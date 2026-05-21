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
const UpcomingDueCard = ({
  row,
  onPayNow,
  onReportPayment,
  payNowBusy,
  reportBusy,
  polling,
  allPaid,
  paymentFlow = 'ONLINE_CHECKOUT',
  onlineCheckoutReady = true,
  manualUpiVpa = null,
}) => {
  if (allPaid) {
    return (
      <CAlert color="success" className="d-flex align-items-center gap-2 mb-4">
        <CIcon icon={cilCheckCircle} />
        <span className="fw-semibold">You&apos;re all caught up — no fees due right now.</span>
      </CAlert>
    )
  }

  if (!row) return null

  const manualMode = paymentFlow === 'MANUAL'

  return (
    <CCard
      color={manualMode ? 'info' : 'primary'}
      textColor="white"
      className="mb-4 border-0 shadow-sm"
    >
      <CCardBody>
        <div className="text-uppercase small fw-semibold opacity-75 mb-1">
          {manualMode ? 'Manual payment due' : 'Upcoming due'}
        </div>
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

        {manualMode ? (
          <>
            <CAlert color="light" className="text-dark border-0 py-2">
              <div className="fw-semibold small mb-1">Pay your academy directly</div>
              {manualUpiVpa ? (
                <div className="small">
                  UPI ID: <strong>{manualUpiVpa}</strong>
                </div>
              ) : (
                <div className="small">
                  Ask your coach for the bank or UPI details, then report the payment here.
                </div>
              )}
              {row.payment_ref ? (
                <div className="small mt-1">
                  Reference: <strong>{row.payment_ref}</strong>
                </div>
              ) : null}
            </CAlert>
            <CButton
              color="light"
              className="fw-semibold"
              size="lg"
              onClick={() => onReportPayment(row)}
              disabled={reportBusy || row.hasPendingReport}
            >
              {row.hasPendingReport ? 'Reported — awaiting coach' : 'Report payment'}
            </CButton>
          </>
        ) : (
          <CButton
            color="light"
            className="fw-semibold"
            size="lg"
            onClick={() => onPayNow(row)}
            disabled={payNowBusy || !onlineCheckoutReady}
          >
            {payNowBusy ? (
              <>
                <CSpinner size="sm" className="me-2" /> Opening secure checkout…
              </>
            ) : (
              'Pay now'
            )}
          </CButton>
        )}

        <div className="small mt-3 opacity-75">
          {manualMode
            ? 'After paying directly, submit the UTR or screenshot so your coach can confirm it.'
            : 'UPI · Cards · Net banking. After you pay, we will confirm here, usually within a few seconds.'}
        </div>

        {!manualMode && !onlineCheckoutReady ? (
          <CAlert color="light" className="mt-3 mb-0 py-2 text-dark border-0">
            Online checkout is being set up by your academy. Please check back later or contact your
            coach.
          </CAlert>
        ) : null}

        {!manualMode && polling ? (
          <CAlert color="light" className="mt-3 mb-0 py-2 text-dark border-0">
            <div className="d-flex align-items-start gap-2">
              <CSpinner size="sm" className="mt-1 flex-shrink-0" />
              <div>
                <div className="fw-semibold small">Waiting for payment confirmation</div>
                <div className="small text-body-secondary mb-0">
                  Complete checkout in the tab we opened. Keep this page open—we refresh
                  automatically. If nothing changes after a minute, tap Refresh or Pay now again for
                  a new link.
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
