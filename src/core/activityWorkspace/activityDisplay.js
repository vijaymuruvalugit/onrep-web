import { getActivityWorkspaceIcon, getActivityWorkspaceLabel } from '@onrep/contracts'

/**
 * Always derive label/icon from platform registry via `type`.
 * Do not use persisted `activities.name` — avoids stale DB rows affecting UI.
 */
export function getWorkspaceDisplay(activity) {
  if (!activity) return { label: '', icon: '📌' }
  const type = String(activity.type || '').toLowerCase()
  return {
    label: getActivityWorkspaceLabel(type),
    icon: getActivityWorkspaceIcon(type),
  }
}
