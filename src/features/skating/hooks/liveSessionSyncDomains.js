/**
 * Background session sync domains — partial merges only (no full snapshot replacement).
 */

export const EMPTY_SYNC_DOMAINS = {
  recentLaps: [],
  recentLapCount: 0,
  totalLapCount: 0,
  leaderboard: null,
  raceResults: [],
  coachingEvents: [],
  sessionMeta: null,
  races: [],
  groups: [],
  resolvedAthletes: [],
  suggestedFocusRaceId: null,
}

/**
 * Map training bundle snapshot into sync domains (reconnect / refreshAll).
 * @param {object|null} bundle
 */
export function extractSyncDomainsFromBundle(bundle) {
  if (!bundle) return { ...EMPTY_SYNC_DOMAINS }
  return {
    recentLaps: Array.isArray(bundle.recentLaps) ? bundle.recentLaps : [],
    recentLapCount: Number(bundle.recentLapCount ?? 0) || 0,
    totalLapCount: Number(bundle.totalLapCount ?? 0) || 0,
    leaderboard: bundle.leaderboard ?? null,
    raceResults: Array.isArray(bundle.raceResults) ? bundle.raceResults : [],
    coachingEvents: Array.isArray(bundle.recentCoachingEvents)
      ? bundle.recentCoachingEvents
      : [],
    sessionMeta: bundle.session ?? null,
    races: Array.isArray(bundle.races) ? bundle.races : [],
    groups: Array.isArray(bundle.groups) ? bundle.groups : [],
    resolvedAthletes: Array.isArray(bundle.resolvedAthletes) ? bundle.resolvedAthletes : [],
    suggestedFocusRaceId: bundle.suggestedFocusRaceId ?? null,
  }
}

/**
 * Merge snapshot into previous sync domains — never replaces unrelated domains with undefined.
 * @param {typeof EMPTY_SYNC_DOMAINS} prev
 * @param {Partial<typeof EMPTY_SYNC_DOMAINS>} patch
 */
export function mergeSyncDomains(prev, patch) {
  if (!patch) return prev
  const next = { ...prev }
  if (patch.recentLaps !== undefined) next.recentLaps = patch.recentLaps
  if (patch.recentLapCount !== undefined) next.recentLapCount = patch.recentLapCount
  if (patch.totalLapCount !== undefined) next.totalLapCount = patch.totalLapCount
  if (patch.leaderboard !== undefined) next.leaderboard = patch.leaderboard
  if (patch.raceResults !== undefined) next.raceResults = patch.raceResults
  if (patch.coachingEvents !== undefined) next.coachingEvents = patch.coachingEvents
  if (patch.races !== undefined) next.races = patch.races
  if (patch.groups !== undefined) next.groups = patch.groups
  if (patch.resolvedAthletes !== undefined) next.resolvedAthletes = patch.resolvedAthletes
  if (patch.suggestedFocusRaceId !== undefined) next.suggestedFocusRaceId = patch.suggestedFocusRaceId
  if (patch.sessionMeta !== undefined) {
    next.sessionMeta =
      prev.sessionMeta && patch.sessionMeta
        ? { ...prev.sessionMeta, ...patch.sessionMeta }
        : patch.sessionMeta
  }
  return next
}
