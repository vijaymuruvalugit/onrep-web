/**
 * Coach may mark attendance while a session is live (active).
 * Completed sessions are Correction mode: only when canCorrectCompleted is true
 * (academy owner/admin — matches API assertCompletedAttendanceCorrectionAuthorized).
 *
 * @param {object} row
 * @param {{ canCorrectCompleted?: boolean }} [opts]
 */
export function canMarkSessionAttendance(row, opts = {}) {
  if (!row) return false
  if (row.isCancelled || String(row.status || '').toUpperCase() === 'CANCELLED') return false
  if (row.attendanceEnabled === false || row.attendance_enabled === false) return false

  const op = String(row.operationalState ?? row.state ?? '').toLowerCase()
  if (op === 'active') return true
  if (op === 'completed') {
    return Boolean(opts.canCorrectCompleted ?? row.canCorrectCompleted)
  }
  if (
    op === 'cancelled' ||
    op === 'scheduled' ||
    op === 'upcoming' ||
    op === 'paused' ||
    op === 'archived'
  ) {
    return false
  }

  return Boolean(row.actualStartTime ?? row.actual_start_time)
}

/**
 * @param {object} row
 * @param {{ canCorrectCompleted?: boolean }} [opts]
 */
export function sessionAttendanceIneligibleMessage(row, opts = {}) {
  if (!row) return 'Session not found.'
  if (row.isCancelled || String(row.status || '').toUpperCase() === 'CANCELLED') {
    return 'Session participation cannot be recorded for a cancelled session.'
  }
  const op = String(row.operationalState ?? row.state ?? '').toLowerCase()
  if (op === 'cancelled') return 'Attendance cannot be recorded for a cancelled session.'
  if (op === 'scheduled' || op === 'upcoming') {
    return 'Start the session before roster check-in.'
  }
  if (op === 'paused') {
    return 'Roster check-in is only available while a session is active or after it is closed. This session is paused.'
  }
  if (op === 'archived') {
    return 'Roster check-in is only available while a session is active or after it is closed. This session is archived.'
  }
  const canCorrect = Boolean(opts.canCorrectCompleted ?? row.canCorrectCompleted)
  if (op === 'completed' && !canCorrect) {
    return 'Completed-session attendance corrections require an academy owner or administrator.'
  }
  if (op && op !== 'active' && op !== 'completed') {
    return 'Roster check-in is only available while a session is active or after it is closed.'
  }
  if (!row.actualStartTime && !row.actual_start_time) {
    return 'Start the session before roster check-in.'
  }
  return 'Session participation is not available for this session.'
}
