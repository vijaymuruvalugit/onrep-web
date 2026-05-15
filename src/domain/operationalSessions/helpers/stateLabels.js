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
 * Coach-facing badge label for canonical operational state.
 * @param {string|null|undefined} state
 * @returns {string}
 */
export function operationalStateDisplayLabel(state) {
  const s = String(state || '').toLowerCase()
  if (s === 'active') return 'Live'
  if (s === 'paused') return 'Paused'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'completed' || s === 'archived') return 'Completed'
  if (s === 'scheduled' || s === 'upcoming') return 'Scheduled'
  return 'Scheduled'
}

/**
 * @param {string|null|undefined} state
 * @returns {string} CoreUI badge color
 */
export function operationalStateBadgeColor(state) {
  const s = String(state || '').toLowerCase()
  if (s === 'active') return 'success'
  if (s === 'paused') return 'warning'
  if (s === 'cancelled') return 'dark'
  if (s === 'completed' || s === 'archived') return 'secondary'
  if (s === 'scheduled' || s === 'upcoming') return 'primary'
  return 'secondary'
}
