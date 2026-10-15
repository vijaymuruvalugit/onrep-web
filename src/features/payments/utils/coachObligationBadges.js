/**
 * Coach-facing badges derived only from obligation API fields (single source of truth).
 */

export function coachObligationBadges(ob) {
  const state = String(ob.fee_state || ob.payment_status || '').toLowerCase()
  const outstanding =
    ob.outstanding_amount != null && ob.outstanding_amount !== ''
      ? Number(ob.outstanding_amount)
      : Math.max(0, (Number(ob.amount_due) || 0) - (Number(ob.amount_paid) || 0))
  const cash = Number(ob.cash_collected ?? ob.amount_paid) || 0
  const pendingReport = ob.has_pending_parent_report === true

  const badges = []

  if (state === 'waived') {
    badges.push({ key: 'waived', color: 'info', text: 'Waived' })
    return badges
  }

  const paid = state === 'paid' || (outstanding <= 0 && cash > 0)

  if (pendingReport) {
    badges.push({
      key: 'pending-review',
      color: 'warning',
      text: 'Pending manual review',
    })
  }

  if (paid) {
    if (ob.has_confirmed_online_payment === true) {
      badges.push({ key: 'paid-online', color: 'success', text: 'Paid online' })
    } else {
      badges.push({ key: 'paid-manual', color: 'success', text: 'Paid manually' })
    }
    return badges
  }

  const linkSt = String(ob.razorpay_link_status || '').toUpperCase()
  const exp = ob.razorpay_link_expire_at != null ? new Date(ob.razorpay_link_expire_at) : null
  const expiredByTime = exp != null && !Number.isNaN(exp.getTime()) && exp <= new Date()

  if (linkSt === 'EXPIRED' || expiredByTime) {
    badges.push({ key: 'link-expired', color: 'danger', text: 'Link expired' })
  } else if (linkSt === 'ACTIVE') {
    badges.push({ key: 'link-active', color: 'info', text: 'Link active' })
  } else if (linkSt === 'PAID') {
    badges.push({ key: 'link-paid', color: 'secondary', text: 'Paid' })
  } else if (linkSt === 'CANCELLED') {
    badges.push({ key: 'link-cancelled', color: 'secondary', text: 'Cancelled' })
  }

  if (!pendingReport) {
    badges.push({
      key: 'pending-parent',
      color: 'warning',
      text: 'Pending parent payment',
    })
  }

  return badges
}
