/**
 * Coach day-board sort: live → paused → upcoming → completed → cancelled; then by start time.
 * @param {import('../types').OperationalSession[]} sessions
 * @returns {import('../types').OperationalSession[]}
 */
export function sortDayBoardSessions(sessions) {
  const list = Array.isArray(sessions) ? [...sessions] : []
  const rank = (state) => {
    const s = String(state || '').toLowerCase()
    if (s === 'active') return 0
    if (s === 'paused') return 1
    if (s === 'scheduled' || s === 'upcoming') return 2
    if (s === 'completed' || s === 'archived') return 3
    if (s === 'cancelled') return 4
    return 5
  }
  const startMs = (row) => {
    const iso = row?.actualStartAt || row?.scheduledStartAt
    if (!iso) return Number.MAX_SAFE_INTEGER
    const t = new Date(iso).getTime()
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
  }
  return list.sort((a, b) => {
    const dr = rank(a.state) - rank(b.state)
    if (dr !== 0) return dr
    return startMs(a) - startMs(b)
  })
}
