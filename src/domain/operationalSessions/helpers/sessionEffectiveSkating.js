/**
 * Session-effective Skating live-floor eligibility.
 * Matches backend canWriteSpecialistOnSession: academies.modules.skating ∩
 * session.specialistModule === 'skating'. Activity type alone is not enough —
 * legacy Skating workspaces with tools OFF must open Core operations.
 *
 * @param {{
 *   session?: { specialistModule?: string|null, specialist_module?: string|null, activityType?: string|null }|null,
 *   modules?: { skating?: boolean }|null,
 *   activityType?: string|null,
 * }} p
 * @returns {boolean}
 */
export function sessionOpensSkatingLiveTools(p = {}) {
  const modules = p.modules && typeof p.modules === 'object' ? p.modules : {}
  if (modules.skating !== true) return false

  const session = p.session || {}
  const stamp = String(session.specialistModule ?? session.specialist_module ?? '')
    .trim()
    .toLowerCase()

  if (stamp === 'skating') return true
  if (stamp === 'none' || stamp === 'music') return false

  // Missing stamp on an otherwise skating-eligible programme: legacy inherit
  // only when the workspace activity type is skating (and modules already on).
  const activityType = String(
    session.activityType || p.activityType || '',
  )
    .trim()
    .toLowerCase()
  return activityType === 'skating'
}

/**
 * Path into the coach session workspace for this occurrence.
 * Skating-eligible → live floor; otherwise Core ops deep-link (schedule focus).
 *
 * @param {string|null|undefined} sessionId
 * @param {{ opensSkatingLive?: boolean }} [opts]
 */
export function sessionWorkspacePath(sessionId, opts = {}) {
  if (!sessionId) {
    return opts.opensSkatingLive ? '/coach/skating' : '/coach/schedule'
  }
  const id = encodeURIComponent(String(sessionId))
  if (opts.opensSkatingLive) {
    return `/coach/skating?session=${id}`
  }
  return `/coach/ops/sessions/${id}`
}
