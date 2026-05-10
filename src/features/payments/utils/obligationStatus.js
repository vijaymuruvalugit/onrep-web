import { parseDate } from './formatDueShort'

/** Maps backend `payment_status` to a Bootstrap color used by `CBadge`. */
export function statusBadgeColor(status) {
  if (status === 'PAID') return 'success'
  if (status === 'OVERDUE') return 'danger'
  if (status === 'PARTIAL' || status === 'PENDING') return 'warning'
  return 'secondary'
}

/** Treats a missing status with a past due date as overdue (matches RN row tint). */
export function effectiveStatus(status, dueDate) {
  if (status) return status
  const d = parseDate(dueDate)
  if (!d || Number.isNaN(d.getTime())) return 'PENDING'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return dueDay < today ? 'OVERDUE' : 'PENDING'
}

export function transactionStatusLabel(status) {
  if (status === 'PENDING_COACH') return 'Pending coach'
  if (status === 'CONFIRMED') return 'Confirmed'
  if (status === 'REJECTED') return 'Rejected'
  if (status === 'RECORDED') return 'Recorded'
  return status || ''
}

export function transactionStatusColor(status) {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'PENDING_COACH') return 'warning'
  if (status === 'REJECTED') return 'danger'
  return 'secondary'
}
