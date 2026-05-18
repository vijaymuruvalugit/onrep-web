import { normalizeTrainingSessionRow } from '../../../features/classes/utils/sessionRow'

/**
 * Map OperationalSession DTO → shape expected by CompactSessionRow / computeOperationalFocus.
 * @param {import('../types').OperationalSession} op
 * @returns {object}
 */
export function operationalSessionToScheduleCompactRow(op) {
  if (!op) return null
  const row = {
    id: op.id,
    sessionId: op.id,
    scheduleId: op.scheduleId ?? null,
    batchId: op.batchId ?? null,
    batchName: op.batchName ?? null,
    placeName: op.placeName ?? null,
    location: op.placeName ?? null,
    operationalDayLocal: op.operationalDayLocal ?? null,
    sessionDate: op.sessionDate ?? null,
    scheduledStartAt: op.scheduledStartAt ?? null,
    scheduledEndAt: op.scheduledEndAt ?? null,
    timezone: op.timezone ?? null,
    startTime: op.startTime ?? null,
    endTime: op.endTime ?? null,
    title: op.title ?? null,
    status:
      op.isCancelled || String(op.state || '').toLowerCase() === 'cancelled'
        ? 'CANCELLED'
        : (op.status ?? null),
    isCancelled: Boolean(op.isCancelled) || String(op.state || '').toLowerCase() === 'cancelled',
    attendanceMarked: Boolean(op.attendanceMarked),
    isOneTime: Boolean(op.isOneTime),
    sessionType: null,
    visibilityEnabled: true,
    attendanceEnabled: true,
    actualStartTime: op.actualStartAt ?? null,
    actualEndTime: op.actualEndAt ?? null,
    /** Carry canonical state for badges without breaking row helpers */
    operationalState: op.state,
    sessionMode: op.sessionMode ?? 'practice',
  }
  return normalizeTrainingSessionRow(row)
}
