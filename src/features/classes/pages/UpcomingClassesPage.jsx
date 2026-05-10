import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import useClasses from '../hooks/useClasses'

const UpcomingClassesPage = () => {
  const { batchId } = useParams()
  const { upcoming, loadingUpcoming, upcomingError, fetchUpcomingClasses } = useClasses()

  useEffect(() => {
    fetchUpcomingClasses(batchId ? { batchId } : {})
  }, [batchId, fetchUpcomingClasses])

  return (
    <CCard>
      <CCardHeader>
        <strong>Upcoming Classes</strong>
      </CCardHeader>
      <CCardBody>
        {upcomingError ? <CAlert color="danger">{upcomingError.message}</CAlert> : null}
        {loadingUpcoming ? <CSpinner /> : null}
        {!loadingUpcoming && !upcoming.length ? (
          <CAlert color="info">No upcoming classes. Add a schedule to generate classes.</CAlert>
        ) : null}
        {!loadingUpcoming &&
          upcoming.map((cls) => {
            const classId = cls.id || cls._id
            return (
              <div
                key={classId}
                className="d-flex justify-content-between align-items-center py-2 border-bottom"
              >
                <div>
                  <div className="fw-semibold">
                    {cls.dateLabel || cls.date || 'Upcoming'} - {cls.batchName || 'Class'}
                  </div>
                  <div className="small text-body-secondary">
                    {cls.startTime || cls.time || '--'}
                  </div>
                  <div className="small text-body-secondary text-truncate">
                    {cls.location || cls.placeName || cls.place_name || 'Location TBD'}
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <CBadge color={cls.attendanceMarked ? 'success' : 'secondary'}>
                    {cls.attendanceMarked ? 'Marked' : 'Pending'}
                  </CBadge>
                  <CButton
                    as={Link}
                    to={`/coach/attendance/class/${encodeURIComponent(classId)}`}
                    size="sm"
                    color="primary"
                    variant="outline"
                  >
                    Open
                  </CButton>
                </div>
              </div>
            )
          })}
      </CCardBody>
    </CCard>
  )
}

export default UpcomingClassesPage
