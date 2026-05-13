/**
 * §15 coach-first plan — lightweight internal counters for adoption / UX research.
 * Not shown in coach UI. In development, bumps log to the console; production
 * keeps in-memory totals only (inspect via `getSkatingOpsInternalMetrics()` from devtools).
 */
const counts = {
  lapSaveSuccess: 0,
  observationSaveSuccess: 0,
  sessionStartedOnIce: 0,
  sessionEnded: 0,
  athleteAddedToSession: 0,
  timingLaneCreated: 0,
}

export function bumpSkatingOpsMetric(key) {
  if (!Object.prototype.hasOwnProperty.call(counts, key)) return
  counts[key] += 1
  if (import.meta.env?.DEV) {
    console.debug('[skating-ops-metrics]', key, { ...counts })
  }
}

export function getSkatingOpsInternalMetrics() {
  return { ...counts }
}

export function resetSkatingOpsInternalMetrics() {
  for (const k of Object.keys(counts)) counts[k] = 0
}
