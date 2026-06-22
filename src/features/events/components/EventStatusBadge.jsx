import React from 'react'
import { CBadge } from '@coreui/react'

const STATUS_COLOR = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'info',
}

const CATEGORY_COLOR = {
  COMPETITION: 'primary',
  WORKSHOP: 'warning',
  CAMP: 'info',
  ASSESSMENT: 'secondary',
  PERFORMANCE: 'success',
  COMMUNITY: 'light',
  CEREMONY: 'dark',
  TRAINING: 'primary',
  OTHER: 'secondary',
}

export function StatusBadge({ status }) {
  return (
    <CBadge color={STATUS_COLOR[status] || 'secondary'} className="text-uppercase">
      {status || '—'}
    </CBadge>
  )
}

export function CategoryBadge({ category }) {
  return (
    <CBadge color={CATEGORY_COLOR[category] || 'secondary'} className="text-uppercase">
      {category || '—'}
    </CBadge>
  )
}
