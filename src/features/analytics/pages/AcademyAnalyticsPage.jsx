import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilChart } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import { InsightBarChart, InsightChartCard, InsightLineChart } from '../components/InsightChartCard'
import { formatInr } from '../../payments/utils/formatInr'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return `${v}%`
}

/**
 * Academy admin drill-down — only metrics we can stand behind for review.
 */
const AcademyAnalyticsPage = () => {
  const activeActivityId = useSelector((state) => state.workspace.activeActivityId)
  const [ops, setOps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!activeActivityId) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
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
  }, [activeActivityId])

  const retentionTrend = ops?.academyGrowth?.retentionTrend || []
  const mostActiveCoaches = ops?.coachingOperations?.mostActiveCoaches || []
  const mostUsedPresets = ops?.coachingStructure?.mostUsedPresets || []
  const overdueStudents = ops?.paymentsContinuity?.overdueStudents || []
  const upcomingRenewals = ops?.paymentsContinuity?.upcomingRenewals || []

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
        Operational health for the selected activity · last {ops?.windowDays ?? 90} days
      </p>

      {error ? (
        <CAlert color="danger">{error.message || 'Failed to load operations'}</CAlert>
      ) : null}
      {loading ? <CSpinner size="sm" /> : null}

      {!loading && ops ? (
        <CRow className="g-3">
          {retentionTrend.length ? (
            <CCol xl={12}>
              <InsightChartCard
                title="Students present by week"
                subtitle="Distinct students marked present or late"
                height={280}
              >
                <InsightLineChart
                  labels={retentionTrend.map((r) => formatDisplayDateDmy(r.week))}
                  datasets={[
                    {
                      label: 'Students present',
                      data: retentionTrend.map((r) => r.activeStudents || 0),
                    },
                  ]}
                />
              </InsightChartCard>
            </CCol>
          ) : null}
          <CCol md={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Roster and sessions</CCardHeader>
              <CCardBody className="small">
                <p>Active students: {ops.academyGrowth?.activeStudents ?? 0}</p>
                <p>New enrollments in period: {ops.academyGrowth?.newEnrollments ?? 0}</p>
                <p>Participation rate: {fmtPct(ops.attendanceTrends?.attendanceRate)}</p>
                <p className="mb-0">
                  Sessions completed: {ops.coachingOperations?.sessionsConducted ?? 0}
                </p>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Fees</CCardHeader>
              <CCardBody className="small">
                <p>
                  Collected this month: ₹
                  {formatInr(ops.paymentsContinuity?.collectedThisMonthInr ?? 0)}
                </p>
                <p>Overdue amount: ₹{formatInr(ops.paymentsContinuity?.overdueAmountInr ?? 0)}</p>
                <p className="mb-0">Overdue students: {overdueStudents.length}</p>
              </CCardBody>
            </CCard>
          </CCol>
          {mostActiveCoaches.length ? (
            <CCol md={mostUsedPresets.length ? 6 : 12}>
              <InsightChartCard title="Coach session load" subtitle="Completed sessions by coach">
                <InsightBarChart
                  labels={mostActiveCoaches.map((c) => c.coachName)}
                  values={mostActiveCoaches.map((c) => c.sessionCount || 0)}
                  label="Sessions"
                />
              </InsightChartCard>
            </CCol>
          ) : null}
          {mostUsedPresets.length ? (
            <CCol md={mostActiveCoaches.length ? 6 : 12}>
              <InsightChartCard title="Preset usage" subtitle="Named session templates">
                <InsightBarChart
                  labels={mostUsedPresets.map((p) => p.label)}
                  values={mostUsedPresets.map((p) => p.count || 0)}
                  label="Sessions"
                />
              </InsightChartCard>
            </CCol>
          ) : null}
          {overdueStudents.length || upcomingRenewals.length ? (
            <CCol md={12}>
              <CCard className="shadow-sm">
                <CCardHeader className="fw-semibold">Fee follow-up</CCardHeader>
                <CCardBody className="small">
                  {overdueStudents.length ? (
                    <>
                      <div className="text-body-secondary mb-1">Overdue</div>
                      <ul className="mb-2 ps-3">
                        {overdueStudents.map((s) => (
                          <li key={s.studentId}>{s.studentName}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {upcomingRenewals.length ? (
                    <>
                      <div className="text-body-secondary mb-1">Due within 14 days</div>
                      <ul className="mb-0 ps-3">
                        {upcomingRenewals.map((s) => (
                          <li key={s.studentId}>{s.studentName}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </CCardBody>
              </CCard>
            </CCol>
          ) : null}
        </CRow>
      ) : null}
    </div>
  )
}

export default AcademyAnalyticsPage
