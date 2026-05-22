/** Local calendar date YYYY-MM-DD (browser timezone). */
export function formatLocalYmd(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** User-facing calendar date DD-MM-YYYY. Keeps API dates separate from display dates. */
export function formatDisplayDateDmy(value = new Date()) {
  const d = value instanceof Date ? value : parseDisplayDate(value)
  if (!d || Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function formatDisplayDateTimeDmy(value) {
  const d = parseDisplayDate(value)
  if (!d || Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDisplayDateDmy(d)} ${hh}:${mm}`
}

function parseDisplayDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return value
  const s = String(value)
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
