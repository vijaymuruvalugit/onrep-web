const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatDaysOfWeekList(days) {
  if (!Array.isArray(days) || days.length === 0) return '—'
  const sorted = [...new Set(days.map((d) => Number(d)).filter((n) => !Number.isNaN(n)))].sort(
    (a, b) => a - b,
  )
  return sorted.map((d) => DAY_LABELS[d] ?? String(d)).join(', ')
}

export function formatTimeRange(start, end) {
  if (!start) return '—'
  const e = end && String(end).trim() ? `–${end}` : ''
  return `${start}${e}`
}
