import React from 'react'
import { CBadge } from '@coreui/react'
import { effectiveStatus, statusBadgeColor } from '../utils/obligationStatus'

const StatusBadge = ({ status, dueDate }) => {
  const resolved = effectiveStatus(status, dueDate)
  return <CBadge color={statusBadgeColor(resolved)}>{resolved}</CBadge>
}

export default StatusBadge
