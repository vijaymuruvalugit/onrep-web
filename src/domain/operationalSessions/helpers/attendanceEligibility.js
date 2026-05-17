/**
 * Coach may mark attendance only while a session is live (active) or after it is closed (completed).
 * @param {{ operationalState?: string|null, state?: string|null, status?: string|null, isCancelled?: boolean, attendanceEnabled?: boolean, attendance_enabled?: boolean, actualStartTime?: string|null, actual_start_time?: string|null }} row
 */
export function canMarkSessionAttendance(row) {
  if (!row) return false
  if (row.isCancelled || String(row.status || '').toUpperCase() === 'CANCELLED') return false
  if (row.attendanceEnabled === false || row.attendance_enabled === false) return false

  const op = String(row.operationalState ?? row.state ?? '').toLowerCase()
  if (op === 'active' || op === 'completed') return true
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
 * @param {{ operationalState?: string|null, state?: string|null, status?: string|null, isCancelled?: boolean, actualStartTime?: string|null, actual_start_time?: string|null }} row
 */
export function sessionAttendanceIneligibleMessage(row) {
  if (!row) return 'Session not found.'
  if (row.isCancelled || String(row.status || '').toUpperCase() === 'CANCELLED') {
    return 'Attendance cannot be recorded for a cancelled session.'
  }
  const op = String(row.operationalState ?? row.state ?? '').toLowerCase()
  if (op === 'cancelled') return 'Attendance cannot be recorded for a cancelled session.'
  if (op === 'scheduled' || op === 'upcoming') {
    return 'Start the session before marking attendance.'
  }
  if (op === 'paused') {
    return 'Attendance can only be marked while a session is active or after it is closed. This session is paused.'
  }
  if (op === 'archived') {
    return 'Attendance can only be marked while a session is active or after it is closed. This session is archived.'
  }
  if (op && op !== 'active' && op !== 'completed') {
    return 'Attendance can only be marked while a session is active or after it is closed.'
  }
  if (!row.actualStartTime && !row.actual_start_time) {
    return 'Start the session before marking attendance.'
  }
  return 'Attendance is not available for this session.'
}
