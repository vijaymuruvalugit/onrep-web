/** Frontend-only confidence for coach pending parent reports (matches RN scoring). */
export function paymentConfidenceLabel(report) {
  let score = 0
  const remaining = Number(report?.remaining_amount)
  const amount = Number(report?.amount)
  if (!Number.isNaN(remaining) && !Number.isNaN(amount) && Math.abs(remaining - amount) < 0.005) {
    score += 50
  }
  const paymentRef = String(report?.payment_ref || '').trim()
  const submittedRef = String(report?.submitted_payment_ref || '').trim()
  if (paymentRef && submittedRef && paymentRef === submittedRef) {
    score += 30
  }
  const recordedAtMs = report?.recorded_at ? new Date(report.recorded_at).getTime() : 0
  if (recordedAtMs && Date.now() - recordedAtMs <= 24 * 60 * 60 * 1000) {
    score += 20
  }
  if (score >= 80) return { score, label: 'High confidence', color: 'success' }
  if (score >= 50) return { score, label: 'Medium confidence', color: 'warning' }
  return { score, label: 'Low confidence', color: 'secondary' }
}

export default paymentConfidenceLabel
