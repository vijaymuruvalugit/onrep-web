/**
 * Lightweight session stats from sync domains (operational, not analytics).
 * @returns {{ athleteCount: number, lapCount: number, focus: string|null, mostActive: { name: string, laps: number }|null }}
 */
export function computeSessionSummary(syncDomains, rosterCount, nameByStudentId = new Map()) {
  const athleteCount = Number(rosterCount) || 0
  const lapCount = Number(syncDomains?.totalLapCount ?? 0) || 0
  const meta = syncDomains?.sessionMeta
  const focus =
    meta?.sessionFocus != null && String(meta.sessionFocus).trim()
      ? String(meta.sessionFocus).trim()
      : null

  const recent = Array.isArray(syncDomains?.recentLaps) ? syncDomains.recentLaps : []
  const counts = new Map()
  for (const row of recent) {
    const sid = String(row.studentId ?? row.student_id ?? '').trim()
    if (!sid) continue
    counts.set(sid, (counts.get(sid) || 0) + 1)
  }
  let topSid = null
  let topN = 0
  for (const [sid, n] of counts.entries()) {
    if (n > topN) {
      topN = n
      topSid = sid
    }
  }
  let mostActive = null
  if (topSid && topN > 0) {
    const name =
      nameByStudentId.get(topSid) ||
      recent.find((r) => String(r.studentId ?? r.student_id) === topSid)?.studentName ||
      recent.find((r) => String(r.studentId ?? r.student_id) === topSid)?.student_full_name ||
      null
    if (name) mostActive = { name: String(name), laps: topN }
  }

  return { athleteCount, lapCount, focus, mostActive }
}
