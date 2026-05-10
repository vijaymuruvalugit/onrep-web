import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilClock, cilDollar, cilSpeedometer } from '@coreui/icons'

import TodayClassesPage from '../../classes/pages/TodayClassesPage'
import AttendanceDashboardPage from '../../attendance/pages/AttendanceDashboardPage'
import roleDashboardApi from '../../dashboard/api/roleDashboardApi'
import { formatLocalYmd } from '../../dashboard/utils/calendarDate'
import DashboardStatCard from '../../dashboard/components/DashboardStatCard'

const quickLinks = [
  { to: '/coach/batches', label: 'Batches' },
  { to: '/coach/schedule', label: 'Schedule' },
  { to: '/coach/classes/upcoming', label: 'Upcoming classes' },
  { to: '/coach/skating', label: 'Skating ops' },
  { to: '/coach/students', label: 'Students' },
  { to: '/coach/parents', label: 'Parents' },
  { to: '/coach/attendance', label: 'Attendance' },
]

/**
 * Coach operational home — session timeline first, KPI strip + quick links.
 * Loads `/dashboard/coach-summary` in parallel with nested TodayClassesPage data.
 */
const CoachOperationalDashboard = () => {
  const dateStr = useMemo(() => formatLocalYmd(), [])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await roleDashboardApi.getCoachOperationalSummary({ date: dateStr })
        if (!cancelled) setSummary(data)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dateStr])

  return (
    <>
      <CRow className="g-3 mb-3 dashboard-sports onrep-coach-kpi-row">
        <CCol xs={12}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <CIcon icon={cilSpeedometer} className="text-primary" />
            <span className="fw-semibold">Today · {dateStr}</span>
          </div>
          {error ? (
            <CAlert color="warning" className="py-2 mb-0">
              {error.message || 'Could not load coach summary.'}
            </CAlert>
          ) : null}
        </CCol>
        <CCol xs={6} md={3}>
          <DashboardStatCard
            title="Today's sessions"
            value={summary?.todaySessions ?? '—'}
            loading={loading}
            accentClass="onrep-dash-stat--sessions shadow-sm"
          />
        </CCol>
        <CCol xs={6} md={3}>
          <DashboardStatCard
            title="Students today"
            value={summary?.studentsToday ?? '—'}
            loading={loading}
            accentClass="border-start border-4 border-info"
          />
        </CCol>
        <CCol xs={6} md={3}>
          <DashboardStatCard
            title="Attendance pending"
            value={summary?.attendancePending ?? '—'}
            loading={loading}
            accentClass="border-start border-4 border-warning"
          />
        </CCol>
        <CCol xs={6} md={3}>
          <DashboardStatCard
            title="Payment proofs"
            value={summary?.pendingParentReports ?? '—'}
            hint="Awaiting confirmation"
            loading={loading}
            accentClass="border-start border-4 border-secondary"
          />
        </CCol>
      </CRow>

      <CRow className="g-3 mb-3">
        <CCol xs={12}>
          <CCard className="border-0 onrep-surface-b shadow-none">
            <CCardHeader className="d-flex align-items-center gap-2 bg-transparent border-bottom border-light-subtle">
              <CIcon icon={cilCalendar} />
              Quick links
            </CCardHeader>
            <CCardBody>
              <div className="d-flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <Link key={item.to} className="btn btn-sm btn-outline-primary" to={item.to}>
                    {item.label}
                  </Link>
                ))}
                <Link className="btn btn-sm btn-outline-secondary" to="/coach/payments">
                  <CIcon icon={cilDollar} className="me-1" />
                  Payments
                </Link>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 align-items-start">
        <CCol xl={7}>
          <CCard className="mb-2 border-0 bg-transparent shadow-none">
            <CCardHeader className="bg-transparent border-0 px-0 pt-0 pb-2">
              <CIcon icon={cilClock} className="me-2 text-primary" />
              <strong>Today&apos;s sessions</strong>
              <span className="small text-body-secondary ms-2">Mark attendance as you go</span>
            </CCardHeader>
          </CCard>
          <TodayClassesPage />
        </CCol>
        <CCol xl={5}>
          <AttendanceDashboardPage />
        </CCol>
      </CRow>
    </>
  )
}

export default CoachOperationalDashboard
