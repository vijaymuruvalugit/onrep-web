import React from 'react'
import { CBadge } from '@coreui/react'

export default function PlaceStatusBadge({ isActive }) {
  if (isActive === false) {
    return (
      <CBadge color="secondary" className="text-uppercase">
        Inactive
      </CBadge>
    )
  }
  return (
    <CBadge color="success" className="text-uppercase">
      Active
    </CBadge>
  )
}
