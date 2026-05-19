import { getTimingMetrics, normalizeProgressEvent } from './normalizeProgressionPayload'

export { getTimingMetrics }

export function createProgressEvent({ sequence, metrics = {}, capturedAt }) {
  return normalizeProgressEvent({
    sequence,
    captured_at: capturedAt || new Date().toISOString(),
    metrics,
  })
}

export function appendProgressEventPack(payload, participantIds, metrics, sequence) {
  const base = payload && typeof payload === 'object' ? payload : { results: [] }
  const results = Array.isArray(base.results) ? [...base.results] : []
  const seq =
    sequence ?? getPackProgressSequence(base, participantIds) + 1
  const event = createProgressEvent({ sequence: seq, metrics })
  const idSet = new Set((participantIds || []).map(String))

  const nextResults = [...results]
  for (const sid of idSet) {
    const idx = nextResults.findIndex((r) => String(r.student_id) === sid)
    const row =
      idx >= 0
        ? { ...nextResults[idx] }
        : { student_id: sid, participated: true, source: 'COACH_CONFIRMED' }
    const events = Array.isArray(row.progress_events) ? [...row.progress_events] : []
    const existing = events.findIndex((e) => Number(e.sequence) === seq)
    if (existing >= 0) events[existing] = { ...events[existing], ...event }
    else events.push(event)
    row.progress_events = events.sort((a, b) => Number(a.sequence) - Number(b.sequence))
    const timing = getTimingMetrics(event)
    if (timing?.cumulative_time_ms != null) row.time_ms = timing.cumulative_time_ms
    if (idx >= 0) nextResults[idx] = row
    else nextResults.push(row)
  }
  return { ...base, results: nextResults }
}

export function appendProgressEventForParticipant(payload, studentId, metrics) {
  const base = payload && typeof payload === 'object' ? payload : { results: [] }
  const results = Array.isArray(base.results) ? [...base.results] : []
  const sid = String(studentId)
  const idx = results.findIndex((r) => String(r.student_id) === sid)
  const row =
    idx >= 0
      ? { ...results[idx] }
      : { student_id: sid, participated: true, source: 'COACH_CONFIRMED' }
  const events = Array.isArray(row.progress_events) ? [...row.progress_events] : []
  const seq = events.length ? Math.max(...events.map((e) => Number(e.sequence) || 0)) + 1 : 1
  const event = createProgressEvent({ sequence: seq, metrics })
  events.push(event)
  row.progress_events = events
  const timing = getTimingMetrics(event)
  if (timing?.cumulative_time_ms != null) row.time_ms = timing.cumulative_time_ms
  if (idx >= 0) results[idx] = row
  else results.push(row)
  return { ...base, results }
}

export function appendProgressEventForTeam(payload, teamId, metrics) {
  const base = payload && typeof payload === 'object' ? payload : { teams: [] }
  const teams = Array.isArray(base.teams) ? [...base.teams] : []
  const tid = String(teamId)
  const idx = teams.findIndex((t) => String(t.team_id) === tid)
  const row = idx >= 0 ? { ...teams[idx] } : { team_id: tid, members: [] }
  const events = Array.isArray(row.progress_events) ? [...row.progress_events] : []
  const seq = events.length ? Math.max(...events.map((e) => Number(e.sequence) || 0)) + 1 : 1
  const event = createProgressEvent({ sequence: seq, metrics })
  events.push(event)
  row.progress_events = events
  const timing = getTimingMetrics(event)
  if (timing?.cumulative_time_ms != null) row.time_ms = timing.cumulative_time_ms
  if (idx >= 0) teams[idx] = row
  else teams.push(row)
  return { ...base, teams }
}

function getPackProgressSequence(payload, participantIds) {
  const ids = (participantIds || []).map(String)
  if (!ids.length) return 0
  const row = (payload.results || []).find((r) => String(r.student_id) === ids[0])
  const events = row?.progress_events || []
  return events.length ? Math.max(...events.map((e) => Number(e.sequence) || 0)) : 0
}

export function computeProgressMetrics(payload, studentId) {
  const results = Array.isArray(payload?.results) ? payload.results : []
  const row = studentId
    ? results.find((r) => String(r.student_id) === String(studentId))
    : results[0]
  const events = Array.isArray(row?.progress_events) ? row.progress_events : []
  const splits = events
    .map((e) => getTimingMetrics(e)?.split_time_ms)
    .filter((t) => Number.isFinite(t) && t > 0)
  const target = payload?.progression_config?.target_progress_count ?? 0
  return {
    progressCompletedCount: events.length,
    remainingCount: target > 0 ? Math.max(0, target - events.length) : null,
    bestProgressSplit: splits.length ? Math.min(...splits) : null,
    currentProgressSplit: splits.length ? splits[splits.length - 1] : null,
  }
}
