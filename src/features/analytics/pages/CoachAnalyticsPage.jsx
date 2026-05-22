import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilLightbulb } from '@coreui/icons'

import analyticsApi from '../api/analyticsApi'

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
          <CCol lg={6}>
            <CCard className="shadow-sm h-100">
              <CCardHeader className="fw-semibold">Attendance consistency</CCardHeader>
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
