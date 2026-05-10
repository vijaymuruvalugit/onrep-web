import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowRight, cilDollar, cilReload, cilWarning } from '@coreui/icons'
import usePayments from '../hooks/usePayments'
import { fetchOwnerPaymentKpis } from '../slices/paymentsSlice'
import { formatInr } from '../utils/formatInr'

const StatBlock = ({ label, value, icon, accent, loading, compact }) => (
  <div className="d-flex flex-column h-100 p-3 border rounded-3">
    <div className="d-flex align-items-center gap-2 text-body-secondary small mb-1">
      {icon ? <CIcon icon={icon} size="sm" /> : null}
      <span>{label}</span>
    </div>
    <div className={`${compact ? 'fs-6' : 'fs-4'} fw-bold ${accent || ''}`}>
      {loading ? <CSpinner size="sm" /> : value}
    </div>
  </div>
)

/**
 * Owner-facing payments KPI strip — pulls `pendingObligationsCount`,
 * `collectedThisMonthInr`, and `overdueAmountInr` from the existing
 * `GET /api/v1/dashboard/summary` endpoint and links to `/coach/payments`.
 */
const OwnerPaymentsOverviewCard = () => {
  const dispatch = useDispatch()
  const { ownerKpis } = usePayments()

  const reload = useCallback(() => dispatch(fetchOwnerPaymentKpis()), [dispatch])

  useEffect(() => {
    reload()
  }, [reload])

  const data = ownerKpis.summary || {}
  const loading = ownerKpis.loading && !ownerKpis.summary
  const ops = data.paymentOps

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <CIcon icon={cilDollar} />
          <strong>Payments overview</strong>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={ownerKpis.loading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
          <Link to="/coach/payments" className="btn btn-primary btn-sm">
            Open payments
            <CIcon icon={cilArrowRight} className="ms-1" />
          </Link>
        </div>
      </CCardHeader>
      <CCardBody>
        {ownerKpis.error ? (
          <CAlert color="danger" className="py-2 mb-3">
            {ownerKpis.error.message || 'Unable to load payment KPIs.'}
          </CAlert>
        ) : null}
        <CRow className="g-3">
          <CCol xs={12} sm={6} md={4}>
            <StatBlock
              label="Pending fees"
              icon={cilDollar}
              value={data.pendingObligationsCount ?? '—'}
              loading={loading}
            />
          </CCol>
          <CCol xs={12} sm={6} md={4}>
            <StatBlock
              label="Collected this month"
              icon={cilDollar}
              accent="text-success"
              value={`₹${formatInr(data.collectedThisMonthInr)}`}
              loading={loading}
            />
          </CCol>
          <CCol xs={12} sm={6} md={4}>
            <StatBlock
              label="Overdue"
              icon={cilWarning}
              accent={Number(data.overdueAmountInr) > 0 ? 'text-danger' : 'text-body-secondary'}
              value={`₹${formatInr(data.overdueAmountInr)}`}
              loading={loading}
            />
          </CCol>
        </CRow>

        {ops ? (
          <>
            <hr className="my-4 text-body-tertiary" />
            <div className="text-body-secondary small mb-2">
              Today & online payments (operational snapshot)
            </div>
            <CRow className="g-3">
              <CCol xs={12} sm={6} md={4} xl={3}>
                <StatBlock
                  compact
                  label="Online paid today"
                  icon={cilDollar}
                  accent="text-success"
                  value={`₹${formatInr(ops.onlinePaidTodayInr)}`}
                  loading={loading}
                />
              </CCol>
              <CCol xs={12} sm={6} md={4} xl={3}>
                <StatBlock
                  compact
                  label="Manual recorded today"
                  icon={cilDollar}
                  value={`₹${formatInr(ops.manualRecordedTodayInr)}`}
                  loading={loading}
                />
              </CCol>
              <CCol xs={12} sm={6} md={4} xl={3}>
                <StatBlock
                  compact
                  label="Active pay links"
                  icon={cilDollar}
                  value={ops.activePayLinksCount ?? '—'}
                  loading={loading}
                />
              </CCol>
              <CCol xs={12} sm={6} md={4} xl={3}>
                <StatBlock
                  compact
                  label="Pending parent reports"
                  icon={cilWarning}
                  accent={
                    Number(ops.pendingParentReportsCount) > 0 ? 'text-warning' : 'text-body-secondary'
                  }
                  value={ops.pendingParentReportsCount ?? '—'}
                  loading={loading}
                />
              </CCol>
              <CCol xs={12} sm={6} md={4} xl={3}>
                <StatBlock
                  compact
                  label="Payment issues (7 days)"
                  icon={cilWarning}
                  accent={
                    Number(ops.paymentIssuesLast7Days) > 0 ? 'text-danger' : 'text-body-secondary'
                  }
                  value={ops.paymentIssuesLast7Days ?? '—'}
                  loading={loading}
                />
              </CCol>
            </CRow>
          </>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default OwnerPaymentsOverviewCard
