/**
 * Admin HeatFlow draft sync helpers for session-runs optimistic concurrency (Slice 1E).
 */

const IMMUTABLE_KEYS = ['captured_sequence', 'captured_elapsed_ms', 'time_ms', 'finish_order']

function immutableConflict(local, server) {
  for (const key of IMMUTABLE_KEYS) {
    const lv = local[key]
    const sv = server[key]
    if (lv == null || sv == null) continue
    if (String(lv) !== String(sv)) {
      return { key, local: lv, server: sv }
    }
  }
  return null
}

/**
 * Union finish_marks / finish_events by stable id after a 409.
 * @param {object[]} localMarks
 * @param {object[]} serverMarks
 * @returns {{ marks: object[], conflicts: object[] }}
 */
export function reconcileFinishMarks(localMarks, serverMarks) {
  const byId = new Map()
  const conflicts = []

  for (const m of serverMarks || []) {
    if (m?.id) byId.set(String(m.id), { ...m })
  }

  for (const m of localMarks || []) {
    if (!m?.id) continue
    const id = String(m.id)
    const prev = byId.get(id)
    if (!prev) {
      byId.set(id, { ...m })
      continue
    }
    const clash = immutableConflict(m, prev)
    if (clash) {
      conflicts.push({
        id,
        reason: `Immutable field ${clash.key} differs`,
        field: clash.key,
        localValue: clash.local,
        serverValue: clash.server,
      })
      byId.set(id, {
        ...prev,
        student_id: m.student_id !== undefined ? m.student_id : prev.student_id,
        voided: m.voided !== undefined ? m.voided : prev.voided,
      })
      continue
    }
    byId.set(id, { ...prev, ...m })
  }

  const marks = [...byId.values()].sort(
    (a, b) =>
      Number(a.captured_sequence ?? a.finish_order ?? 0) -
      Number(b.captured_sequence ?? b.finish_order ?? 0),
  )
  return { marks, conflicts }
}

/**
 * Normalize legacy finish_marks into captured_* fields for readability.
 * @param {object[]} marks
 */
export function normalizeFinishMarksCompat(marks) {
  return (marks || []).map((m, i) => {
    const seq = m.captured_sequence ?? m.finish_order ?? i + 1
    const elapsed =
      m.captured_elapsed_ms != null
        ? Number(m.captured_elapsed_ms)
        : m.time_ms != null
          ? Number(m.time_ms)
          : null
    return {
      ...m,
      id: m.id || `finish-${seq}`,
      captured_sequence: seq,
      captured_elapsed_ms: elapsed,
      finish_order: m.finish_order ?? seq,
      time_ms: m.time_ms ?? elapsed,
    }
  })
}

/**
 * Coalesced versioned PATCH queue (one in-flight; latest payload wins).
 * @param {object} p
 * @param {(body: object) => Promise<object>} p.patchFn receives body with expectedVersion
 * @param {() => number} p.getVersion
 * @param {(v: number) => void} p.setVersion
 * @param {(local: object, serverRun: object) => object} [p.reconcilePayload]
 */
export function createVersionedPatchQueue({ patchFn, getVersion, setVersion, reconcilePayload }) {
  let inFlight = null
  let queued = null

  async function process() {
    while (queued) {
      const job = queued
      queued = null
      try {
        const body = {
          ...job.body,
          expectedVersion: getVersion(),
        }
        const run = await patchFn(body)
        if (run?.runVersion != null) setVersion(Number(run.runVersion))
        job.resolve?.(run)
      } catch (e) {
        const status = e?.response?.status
        const data = e?.response?.data || {}
        if (status === 409 && data.run && reconcilePayload) {
          const nextVersion = Number(data.currentVersion ?? data.run.runVersion ?? getVersion())
          setVersion(nextVersion)
          const reconciled = reconcilePayload(job.body, data.run)
          queued = {
            ...job,
            body: {
              ...job.body,
              runPayload: reconciled,
              expectedVersion: nextVersion,
            },
          }
          continue
        }
        if (status === 409 && data.run?.runVersion != null) {
          setVersion(Number(data.run.runVersion))
        }
        job.reject?.(e)
        break
      }
    }
    inFlight = null
  }

  function enqueue(body, { awaitResult = false } = {}) {
    queued = { body }
    let promise = Promise.resolve(null)
    if (awaitResult) {
      promise = new Promise((resolve, reject) => {
        queued.resolve = resolve
        queued.reject = reject
      })
    }
    if (!inFlight) inFlight = process()
    return promise
  }

  return {
    schedule: (body) => enqueue(body, { awaitResult: false }),
    flush: (body) => enqueue(body, { awaitResult: true }),
  }
}

export default {
  reconcileFinishMarks,
  normalizeFinishMarksCompat,
  createVersionedPatchQueue,
}
