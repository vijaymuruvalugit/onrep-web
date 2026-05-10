import React from 'react'
import { CAlert, CBadge, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilCheckCircle } from '@coreui/icons'
import { formatInr } from '../utils/formatInr'
import { formatDueLong } from '../utils/formatDueShort'

/**
 * Hero card on `ParentPaymentHistoryPage` — shows the most pressing fee with a
 * single primary action (Pay now). When nothing is outstanding we show a calm
 * "all paid" state.
 */
const UpcomingDueCard = ({ row, onPayNow, payNowBusy, polling, allPaid }) => {
  if (allPaid) {
    return (
      <CAlert color="success" className="d-flex align-items-center gap-2 mb-4">
        <CIcon icon={cilCheckCircle} />
        <span className="fw-semibold">You&apos;re all caught up — no fees due right now.</span>
      </CAlert>
    )
  }

  if (!row) return null

  return (
    <CCard color="primary" textColor="white" className="mb-4 border-0 shadow-sm">
      <CCardBody>
        <div className="text-uppercase small fw-semibold opacity-75 mb-1">Upcoming due</div>
        <div className="d-flex flex-wrap align-items-baseline gap-2 mb-2">
          <h2 className="mb-0">₹{formatInr(row.remaining)}</h2>
          <span className="opacity-75">for {row.studentName}</span>
        </div>
        {row.dueDate ? (
          <div className="d-flex align-items-center gap-2 mb-3 opacity-90">
            <CIcon icon={cilCalendar} />
            <span>Due {formatDueLong(row.dueDate)}</span>
            {row.periodMonth ? <span className="opacity-75">· {row.periodMonth}</span> : null}
          </div>
        ) : null}

        {row.payment_link_label ? (
          <div className="mb-3">
            <CBadge color="light" textColor="dark" className="text-dark">
              {row.payment_link_label}
            </CBadge>
          </div>
        ) : null}

        <CButton
          color="light"
          className="fw-semibold"
          size="lg"
          onClick={() => onPayNow(row)}
          disabled={payNowBusy}
        >
          {payNowBusy ? (
            <>
              <CSpinner size="sm" className="me-2" /> Opening secure checkout…
            </>
          ) : (
            'Pay now'
          )}
        </CButton>

        <div className="small mt-3 opacity-75">
          UPI · Cards · Net banking. After you pay, we&apos;ll confirm here—usually within a few seconds.
        </div>

        {polling ? (
          <CAlert color="light" className="mt-3 mb-0 py-2 text-dark border-0">
            <div className="d-flex align-items-start gap-2">
              <CSpinner size="sm" className="mt-1 flex-shrink-0" />
              <div>
                <div className="fw-semibold small">Waiting for payment confirmation</div>
                <div className="small text-body-secondary mb-0">
                  Complete checkout in the tab we opened. Keep this page open—we refresh automatically.
                  If nothing changes after a minute, tap Refresh or Pay now again for a new link.
                </div>
              </div>
            </div>
          </CAlert>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default UpcomingDueCard
