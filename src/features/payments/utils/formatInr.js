const inrFmt = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Format amount digits without currency symbol. */
export function formatInr(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (Number.isNaN(n)) return '—'
  return inrFmt.format(n)
}

/** Canonical money display: ₹ + en-IN (INR only this launch). */
export function formatMoney(amount, currency = 'INR') {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (Number.isNaN(n)) return '—'
  const code = String(currency || 'INR').toUpperCase()
  if (code === 'INR') return `₹${inrFmt.format(n)}`
  return `${code} ${inrFmt.format(n)}`
}

export default formatInr
