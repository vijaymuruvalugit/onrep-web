import React from 'react'
import { CButton, CCard, CCardBody } from '@coreui/react'
import { Link } from 'react-router-dom'
import { SKATING_OPS_COPY } from '../../../features/skating/constants/skatingOpsCopy'

/**
 * @param {{
 *   workspaceName?: string|null,
 *   dateYmd?: string,
 *   variant?: 'default'|'no_workspace'|'wrong_capability',
 * }} props
 */
export default function DayBoardEmptyState({
  workspaceName = null,
  dateYmd = '',
  variant = 'default',
}) {
  let title = SKATING_OPS_COPY.emptyTitle
  let body = SKATING_OPS_COPY.emptyBody

  if (variant === 'no_workspace') {
    title = 'Choose a program workspace'
    body = SKATING_OPS_COPY.emptyNoWorkspace
  } else if (variant === 'wrong_capability') {
    title = 'Wrong program workspace'
    body = SKATING_OPS_COPY.emptyWrongCapability
  } else if (workspaceName) {
    title = `No sessions on ${dateYmd || 'this day'}`
    body = SKATING_OPS_COPY.emptyBodyInWorkspace.replace(
      'your current program workspace',
      workspaceName,
    )
  }

  return (
    <CCard className="op-day-board-empty border-0 bg-body-tertiary">
      <CCardBody className="text-center py-5 px-4">
        <h2 className="h5 fw-semibold mb-2">{title}</h2>
        <p className="text-body-secondary mb-4 mx-auto" style={{ maxWidth: '28rem' }}>
          {body}
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <CButton as={Link} to="/coach/schedule" color="primary" size="sm">
            {SKATING_OPS_COPY.emptyCtaSchedule}
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}
