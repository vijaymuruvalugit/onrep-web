export function normalizeTrainingSessionRow(row) {
  if (!row) return row
  const id = row.id ?? row._id ?? null
  const scheduleId = row.scheduleId ?? row.schedule_id ?? null
  const batchId = row.batchId ?? row.batch_id ?? null
  const statusRaw = row.status ?? row.session_status ?? null
  const status = statusRaw != null ? String(statusRaw).toUpperCase() : ''
  const isCancelled = status === 'CANCELLED'
  return {
    ...row,
    sessionId: row.sessionId ?? id,
    id,
    scheduleId,
    placeId: row.placeId ?? row.place_id ?? null,
    placeName: row.placeName ?? row.place_name ?? null,
    location: row.location ?? row.placeName ?? row.place_name ?? null,
    sessionDate: row.sessionDate ?? row.session_date ?? null,
    startTime: row.startTime ?? row.start_time ?? null,
    endTime: row.endTime ?? row.end_time ?? null,
    batchId,
    batchName: row.batchName ?? row.batch_name ?? null,
    title: row.title ?? null,
    status: statusRaw ?? null,
    isCancelled,
    sessionComments: row.sessionComments ?? row.session_comments ?? null,
    cancelledAt: row.cancelledAt ?? row.cancelled_at ?? null,
    cancelReason: row.cancelReason ?? row.cancel_reason ?? null,
    actualStartTime: row.actualStartTime ?? row.actual_start_time ?? null,
    actualEndTime: row.actualEndTime ?? row.actual_end_time ?? null,
    timeOverrideReason: row.timeOverrideReason ?? row.time_override_reason ?? null,
    attendanceMarked: Boolean(row.attendanceMarked ?? row.attendance_marked),
    expectedStudentCount: row.expectedStudentCount ?? row.expected_student_count ?? null,
    sessionType: row.sessionType ?? row.session_type ?? null,
    isOneTime: Boolean(row.isOneTime ?? row.is_one_time),
    visibilityEnabled:
      row.visibilityEnabled !== undefined
        ? Boolean(row.visibilityEnabled)
        : row.visibility_enabled !== undefined
          ? Boolean(row.visibility_enabled)
          : true,
    attendanceEnabled:
      row.attendanceEnabled !== undefined
        ? Boolean(row.attendanceEnabled)
        : row.attendance_enabled !== undefined
          ? Boolean(row.attendance_enabled)
          : true,
    /** Heuristic: batch session without a schedule link is usually an extra / manual instance */
    isExtraSession: Boolean(batchId) && !scheduleId,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  }
}

/** True for API one-offs and template-less instances (no batch_schedule link). */
export function isOperationalOneOff(row) {
  if (!row || row.isCancelled) return false
  if (Boolean(row.isOneTime ?? row.is_one_time)) return true
  return !Boolean(row.scheduleId ?? row.schedule_id)
}

/** Materialized row tied to a weekly pattern (has schedule_id), not flagged one-off. */
export function isOperationalRecurring(row) {
  if (!row || row.isCancelled) return false
  if (Boolean(row.isOneTime ?? row.is_one_time)) return false
  return Boolean(row.scheduleId ?? row.schedule_id)
}
