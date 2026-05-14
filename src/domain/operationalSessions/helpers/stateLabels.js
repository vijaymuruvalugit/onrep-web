/**
 * Map canonical operational `state` to legacy skating bundle `opsState` for workspace compatibility.
 * @param {string|null|undefined} state
 * @returns {'upcoming'|'active'|'ended'}
 */
export function operationalStateToLegacyOpsState(state) {
  const s = String(state || '').toLowerCase()
  if (s === 'completed' || s === 'archived' || s === 'cancelled') return 'ended'
  if (s === 'active' || s === 'paused') return 'active'
  return 'upcoming'
}

/**
 * @param {string|null|undefined} state
 * @returns {string} CoreUI badge color
 */
export function operationalStateBadgeColor(state) {
  const s = String(state || '').toLowerCase()
  if (s === 'active') return 'success'
  if (s === 'paused') return 'warning'
  if (s === 'completed' || s === 'archived' || s === 'cancelled') return 'dark'
  if (s === 'scheduled' || s === 'upcoming') return 'secondary'
  return 'secondary'
}
