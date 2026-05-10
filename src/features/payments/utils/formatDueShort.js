/** Parse YYYY-MM-DD without UTC day-shift. */
export function parseDate(dateStr) {
  if (dateStr == null || dateStr === '') return null
  return new Date(`${String(dateStr).slice(0, 10)}T12:00:00`)
}

export function formatDueShort(dateStr) {
  const d = parseDate(dateStr)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatDueLong(dateStr) {
  const d = parseDate(dateStr)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatPeriodMonth(periodMonth) {
  const [y, m] = String(periodMonth || '')
    .split('-')
    .map(Number)
  if (!y || !m) return String(periodMonth || '')
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function monthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function lastDayOfMonth(year, monthOneBased) {
  return new Date(year, monthOneBased, 0).getDate()
}
