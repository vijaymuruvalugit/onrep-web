import React from 'react'
import { CCard, CCardBody, CPlaceholder } from '@coreui/react'

export default function PlacesListSkeleton({ rows = 6 }) {
  return (
    <CCard className="mb-2">
      <CCardBody className="py-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="d-flex gap-3 align-items-center py-2 border-bottom">
            <CPlaceholder animation="glow" className="flex-grow-1">
              <CPlaceholder xs={8} />
              <CPlaceholder xs={4} size="sm" />
            </CPlaceholder>
            <CPlaceholder animation="glow" style={{ width: 64 }}>
              <CPlaceholder xs={12} size="sm" />
            </CPlaceholder>
          </div>
        ))}
      </CCardBody>
    </CCard>
  )
}
