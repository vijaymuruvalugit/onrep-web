import {
  formatOperationalSessionLine,
  formatOperationalSessionRange,
  formatSessionClock,
  getNextSessionHighlightIndex,
  parseSessionLocalDate,
  sessionStartsAt,
} from '../../classes/utils/sessionDisplay'
import { apiDaysToUiLabels, UI_DAY_LABELS_ORDERED } from '../../schedule/utils/daysOfWeek'

export function todayIsoLocal() {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Merge today's batch sessions with upcoming API rows into one chronological list (deduped).
 * @param {string} batchId
 * @param {object[]} todayBatchSessions normalized
 * @param {object[]} upcomingNormalized normalized
 * @param {string} todayIso YYYY-MM-DD
 * @param {number} maxRows
 */
/** Next session that counts for operations (skips cancelled rows). */
export function firstNonCancelledSession(mergedTimeline) {
  const list = mergedTimeline || []
  const hit = list.find((r) => !r.isCancelled)
  return hit || null
}

export function mergeBatchSessionInstances(
  batchId,
  todayBatchSessions,
  upcomingNormalized,
  todayIso,
  maxRows = 6,
) {
  const bid = String(batchId)
  const candidates = []

  for (const r of todayBatchSessions || []) {
    if (String(r.batchId || '') === bid) candidates.push(r)
  }
  for (const r of upcomingNormalized || []) {
    if (String(r.batchId || '') !== bid) continue
    const sd = r.sessionDate ? String(r.sessionDate).slice(0, 10) : ''
    if (!sd || sd < todayIso) continue
    candidates.push(r)
  }

  const byId = new Map()
  for (const c of candidates) {
    const id = String(c.sessionId || c.id || '')
    if (!id) continue
    byId.set(id, c)
  }

  const merged = [...byId.values()].sort((a, b) => {
    const da = String(a.sessionDate || '').slice(0, 10)
    const db = String(b.sessionDate || '').slice(0, 10)
    if (da !== db) return da.localeCompare(db)
    const oa = a.isOneTime ? 1 : 0
    const ob = b.isOneTime ? 1 : 0
    if (ob !== oa) return ob - oa
    return String(a.startTime || '').localeCompare(String(b.startTime || ''))
  })

  return merged.slice(0, maxRows)
}

/**
 * @param {object[]} schedules normalized schedule rows
 */
function formatOneScheduleLine(row) {
  const rawDays = row.daysOfWeek || []
  const labels = apiDaysToUiLabels(rawDays)
  const ordered = [...labels].sort(
    (a, b) => UI_DAY_LABELS_ORDERED.indexOf(a) - UI_DAY_LABELS_ORDERED.indexOf(b),
  )
  const dayPart = ordered.length ? ordered.join(' · ') : 'Custom schedule'
  const start = formatSessionClock(row.startTime)
  const end = formatSessionClock(row.endTime)
  const timePart = start !== '—' && end !== '—' ? `${start} – ${end}` : start !== '—' ? start : ''
  return [dayPart, timePart].filter(Boolean).join(' · ')
}

/**
 * Single-line summary used on dense surfaces (batch tile, list view).
 *
 * Single-pattern batches: returns one cadence string (legacy behavior, no UI regression).
 * Multi-pattern batches: returns a "{name} · {cadence}" composite — caller may render
 * via `formatCadenceLines` instead for stacked display.
 */
export function formatCadenceLine(schedules) {
  if (!schedules?.length) return null
  const active = schedules.filter((s) => s.isActive !== false)
  const rows = active.length ? active : schedules
  if (rows.length === 1) return formatOneScheduleLine(rows[0])
  // Compact summary for cases where only one line of vertical space exists.
  return rows
    .map((row) => {
      const line = formatOneScheduleLine(row)
      return row.name ? `${row.name}: ${line}` : line
    })
    .join(' · ')
}

/**
 * Multi-line summary for use in batch detail tiles where vertical space allows.
 * Returns an array of `{ id, name, line }` rows; caller renders one per <div>.
 */
export function formatCadenceLines(schedules) {
  if (!schedules?.length) return []
  const active = schedules.filter((s) => s.isActive !== false)
  const rows = active.length ? active : schedules
  return rows.map((row) => ({
    id: row.id || row.scheduleId || null,
    name: row.name || row.slotName || null,
    line: formatOneScheduleLine(row),
  }))
}

export function formatHeaderWhenNext(mergedTimeline, todayIso) {
  if (!mergedTimeline?.length) return 'No upcoming session scheduled.'
  const next = mergedTimeline[0]
  const end = next.endTime ?? next.end_time
  const when = formatOperationalSessionRange(next.sessionDate, next.startTime, end, todayIso)
  const place = next.placeName || next.location
  const tail = place ? ` · ${place}` : ''
  return `Next session: ${when}${tail}`
}

/**
 * Batch workspace header: operational line is **when** only (day · time range).
 * Place stays in tertiary metadata with activity — avoids competing weights.
 */
export function formatHeaderOperationalWhen(mergedTimeline, todayIso) {
  if (!mergedTimeline?.length) {
    return { whenLine: null, emptyMessage: 'No upcoming session scheduled.' }
  }
  const next = firstNonCancelledSession(mergedTimeline) || mergedTimeline[0]
  const end = next.endTime ?? next.end_time
  const whenLine = formatOperationalSessionRange(next.sessionDate, next.startTime, end, todayIso)
  return { whenLine, emptyMessage: null }
}

/**
 * @returns {{ kind: string, message: string, primarySession?: object, primaryLabel?: string, nextHint?: object }}
 */
export function computeOperationalFocus({
  now = new Date(),
  todayIso,
  todayBatchSessions,
  mergedTimeline,
}) {
  const todayList = (todayBatchSessions || []).slice().sort((a, b) => {
    return String(a.startTime || '').localeCompare(String(b.startTime || ''))
  })

  const todayActive = todayList.filter((s) => !s.isCancelled)
  const pendingToday = todayActive.filter((s) => !s.attendanceMarked)
  if (pendingToday.length > 0) {
    const idx = getNextSessionHighlightIndex(pendingToday, now)
    const s = idx >= 0 ? pendingToday[idx] : pendingToday[0]
    return {
      kind: 'attendance_pending',
      message: 'Attendance is open for today’s session.',
      primarySession: s,
      primaryLabel: 'Start session',
    }
  }

  if (todayActive.length > 0) {
    const nextFuture = mergedTimeline.find((row) => {
      if (row.isCancelled) return false
      const sd = String(row.sessionDate || '').slice(0, 10)
      if (sd > todayIso) return true
      if (sd === todayIso) {
        const start = sessionStartsAt(row)
        return start && start > now
      }
      return false
    })
    return {
      kind: 'attendance_done',
      message: 'Attendance complete.',
      nextHint:
        nextFuture ||
        mergedTimeline.find(
          (r) => !r.isCancelled && String(r.sessionDate || '').slice(0, 10) > todayIso,
        ),
    }
  }

  const next = firstNonCancelledSession(mergedTimeline) || mergedTimeline[0]
  return {
    kind: 'no_session_today',
    message: 'No session today.',
    nextHint: next,
  }
}

/** Human next session line for focus copy (no ISO, no "Next:" prefix). */
export function formatNextSessionSummary(nextSession, todayIso) {
  if (!nextSession) return null
  const when = formatOperationalSessionLine(
    nextSession.sessionDate,
    nextSession.startTime,
    todayIso,
  )
  const place = nextSession.placeName || nextSession.location
  return place ? `${when} — ${place}` : when
}

/** Divider helper: should show "Tomorrow" before this row */
export function showTomorrowDivider(prevRow, row, todayIso) {
  if (!prevRow || !row) return false
  const prev = String(prevRow.sessionDate || '').slice(0, 10)
  const cur = String(row.sessionDate || '').slice(0, 10)
  if (prev === cur) return false
  const t = parseSessionLocalDate(todayIso)
  const c = parseSessionLocalDate(cur)
  if (!t || !c) return false
  const diff = Math.round((c.getTime() - t.getTime()) / 86400000)
  return diff === 1
}
