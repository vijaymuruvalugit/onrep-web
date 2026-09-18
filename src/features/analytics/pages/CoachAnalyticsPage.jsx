import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilLightbulb } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import {
  InsightBarChart,
  InsightChartCard,
  InsightLineChart,
} from '../components/InsightChartCard'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

/**
 * Coach drill-down — session trends and deeper operational patterns.
 * Coach-facing label: Coaching insights / Session trends (not Analytics).
 */
const CoachAnalyticsPage = () => {
  const activeActivityId = useSelector((state) => state.workspace.activeActivityId)
  const [insights, setInsights] = useState(null)
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
        const data = await analyticsApi.getCoachInsights({ depth: 'full' })
        if (!cancelled) setInsights(data)
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

  const dd = insights?.drilldown
  const participationTrend = dd?.attendanceTrends?.trendLine || []
  const focusAreas = dd?.observationTrends?.mostCommonFocusAreas || []
  const presets = dd?.sessionComposition?.mostUsedPresets || []

  return (
    <div className="p-2">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/coach/dashboard" className="btn btn-sm btn-outline-secondary">
          <CIcon icon={cilArrowLeft} className="me-1" />
          Back to home
        </Link>
        <h2 className="mb-0 d-flex align-items-center gap-2">
          <CIcon icon={cilLightbulb} className="text-primary" />
          Session trends
        </h2>
      </div>
      <p className="text-body-secondary small">
        Coaching patterns from the last {insights?.windowDays ?? 30} days
      </p>

      {error ? <CAlert color="danger">{error.message || 'Failed to load insights'}</CAlert> : null}
      {loading ? <CSpinner size="sm" /> : null}

      {!loading && dd ? (
        <CRow className="g-3">
          <CCol xl={12}>
            <InsightChartCard
              title="Participation trend"
              subtitle="Present or late vs all marked students"
              height={280}
            >
              <InsightLineChart
                labels={participationTrend.map((d) => formatDisplayDateDmy(d.day))}
                datasets={[
                  {
                    label: 'Present',
                    data: participationTrend.map((d) => d.present || 0),
                  },
                  {
                    label: 'Marked',
                    data: participationTrend.map((d) => d.total || 0),
                    color: '#6c757d',
                  },
                ]}
              />
            </InsightChartCard>
          </CCol>
          <CCol lg={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Participation consistency</CCardHeader>
              <CCardBody className="small">
                <div className="mb-2 text-body-secondary">Most consistent students</div>
                <ul className="mb-3 ps-3">
                  {(dd.attendanceTrends?.mostConsistentAthletes || []).length ? (
                    (dd.attendanceTrends?.mostConsistentAthletes || []).map((a) => (
                      <li key={a.studentId}>
                        {a.studentName} · {a.attendanceRate}%
                      </li>
                    ))
                  ) : (
                    <li className="text-body-secondary">Not enough marked sessions yet.</li>
                  )}
                </ul>
                <div className="mb-2 text-body-secondary">Students to check in with</div>
                <ul className="mb-0 ps-3">
                  {(dd.attendanceTrends?.athletesToCheckIn || []).length ? (
                    (dd.attendanceTrends?.athletesToCheckIn || []).map((a) => (
                      <li key={a.studentId}>
                        {a.studentName}
                        {a.attendanceRate != null ? ` · ${a.attendanceRate}%` : ''}
                      </li>
                    ))
                  ) : (
                    <li className="text-body-secondary">No low-participation students right now.</li>
                  )}
                </ul>
              </CCardBody>
            </CCard>
          </CCol>
          {focusAreas.length ? (
            <CCol lg={6}>
              <InsightChartCard title="Focus area frequency" subtitle="Most common observations">
                <InsightBarChart
                  labels={focusAreas.map((o) => o.label)}
                  values={focusAreas.map((o) => o.count || 0)}
                  label="Observations"
                />
              </InsightChartCard>
            </CCol>
          ) : null}
          {presets.length ? (
            <CCol lg={6}>
              <InsightChartCard title="Preset usage" subtitle="Named session templates">
                <InsightBarChart
                  labels={presets.map((p) => p.label)}
                  values={presets.map((p) => p.sessionCount || 0)}
                  label="Sessions"
                />
              </InsightChartCard>
            </CCol>
          ) : null}
        </CRow>
      ) : null}
    </div>
  )
}

export default CoachAnalyticsPage
