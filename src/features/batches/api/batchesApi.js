import http from '../../../api/http'
import { apiDaysToUiLabels, UI_DAY_LABELS_ORDERED } from '../../schedule/utils/daysOfWeek'
import { formatSessionClock } from '../../classes/utils/sessionDisplay'

function sortDayLabels(labels) {
  return [...labels].sort(
    (a, b) => UI_DAY_LABELS_ORDERED.indexOf(a) - UI_DAY_LABELS_ORDERED.indexOf(b),
  )
}

/** First weekly row from list API — same shape Operations uses for cadence. */
function formatListScheduleSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return null
  const days = snap.daysOfWeek ?? snap.days_of_week
  if (!Array.isArray(days) || days.length === 0) return null
  const labels = sortDayLabels(apiDaysToUiLabels(days))
  const dayPart = labels.length ? labels.join(' · ') : ''
  const start = formatSessionClock(snap.startTime ?? snap.start_time)
  const end = formatSessionClock(snap.endTime ?? snap.end_time)
  const timePart = start !== '—' && end !== '—' ? `${start} – ${end}` : start !== '—' ? start : ''
  return [dayPart, timePart].filter(Boolean).join(' · ') || null
}

function parseBatchCoachesJson(batch) {
  const raw = batch.batchCoaches ?? batch.batch_coaches
  if (Array.isArray(raw)) {
    return raw
      .map((r) => ({
        id: String(r.id ?? r.user_id ?? ''),
        name: r.name != null ? String(r.name) : '',
      }))
      .filter((r) => r.id)
  }
  if (raw && typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p)
        ? p
            .map((r) => ({
              id: String(r.id ?? ''),
              name: r.name != null ? String(r.name) : '',
            }))
            .filter((r) => r.id)
        : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeBatch(batch) {
  if (!batch) return batch
  const activeScheduleCount = Number(batch.activeScheduleCount ?? batch.active_schedule_count ?? 0)
  const upcomingSessionsCount = Number(
    batch.upcomingSessionsCount ?? batch.upcoming_sessions_count ?? 0,
  )
  const snap = batch.listScheduleSnapshot ?? batch.list_schedule_snapshot
  const fromSnapshot = formatListScheduleSnapshot(snap)

  const weeklySummary = batch.weeklySummary ?? batch.weekly_summary ?? fromSnapshot ?? null

  const hasUpcomingClass =
    Boolean(batch.hasUpcomingClass ?? batch.has_upcoming_class) || upcomingSessionsCount > 0

  const todaySessionSnapshot = batch.todaySessionSnapshot ?? batch.today_session_snapshot ?? null
  const nextSessionSnapshot = batch.nextSessionSnapshot ?? batch.next_session_snapshot ?? null

  const batchCoaches = parseBatchCoachesJson(batch)
  const coachUserIdsRaw = batch.coachUserIds ?? batch.coach_user_ids
  let coachUserIds = []
  if (Array.isArray(coachUserIdsRaw)) {
    coachUserIds = coachUserIdsRaw.map((id) => String(id)).filter(Boolean)
  } else if (batchCoaches.length > 0) {
    coachUserIds = batchCoaches.map((c) => c.id)
  }
  const leadCoachUserId =
    batch.leadCoachUserId ??
    batch.lead_coach_user_id ??
    (coachUserIds.length ? coachUserIds[0] : null)
  const leadCoachName =
    batch.leadCoachName ??
    batch.lead_coach_name ??
    (batchCoaches.length ? batchCoaches[0].name : null)
  const coachNamesJoined =
    batchCoaches.length > 0
      ? batchCoaches
          .map((c) => c.name)
          .filter(Boolean)
          .join(', ')
      : null

  return {
    ...batch,
    activityWorkspaceId: batch.activityWorkspaceId ?? batch.activity_workspace_id ?? null,
    subActivityName: batch.subActivityName ?? batch.sub_activity_name ?? null,
    subActivitySlug: batch.subActivitySlug ?? batch.sub_activity_slug ?? null,
    studentsCount: batch.studentsCount ?? batch.students_count ?? 0,
    studentIds: batch.studentIds ?? batch.student_ids ?? [],
    activeStudentsCount: batch.activeStudentsCount ?? batch.active_students_count ?? 0,
    activeStudentIds: batch.activeStudentIds ?? batch.active_student_ids ?? [],
    batchCoaches,
    coachUserIds,
    leadCoachUserId,
    leadCoachName,
    coachName: batch.coachName ?? batch.coach_name ?? coachNamesJoined ?? leadCoachName ?? null,
    defaultPlaceId: batch.defaultPlaceId ?? batch.default_place_id ?? null,
    defaultPlaceName: batch.defaultPlaceName ?? batch.default_place_name ?? null,
    location:
      batch.location ??
      batch.place_name ??
      batch.placeName ??
      batch.defaultPlaceName ??
      batch.default_place_name ??
      null,
    activeScheduleCount,
    upcomingSessionsCount,
    listScheduleSnapshot: snap ?? null,
    weeklySummary,
    hasUpcomingClass,
    todaySessionSnapshot,
    nextSessionSnapshot,
    feeInr: batch.fee_inr ?? batch.feeInr ?? null,
  }
}

export const batchesApi = {
  async listBatches(params = {}) {
    const { data } = await http.get('/batches', { params })
    const batches = Array.isArray(data?.batches) ? data.batches.map(normalizeBatch) : []
    return { ...(data || {}), batches }
  },

  async getBatch(batchId) {
    // Backend currently exposes list + patch, but no dedicated GET /batches/:id route.
    // Resolve detail from list to keep contract-safe behavior without backend changes.
    const { data } = await http.get('/batches')
    const batches = data?.batches || []
    const batch = batches.find((item) => String(item.id) === String(batchId))
    return { batch: normalizeBatch(batch) || null }
  },

  async createBatch(payload) {
    const { name, feeInr, subActivityId } = payload || {}
    const body = {
      name: String(name || '').trim(),
      subActivityId: String(subActivityId || '').trim(),
    }
    if (feeInr !== undefined && feeInr !== null && feeInr !== '') {
      const n = Number(feeInr)
      if (Number.isFinite(n) && n >= 0) body.feeInr = Math.round(n)
    }
    const { data } = await http.post('/batches', body)
    const raw = data?.batch
    return { batch: raw ? normalizeBatch(raw) : null }
  },

  async updateBatch(batchId, payload) {
    const { data } = await http.patch(`/batches/${encodeURIComponent(batchId)}`, payload)
    return data || {}
  },

  async replaceBatchStudents(batchId, studentIds) {
    const { data } = await http.put(`/batches/${encodeURIComponent(batchId)}/students`, {
      studentIds,
    })
    return data || {}
  },

  async listBatchSchedules(batchId) {
    const { data } = await http.get(`/batch-schedules/${encodeURIComponent(batchId)}`)
    return data || {}
  },

  async createBatchSchedule(payload) {
    const { data } = await http.post('/batch-schedules', payload)
    return data || {}
  },

  async updateBatchSchedule(scheduleId, payload) {
    const { data } = await http.patch(`/batch-schedules/${encodeURIComponent(scheduleId)}`, payload)
    return data || {}
  },

  /**
   * Legacy batch-wide session materialization. Prefer server rolling generation;
   * retained for rare ops/debug.
   */
  async generateClasses(payload) {
    const { data } = await http.post('/batch-schedules/generate', payload)
    return data || {}
  },

  async listClasses(params = {}) {
    const { data } = await http.get('/sessions', { params })
    return data || {}
  },

  async getSession(sessionId) {
    const { data } = await http.get(`/sessions/${encodeURIComponent(sessionId)}`)
    return data || {}
  },

  async createSession(payload) {
    const { data } = await http.post('/sessions', payload)
    return data || {}
  },

  async createOneTimeSession(payload) {
    const { data } = await http.post('/sessions/one-time', payload)
    return data || {}
  },

  async patchSession(sessionId, payload) {
    const { data } = await http.patch(`/sessions/${encodeURIComponent(sessionId)}`, payload)
    return data || {}
  },

  async cancelSession(sessionId, body = {}) {
    const { data } = await http.patch(`/sessions/${encodeURIComponent(sessionId)}/cancel`, body)
    return data || {}
  },
}

export default batchesApi
