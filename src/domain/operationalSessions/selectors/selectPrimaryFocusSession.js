/**
 * Prefer first active operational session for the day (coach re-entry).
 * @param {import('../types').OperationalSession[]} sessions
 * @returns {string|null} session id
 */
export function selectPrimaryFocusSessionId(sessions) {
  const list = Array.isArray(sessions) ? sessions : []
  const active = list.find((s) => {
    const st = String(s?.state || '').toLowerCase()
    return st === 'active' || st === 'paused'
  })
  return active?.id ? String(active.id) : null
}
