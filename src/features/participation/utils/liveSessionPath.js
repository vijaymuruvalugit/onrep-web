/**
 * Canonical coach path into the live session workspace (session participation capture).
 * @param {string|null|undefined} sessionId
 * @returns {string}
 */
export function liveSessionPath(sessionId) {
  if (!sessionId) return '/coach/skating'
  return `/coach/skating?session=${encodeURIComponent(String(sessionId))}`
}

export default liveSessionPath
