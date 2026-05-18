import { useMemo } from 'react'

/**
 * Stable primitives from sync domains — avoid `bundle` object identity in effect deps.
 */
export function useSyncDomainPrimitives(syncDomains) {
  return useMemo(() => {
    const meta = syncDomains?.sessionMeta
    const races = syncDomains?.races
    return {
      sessionMeta: meta,
      hasSessionMeta: Boolean(meta),
      sessionOpsState: meta?.opsState,
      sessionMode: meta?.sessionMode,
      sessionSkaterIds: meta?.sessionSkaterIds || meta?.session_skater_ids || [],
      resolvedAthletes: syncDomains?.resolvedAthletes || [],
      groups: syncDomains?.groups || [],
      races: races || [],
      racesCount: Array.isArray(races) ? races.length : 0,
      recentLaps: syncDomains?.recentLaps || [],
      coachingEvents: syncDomains?.coachingEvents || [],
      totalLapCount: syncDomains?.totalLapCount ?? 0,
      suggestedFocusRaceId: syncDomains?.suggestedFocusRaceId,
      sessionStartedAt: meta?.startedAt || meta?.started_at,
      sessionEndedAt: meta?.endedAt || meta?.ended_at,
      placeName: meta?.placeName,
    }
  }, [
    syncDomains?.sessionMeta,
    syncDomains?.resolvedAthletes,
    syncDomains?.groups,
    syncDomains?.races,
    syncDomains?.recentLaps,
    syncDomains?.coachingEvents,
    syncDomains?.totalLapCount,
    syncDomains?.suggestedFocusRaceId,
  ])
}
