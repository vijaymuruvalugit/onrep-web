import { getActivityWorkspaceIcon, getActivityWorkspaceLabel } from '@onrep/contracts'

/**
 * Prefer owner-editable stored name/label (Core rename-in-place); fall back to registry by type.
 * Legacy signup default was "Activity" for type=core — show registry "Skating" until renamed.
 */
function resolveStoredLabel(activity, type) {
  const stored =
    (activity.label != null && String(activity.label).trim()) ||
    (activity.name != null && String(activity.name).trim()) ||
    ''
  if (!stored) return ''
  if (type === 'core' && stored.toLowerCase() === 'activity') return ''
  return stored
}

export function getWorkspaceDisplay(activity) {
  if (!activity) return { label: '', icon: '📌' }
  const type = String(activity.type || '').toLowerCase()
  const stored = resolveStoredLabel(activity, type)
  return {
    label: stored || getActivityWorkspaceLabel(type),
    icon: getActivityWorkspaceIcon(type),
  }
}
