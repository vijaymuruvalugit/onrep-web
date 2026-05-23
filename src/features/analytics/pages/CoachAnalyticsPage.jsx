import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilLightbulb } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'
import {
  InsightBarChart,
  InsightChartCard,
  InsightDoughnutChart,
  InsightLineChart,
} from '../components/InsightChartCard'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

/**
 * Coach drill-down — session trends and deeper operational patterns.
 * Coach-facing label: Coaching insights / Session trends (not Analytics).
 */
const CoachAnalyticsPage = () => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
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
  }, [])

  const dd = insights?.drilldown
  const participationTrend = dd?.attendanceTrends?.trendLine || []
  const focusAreas = dd?.observationTrends?.mostCommonFocusAreas || []
  const presets = dd?.sessionComposition?.mostUsedPresets || []
  const phaseDistribution = dd?.sessionComposition?.phaseDistribution || []
  const sessionStyleMix = dd?.sessionComposition?.sessionStyleMix || {}

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
          <CCol xl={8}>
            <InsightChartCard
              title="Participation trend"
              subtitle="Present athletes vs roster marks"
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
                    label: 'Total marks',
                    data: participationTrend.map((d) => d.total || 0),
                    color: '#6c757d',
                  },
                ]}
              />
            </InsightChartCard>
          </CCol>
          <CCol xl={4}>
            <InsightChartCard title="Session style mix" subtitle="Exercise vs observation led">
              <InsightDoughnutChart
                labels={['Exercise heavy', 'Observation heavy']}
                values={[
                  sessionStyleMix.exerciseHeavySessions || 0,
                  sessionStyleMix.observationHeavySessions || 0,
                ]}
              />
            </InsightChartCard>
          </CCol>
          <CCol lg={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Participation consistency</CCardHeader>
              <CCardBody className="small">
                <div className="mb-2 text-body-secondary">Most consistent athletes</div>
                <ul className="mb-3 ps-3">
                  {(dd.attendanceTrends?.mostConsistentAthletes || []).map((a) => (
                    <li key={a.studentId}>
                      {a.studentName} · {a.attendanceRate}%
                    </li>
                  ))}
                </ul>
                <div className="mb-2 text-body-secondary">Athletes to check in with</div>
                <ul className="mb-0 ps-3">
                  {(dd.attendanceTrends?.athletesToCheckIn || []).map((a) => (
                    <li key={a.studentId}>
                      {a.studentName}
                      {a.attendanceRate != null ? ` · ${a.attendanceRate}%` : ''}
                    </li>
                  ))}
                </ul>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol lg={6}>
            <InsightChartCard title="Focus area frequency" subtitle="Most common observations">
              <InsightBarChart
                labels={focusAreas.map((o) => o.label)}
                values={focusAreas.map((o) => o.count || 0)}
                label="Observations"
              />
            </InsightChartCard>
          </CCol>
          <CCol lg={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Observation trends</CCardHeader>
              <CCardBody className="small">
                <ul className="mb-0 ps-3">
                  {(dd.observationTrends?.mostCommonFocusAreas || []).map((o) => (
                    <li key={o.label}>
                      {o.label} ({o.count})
                    </li>
                  ))}
                </ul>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol lg={6}>
            <InsightChartCard title="Preset usage" subtitle="Sessions by preset">
              <InsightBarChart
                labels={presets.map((p) => p.label)}
                values={presets.map((p) => p.sessionCount || 0)}
                label="Sessions"
              />
            </InsightChartCard>
          </CCol>
          <CCol lg={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Session composition</CCardHeader>
              <CCardBody className="small">
                <div className="mb-2">Most used presets</div>
                <ul className="mb-3 ps-3">
                  {(dd.sessionComposition?.mostUsedPresets || []).map((p) => (
                    <li key={p.presetId}>
                      {p.label} · {p.sessionCount}
                    </li>
                  ))}
                </ul>
                {dd.sessionComposition?.averageSessionMinutes != null ? (
                  <p className="mb-0 text-body-secondary">
                    Average session ~{dd.sessionComposition.averageSessionMinutes} min
                  </p>
                ) : null}
              </CCardBody>
            </CCard>
          </CCol>
          <CCol lg={6}>
            <InsightChartCard title="Phase distribution" subtitle="Phase types used in sessions">
              <InsightBarChart
                labels={phaseDistribution.map((p) => p.phaseType)}
                values={phaseDistribution.map((p) => p.count || 0)}
                label="Phases"
              />
            </InsightChartCard>
          </CCol>
          <CCol lg={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Athlete focus</CCardHeader>
              <CCardBody className="small">
                <div className="mb-2 text-body-secondary">Coaching emphasis</div>
                <ul className="mb-3 ps-3">
                  {(dd.athleteFocusInsights?.repeatedFocusAreas || []).map((f) => (
                    <li key={f.label}>{f.label}</li>
                  ))}
                </ul>
                <div className="mb-2 text-body-secondary">Improved participation</div>
                <ul className="mb-0 ps-3">
                  {(dd.athleteFocusInsights?.improvedAttendance || []).map((a) => (
                    <li key={a.studentId}>
                      {a.studentName} · {a.attendanceRate}%
                    </li>
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

export default CoachAnalyticsPage
