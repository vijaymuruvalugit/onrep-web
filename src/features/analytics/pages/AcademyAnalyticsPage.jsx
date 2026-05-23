import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilChart } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import {
  InsightBarChart,
  InsightChartCard,
  InsightDoughnutChart,
  InsightLineChart,
} from '../components/InsightChartCard'
import { formatInr } from '../../payments/utils/formatInr'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

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

  const retentionTrend = ops?.academyGrowth?.retentionTrend || []
  const mostActiveCoaches = ops?.coachingOperations?.mostActiveCoaches || []
  const mostUsedPresets = ops?.coachingStructure?.mostUsedPresets || []
  const mostCommonPhases = ops?.coachingStructure?.mostCommonPhases || []
  const completedSessions = ops?.sessionReliability?.completedSessions || 0
  const cancelledSessions = ops?.sessionReliability?.cancelledSessions || 0
  const conductedSessions = ops?.coachingOperations?.sessionsConducted || 0
  const otherSessions = Math.max(conductedSessions - completedSessions - cancelledSessions, 0)

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
          <CCol xl={8}>
            <InsightChartCard
              title="Active student retention"
              subtitle="Weekly active students with present marks"
              height={280}
            >
              <InsightLineChart
                labels={retentionTrend.map((r) => formatDisplayDateDmy(r.week))}
                datasets={[
                  {
                    label: 'Active students',
                    data: retentionTrend.map((r) => r.activeStudents || 0),
                  },
                ]}
              />
            </InsightChartCard>
          </CCol>
          <CCol xl={4}>
            <InsightChartCard title="Session reliability" subtitle="Completed, cancelled, open">
              <InsightDoughnutChart
                labels={['Completed', 'Cancelled', 'Other']}
                values={[completedSessions, cancelledSessions, otherSessions]}
              />
            </InsightChartCard>
          </CCol>
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
            <InsightChartCard title="Coach session load" subtitle="Sessions by coach">
              <InsightBarChart
                labels={mostActiveCoaches.map((c) => c.coachName)}
                values={mostActiveCoaches.map((c) => c.sessionCount || 0)}
                label="Sessions"
              />
            </InsightChartCard>
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
            <InsightChartCard title="Preset usage" subtitle="Most used session presets">
              <InsightBarChart
                labels={mostUsedPresets.map((p) => p.label)}
                values={mostUsedPresets.map((p) => p.count || 0)}
                label="Sessions"
              />
            </InsightChartCard>
          </CCol>
          <CCol md={6}>
            <InsightChartCard title="Phase mix" subtitle="Most common phase types">
              <InsightBarChart
                labels={mostCommonPhases.map((p) => p.phaseType)}
                values={mostCommonPhases.map((p) => p.count || 0)}
                label="Phases"
              />
            </InsightChartCard>
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
            <InsightChartCard title="Payment continuity" subtitle="Active plans vs follow-ups">
              <InsightDoughnutChart
                labels={['Active plans', 'Overdue', 'Renewing soon']}
                values={[
                  ops.paymentsContinuity?.activePlans || 0,
                  ops.paymentsContinuity?.overdueStudents?.length || 0,
                  ops.paymentsContinuity?.upcomingRenewals?.length || 0,
                ]}
              />
            </InsightChartCard>
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
