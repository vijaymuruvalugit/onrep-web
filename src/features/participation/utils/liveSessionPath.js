import { sessionWorkspacePath } from '../../../domain/operationalSessions/helpers/sessionEffectiveSkating'

/**
 * Coach path into the session workspace.
 * Prefer sessionWorkspacePath({ opensSkatingLive }) when modules ∩ stamp are known.
 * Without eligibility context this deep-links via Core ops redirect, which resolves
 * session-effective routing (avoids forcing LiveSessionWorkspace for Core/tools-off).
 *
 * @param {string|null|undefined} sessionId
 * @param {{ opensSkatingLive?: boolean }} [opts]
 * @returns {string}
 */
export function liveSessionPath(sessionId, opts = {}) {
  if (opts.opensSkatingLive === true) {
    return sessionWorkspacePath(sessionId, { opensSkatingLive: true })
  }
  if (opts.opensSkatingLive === false) {
    return sessionWorkspacePath(sessionId, { opensSkatingLive: false })
  }
  // Unknown eligibility — Core ops redirect resolves modules ∩ stamp.
  if (!sessionId) return '/coach/schedule'
  return `/coach/ops/sessions/${encodeURIComponent(String(sessionId))}`
}

export default liveSessionPath
