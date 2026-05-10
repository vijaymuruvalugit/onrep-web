const inrFmt = new Intl.NumberFormat('en-IN')

export function formatInr(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (Number.isNaN(n)) return '—'
  return inrFmt.format(n)
}

export default formatInr
