import React from 'react'
import { CCard, CCardBody, CCol, CPlaceholder, CRow } from '@coreui/react'

const DashboardCardSkeleton = ({ rows = 4 }) => (
  <CRow className="g-3 mb-3">
    {Array.from({ length: rows }).map((_, i) => (
      <CCol key={i} xs={6} lg={3}>
        <CCard className="h-100">
          <CCardBody>
            <CPlaceholder size="lg" animation="glow" className="w-50 mb-3" />
            <CPlaceholder size="xs" animation="glow" className="w-75" />
          </CCardBody>
        </CCard>
      </CCol>
    ))}
  </CRow>
)

export default DashboardCardSkeleton
