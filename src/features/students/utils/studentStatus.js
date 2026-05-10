export const STUDENT_STATUS_COLORS = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
  overdue: 'danger',
}

export function normalizeStatus(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
  if (!normalized) return 'pending'
  if (normalized === 'partially paid') return 'pending'
  return normalized
}

export function statusColor(value) {
  const normalized = normalizeStatus(value)
  return STUDENT_STATUS_COLORS[normalized] || 'secondary'
}

export function statusLabel(value) {
  const normalized = normalizeStatus(value)
  if (normalized === 'inactive') return 'Inactive'
  if (normalized === 'overdue') return 'Overdue'
  if (normalized === 'pending') return 'Pending'
  if (normalized === 'active') return 'Active'
  return value || 'Unknown'
}
