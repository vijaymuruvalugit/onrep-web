/** @module core/activityWorkspace/workspacePersistence — persistence only; Redux is runtime SoT. */

export const ONREP_ACTIVE_ACTIVITY_STORAGE_KEY = 'onrep.activeActivityId'

const BROADCAST_NAME = 'onrep-activity-workspace'

let broadcastChannel = null

function getBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!broadcastChannel) broadcastChannel = new BroadcastChannel(BROADCAST_NAME)
  return broadcastChannel
}

export function readPersistedActivityId() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ONREP_ACTIVE_ACTIVITY_STORAGE_KEY)
  return raw && String(raw).trim() ? String(raw).trim() : null
}

export function writePersistedActivityId(activityId) {
  if (typeof window === 'undefined') return
  if (activityId == null || activityId === '') {
    window.localStorage.removeItem(ONREP_ACTIVE_ACTIVITY_STORAGE_KEY)
  } else {
    window.localStorage.setItem(ONREP_ACTIVE_ACTIVITY_STORAGE_KEY, String(activityId))
  }
}

export function broadcastWorkspaceChange(activityId) {
  const ch = getBroadcastChannel()
  if (ch) {
    try {
      ch.postMessage({ type: 'workspace', activityId: activityId ? String(activityId) : null })
    } catch {
      /* ignore */
    }
  }
}

export function subscribeWorkspaceBroadcast(handler) {
  const ch = getBroadcastChannel()
  if (!ch) return () => {}
  const fn = (ev) => {
    if (ev?.data?.type === 'workspace') handler(ev.data.activityId ?? null)
  }
  ch.addEventListener('message', fn)
  return () => ch.removeEventListener('message', fn)
}
