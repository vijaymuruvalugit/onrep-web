import React from 'react'
import { CCard, CCardBody } from '@coreui/react'

/** Sports-toned empty state (no fabricated data). */
const DashboardEmptyState = ({ title, detail, children }) => (
  <CCard className="border-0 bg-body-tertiary">
    <CCardBody className="text-center py-4 px-3">
      <div className="fw-semibold">{title}</div>
      {detail ? <div className="small text-body-secondary mt-1">{detail}</div> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </CCardBody>
  </CCard>
)

export default DashboardEmptyState
