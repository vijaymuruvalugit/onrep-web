import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CCollapse,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChart } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import DashboardStatCard from '../../dashboard/components/DashboardStatCard'

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return `${v}%`
}

/**
 * Academy admin operational metrics — dashboard-first.
 */
const AcademyOperationsInsights = () => {
  const [ops, setOps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await analyticsApi.getAcademyOperations({ depth: 'embedded' })
        if (!cancelled) setOps(data)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CCard className="border-0 shadow-sm mb-3">
      <CCardHeader className="d-flex align-items-center justify-content-between">
        <span className="d-flex align-items-center gap-2">
          <CIcon icon={cilChart} />
          <strong>Operations</strong>
          <span className="small text-body-secondary">Last 90 days</span>
        </span>
        <Link className="btn btn-sm btn-link" to="/coach/academy/insights">
          View details
        </Link>
      </CCardHeader>
      <CCardBody>
        {error ? (
          <CAlert color="warning" className="py-2 mb-0 small">
            {error.message || 'Operations insights unavailable.'}
          </CAlert>
        ) : null}
        {loading ? <CSpinner size="sm" /> : null}
        {!loading && ops ? (
          <CRow className="g-3">
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Active students"
                value={ops.academyGrowth?.activeStudents ?? '—'}
                loading={false}
              />
            </CCol>
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Participation rate"
                value={fmtPct(ops.attendanceTrends?.attendanceRate)}
                loading={false}
              />
            </CCol>
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Sessions conducted"
                value={ops.coachingOperations?.sessionsConducted ?? '—'}
                loading={false}
              />
            </CCol>
            <CCol xs={6} md={3}>
              <DashboardStatCard
                title="Completion rate"
                value={fmtPct(ops.sessionReliability?.completionRate)}
                loading={false}
              />
            </CCol>
            <CCol xs={12}>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <p className="small mb-0">
                  {ops.paymentsContinuity?.overdueStudents?.length
                    ? `${ops.paymentsContinuity.overdueStudents.length} continuity alerts`
                    : 'No continuity alerts'}
                  {' · '}
                  {ops.paymentsContinuity?.upcomingRenewals?.length
                    ? `${ops.paymentsContinuity.upcomingRenewals.length} renewals soon`
                    : 'No upcoming renewals'}
                </p>
                <CButton
                  color="link"
                  size="sm"
                  className="p-0"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? 'Hide details' : 'Show details'}
                </CButton>
              </div>
              <CCollapse visible={expanded}>
                <div className="small text-body-secondary mt-2">
                  Keep this focused on continuity and reliability. Use the drill-down only when a
                  metric needs follow-up.
                </div>
              </CCollapse>
            </CCol>
          </CRow>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default AcademyOperationsInsights
