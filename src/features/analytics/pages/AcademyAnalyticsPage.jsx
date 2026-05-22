import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilChart } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import { formatInr } from '../../payments/utils/formatInr'

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return `${v}%`
}

/**
 * Academy admin drill-down for advanced operations detail.
 */
const AcademyAnalyticsPage = () => {
  const [ops, setOps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await analyticsApi.getAcademyOperations({ depth: 'full' })
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
    <div className="p-2">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/coach/dashboard" className="btn btn-sm btn-outline-secondary">
          <CIcon icon={cilArrowLeft} className="me-1" />
          Back to dashboard
        </Link>
        <h2 className="mb-0 d-flex align-items-center gap-2">
          <CIcon icon={cilChart} />
          Academy operations
        </h2>
      </div>
      <p className="text-body-secondary small">
        Operational health · last {ops?.windowDays ?? 90} days
      </p>

      {error ? (
        <CAlert color="danger">{error.message || 'Failed to load operations'}</CAlert>
      ) : null}
      {loading ? <CSpinner size="sm" /> : null}

      {!loading && ops ? (
        <CRow className="g-3">
          <CCol md={6}>
            <CCard className="shadow-sm">
              <CCardHeader className="fw-semibold">Growth</CCardHeader>
              <CCardBody className="small">
                <p>Active students: {ops.academyGrowth?.activeStudents ?? 0}</p>
                <p>New enrollments: {ops.academyGrowth?.newEnrollments ?? 0}</p>
                <p className="mb-0">
                  Participation rate: {fmtPct(ops.attendanceTrends?.attendanceRate)}
                </p>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={6}>
            <CCard className="shadow-sm">
              <CCardHeader className="fw-semibold">Coaching activity</CCardHeader>
              <CCardBody className="small">
                <p>Sessions conducted: {ops.coachingOperations?.sessionsConducted ?? 0}</p>
                <p>Cancelled: {ops.coachingOperations?.cancelledSessions ?? 0}</p>
                <p className="mb-2">Completion: {fmtPct(ops.sessionReliability?.completionRate)}</p>
                <ul className="mb-0 ps-3">
                  {(ops.coachingOperations?.mostActiveCoaches || []).map((c) => (
                    <li key={c.coachId}>
                      {c.coachName} · {c.sessionCount} sessions
                    </li>
                  ))}
                </ul>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={6}>
            <CCard className="shadow-sm">
              <CCardHeader className="fw-semibold">Coaching structure</CCardHeader>
              <CCardBody className="small">
                <ul className="mb-0 ps-3">
                  {(ops.coachingStructure?.mostUsedPresets || []).map((p) => (
                    <li key={p.presetId}>
                      {p.label} · {p.count}
                    </li>
                  ))}
                </ul>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={6}>
            <CCard className="shadow-sm">
              <CCardHeader className="fw-semibold">Payments & continuity</CCardHeader>
              <CCardBody className="small">
                <p>
                  Collected this month: ₹
                  {formatInr(ops.paymentsContinuity?.collectedThisMonthInr ?? 0)}
                </p>
                <p>Overdue amount: ₹{formatInr(ops.paymentsContinuity?.overdueAmountInr ?? 0)}</p>
                <p className="mb-2">Active plans: {ops.paymentsContinuity?.activePlans ?? 0}</p>
                <div className="text-body-secondary mb-1">Overdue students</div>
                <ul className="mb-2 ps-3">
                  {(ops.paymentsContinuity?.overdueStudents || []).map((s) => (
                    <li key={s.studentId}>{s.studentName}</li>
                  ))}
                </ul>
                <div className="text-body-secondary mb-1">Upcoming renewals</div>
                <ul className="mb-0 ps-3">
                  {(ops.paymentsContinuity?.upcomingRenewals || []).map((s) => (
                    <li key={s.studentId}>{s.studentName}</li>
                  ))}
                </ul>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      ) : null}
    </div>
  )
}

export default AcademyAnalyticsPage
