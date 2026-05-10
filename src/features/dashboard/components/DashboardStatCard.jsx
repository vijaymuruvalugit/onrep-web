import React from 'react'
import { CCard, CCardBody } from '@coreui/react'

/**
 * Compact KPI tile — avoids dense ERP tables.
 */
const DashboardStatCard = ({ title, value, hint, accentClass = '', loading }) => (
  <CCard className={`h-100 border-0 shadow-sm ${accentClass}`}>
    <CCardBody className="py-3">
      <div className="text-body-secondary text-uppercase small fw-semibold mb-1">{title}</div>
      <div className="fs-4 fw-bold">
        {loading ? <span className="placeholder col-6 d-inline-block rounded" /> : value}
      </div>
      {hint ? <div className="small text-body-secondary mt-1">{hint}</div> : null}
    </CCardBody>
  </CCard>
)

export default DashboardStatCard
