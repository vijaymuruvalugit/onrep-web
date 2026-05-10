import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowRight, cilReload } from '@coreui/icons'
import usePayments from '../../payments/hooks/usePayments'
import { fetchParentSummary } from '../../payments/slices/paymentsSlice'
import { formatInr } from '../../payments/utils/formatInr'
import { formatDueLong } from '../../payments/utils/formatDueShort'

/**
 * Lightweight parent fees overview. Uses **only** `GET /payments/parent-summary`
 * (same source as `ParentPaymentHistoryPage`) so we never duplicate the fee
 * data shape. Anything action-heavy (Pay now, manual report) lives on the
 * Payment history page.
 */
const ParentFeesPage = () => {
  const dispatch = useDispatch()
  const { parent } = usePayments()

  // `dispatch` is stable; depending on the `parent` bundle would re-fire the
  // fetch every time the slice updates (loading flag, etc.) → infinite loop.
  const reload = useCallback(() => dispatch(fetchParentSummary()), [dispatch])

  useEffect(() => {
    reload()
  }, [reload])

  const summary = parent.summary?.summary || { total_due: 0, total_paid: 0 }
  const summaryStudents = parent.summary?.students

  const upcoming = useMemo(() => {
    const rows = []
    for (const student of summaryStudents || []) {
      for (const ob of student.obligations || []) {
        const remaining = Number(ob.remaining_amount)
        if (Number.isFinite(remaining) && remaining > 0) {
          rows.push({
            obligationId: ob.obligationId,
            studentName: student.name,
            periodMonth: ob.period_month,
            dueDate: ob.due_date || '',
            remaining,
            hasPendingReport: ob.has_pending_report === true,
          })
        }
      }
    }
    rows.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    return rows
  }, [summaryStudents])

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">Fees</h2>
          <p className="text-body-secondary small mb-0">
            A quick view of what&apos;s due. Use Payment history to pay or report a payment.
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
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {parent.summaryError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{parent.summaryError.message || 'Unable to load fees.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={reload}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      <CRow className="g-3 mb-4">
        <CCol sm={6} md={4}>
          <CCard className="h-100 text-center">
            <CCardBody>
              <div className="text-body-secondary small">Total due</div>
              <div className="fs-3 fw-bold">₹{formatInr(summary.total_due)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={4}>
          <CCard className="h-100 text-center border-success">
            <CCardBody>
              <div className="text-body-secondary small">Paid (confirmed)</div>
              <div className="fs-3 fw-bold text-success">₹{formatInr(summary.total_paid)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={4}>
          <CCard className="h-100 text-center border-warning">
            <CCardBody>
              <div className="text-body-secondary small">Outstanding fees</div>
              <div className="fs-3 fw-bold text-warning">{upcoming.length}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {parent.summaryLoading && !parent.summary ? (
        <div className="text-center py-4">
          <CSpinner />
        </div>
      ) : null}

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>Upcoming fees</span>
          <Link
            to="/parent/payments/history"
            className="small d-inline-flex align-items-center gap-1"
          >
            Payment history
            <CIcon icon={cilArrowRight} size="sm" />
          </Link>
        </CCardHeader>
        <CCardBody>
          {upcoming.length === 0 && !parent.summaryLoading ? (
            <p className="text-body-secondary mb-0">
              No fees due. We&apos;ll show new fees here when your coach issues them.
            </p>
          ) : null}
          <div className="d-flex flex-column gap-2">
            {upcoming.map((row) => (
              <div
                key={row.obligationId}
                className="d-flex justify-content-between align-items-center gap-3 flex-wrap border rounded-3 p-3"
              >
                <div>
                  <div className="fw-semibold">{row.studentName}</div>
                  <div className="text-body-secondary small">
                    {row.periodMonth}
                    {row.dueDate ? ` · Due ${formatDueLong(row.dueDate)}` : ''}
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">₹{formatInr(row.remaining)}</div>
                  {row.hasPendingReport ? (
                    <CBadge color="warning" className="mt-1">
                      Awaiting coach
                    </CBadge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {upcoming.length > 0 ? (
            <div className="mt-3 d-flex justify-content-end">
              <Link to="/parent/payments/history" className="btn btn-primary">
                Pay or report
                <CIcon icon={cilArrowRight} className="ms-1" />
              </Link>
            </div>
          ) : null}
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentFeesPage
