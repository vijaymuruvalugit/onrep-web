import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CSpinner,
} from '@coreui/react'
import useClasses from '../hooks/useClasses'
import {
  displayBatchTitle,
  formatExpectedStudents,
  formatSessionCalendarDate,
} from '../utils/sessionDisplay'

const todayIsoLocal = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

const TodayClassesPage = () => {
  const { today, loadingToday, todayError, fetchTodayClasses } = useClasses()

  useEffect(() => {
    fetchTodayClasses()
  }, [fetchTodayClasses])

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Today&apos;s Classes</strong>
          <div className="small text-body-secondary">
            {formatSessionCalendarDate(todayIsoLocal(), { weekday: 'long', month: 'long' })} — open
            a class to mark attendance
          </div>
        </div>
        <CButton size="sm" color="primary" variant="outline" onClick={() => fetchTodayClasses()}>
          Refresh
        </CButton>
      </CCardHeader>
      <CCardBody>
        {todayError ? <CAlert color="danger">{todayError.message}</CAlert> : null}

        {loadingToday ? (
          <div className="text-center py-4">
            <CSpinner />
          </div>
        ) : null}

        {!loadingToday && !today.length ? <CAlert color="info">No classes today.</CAlert> : null}

        {!loadingToday && today.length ? (
          <CListGroup flush>
            {today.map((cls) => {
              const classId = cls.sessionId || cls.id || cls._id
              if (!classId) return null
              const expectedLine = formatExpectedStudents(cls)
              return (
                <CListGroupItem
                  key={classId}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-semibold">{displayBatchTitle(cls)}</div>
                    <div className="small text-body-secondary">
                      {cls.startTime || cls.time || '--'}
                      {expectedLine ? ` · ${expectedLine}` : ''}
                      {cls.location || cls.placeName
                        ? ` · ${cls.location || cls.placeName}`
                        : ''}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CBadge color={cls.attendanceMarked ? 'success' : 'warning'}>
                      {cls.attendanceMarked ? 'Attendance Completed' : 'Attendance Pending'}
                    </CBadge>
                    <CButton
                      as={Link}
                      to={`/coach/attendance/class/${encodeURIComponent(classId)}`}
                      size="sm"
                      color="primary"
                    >
                      Mark Attendance
                    </CButton>
                  </div>
                </CListGroupItem>
              )
            })}
          </CListGroup>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default TodayClassesPage
