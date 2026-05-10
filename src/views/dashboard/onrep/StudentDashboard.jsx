import React from 'react'
import { Link } from 'react-router-dom'
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowRight, cilCalendar, cilPeople, cilSpeedometer } from '@coreui/icons'

import DashboardEmptyState from '../../../features/dashboard/components/DashboardEmptyState'

/**
 * Student / member home — no placeholder leaderboards or fake streaks.
 * Add real student-scoped APIs before showing progress UI.
 */
const StudentDashboard = () => {
  return (
    <div className="dashboard-sports">
      <CRow className="mb-3">
        <CCol>
          <h2 className="mb-0 d-flex align-items-center gap-2">
            <CIcon icon={cilSpeedometer} className="text-primary" />
            Home
          </h2>
          <p className="text-body-secondary small mb-0">Your academy hub — schedule and updates</p>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={8}>
          <DashboardEmptyState
            title="Welcome"
            detail="Schedules and announcements appear here as your academy publishes them. Detailed progress views ship in a later release."
          />
        </CCol>
        <CCol lg={4}>
          <CCard className="shadow-sm h-100">
            <CCardHeader>Shortcuts</CCardHeader>
            <CCardBody className="d-grid gap-2">
              <CButton as={Link} to="/student/schedule" color="primary" variant="outline">
                <CIcon icon={cilCalendar} className="me-2" />
                Schedule
                <CIcon icon={cilArrowRight} className="float-end mt-1" />
              </CButton>
              <CButton as={Link} to="/student/attendance" color="primary" variant="outline">
                <CIcon icon={cilPeople} className="me-2" />
                Attendance
              </CButton>
              <CButton as={Link} to="/student/notifications" color="secondary" variant="outline">
                Notifications
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default StudentDashboard
