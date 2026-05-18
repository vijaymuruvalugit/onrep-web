import { useCallback, useEffect, useRef, useState } from 'react'
import { skatingOpsApi } from '../api/skatingOpsApi'
import {
  EMPTY_SYNC_DOMAINS,
  extractSyncDomainsFromBundle,
  mergeSyncDomains,
} from './liveSessionSyncDomains'

/**
 * Background session sync — per-domain merges, fail-open, no workspace ownership.
 *
 * @param {string} sessionId
 */
export function useLiveSessionRefresh(sessionId) {
  const [syncDomains, setSyncDomains] = useState(EMPTY_SYNC_DOMAINS)
  const [syncError, setSyncError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [syncAgeTick, setSyncAgeTick] = useState(0)
  const sessionIdRef = useRef(sessionId)

  sessionIdRef.current = sessionId

  useEffect(() => {
    if (!sessionId) {
      setSyncDomains(EMPTY_SYNC_DOMAINS)
      setSyncError(null)
      setLastSyncedAt(null)
      return
    }
    setSyncDomains(EMPTY_SYNC_DOMAINS)
    setSyncError(null)
  }, [sessionId])

  useEffect(() => {
    const id = setInterval(() => setSyncAgeTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const applyPatch = useCallback((patch) => {
    setSyncDomains((prev) => mergeSyncDomains(prev, patch))
    setLastSyncedAt(Date.now())
  }, [])

  const refreshAllSyncDomains = useCallback(
    async (opts = {}) => {
      const sid = sessionIdRef.current
      if (!sid) return false
      const silent = Boolean(opts.silent)
      if (!silent) setSyncing(true)
      try {
        const bundle = await skatingOpsApi.getSessionBundle(sid, {
          recentLapLimit: opts.recentLapLimit ?? 120,
          blockId: opts.blockId || undefined,
        })
        const extracted = extractSyncDomainsFromBundle(bundle)
        setSyncDomains((prev) => mergeSyncDomains(prev, extracted))
        setLastSyncedAt(Date.now())
        if (silent) setSyncError(null)
        return { bundle, extracted }
      } catch (e) {
        setSyncError(e?.message || 'Background session sync failed.')
        return false
      } finally {
        if (!silent) setSyncing(false)
      }
    },
    [],
  )

  const refreshLapsSyncDomain = useCallback(
    async (opts = {}) => {
      const result = await refreshAllSyncDomains({ ...opts, silent: true })
      if (!result) return false
      return result
    },
    [refreshAllSyncDomains],
  )

  const refreshLeaderboardSyncDomain = useCallback(async () => {
    const sid = sessionIdRef.current
    if (!sid) return false
    try {
      const leaderboard = await skatingOpsApi.getLeaderboard(sid)
      applyPatch({ leaderboard })
      return true
    } catch (e) {
      setSyncError(e?.message || 'Could not refresh leaderboard.')
      return false
    }
  }, [applyPatch])

  const refreshCoachingEventsSyncDomain = useCallback(async () => {
    const sid = sessionIdRef.current
    if (!sid) return false
    try {
      const events = await skatingOpsApi.listCoachingEvents(sid, { limit: 80 })
      applyPatch({ coachingEvents: events })
      return true
    } catch (e) {
      setSyncError(e?.message || 'Could not refresh coaching events.')
      return false
    }
  }, [applyPatch])

  const refreshRaceResultsSyncDomain = useCallback(async () => {
    const sid = sessionIdRef.current
    if (!sid) return false
    try {
      const races = await skatingOpsApi.listRacesAggregate(sid)
      applyPatch({ races })
      await refreshLeaderboardSyncDomain()
      return true
    } catch (e) {
      setSyncError(e?.message || 'Could not refresh race results.')
      return false
    }
  }, [applyPatch, refreshLeaderboardSyncDomain])

  const patchSessionMeta = useCallback((fields) => {
    applyPatch({
      sessionMeta: fields,
    })
  }, [applyPatch])

  const appendRecentLap = useCallback((lapRow) => {
    if (!lapRow) return
    setSyncDomains((prev) => ({
      ...prev,
      recentLaps: [lapRow, ...(prev.recentLaps || [])].slice(0, 120),
      recentLapCount: (prev.recentLapCount || 0) + 1,
      totalLapCount: (prev.totalLapCount || 0) + 1,
    }))
    setLastSyncedAt(Date.now())
  }, [])

  const removeRecentLap = useCallback((lapId) => {
    if (!lapId) return
    setSyncDomains((prev) => ({
      ...prev,
      recentLaps: (prev.recentLaps || []).filter((r) => String(r.id) !== String(lapId)),
      recentLapCount: Math.max(0, (prev.recentLapCount || 0) - 1),
      totalLapCount: Math.max(0, (prev.totalLapCount || 0) - 1),
    }))
  }, [])

  return {
    syncDomains,
    syncError,
    setSyncError,
    syncing,
    lastSyncedAt,
    syncAgeTick,
    refreshAllSyncDomains,
    refreshLapsSyncDomain,
    refreshLeaderboardSyncDomain,
    refreshCoachingEventsSyncDomain,
    refreshRaceResultsSyncDomain,
    patchSessionMeta,
    appendRecentLap,
    removeRecentLap,
    applyPatch,
  }
}

export default useLiveSessionRefresh
