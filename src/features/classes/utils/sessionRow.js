export function normalizeTrainingSessionRow(row) {
  if (!row) return row
  const id = row.id ?? row._id ?? null
  const scheduleId = row.scheduleId ?? row.schedule_id ?? null
  const batchId = row.batchId ?? row.batch_id ?? null
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
    attendanceMarked: Boolean(row.attendanceMarked ?? row.attendance_marked),
    expectedStudentCount: row.expectedStudentCount ?? row.expected_student_count ?? null,
    /** Heuristic: batch session without a schedule link is usually an extra / manual instance */
    isExtraSession: Boolean(batchId) && !scheduleId,
  }
}
