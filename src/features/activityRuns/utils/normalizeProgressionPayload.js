/**
 * Mirror of onrep-backend normalizeProgressionPayload (keep in sync).
 */

/** @param {unknown} value */
export function coerceTimerAnchorMs(value) {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * @param {{ splitTimeMs?: number, cumulativeTimeMs?: number }} timing
 * @returns {{ split_time_ms: number, cumulative_time_ms: number }|null}
 */
export function coerceStopwatchTiming(timing) {
  if (!timing || typeof timing !== 'object') return null
  let cumulative = Math.round(Number(timing.cumulativeTimeMs))
  let split = Math.round(Number(timing.splitTimeMs))
  if (!Number.isFinite(cumulative) || cumulative < 1) return null
  if (!Number.isFinite(split) || split < 1) split = cumulative
  return { split_time_ms: split, cumulative_time_ms: cumulative }
}

/**
 * @param {object} metrics
 * @returns {object}
 */
export function sanitizeTimingMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return {}
  const out = {}
  const cumulative = Number(metrics.cumulative_time_ms)
  const split = Number(metrics.split_time_ms)
  if (Number.isFinite(cumulative) && cumulative > 0 && Math.round(cumulative) === cumulative) {
    out.cumulative_time_ms = Math.round(cumulative)
  }
  if (Number.isFinite(split) && split > 0 && Math.round(split) === split) {
    out.split_time_ms = Math.round(split)
  } else if (out.cumulative_time_ms != null) {
    out.split_time_ms = out.cumulative_time_ms
  }
  return out
}

export function getTimingMetrics(event) {
  if (!event?.metrics || typeof event.metrics !== 'object') return null
  const m = event.metrics
  const split = m.split_time_ms != null ? Number(m.split_time_ms) : null
  const cumulative = m.cumulative_time_ms != null ? Number(m.cumulative_time_ms) : null
  if (
    (split == null || !Number.isFinite(split)) &&
    (cumulative == null || !Number.isFinite(cumulative))
  ) {
    return null
  }
  return {
    ...(split != null && Number.isFinite(split) ? { split_time_ms: split } : {}),
    ...(cumulative != null && Number.isFinite(cumulative)
      ? { cumulative_time_ms: cumulative }
      : {}),
  }
}

export function normalizeProgressEvent(event) {
  if (!event || typeof event !== 'object') return event
  const e = { ...event }
  const sequence = e.sequence ?? e.lap_number ?? e.lapNumber
  if (sequence != null) e.sequence = Number(sequence)

  const metrics = { ...(e.metrics && typeof e.metrics === 'object' ? e.metrics : {}) }
  if (e.split_time_ms != null) metrics.split_time_ms = Number(e.split_time_ms)
  if (e.cumulative_time_ms != null) metrics.cumulative_time_ms = Number(e.cumulative_time_ms)
  if (e.lap_time_ms != null && metrics.split_time_ms == null) {
    metrics.split_time_ms = Number(e.lap_time_ms)
  }
  delete e.split_time_ms
  delete e.cumulative_time_ms
  delete e.lap_time_ms
  delete e.lap_number
  delete e.lapNumber

  const sanitized = sanitizeTimingMetrics(metrics)
  if (Object.keys(sanitized).length) e.metrics = sanitized
  else delete e.metrics

  if (!e.captured_at && e.capturedAt) e.captured_at = e.capturedAt
  delete e.capturedAt

  return e
}

function normalizeResultRow(row) {
  if (!row || typeof row !== 'object') return row
  const r = { ...row }
  let events = []
  if (Array.isArray(r.progress_events)) {
    events = r.progress_events.map(normalizeProgressEvent)
  } else if (Array.isArray(r.laps)) {
    events = r.laps.map((lap, i) =>
      normalizeProgressEvent({
        sequence: lap.lap_number ?? lap.sequence ?? i + 1,
        captured_at: lap.captured_at,
        split_time_ms: lap.split_time_ms ?? lap.lap_time_ms,
        cumulative_time_ms: lap.cumulative_time_ms,
        metrics: lap.metrics,
      }),
    )
    delete r.laps
  } else if (Array.isArray(r.lap_times_ms)) {
    events = r.lap_times_ms.map((ms, i) =>
      normalizeProgressEvent({
        sequence: i + 1,
        metrics: { split_time_ms: Number(ms) },
      }),
    )
    delete r.lap_times_ms
  }
  if (events.length) r.progress_events = events
  if (r.time_ms == null && events.length) {
    const last = events[events.length - 1]
    const timing = getTimingMetrics(last)
    if (timing?.cumulative_time_ms != null) r.time_ms = timing.cumulative_time_ms
    else if (timing?.split_time_ms != null) r.time_ms = timing.split_time_ms
  }
  return r
}

function normalizeTeamRow(team) {
  if (!team || typeof team !== 'object') return team
  const t = { ...team }
  if (Array.isArray(t.progress_events)) {
    t.progress_events = t.progress_events.map(normalizeProgressEvent)
  } else if (Array.isArray(t.laps)) {
    t.progress_events = t.laps.map((lap, i) =>
      normalizeProgressEvent({
        sequence: lap.lap_number ?? i + 1,
        split_time_ms: lap.split_time_ms,
        cumulative_time_ms: lap.cumulative_time_ms,
        metrics: lap.metrics,
      }),
    )
    delete t.laps
  }
  return t
}

export function normalizeProgressionPayload(payload) {
  const raw = payload && typeof payload === 'object' ? { ...payload } : {}
  const version = Number(raw.payload_version ?? raw.payloadVersion ?? 1)
  const out = { ...raw }

  if (raw.lap_config && !raw.progression_config) {
    const lc = raw.lap_config
    out.progression_config = {
      enabled: lc.enabled !== false,
      target_progress_count:
        lc.target_progress_count ?? lc.total_laps ?? lc.target_laps ?? 0,
      progression_mode: lc.progression_mode ?? lc.lap_mode ?? 'PACK',
      distance_label: lc.distance_label ?? null,
      locked: Boolean(lc.locked),
    }
    delete out.lap_config
  }

  if (Array.isArray(raw.results)) out.results = raw.results.map(normalizeResultRow)
  if (Array.isArray(raw.teams)) out.teams = raw.teams.map(normalizeTeamRow)

  const hasProgression =
    out.progression_config ||
    (Array.isArray(out.results) && out.results.some((r) => r?.progress_events?.length)) ||
    raw.lap_config

  if (hasProgression) out.payload_version = 2
  else if (out.payload_version == null) out.payload_version = version || 1

  return out
}
