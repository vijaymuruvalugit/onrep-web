/**
 * Normalize skill-catalog API payloads (same shape as AthleteCaptureDrawer).
 * Handles empty `skills` array with populated platform/custom slices.
 */
export function mergeSkillCatalogList(skillsData) {
  if (!skillsData) return []
  if (Array.isArray(skillsData.skills) && skillsData.skills.length > 0) {
    return skillsData.skills
  }
  const platform = skillsData.platform || []
  const custom = skillsData.custom || []
  if (platform.length || custom.length) {
    return [...platform, ...custom]
  }
  return Array.isArray(skillsData.skills) ? skillsData.skills : []
}

export function groupSkillsByCategory(skillsData) {
  const list = mergeSkillCatalogList(skillsData)
  const byCat = new Map()
  for (const s of list) {
    const c = s.category || 'Other'
    if (!byCat.has(c)) byCat.set(c, [])
    byCat.get(c).push(s)
  }
  return Array.from(byCat.entries())
}

export function buildProgressSnapshot(raw, { showAll = false } = {}) {
  const latest = {}
  for (const row of raw?.kpis || []) {
    const c = row.code
    if (!latest[c]) latest[c] = row
  }
  const primaryCodes = [
    'SESSION_BEST_LAP_MS',
    'SESSION_LAP_CONSISTENCY_SCORE',
    'ROLLING_ATTENDANCE_PCT',
    'TREND_SPEED_DELTA',
    'TREND_TECHNIQUE_DELTA',
  ]
  const keys = showAll ? Object.keys(latest).sort() : primaryCodes.filter((c) => latest[c])
  return { latest, keys }
}
