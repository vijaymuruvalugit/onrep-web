import React from 'react'
import { useSelector } from 'react-redux'

import CoachDashboard from './CoachDashboard'
import OwnerDashboard from './OwnerDashboard'

/**
 * Same route as coach home; owner sees business dashboard, others see operational coach view.
 */
const CoachAreaDashboard = () => {
  const activeRole = useSelector(
    (state) => state.auth.user?.role || state.auth.user?.userRole || 'coach',
  )
  if (String(activeRole).toLowerCase() === 'academy_owner') {
    return <OwnerDashboard />
  }
  return <CoachDashboard />
}

export default CoachAreaDashboard
