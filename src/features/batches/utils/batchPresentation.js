export function summarizeSchedule(schedules = []) {
  if (!schedules.length) return 'No schedule yet'
  const first = schedules[0]
  const days = Array.isArray(first.daysOfWeek) && first.daysOfWeek.length ? first.daysOfWeek : []
  const dayLabel = days.length ? days.join('/') : 'Custom'
  const timeLabel = [first.startTime, first.endTime].filter(Boolean).join(' - ')
  return [dayLabel, timeLabel].filter(Boolean).join(' ') || 'Schedule available'
}

export function getBatchStudentCount(batch) {
  if (!batch) return 0
  if (typeof batch.studentsCount === 'number') return batch.studentsCount
  if (typeof batch.activeStudentsCount === 'number') return batch.activeStudentsCount
  if (Array.isArray(batch.students)) return batch.students.length
  if (Array.isArray(batch.studentIds)) return batch.studentIds.length
  return 0
}

/**
 * True when the batch has no active recurring pattern (batch_schedules rows).
 */
export function batchNeedsSchedule(batch) {
  const ac = Number(batch?.activeScheduleCount ?? batch?.active_schedule_count ?? 0)
  if (Number.isFinite(ac)) return ac === 0
  const w = batch?.weeklySummary
  if (w == null || String(w).trim() === '') return true
  const s = String(w).toLowerCase()
  if (s.includes('not configured') || s.includes('no schedule')) return true
  return false
}

export function batchNeedsCoach(batch) {
  const c = batch?.coachName ?? batch?.coach_name
  if (c == null || !String(c).trim()) return true
  return String(c).toLowerCase().includes('not assigned')
}
