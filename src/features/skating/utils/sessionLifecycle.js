/**
 * Operational session lifecycle for coach UX (distinct from raw DB timestamps).
 * @typedef {'upcoming'|'active'|'paused'|'ended'} SessionLifecycleKey
 */

/**
 * @param {{ opsState?: string, uiPaused?: boolean, operationalState?: string|null }} input
 * @returns {{ key: SessionLifecycleKey, badgeColor: string, label: string }}
 */
export function deriveSessionLifecycle({ opsState, uiPaused, operationalState }) {
  const op = String(operationalState || '').toLowerCase()
  if (op === 'paused') {
    return { key: 'paused', badgeColor: 'warning', label: 'Paused' }
  }
  if (op === 'cancelled') {
    return { key: 'ended', badgeColor: 'dark', label: 'Cancelled' }
  }
  if (op === 'completed' || op === 'archived') {
    return { key: 'ended', badgeColor: 'dark', label: 'Completed' }
  }
  if (op === 'scheduled') {
    return { key: 'upcoming', badgeColor: 'secondary', label: 'Scheduled' }
  }
  const raw = (opsState || 'upcoming').toLowerCase()
  if (raw === 'ended') {
    return { key: 'ended', badgeColor: 'dark', label: 'Ended' }
  }
  if (raw === 'active' && uiPaused) {
    return { key: 'paused', badgeColor: 'warning', label: 'Paused' }
  }
  if (raw === 'active') {
    return { key: 'active', badgeColor: 'success', label: 'Active' }
  }
  return { key: 'upcoming', badgeColor: 'secondary', label: 'Upcoming' }
}

/**
 * Human-friendly elapsed label while session is live.
 * @param {string|Date|null|undefined} startedAtIso
 * @param {{ nowMs?: number, endedAtIso?: string|Date|null }} [opts]
 */
export function formatElapsedLiveLabel(startedAtIso, opts = {}) {
  if (!startedAtIso) return null
  const start = new Date(startedAtIso).getTime()
  if (Number.isNaN(start)) return null
  const nowMs = opts.nowMs != null ? opts.nowMs : Date.now()
  const end = opts.endedAtIso ? new Date(opts.endedAtIso).getTime() : null
  const t = end != null && !Number.isNaN(end) ? end : nowMs
  const sec = Math.max(0, Math.floor((t - start) / 1000))
  const m = Math.floor(sec / 60)
  if (m < 120) {
    return m <= 0 ? 'Live • <1 min' : `Live • ${m} min${m === 1 ? '' : 's'}`
  }
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `Live • ${h}h ${mm}m`
}
