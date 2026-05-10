import React from 'react'
import { CBadge } from '@coreui/react'
import { statusColor, statusLabel } from '../utils/studentStatus'

const StudentStatusBadge = ({ status }) => {
  return <CBadge color={statusColor(status)}>{statusLabel(status)}</CBadge>
}

export default StudentStatusBadge
