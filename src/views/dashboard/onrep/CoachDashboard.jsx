import React from 'react'
import { CCol, CRow } from '@coreui/react'
import TodayClassesPage from '../../../features/classes/pages/TodayClassesPage'
import AttendanceDashboardPage from '../../../features/attendance/pages/AttendanceDashboardPage'

const CoachDashboard = () => {
  return (
    <CRow className="g-3">
      <CCol xl={7}>
        <TodayClassesPage />
      </CCol>
      <CCol xl={5}>
        <AttendanceDashboardPage />
      </CCol>
    </CRow>
  )
}

export default CoachDashboard
