import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CListGroup,
  CListGroupItem,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowRight,
  cilBasketball,
  cilCalendar,
  cilCheckCircle,
  cilDollar,
  cilPeople,
  cilSpeedometer,
  cilWarning,
} from '@coreui/icons'

import roleDashboardApi from '../../../features/dashboard/api/roleDashboardApi'
import { refreshSession } from '../../../features/auth/slices/authSlice'
import { normalizeOnboardingDtoFromApi } from '../../../features/onboarding/utils/onboardingSteps'
import {
  formatDisplayDateDmy,
  formatLocalYmd,
} from '../../../features/dashboard/utils/calendarDate'
import DashboardStatCard from '../../../features/dashboard/components/DashboardStatCard'
import DashboardEmptyState from '../../../features/dashboard/components/DashboardEmptyState'
import DashboardCardSkeleton from '../../../features/dashboard/components/DashboardCardSkeleton'
import { formatInr } from '../../../features/payments/utils/formatInr'
import AcademyOperationsInsights from '../../../features/analytics/components/AcademyOperationsInsights'
import { liveSessionPath } from '../../../features/participation/utils/liveSessionPath'

const MAX_ACTIONS = 5

function buildPendingActions(operations) {
  if (!operations) return []
  const out = []
  for (const p of operations.pendingAttendance || []) {
    if (out.length >= MAX_ACTIONS) break
    out.push({
      key: `att-${p.sessionId}`,
      title: p.batchName || p.title || 'Session',
      subtitle: [p.startTime, p.coachName].filter(Boolean).join(' · '),
      to: liveSessionPath(p.sessionId),
      badge: 'Participation',
      color: 'warning',
    })
  }
  for (const r of operations.pendingParentReportsPreview || []) {
    if (out.length >= MAX_ACTIONS) break
    out.push({
      key: `rep-${r.transactionId}`,
      title: `Payment proof — ${r.studentName || 'Student'}`,
      subtitle: r.amountInr != null ? `₹${formatInr(r.amountInr)}` : 'Awaiting review',
      to: '/coach/payments',
      badge: 'Payment',
      color: 'info',
    })
  }
  return out
}

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return `${v}%`
}

const OwnerDashboard = () => {
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth.user)
  const onboarding = normalizeOnboardingDtoFromApi(authUser?.onboarding ?? null)

  const dateStr = useMemo(() => formatLocalYmd(), [])
  const displayDate = useMemo(() => formatDisplayDateDmy(dateStr), [dateStr])
  const [summary, setSummary] = useState(null)
  const [operations, setOperations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dispatch(refreshSession())
  }, [dispatch])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, o] = await Promise.all([
        roleDashboardApi.getOwnerSummary({ date: dateStr }),
        roleDashboardApi.getOwnerOperations({ date: dateStr }),
      ])
      setSummary(s)
      setOperations(o)
    } catch (e) {
      setError(e)
      setSummary(null)
      setOperations(null)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  /* Initial dashboard KPI fetch — intentional mount fetch pattern */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch summary/operations on mount
    load()
  }, [load])

  const pendingActions = useMemo(() => buildPendingActions(operations), [operations])

  return (
    <div className="dashboard-sports">
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0 d-flex align-items-center gap-2">
            <CIcon icon={cilBasketball} className="text-warning" />
            Academy overview
          </h2>
          <p className="text-body-secondary small mb-0">Operational pulse · {displayDate}</p>
        </CCol>
        <CCol xs="auto">
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading}>
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {onboarding && !onboarding.payment_setup_done ? (
        <CAlert
          color="info"
          className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3"
        >
          <span className="mb-0">
            Complete payment setup to record how parents pay your academy.
          </span>
          <CButton as={Link} to="/onboarding/setup" color="primary" size="sm">
            Complete payment setup
          </CButton>
        </CAlert>
      ) : null}

      {onboarding && !onboarding.first_coach_invited ? (
        <CAlert
          color="info"
          className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3"
        >
          <span className="mb-0">
            Invite a coach when you&apos;re ready — optional but helpful as you grow.
          </span>
          <CButton
            as={Link}
            to="/coach/onboarding/coaches"
            color="primary"
            size="sm"
            variant="outline"
          >
            Invite your first coach
          </CButton>
        </CAlert>
      ) : null}

      {!loading && summary && Number(summary.activeStudents) === 0 ? (
        <CAlert color="light" className="border mb-3">
          <strong>Welcome — your academy is live.</strong>{' '}
          <span className="text-body-secondary">
            Add a batch, then students, or explore payments. Everything can be done in any order
            that suits you.
          </span>
          <div className="mt-2 d-flex flex-wrap gap-2">
            <CButton as={Link} to="/coach/batches" color="primary" size="sm">
              Go to batches
            </CButton>
            <CButton
              as={Link}
              to="/coach/students/new"
              color="secondary"
              size="sm"
              variant="outline"
            >
              Add a student
            </CButton>
          </div>
        </CAlert>
      ) : null}

      {error ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row align-items-sm-center gap-2"
        >
          <span>{error.message || 'Could not load dashboard.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={load}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {loading && !summary ? <DashboardCardSkeleton rows={6} /> : null}

      <AcademyOperationsInsights />

      {!loading || summary ? (
        <CRow className="g-3 mb-3">
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Active students"
              value={summary?.activeStudents ?? '—'}
              loading={loading && !summary}
              accentClass="border-start border-4 border-primary"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Today participation"
              value={fmtPct(summary?.todayAttendancePercent)}
              hint="Weighted by roster"
              loading={loading && !summary}
              accentClass="border-start border-4 border-success"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Participation recorded"
              value={fmtPct(summary?.attendanceCompletionPercent)}
              hint="Sessions marked today"
              loading={loading && !summary}
              accentClass="border-start border-4 border-info"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Pending fees"
              value={summary?.pendingFeesCount ?? '—'}
              loading={loading && !summary}
              accentClass="border-start border-4 border-warning"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Gross collected (month)"
              value={
                summary?.grossCollectedThisMonth != null || summary?.collectedThisMonthInr != null
                  ? `₹${formatInr(summary.grossCollectedThisMonth ?? summary.collectedThisMonthInr)}`
                  : '—'
              }
              loading={loading && !summary}
              accentClass="border-start border-4 border-success"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Net collected (month)"
              value={
                summary?.netCollectedThisMonth != null
                  ? `₹${formatInr(summary.netCollectedThisMonth)}`
                  : summary?.collectedThisMonthInr != null
                    ? `₹${formatInr(summary.collectedThisMonthInr)}`
                    : '—'
              }
              loading={loading && !summary}
              accentClass="border-start border-4 border-success"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Today’s sessions"
              value={summary?.todaySessions ?? '—'}
              loading={loading && !summary}
              accentClass="border-start border-4 border-primary"
            />
          </CCol>
          <CCol xs={6} xl={2}>
            <DashboardStatCard
              title="Active coaches"
              value={summary?.activeCoaches ?? '—'}
              loading={loading && !summary}
              accentClass="border-start border-4 border-secondary"
            />
          </CCol>
        </CRow>
      ) : null}

      <CRow className="g-3 mb-3">
        <CCol lg={6}>
          <CCard className="h-100 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>
                <CIcon icon={cilWarning} className="me-2" />
                Pending actions
              </span>
              <div className="d-flex gap-2">
                <Link to="/coach/academy/insights" className="btn btn-sm btn-link">
                  Participation reports
                  <CIcon icon={cilArrowRight} className="ms-1" />
                </Link>
                <Link to="/coach/payments" className="btn btn-sm btn-link">
                  View payments
                  <CIcon icon={cilArrowRight} className="ms-1" />
                </Link>
              </div>
            </CCardHeader>
            <CCardBody>
              {loading && !operations ? (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              ) : null}
              {!loading && pendingActions.length === 0 ? (
                <DashboardEmptyState
                  title="You’re caught up"
                  detail="No participation gaps or payment proofs waiting in the top queue."
                />
              ) : null}
              {pendingActions.length ? (
                <CListGroup flush>
                  {pendingActions.map((a) => (
                    <CListGroupItem
                      key={a.key}
                      className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                    >
                      <div>
                        <CBadge color={a.color} className="me-2">
                          {a.badge}
                        </CBadge>
                        <span className="fw-semibold">{a.title}</span>
                        <div className="small text-body-secondary">{a.subtitle}</div>
                      </div>
                      <CButton as={Link} to={a.to} size="sm" color="primary" variant="outline">
                        Open
                      </CButton>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              ) : null}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard className="h-100 shadow-sm">
            <CCardHeader>
              <CIcon icon={cilCalendar} className="me-2" />
              Today’s sessions
            </CCardHeader>
            <CCardBody>
              {loading && !operations ? (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              ) : null}
              {!loading && !operations?.upcomingSessions?.length ? (
                <DashboardEmptyState
                  title="No sessions on the schedule today"
                  detail="Create batches and schedules to generate sessions."
                >
                  <Link to="/coach/batches" className="btn btn-sm btn-primary">
                    Go to batches
                  </Link>
                </DashboardEmptyState>
              ) : null}
              {operations?.upcomingSessions?.length ? (
                <CListGroup flush>
                  {operations.upcomingSessions.map((s) => (
                    <CListGroupItem key={s.sessionId}>
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                          <div className="fw-semibold">
                            {s.startTime || '--'} · {s.batchName || s.title || 'Session'}
                          </div>
                          <div className="small text-body-secondary">
                            {[s.activityName, s.venue, s.coachName].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <CBadge color={s.attendanceMarked ? 'success' : 'warning'}>
                            {s.attendanceMarked ? 'Participation done' : 'Participation pending'}
                          </CBadge>
                          <CButton
                            as={Link}
                            to={liveSessionPath(s.sessionId)}
                            size="sm"
                            color="primary"
                          >
                            Open session
                          </CButton>
                        </div>
                      </div>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              ) : null}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol xs={12}>
          <CCard className="shadow-sm">
            <CCardHeader>
              <CIcon icon={cilSpeedometer} className="me-2" />
              Quick actions
            </CCardHeader>
            <CCardBody className="d-flex flex-wrap gap-2">
              <Link to="/coach/students/new" className="btn btn-outline-primary">
                <CIcon icon={cilPeople} className="me-1" />
                Add student
              </Link>
              <Link to="/coach/onboarding/coaches" className="btn btn-outline-primary">
                <CIcon icon={cilPeople} className="me-1" />
                Invite coach
              </Link>
              <Link to="/coach/batches" className="btn btn-outline-primary">
                <CIcon icon={cilCalendar} className="me-1" />
                Batches
              </Link>
              <Link to="/coach/payments" className="btn btn-outline-primary">
                <CIcon icon={cilDollar} className="me-1" />
                Payments
              </Link>
              <Link to="/coach/parents" className="btn btn-outline-secondary">
                <CIcon icon={cilCheckCircle} className="me-1" />
                Parents
              </Link>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default OwnerDashboard
