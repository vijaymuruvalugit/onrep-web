/**
 * Canonical participation timeline events — normalize attendance/history rows.
 * Future: parent consistency, streaks, admin reporting, coach insights derive from this shape.
 */

/**
 * @param {object} row
 * @returns {{ id: string, sessionDate: string|null, sessionTitle: string, studentName: string|null, status: 'present'|'absent'|'unknown', markedAt: string|null }}
 */
export function mapRowToParticipationEvent(row) {
  const statusRaw = String(row?.status ?? row?.attendanceStatus ?? '').toUpperCase()
  let status = 'unknown'
  if (statusRaw === 'PRESENT' || statusRaw === 'present') status = 'present'
  else if (statusRaw === 'ABSENT' || statusRaw === 'absent') status = 'absent'

  return {
    id: String(
      row?.id ??
        `${row?.sessionId || row?.session_id || 's'}-${row?.studentId || row?.student_id || ''}-${row?.markedAt || row?.marked_at || ''}`,
    ),
    sessionDate: row?.markedAt || row?.marked_at || row?.sessionDate || row?.session_date || null,
    sessionTitle: row?.sessionTitle || row?.session_title || row?.title || 'Session',
    studentName: row?.studentName || row?.student_name || null,
    status,
    markedAt: row?.markedAt || row?.marked_at || null,
  }
}

/**
 * @param {ReadonlyArray<object>} rows
 * @returns {ReadonlyArray<ReturnType<typeof mapRowToParticipationEvent>>}
 */
export function buildParticipationTimeline(rows) {
  return (rows || []).map(mapRowToParticipationEvent)
}

/**
 * @param {ReadonlyArray<ReturnType<typeof mapRowToParticipationEvent>>} events
 */
export function summarizeParticipation(events) {
  const list = events || []
  const total = list.length
  const attended = list.filter((e) => e.status === 'present').length
  const missed = list.filter((e) => e.status === 'absent').length
  const rate = total > 0 ? Math.round((100 * attended) / total) : null

  let streak = 0
  for (const e of list) {
    if (e.status === 'present') streak += 1
    else if (e.status === 'absent') break
    else break
  }

  return { total, attended, missed, rate, streak }
}

export default buildParticipationTimeline
