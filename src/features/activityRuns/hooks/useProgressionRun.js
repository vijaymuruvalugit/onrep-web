import { useCallback, useMemo, useRef, useState } from 'react'
import sessionRunsApi from '../api/sessionRunsApi'
import { buildRunPayload } from '../utils/buildRunPayload'
import {
  coerceStopwatchTiming,
  normalizeProgressionPayload,
} from '../utils/normalizeProgressionPayload'
import {
  appendProgressEventForParticipant,
  appendProgressEventForTeam,
  appendProgressEventPack,
  computeProgressMetrics,
} from '../utils/progressionPayload'
import {
  createVersionedPatchQueue,
  normalizeFinishMarksCompat,
  reconcileFinishMarks,
} from '../utils/adminRaceDraftSync'
import { useProgressionStateMachine, RUN_STATES } from './useProgressionStateMachine'

const PATCH_DEBOUNCE_MS = 400

function newMutationId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `mut-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function buildRaceMetaPatch(payload, extras = {}) {
  const meta = payload?.race_meta || {}
  const results = payload?.results || []
  const firstEvents = results[0]?.progress_events || []
  const currentLap = firstEvents.length
  return {
    race_meta: {
      ...meta,
      ...extras,
      currentLap,
      targetLaps:
        extras.targetLaps ??
        meta.targetLaps ??
        payload?.progression_config?.target_progress_count ??
        null,
    },
  }
}

/**
 * @param {object} p
 */
export function useProgressionRun({
  operationalSessionId,
  phaseId,
  runType,
  definition,
  progressionMode,
  participantIds = [],
  teamId = null,
  heatNumber = 1,
}) {
  const [payload, setPayload] = useState(() =>
    buildRunPayload(runType, { heat_number: heatNumber }),
  )
  const [runId, setRunId] = useState(null)
  const [runVersion, setRunVersion] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resumed, setResumed] = useState(false)
  const patchTimer = useRef(null)
  const runIdRef = useRef(null)
  const runVersionRef = useRef(0)
  const patchQueueRef = useRef(null)

  const setVersionBoth = useCallback((v) => {
    const n = Math.round(Number(v) || 0)
    runVersionRef.current = n
    setRunVersion(n)
  }, [])

  const ensurePatchQueue = useCallback(() => {
    if (patchQueueRef.current) return patchQueueRef.current
    patchQueueRef.current = createVersionedPatchQueue({
      getVersion: () => runVersionRef.current,
      setVersion: setVersionBoth,
      patchFn: async (body) => {
        const id = runIdRef.current
        if (!id) return null
        return sessionRunsApi.updateRun(id, body)
      },
      reconcilePayload: (requestBody, serverRun) => {
        const localPayload = requestBody?.runPayload || {}
        const serverPayload = serverRun?.runPayload || {}
        const localMarks =
          localPayload?.race_meta?.finish_marks ||
          localPayload?.race_meta?.finish_events ||
          []
        const serverMarks =
          serverPayload?.race_meta?.finish_marks ||
          serverPayload?.race_meta?.finish_events ||
          []
        const { marks, conflicts } = reconcileFinishMarks(localMarks, serverMarks)
        if (conflicts.length) {
          setError(
            `Finish conflict on ${conflicts.map((c) => c.id).join(', ')} — server captured times kept`,
          )
        }
        const next = normalizeProgressionPayload({
          ...serverPayload,
          ...localPayload,
          race_meta: {
            ...(serverPayload.race_meta || {}),
            ...(localPayload.race_meta || {}),
            finish_marks: marks,
            finish_events: marks,
            currentFinishes: marks.filter((m) => !m?.voided).length,
          },
        })
        setPayload(next)
        return next
      },
    })
    return patchQueueRef.current
  }, [setVersionBoth])

  const targetCount =
    payload?.progression_config?.target_progress_count ??
    definition?.progressionConfig?.defaultCount ??
    5

  const sm = useProgressionStateMachine({ targetProgressCount: targetCount })

  const metrics = useMemo(() => computeProgressMetrics(payload), [payload])

  const flushPatch = useCallback(
    async (nextPayload) => {
      if (!runIdRef.current) return null
      setSaving(true)
      try {
        const queue = ensurePatchQueue()
        const run = await queue.flush({
          runPayload: normalizeProgressionPayload(nextPayload),
          partial: true,
        })
        return run
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Could not save progress')
        return null
      } finally {
        setSaving(false)
      }
    },
    [ensurePatchQueue],
  )

  const schedulePatch = useCallback(
    (nextPayload) => {
      if (patchTimer.current) clearTimeout(patchTimer.current)
      patchTimer.current = setTimeout(() => {
        if (!runIdRef.current) return
        setSaving(true)
        const queue = ensurePatchQueue()
        void queue
          .flush({
            runPayload: normalizeProgressionPayload(nextPayload),
            partial: true,
          })
          .catch((e) => {
            setError(e?.response?.data?.error || e?.message || 'Could not save progress')
          })
          .finally(() => setSaving(false))
      }, PATCH_DEBOUNCE_MS)
    },
    [ensurePatchQueue],
  )

  const setTargetProgressCount = useCallback((count) => {
    setPayload((prev) => ({
      ...prev,
      progression_config: {
        ...(prev.progression_config || {}),
        target_progress_count: Math.max(1, Number(count) || 1),
        locked: false,
      },
    }))
  }, [])

  const startRun = useCallback(
    async (initialPatch = {}) => {
      setError('')
      if (!operationalSessionId || !phaseId) {
        setError('Session and phase required')
        return null
      }
      const timerStartedAt = Date.now()
      const startPayload = normalizeProgressionPayload({
        ...payload,
        ...initialPatch,
        progression_config: {
          ...(payload.progression_config || {}),
          ...(initialPatch.progression_config || {}),
          locked: true,
          progression_mode:
            initialPatch.progression_config?.progression_mode ||
            progressionMode ||
            definition?.progressionMode ||
            'PACK',
        },
        race_meta: {
          ...(initialPatch.race_meta || {}),
          status: 'active',
          startedAt: new Date().toISOString(),
          timerStartedAt,
          participantIds: participantIds.map(String),
          raceSequence: initialPatch.heat_number ?? heatNumber,
          currentLap: 0,
          currentFinishes: 0,
          finish_marks: [],
          targetLaps: initialPatch.progression_config?.target_progress_count ?? targetCount,
        },
      })
      setSaving(true)
      try {
        const run = await sessionRunsApi.createRun(operationalSessionId, {
          runType,
          phaseId,
          clientMutationId: newMutationId(),
          runPayload: startPayload,
        })
        setRunId(run?.id ?? null)
        runIdRef.current = run?.id ?? null
        setVersionBoth(run?.runVersion != null ? Number(run.runVersion) : 0)
        setPayload(startPayload)
        sm.startRun()
        setResumed(false)
        return run
      } catch (e) {
        setError(e?.message || 'Could not start race')
        return null
      } finally {
        setSaving(false)
      }
    },
    [
      operationalSessionId,
      phaseId,
      payload,
      runType,
      progressionMode,
      definition,
      sm,
      participantIds,
      heatNumber,
      targetCount,
      setVersionBoth,
    ],
  )

  const resumeRun = useCallback(
    (run) => {
      if (!run?.id) return
      const p = normalizeProgressionPayload(run.runPayload || {})
      if (p.race_meta?.finish_marks || p.race_meta?.finish_events) {
        const marks = normalizeFinishMarksCompat(
          p.race_meta.finish_marks || p.race_meta.finish_events || [],
        )
        p.race_meta = {
          ...p.race_meta,
          finish_marks: marks,
          finish_events: marks,
        }
      }
      setRunId(run.id)
      runIdRef.current = run.id
      setVersionBoth(run.runVersion != null ? Number(run.runVersion) : 0)
      setPayload(p)
      setResumed(true)

      const events = p.results?.[0]?.progress_events || []
      const completed = events.length
      const target = p.progression_config?.target_progress_count ?? targetCount

      if (p.race_meta?.status === 'completed') {
        sm.completeRun()
      } else if (target > 0 && completed >= target) {
        sm.finishProgress()
        sm.recordCapture(completed)
      } else if (completed > 0) {
        sm.startRun()
        sm.recordCapture(completed)
      } else {
        sm.startRun()
      }
    },
    [sm, targetCount, setVersionBoth],
  )

  const applyCapture = useCallback(
    (timingMetrics) => {
      const metrics = coerceStopwatchTiming(timingMetrics)
      if (!metrics) {
        setError('Could not record — start the timer and try again')
        return payload
      }
      let next = payload
      const mode = progressionMode || definition?.progressionMode || 'PACK'
      if (mode === 'PER_PARTICIPANT' && participantIds.length === 1) {
        next = appendProgressEventForParticipant(payload, participantIds[0], metrics)
      } else if (mode === 'PER_PARTICIPANT') {
        next = payload
      } else if (mode === 'PER_TEAM') {
        const tid = teamId || payload.teams?.[0]?.team_id || 'team-1'
        next = appendProgressEventForTeam(payload, tid, metrics)
        const team = next.teams?.find((t) => String(t.team_id) === String(tid))
        const count = team?.progress_events?.length ?? 0
        sm.recordCapture(count)
      } else {
        next = appendProgressEventPack(payload, participantIds, metrics)
        const completed = next.results?.[0]?.progress_events?.length ?? 0
        sm.recordCapture(completed)
      }
      next = {
        ...next,
        ...buildRaceMetaPatch(next, {
          timerStartedAt: next.race_meta?.timerStartedAt ?? payload.race_meta?.timerStartedAt,
        }),
      }
      if (next.race_meta?.timerStartedAt == null) {
        next.race_meta = { ...next.race_meta, timerStartedAt: Date.now() }
      }
      setPayload(next)
      schedulePatch(next)
      return next
    },
    [payload, progressionMode, definition, participantIds, teamId, sm, schedulePatch],
  )

  const captureForParticipant = useCallback(
    (studentId, timingMetrics) => {
      const metrics = coerceStopwatchTiming(timingMetrics)
      if (!metrics) {
        setError('Could not record — start the timer and try again')
        return payload
      }
      let next = appendProgressEventForParticipant(payload, studentId, metrics)
      next = { ...next, ...buildRaceMetaPatch(next) }
      setPayload(next)
      const row = next.results?.find((r) => String(r.student_id) === String(studentId))
      const count = row?.progress_events?.length ?? 0
      sm.recordCapture(count)
      if (targetCount > 0 && count >= targetCount) {
        sm.finishProgress()
      }
      schedulePatch(next)
      return next
    },
    [payload, targetCount, sm, schedulePatch],
  )

  const recordParticipantFinish = useCallback(
    (studentId, timingMetrics) => {
      const metrics = coerceStopwatchTiming(timingMetrics)
      if (!metrics) {
        setError('Could not record finish — start the timer and try again')
        return payload
      }

      const sid = String(studentId)
      const existing = (payload.results || []).find((r) => String(r.student_id) === sid)
      if (existing?.time_ms != null || existing?.progress_events?.length) {
        return payload
      }

      let next = appendProgressEventForParticipant(payload, sid, metrics)
      next = {
        ...next,
        ...buildRaceMetaPatch(next, {
          timerStartedAt: payload.race_meta?.timerStartedAt,
        }),
      }
      const finishedCount = (next.results || []).filter(
        (r) => r?.time_ms != null || r?.progress_events?.length,
      ).length
      next.race_meta = {
        ...(next.race_meta || {}),
        currentFinishes: finishedCount,
      }
      setPayload(next)
      schedulePatch(next)
      return next
    },
    [payload, schedulePatch],
  )

  const recordFinishMark = useCallback(
    (timingMetrics) => {
      const metrics = coerceStopwatchTiming(timingMetrics)
      if (!metrics) {
        setError('Could not record finish — start the timer and try again')
        return payload
      }

      let nextPayload = payload
      setPayload((prev) => {
        const marks = Array.isArray(prev.race_meta?.finish_marks)
          ? prev.race_meta.finish_marks
          : Array.isArray(prev.race_meta?.finish_events)
            ? prev.race_meta.finish_events
            : []
        const seq = marks.filter((m) => !m?.voided).length + 1
        const nextMark = {
          id: newMutationId(),
          captured_sequence: seq,
          captured_elapsed_ms: metrics.cumulative_time_ms,
          finish_order: seq,
          time_ms: metrics.cumulative_time_ms,
          captured_at: new Date().toISOString(),
        }
        const nextMarks = [...marks, nextMark]
        const next = {
          ...prev,
          race_meta: {
            ...(prev.race_meta || {}),
            currentFinishes: nextMarks.filter((m) => !m?.voided).length,
            finish_marks: nextMarks,
            finish_events: nextMarks,
          },
        }
        nextPayload = next
        schedulePatch(next)
        return next
      })
      return nextPayload
    },
    [payload, schedulePatch],
  )

  const finalizeRun = useCallback(
    async (patch = {}) => {
      if (!runId) return null
      if (patchTimer.current) {
        clearTimeout(patchTimer.current)
        patchTimer.current = null
      }
      setSaving(true)
      setError('')
      try {
        const merged = normalizeProgressionPayload({
          ...payload,
          ...patch,
          race_meta: {
            ...(payload.race_meta || {}),
            ...(patch.race_meta || {}),
            status: 'completed',
          },
        })
        const run = await sessionRunsApi.updateRun(runId, {
          runPayload: merged,
          partial: false,
          confirm: true,
          confirmClientMutationId: newMutationId(),
          expectedVersion: runVersionRef.current,
        })
        if (run?.runVersion != null) setVersionBoth(Number(run.runVersion))
        setPayload(merged)
        sm.completeRun()
        return run
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Could not save race')
        return null
      } finally {
        setSaving(false)
      }
    },
    [runId, payload, sm, setVersionBoth],
  )

  const abandonRun = useCallback(async () => {
    if (patchTimer.current) clearTimeout(patchTimer.current)
    if (runId) {
      setSaving(true)
      try {
        await sessionRunsApi.updateRun(runId, {
          runPayload: {
            race_meta: {
              ...(payload.race_meta || {}),
              status: 'abandoned',
              endedAt: new Date().toISOString(),
            },
          },
          partial: true,
          expectedVersion: runVersionRef.current,
        })
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Could not reset race')
      } finally {
        setSaving(false)
      }
    }
    setRunId(null)
    runIdRef.current = null
    setVersionBoth(0)
    patchQueueRef.current = null
    setPayload(buildRunPayload(runType, { heat_number: heatNumber }))
    sm.resetRun()
    setResumed(false)
  }, [runId, payload, runType, heatNumber, sm, setVersionBoth])

  const resetAll = useCallback(() => {
    if (patchTimer.current) clearTimeout(patchTimer.current)
    setRunId(null)
    runIdRef.current = null
    setVersionBoth(0)
    patchQueueRef.current = null
    setPayload(buildRunPayload(runType, { heat_number: heatNumber }))
    sm.resetRun()
    setResumed(false)
    setError('')
  }, [runType, heatNumber, sm, setVersionBoth])

  return {
    ...sm,
    RUN_STATES,
    payload,
    setPayload,
    runId,
    runVersion,
    saving,
    error,
    resumed,
    metrics,
    targetCount,
    setTargetProgressCount,
    startRun,
    resumeRun,
    applyCapture,
    captureForParticipant,
    recordParticipantFinish,
    recordFinishMark,
    finalizeRun,
    abandonRun,
    resetAll,
  }
}

export default useProgressionRun
