/** Display-only formatting — storage always uses integer ms. */
export function formatDurationMs(ms) {
  const n = Number(ms)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1000) return `${Math.round(n)}ms`
  const sec = n / 1000
  if (sec < 60) return `${sec.toFixed(2)}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  return `${min}:${rem.toFixed(2).padStart(5, '0')}`
}

/** @deprecated use formatDurationMs */
export function formatDuration(seconds) {
  if (seconds == null) return '—'
  return formatDurationMs(Number(seconds) * 1000)
}
