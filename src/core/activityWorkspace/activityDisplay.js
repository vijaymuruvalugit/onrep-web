import { getActivityWorkspaceIcon, getActivityWorkspaceLabel } from '@onrep/contracts'

/**
 * Prefer owner-editable stored name/label (Core rename-in-place); fall back to registry by type.
 */
export function getWorkspaceDisplay(activity) {
  if (!activity) return { label: '', icon: '📌' }
  const type = String(activity.type || '').toLowerCase()
  const stored =
    (activity.label != null && String(activity.label).trim()) ||
    (activity.name != null && String(activity.name).trim()) ||
    ''
  return {
    label: stored || getActivityWorkspaceLabel(type),
    icon: getActivityWorkspaceIcon(type),
  }
}
