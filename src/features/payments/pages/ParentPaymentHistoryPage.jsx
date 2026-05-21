import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CToast,
  CToastBody,
  CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import usePayments from '../hooks/usePayments'
import {
  createParentPaymentLink,
  fetchParentSummary,
  reportParentPayment,
} from '../slices/paymentsSlice'
import paymentsApi from '../api/paymentsApi'
import UpcomingDueCard from '../components/UpcomingDueCard'
import ReportPaymentModal from '../components/ReportPaymentModal'
import { formatInr } from '../utils/formatInr'
import { formatDueLong } from '../utils/formatDueShort'
import { transactionStatusColor, transactionStatusLabel } from '../utils/obligationStatus'
import { createParentSummaryPoller } from '../utils/pollParentSummaryAfterPay'

function flattenOutstanding(students) {
  const rows = []
  for (const student of students || []) {
    for (const ob of student.obligations || []) {
      const remaining = Number(ob.remaining_amount)
      if (Number.isFinite(remaining) && remaining > 0) {
        rows.push({
          obligationId: ob.obligationId,
          studentId: student.studentId,
          studentName: student.name,
          periodMonth: ob.period_month,
          dueDate: ob.due_date || '',
          remaining,
          payment_ref: ob.payment_ref || '',
          hasPendingReport: ob.has_pending_report === true,
          payment_link_label: ob.payment_link_label || '',
          payment_link_state: ob.payment_link_state || '',
          razorpay_link_expire_at: ob.razorpay_link_expire_at || null,
        })
      }
    }
  }
  rows.sort((a, b) => {
    const ad = a.dueDate || ''
    const bd = b.dueDate || ''
    return ad.localeCompare(bd)
  })
  return rows
}

const ParentPaymentHistoryPage = () => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const highlightObligationId = searchParams.get('obligationId') || null
  const { parent } = usePayments()

  const [toasts, setToasts] = useState([])
  const [reportRow, setReportRow] = useState(null)
  const [pollingObligationId, setPollingObligationId] = useState(null)
  const [pollHint, setPollHint] = useState(null)

  const pollerRef = useRef(null)
  if (pollerRef.current == null) {
    pollerRef.current = createParentSummaryPoller({ intervalMs: 4000, maxDurationMs: 120000 })
  }

  const pushToast = useCallback((message, color = 'primary') => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, color }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const summary = parent.summary?.summary || { total_due: 0, total_paid: 0 }
  const summaryStudents = parent.summary?.students
  const transactions = parent.summary?.transactions || []
  const paymentSettings = parent.summary?.payment_settings || {}
  const paymentFlow =
    paymentSettings.payment_flow === 'ONLINE_CHECKOUT' ? 'ONLINE_CHECKOUT' : 'MANUAL'
  const onlineCheckoutReady = paymentSettings.online_checkout_ready === true
  const manualUpiVpa = paymentSettings.manual_upi_vpa || null
  const outstanding = useMemo(() => flattenOutstanding(summaryStudents || []), [summaryStudents])

  // Depend only on `dispatch` so reload doesn't get re-created when the slice
  // updates (loading flag, summary payload), which would cause the effect to
  // refetch in a loop and freeze the page.
  const reload = useCallback(() => dispatch(fetchParentSummary()), [dispatch])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    return () => pollerRef.current?.stop()
  }, [])

  const startPollingFor = useCallback(
    (obligationId) => {
      setPollingObligationId(obligationId)
      setPollHint(null)
      pollerRef.current?.start(
        async () => {
          const action = await dispatch(fetchParentSummary())
          const summaryPayload = action?.payload
          const stillOutstanding = (summaryPayload?.students || []).some((student) =>
            (student.obligations || []).some(
              (ob) => ob.obligationId === obligationId && Number(ob.remaining_amount) > 0,
            ),
          )
          if (!stillOutstanding) {
            setPollingObligationId(null)
            setPollHint(null)
            pushToast('Payment received.', 'success')
            return { done: true }
          }
          return { done: false }
        },
        {
          onTimeout: () => {
            setPollingObligationId(null)
            setPollHint(
              'Still processing? Refresh in a moment — payments usually clear within a minute.',
            )
          },
          onError: () => {
            setPollingObligationId(null)
            setPollHint('Network hiccup while checking payment status. Try Refresh.')
          },
        },
      )
    },
    [dispatch, pushToast],
  )

  const handlePayNow = useCallback(
    async (row) => {
      const action = await dispatch(createParentPaymentLink(row.obligationId))
      if (action?.error) {
        const msg =
          action.payload?.message ||
          'Could not start your payment. Check your connection and tap Pay now to try again.'
        pushToast(msg, 'danger')
        return
      }
      const url = action.payload?.url || action.payload?.short_url
      if (!url) {
        pushToast('Payment link unavailable. Try the manual report option.', 'warning')
        return
      }
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      // Optimistic refresh + start bounded poll for this obligation.
      await dispatch(fetchParentSummary())
      startPollingFor(row.obligationId)
    },
    [dispatch, pushToast, startPollingFor],
  )

  const handleOpenReport = useCallback(
    (row) => {
      if (row.hasPendingReport) {
        pushToast('Already reported — waiting on coach confirmation.', 'warning')
        return
      }
      setReportRow({ ...row, manualUpiVpa })
    },
    [manualUpiVpa, pushToast],
  )

  const handleSubmitReport = useCallback(
    async (payload) => {
      const action = await dispatch(reportParentPayment(payload))
      if (action?.error) {
        return { error: true, payload: action.payload }
      }
      pushToast('Report sent. Pending coach confirmation.', 'success')
      setReportRow(null)
      await dispatch(fetchParentSummary())
      return { ok: true }
    },
    [dispatch, pushToast],
  )

  const handleUploadScreenshot = useCallback(async ({ file, onUploadProgress }) => {
    return paymentsApi.uploadParentPaymentScreenshot({ file, onUploadProgress })
  }, [])

  const heroRow = outstanding[0] || null
  const allPaid = outstanding.length === 0 && (parent.summary?.students?.length || 0) > 0

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">Fees</h2>
          <p className="text-body-secondary small mb-0">
            Total due: <strong>₹{formatInr(summary.total_due)}</strong> · Paid (confirmed):{' '}
            <strong>₹{formatInr(summary.total_paid)}</strong>
          </p>
        </CCol>
        <CCol xs="auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={parent.summaryLoading}
          >
            <CIcon icon={cilReload} className="me-1" /> Refresh
          </CButton>
        </CCol>
      </CRow>

      {parent.summaryError ? (
        <CAlert color="danger" className="d-flex justify-content-between align-items-center">
          <span>{parent.summaryError.message || 'Unable to load fees.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={reload}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {parent.summaryLoading && !parent.summary ? (
        <div className="text-center py-5">
          <CSpinner />
          <div className="text-body-secondary small mt-2">Loading your fees…</div>
        </div>
      ) : null}

      <UpcomingDueCard
        row={heroRow}
        onPayNow={handlePayNow}
        onReportPayment={handleOpenReport}
        payNowBusy={!!parent.createLinkBusyById?.[heroRow?.obligationId]}
        reportBusy={!!parent.reportBusyById?.[heroRow?.obligationId]}
        polling={pollingObligationId === heroRow?.obligationId}
        allPaid={allPaid && !heroRow}
        paymentFlow={paymentFlow}
        onlineCheckoutReady={onlineCheckoutReady}
        manualUpiVpa={manualUpiVpa}
      />

      {paymentFlow === 'ONLINE_CHECKOUT' && heroRow?.payment_link_state === 'expired' ? (
        <CAlert color="warning" className="py-2 mb-4">
          This pay link has expired. Tap <strong>Pay now</strong> to open a new secure checkout
          page.
        </CAlert>
      ) : null}

      {paymentFlow === 'MANUAL' && manualUpiVpa ? (
        <CAlert color="info" className="py-2 mb-4">
          Your academy accepts manual payments. Pay to <strong>{manualUpiVpa}</strong>, then report
          the payment with UTR or screenshot.
        </CAlert>
      ) : null}

      {pollHint ? (
        <CAlert color="info" className="py-2">
          {pollHint}
        </CAlert>
      ) : null}

      {outstanding.length > 1 ? (
        <CCard className="mb-4">
          <CCardHeader>Other outstanding fees</CCardHeader>
          <CCardBody className="d-flex flex-column gap-3">
            {outstanding.slice(1).map((row) => {
              const linkBusy = !!parent.createLinkBusyById?.[row.obligationId]
              const reportBusy = !!parent.reportBusyById?.[row.obligationId]
              const highlighted = highlightObligationId === row.obligationId
              return (
                <div
                  key={row.obligationId}
                  className={`border rounded-3 p-3 ${highlighted ? 'border-primary' : ''}`}
                >
                  <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
                    <div>
                      <div className="fw-semibold">{row.studentName}</div>
                      <div className="text-body-secondary small">
                        {row.periodMonth}
                        {row.dueDate ? ` · Due ${formatDueLong(row.dueDate)}` : ''}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold fs-5">₹{formatInr(row.remaining)}</div>
                      {row.payment_link_label ? (
                        <CBadge color="info" className="me-1">
                          {row.payment_link_label}
                        </CBadge>
                      ) : null}
                      {row.hasPendingReport ? (
                        <CBadge color="warning">Pending coach confirmation</CBadge>
                      ) : null}
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {paymentFlow === 'ONLINE_CHECKOUT' ? (
                      <CButton
                        color="primary"
                        onClick={() => handlePayNow(row)}
                        disabled={linkBusy || !onlineCheckoutReady}
                      >
                        {linkBusy ? (
                          <>
                            <CSpinner size="sm" className="me-2" /> Opening…
                          </>
                        ) : (
                          'Pay now'
                        )}
                      </CButton>
                    ) : null}
                    <CButton
                      color={paymentFlow === 'MANUAL' ? 'primary' : 'secondary'}
                      variant={paymentFlow === 'MANUAL' ? undefined : 'outline'}
                      onClick={() => handleOpenReport(row)}
                      disabled={reportBusy || row.hasPendingReport}
                    >
                      {paymentFlow === 'MANUAL' ? 'Report payment' : "I've already paid"}
                    </CButton>
                  </div>
                </div>
              )
            })}
          </CCardBody>
        </CCard>
      ) : null}

      {heroRow && paymentFlow === 'ONLINE_CHECKOUT' ? (
        <CCard className="mb-4">
          <CCardHeader>Already paid this fee?</CCardHeader>
          <CCardBody className="d-flex flex-wrap gap-3 justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">{heroRow.studentName}</div>
              <div className="text-body-secondary small">
                ₹{formatInr(heroRow.remaining)}
                {heroRow.payment_ref ? ` · Ref ${heroRow.payment_ref}` : ''}
              </div>
            </div>
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => handleOpenReport(heroRow)}
              disabled={heroRow.hasPendingReport || !!parent.reportBusyById?.[heroRow.obligationId]}
            >
              {heroRow.hasPendingReport
                ? 'Reported — awaiting coach'
                : 'Report manual / UPI payment'}
            </CButton>
          </CCardBody>
        </CCard>
      ) : null}

      <CCard className="mb-4">
        <CCardHeader>Recent payments</CCardHeader>
        <CCardBody className="p-0">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-body-secondary">No payments yet.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {transactions.map((tx) => (
                <li
                  key={tx.transactionId}
                  className="list-group-item d-flex justify-content-between flex-wrap gap-2"
                >
                  <div>
                    <div className="fw-semibold">₹{formatInr(tx.amount)}</div>
                    <div className="text-body-secondary small">
                      {tx.student_name || '—'}
                      {tx.recorded_at ? ` · ${new Date(tx.recorded_at).toLocaleString()}` : ''}
                    </div>
                    {tx.payment_source_label ? (
                      <div className="small text-body-secondary mt-1">
                        {tx.payment_source_label}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-end">
                    <CBadge color={transactionStatusColor(tx.status)}>
                      {transactionStatusLabel(tx.status) || '—'}
                    </CBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CCardBody>
      </CCard>

      <ReportPaymentModal
        visible={!!reportRow}
        row={reportRow}
        submitting={!!parent.reportBusyById?.[reportRow?.obligationId]}
        onClose={() => setReportRow(null)}
        onSubmit={handleSubmitReport}
        onUploadScreenshot={handleUploadScreenshot}
      />

      <CToaster placement="top-end">
        {toasts.map((toast) => (
          <CToast
            key={toast.id}
            autohide
            visible
            color={toast.color}
            className="text-white align-items-center"
            onClose={() => dismissToast(toast.id)}
          >
            <div className="d-flex">
              <CToastBody>{toast.message}</CToastBody>
            </div>
          </CToast>
        ))}
      </CToaster>
    </>
  )
}

export default ParentPaymentHistoryPage
