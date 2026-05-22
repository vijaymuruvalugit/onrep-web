/** @deprecated Standalone coach attendance hub — routes redirect to live session workspace. */
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCollapse,
  CListGroup,
  CListGroupItem,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilChevronBottom, cilChevronTop, cilLocationPin } from '@coreui/icons'
import useClasses from '../../classes/hooks/useClasses'
import {
  displayBatchTitle,
  formatExpectedStudents,
  formatSessionCalendarDate,
  formatSessionClock,
  getNextSessionHighlightIndex,
} from '../../classes/utils/sessionDisplay'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import './AttendanceDashboardPage.scss'

const PAGE_SIZE = 12

function todayIsoLocal() {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function SessionRow({
  session,
  emphasizeNext,
  showProminentDate,
  dateLine,
}) {
  const classId = session.sessionId || session.id || session._id
  if (!classId) return null

  const batchTitle = displayBatchTitle(session)
  const timeLabel = formatSessionClock(session.startTime)
  const expected = formatExpectedStudents(session)
  const placeRaw = session.placeName || session.location
  const place = placeRaw ? stripDemoSuffix(placeRaw) : ''

  return (
    <CListGroupItem
      className={[
        'onrep-attendance-row px-3 py-3',
        emphasizeNext ? 'onrep-attendance-row--next' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start align-items-md-center">
        <div className="flex-grow-1 min-w-0">
          {showProminentDate && dateLine ? (
            <div className="small fw-semibold text-primary text-uppercase mb-1">{dateLine}</div>
          ) : null}
          <div className="d-flex flex-wrap align-items-baseline gap-2">
            <span className="fw-semibold fs-6">{batchTitle}</span>
            {session.title && session.batchName && session.title !== session.batchName ? (
              <span className="small text-body-secondary">({session.title})</span>
            ) : null}
          </div>
          <div className="onrep-attendance-row-meta mt-1 d-flex flex-wrap gap-x-3 gap-y-1">
            <span>
              <CIcon icon={cilCalendar} className="me-1 text-body-secondary" size="sm" />
              {timeLabel}
            </span>
            {expected ? <span>{expected}</span> : null}
            {place ? (
              <span>
                <CIcon icon={cilLocationPin} className="me-1 text-body-secondary" size="sm" />
                {place}
              </span>
            ) : null}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <CBadge color={session.attendanceMarked ? 'success' : 'warning'}>
            {session.attendanceMarked ? 'Done' : 'Pending'}
          </CBadge>
          <CButton
            as={Link}
            size="sm"
            color="primary"
            to={`/coach/attendance/class/${encodeURIComponent(classId)}`}
          >
            Open
          </CButton>
        </div>
      </div>
    </CListGroupItem>
  )
}

const AttendanceDashboardPage = () => {
  const {
    today,
    pastSessions,
    loadingToday,
    loadingPast,
    todayError,
    pastError,
    fetchTodayClasses,
    fetchPastSessions,
  } = useClasses()

  const [pastOpen, setPastOpen] = useState(false)
  const [pastPage, setPastPage] = useState(1)

  useEffect(() => {
    fetchTodayClasses()
    fetchPastSessions({ limit: 80 })
  }, [fetchTodayClasses, fetchPastSessions])

  const pending = useMemo(() => today.filter((item) => !item.attendanceMarked), [today])
  const highlightIdx = useMemo(() => getNextSessionHighlightIndex(today), [today])

  const todayHeadingDate = formatSessionCalendarDate(todayIsoLocal(), {
    weekday: 'long',
    month: 'long',
  })

  const pastTotalPages = Math.max(1, Math.ceil((pastSessions?.length || 0) / PAGE_SIZE))
  const pastSlice = useMemo(() => {
    const list = pastSessions || []
    const start = (pastPage - 1) * PAGE_SIZE
    return list.slice(start, start + PAGE_SIZE)
  }, [pastSessions, pastPage])

  useEffect(() => {
    setPastPage(1)
  }, [pastSessions])

  const loadingAny = loadingToday || loadingPast
  const refreshAll = () => {
    fetchTodayClasses()
    fetchPastSessions({ limit: 80 })
  }

  return (
    <CCard className="border-0 onrep-surface-b shadow-none">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-transparent border-bottom border-light-subtle py-3">
        <div>
          <strong>Attendance</strong>
          <div className="small text-body-secondary">
            Today&apos;s sessions first — full date, batch, and roster size on every row
          </div>
        </div>
        <CButton
          size="sm"
          color="primary"
          variant="outline"
          disabled={loadingAny}
          onClick={refreshAll}
        >
          {loadingAny ? (
            <>
              <CSpinner size="sm" className="me-2" /> Refresh
            </>
          ) : (
            'Refresh'
          )}
        </CButton>
      </CCardHeader>
      <CCardBody>
        {todayError ? <CAlert color="danger">{todayError.message}</CAlert> : null}
        {pastError ? <CAlert color="warning">{pastError.message}</CAlert> : null}

        {!loadingToday && !today.length ? (
          <div className="onrep-attendance-today-panel mb-4">
            <div className="onrep-attendance-today-heading">Today — {todayHeadingDate}</div>
            <p className="onrep-attendance-today-sub mb-0">No sessions scheduled for today.</p>
          </div>
        ) : null}

        {loadingToday && !today.length ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
        ) : null}

        {!loadingToday && today.length ? (
          <div className="onrep-attendance-today-panel mb-4">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <div className="onrep-attendance-today-heading">Today — {todayHeadingDate}</div>
                <div className="onrep-attendance-today-sub">
                  {highlightIdx >= 0
                    ? 'Highlighted row is your next session that still needs attendance.'
                    : 'All caught up for today, or review any row below.'}
                </div>
              </div>
              <div className="d-flex gap-2">
                <CBadge color="warning">Pending {pending.length}</CBadge>
                <CBadge color="success">
                  Completed {today.filter((t) => t.attendanceMarked).length}
                </CBadge>
              </div>
            </div>
            <CListGroup flush className="rounded overflow-hidden border">
              {today.map((item, idx) => (
                <SessionRow
                  key={item.sessionId || item.id || idx}
                  session={item}
                  emphasizeNext={idx === highlightIdx && highlightIdx >= 0}
                  showProminentDate={false}
                  dateLine={null}
                />
              ))}
            </CListGroup>
          </div>
        ) : null}

        <div className="mt-2">
          <CButton
            color="secondary"
            variant="ghost"
            className="onrep-attendance-past-toggle text-body px-0 d-flex align-items-center gap-2"
            onClick={() => setPastOpen((v) => !v)}
            aria-expanded={pastOpen}
          >
            <CIcon icon={pastOpen ? cilChevronTop : cilChevronBottom} />
            Earlier sessions ({pastSessions?.length || 0})
            <span className="small text-body-secondary fw-normal">
              — history only; today stays above
            </span>
          </CButton>

          <CCollapse visible={pastOpen}>
            <div className="pt-3">
              {loadingPast ? (
                <div className="text-center py-3">
                  <CSpinner size="sm" />
                </div>
              ) : null}
              {!loadingPast && !(pastSessions?.length > 0) ? (
                <p className="small text-body-secondary mb-0">No past sessions in this view.</p>
              ) : null}
              {!loadingPast && pastSessions?.length > 0 ? (
                <>
                  <CListGroup flush className="border rounded overflow-hidden">
                    {pastSlice.map((item, idx) => {
                      const dateLine = item.sessionDate
                        ? formatSessionCalendarDate(item.sessionDate, {
                            weekday: 'short',
                            month: 'short',
                          })
                        : '—'
                      return (
                        <SessionRow
                          key={item.sessionId || item.id || idx}
                          session={item}
                          emphasizeNext={false}
                          showProminentDate
                          dateLine={dateLine}
                        />
                      )
                    })}
                  </CListGroup>
                  {pastTotalPages > 1 ? (
                    <div className="d-flex justify-content-between align-items-center mt-3 gap-2 flex-wrap">
                      <CButton
                        size="sm"
                        color="secondary"
                        variant="outline"
                        disabled={pastPage <= 1}
                        onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </CButton>
                      <span className="small text-body-secondary">
                        Page {pastPage} of {pastTotalPages}
                      </span>
                      <CButton
                        size="sm"
                        color="secondary"
                        variant="outline"
                        disabled={pastPage >= pastTotalPages}
                        onClick={() => setPastPage((p) => Math.min(pastTotalPages, p + 1))}
                      >
                        Next
                      </CButton>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </CCollapse>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default AttendanceDashboardPage
