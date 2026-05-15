import React from 'react'
import { CButton, CCard, CCardBody } from '@coreui/react'
import { Link } from 'react-router-dom'
import { SKATING_OPS_COPY } from '../../../features/skating/constants/skatingOpsCopy'

/**
 * @param {{ onAdHoc: () => void }} props
 */
export default function DayBoardEmptyState({ onAdHoc }) {
  return (
    <CCard className="op-day-board-empty border-0 bg-body-tertiary">
      <CCardBody className="text-center py-5 px-4">
        <h2 className="h5 fw-semibold mb-2">{SKATING_OPS_COPY.emptyTitle}</h2>
        <p className="text-body-secondary mb-4 mx-auto" style={{ maxWidth: '28rem' }}>
          {SKATING_OPS_COPY.emptyBody}
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <CButton as={Link} to="/coach/schedule" color="primary" size="sm">
            {SKATING_OPS_COPY.emptyCtaSchedule}
          </CButton>
          <CButton color="light" size="sm" variant="outline" onClick={onAdHoc}>
            {SKATING_OPS_COPY.emptyCtaAdHoc}
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}
