/**
 * Build ordered roster rows from skaters list + sync domain athlete ids (shell-first).
 *
 * @param {object[]} skaters
 * @param {object} syncDomains
 */
export function buildSessionRoster(skaters, syncDomains) {
  const byId = new Map((skaters || []).map((s) => [String(s.id), s]))
  const seen = new Set()
  const orderedIds = []

  const pushId = (id) => {
    const s = String(id || '').trim()
    if (!s || seen.has(s)) return
    seen.add(s)
    orderedIds.push(s)
  }

  const resolved = syncDomains?.resolvedAthletes
  if (Array.isArray(resolved)) {
    for (const r of resolved) pushId(r.student_id ?? r.studentId)
  }

  const meta = syncDomains?.sessionMeta
  const sessionIds = meta?.sessionSkaterIds || meta?.session_skater_ids || []
  for (const id of sessionIds) pushId(id)

  for (const g of syncDomains?.groups || []) {
    const gk = g.skaterIds || g.skater_ids || []
    for (const id of gk) pushId(id)
  }

  return orderedIds.map((id) => byId.get(id)).filter(Boolean)
}

export function buildRosterWithSource(rosterForSession, syncDomains) {
  const src = new Map(
    (syncDomains?.resolvedAthletes || []).map((r) => [
      String(r.student_id ?? r.studentId),
      r.source,
    ]),
  )
  const sessionSet = new Set(
    (
      syncDomains?.sessionMeta?.sessionSkaterIds ||
      syncDomains?.sessionMeta?.session_skater_ids ||
      []
    ).map(String),
  )
  return rosterForSession.map((r) => {
    const id = String(r.id)
    let source = src.get(id)
    if (!source && sessionSet.has(id)) source = 'manual_session_override'
    return { ...r, rosterSource: source || null }
  })
}

/**
 * Athlete focus from session meta sync slice only (not full bundle).
 */
export function athleteFocusFromMeta(sessionMeta, studentId) {
  if (!studentId || !sessionMeta) return null
  const map = sessionMeta.sessionAthleteFocusJson
  const cell = map && typeof map === 'object' ? map[studentId] : null
  const txt =
    cell && typeof cell === 'object' && cell.text != null ? String(cell.text).trim() : ''
  return { text: txt }
}
