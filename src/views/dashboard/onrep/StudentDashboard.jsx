import React, { useEffect, useState } from 'react'
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
import { cilArrowRight, cilCalendar, cilSpeedometer } from '@coreui/icons'
import { familyApi } from '../../../features/family/api/familyApi'
import StudentMotivationInsights from '../../../features/analytics/components/StudentMotivationInsights'

const StudentDashboard = () => {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await familyApi.getStudentProgress()
        if (!cancelled) setProgress(data)
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
    <div className="dashboard-sports">
      <CRow className="mb-3">
        <CCol>
          <h2 className="mb-0 d-flex align-items-center gap-2">
            <CIcon icon={cilSpeedometer} className="text-primary" />
            My progress
          </h2>
          <p className="text-body-secondary small mb-0">Stay motivated — your coaching journey</p>
        </CCol>
      </CRow>

      {loading ? (
        <div className="text-center py-4">
          <CSpinner color="primary" />
        </div>
      ) : null}

      {error ? (
        <CAlert color="warning">{error.message || 'Could not load progress.'}</CAlert>
      ) : null}

      <StudentMotivationInsights />

      {progress ? (
        <CRow className="g-3 mb-4">
          <CCol sm={6} md={4}>
            <CCard className="shadow-sm text-center">
              <CCardBody>
                <div className="display-6 fw-bold text-primary">
                  {progress.attendanceStreak ?? 0}
                </div>
                <div className="small text-body-secondary">Day streak</div>
              </CCardBody>
            </CCard>
          </CCol>
          {progress.participationRate != null ? (
            <CCol sm={6} md={4}>
              <CCard className="shadow-sm text-center">
                <CCardBody>
                  <div className="display-6 fw-bold">{progress.participationRate}%</div>
                  <div className="small text-body-secondary">Participation</div>
                </CCardBody>
              </CCard>
            </CCol>
          ) : null}
          <CCol xs={12} md={8}>
            <CCard className="shadow-sm">
              <CCardHeader className="fw-semibold">Coach highlights</CCardHeader>
              <CCardBody>
                {(progress.coachHighlights || []).length === 0 ? (
                  <p className="text-body-secondary small mb-0">
                    Highlights appear after your sessions.
                  </p>
                ) : (
                  (progress.coachHighlights || []).map((h, i) => (
                    <CBadge key={i} color="info" className="me-1 mb-1">
                      {h}
                    </CBadge>
                  ))
                )}
              </CCardBody>
            </CCard>
          </CCol>
          <CCol xs={12}>
            <CCard className="shadow-sm">
              <CCardHeader className="fw-semibold">Upcoming sessions</CCardHeader>
              <CCardBody>
                {(progress.upcomingSessions || []).length === 0 ? (
                  <p className="text-body-secondary small mb-0">No upcoming sessions yet.</p>
                ) : (
                  <ul className="small mb-0 ps-3">
                    {(progress.upcomingSessions || []).map((s) => (
                      <li key={s.id}>
                        {s.title} — {s.when || 'TBD'}
                      </li>
                    ))}
                  </ul>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      ) : null}

      <CRow className="g-2">
        <CCol xs="auto">
          <CButton as={Link} to="/student/schedule" color="primary" variant="outline" size="sm">
            <CIcon icon={cilCalendar} className="me-1" />
            Sessions
            <CIcon icon={cilArrowRight} className="ms-1" />
          </CButton>
        </CCol>
      </CRow>
    </div>
  )
}

export default StudentDashboard
