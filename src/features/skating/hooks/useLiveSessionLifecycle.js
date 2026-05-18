import { useEffect } from 'react'

/**
 * Session enter + tab visibility — background session sync and shell refresh without duplicate loaders on page.
 */
export function useLiveSessionLifecycle({
  sessionId,
  refreshAllSyncDomains,
  refreshShell,
  loadDayBoard,
  onTabVisible,
}) {
  useEffect(() => {
    if (!sessionId) return
    void refreshAllSyncDomains({ silent: true, recentLapLimit: 120 })
  }, [sessionId, refreshAllSyncDomains])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      if (sessionId) {
        void refreshAllSyncDomains({ silent: true, recentLapLimit: 120 })
        void refreshShell?.({ silent: true })
      }
      void loadDayBoard?.({ silent: true })
      onTabVisible?.()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [sessionId, refreshAllSyncDomains, refreshShell, loadDayBoard, onTabVisible])
}

export default useLiveSessionLifecycle
