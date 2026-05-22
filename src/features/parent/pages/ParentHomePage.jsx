import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilCalendar, cilChild, cilDollar, cilList, cilReload } from '@coreui/icons'

import useParent from '../hooks/useParent'
import { formatSessionWhen } from '../utils/formatParentDate'

const ParentHomePage = () => {
  const { homeModel, loadDashboard, loadFees } = useParent()

  useEffect(() => {
    loadDashboard()
    loadFees({ limit: 50, offset: 0 })
  }, [loadDashboard, loadFees])

  const {
    anyLoading,
    blockingError,
    feesError,
    sessions,
    attendancePreview,
    notificationsPreview,
    resultsPreview,
    feesSummary,
    participation,
    linkedStudentNames,
  } = homeModel

  const retry = () => {
    loadDashboard()
    loadFees({ limit: 50, offset: 0 })
  }

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">Overview</h2>
          <p className="text-body-secondary small mb-0">
            Calm visibility into schedule, participation, and coaching highlights for your athletes.
          </p>
        </CCol>
        <CCol xs="auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={anyLoading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {blockingError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row align-items-sm-center gap-2"
        >
          <span>
            {blockingError.message || 'Could not load home. Check your connection and try again.'}
          </span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {feesError ? (
        <CAlert color="warning">
          {feesError.message || 'Fees could not be loaded.'}{' '}
          <CButton
            color="warning"
            variant="outline"
            size="sm"
            className="ms-2"
            onClick={() => loadFees({ limit: 50, offset: 0 })}
          >
            Retry fees
          </CButton>
        </CAlert>
      ) : null}

      {anyLoading && !sessions.length && !blockingError ? (
        <div className="text-center py-5">
          <CSpinner />
          <div className="small text-body-secondary mt-2">Loading your overview…</div>
        </div>
      ) : null}

      <CRow className="mb-4 g-3">
        <CCol md={6} xl={4}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilChild} className="me-2" />
              Athletes on your account
            </CCardHeader>
            <CCardBody>
              {linkedStudentNames.length ? (
                <ul className="list-unstyled mb-0">
                  {linkedStudentNames.map((name) => (
                    <li key={name} className="mb-1 fw-semibold">
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-secondary small mb-0">
                  Student names appear here when schedule or participation data is available.
                </p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6} xl={4}>
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={cilList} className="me-2" />
              Participation snapshot
            </CCardHeader>
            <CCardBody>
              {participation.recentCount > 0 && participation.attendanceRate != null ? (
                <>
                  <div className="d-flex justify-content-between small text-body-secondary mb-1">
                    <span>Recent marks (preview)</span>
                    <span>{participation.attendanceRate}% consistency</span>
                  </div>
                  <CProgress
                    color={participation.attendanceRate >= 80 ? 'success' : 'warning'}
                    value={participation.attendanceRate}
                  />
                  <div className="small text-body-secondary mt-2">
                    Based on the latest {participation.recentCount} recorded session(s) shown on
                    your home feed — see <Link to="/parent/attendance">Participation</Link> for full
                    history.
                  </div>
                </>
              ) : (
                <p className="text-body-secondary small mb-0">
                  No participation preview yet. Open{' '}
                  <Link to="/parent/attendance">Participation</Link> for history.
                </p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={12} xl={4}>
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>
                <CIcon icon={cilDollar} className="me-2" />
                Fee summary
              </span>
              <Link to="/parent/fees" className="small">
                Details
              </Link>
            </CCardHeader>
            <CCardBody>
              {feesSummary.total ? (
                <>
                  <div className="d-flex gap-2 mb-2">
                    <CBadge color="success">Paid {feesSummary.paidCount}</CBadge>
                    <CBadge color={feesSummary.dueCount ? 'warning' : 'secondary'}>
                      Due {feesSummary.dueCount}
                    </CBadge>
                  </div>
                  <ul className="list-unstyled small mb-0">
                    {feesSummary.items.map((f) => (
                      <li
                        key={f.id}
                        className="d-flex justify-content-between py-1 border-bottom border-light"
                      >
                        <span>{f.studentName || f.student_name || 'Student'}</span>
                        <CBadge
                          color={String(f.status).toUpperCase() === 'PAID' ? 'success' : 'warning'}
                        >
                          {f.status}
                        </CBadge>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-body-secondary small mb-0">
                  No fee records loaded. <Link to="/parent/fees">View fees</Link>
                </p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={7}>
          <CCard className="h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>
                <CIcon icon={cilCalendar} className="me-2" />
                Upcoming sessions
              </span>
              <Link to="/parent/schedule" className="small">
                Full schedule
              </Link>
            </CCardHeader>
            <CCardBody>
              {!sessions.length ? (
                <p className="text-body-secondary small mb-0">No upcoming sessions in this view.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {sessions.slice(0, 8).map((s) => (
                    <li key={s.id} className="mb-3 pb-3 border-bottom border-light">
                      <div className="d-flex justify-content-between flex-wrap gap-1">
                        <span className="fw-semibold">{s.title || 'Session'}</span>
                        {s.student?.name ? (
                          <CBadge color="light" textColor="dark">
                            {s.student.name}
                          </CBadge>
                        ) : null}
                      </div>
                      <div className="small text-body-secondary">
                        {formatSessionWhen(s)} · {s.place || 'Location TBD'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <CCard className="h-100 mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>
                <CIcon icon={cilBell} className="me-2" />
                Announcements
              </span>
              <Link to="/parent/notifications" className="small">
                All
              </Link>
            </CCardHeader>
            <CCardBody>
              {!notificationsPreview.length ? (
                <p className="text-body-secondary small mb-0">No announcements in this preview.</p>
              ) : (
                <ul className="list-unstyled small mb-0">
                  {notificationsPreview.slice(0, 5).map((n) => (
                    <li key={n.id} className="mb-3">
                      <div className="fw-semibold">{n.title || 'Notice'}</div>
                      <div className="text-body-secondary text-truncate">{n.message}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CCardBody>
          </CCard>
          <CCard>
            <CCardHeader>Recent activity</CCardHeader>
            <CCardBody>
              {!resultsPreview.length ? (
                <p className="text-body-secondary small mb-0">
                  No recent competition results in this feed.
                </p>
              ) : (
                <ul className="list-unstyled small mb-0">
                  {resultsPreview.slice(0, 5).map((r) => (
                    <li key={r.id} className="mb-2">
                      <span className="fw-semibold">{r.studentName}</span>
                      <span className="text-body-secondary">
                        {' '}
                        — {r.rank != null ? `Rank ${r.rank}` : 'Result'}
                        {r.score != null ? ` · ${r.score}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="small text-body-secondary mt-2">
                <Link to="/parent/competitions">Competitions</Link>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default ParentHomePage
