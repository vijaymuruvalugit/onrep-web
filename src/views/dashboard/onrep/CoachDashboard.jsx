import React from 'react'
import { CCol, CRow } from '@coreui/react'
import TodayClassesPage from '../../../features/classes/pages/TodayClassesPage'

const CoachDashboard = () => {
  return (
    <CRow className="g-3">
      <CCol xs={12}>
        <TodayClassesPage />
      </CCol>
    </CRow>
  )
}

export default CoachDashboard
