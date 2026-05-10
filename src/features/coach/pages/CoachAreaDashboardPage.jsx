import React from 'react'
import { useSelector } from 'react-redux'

import CoachOperationalDashboard from './CoachOperationalDashboard'
import OwnerDashboard from '../../../views/dashboard/onrep/OwnerDashboard'

/**
 * Role-aware coach home: academy owner sees business dashboard; coaches see operational dashboard.
 */
const CoachAreaDashboardPage = () => {
  const activeRole = useSelector(
    (state) => state.auth.user?.role || state.auth.user?.userRole || 'coach',
  )
  if (String(activeRole).toLowerCase() === 'academy_owner') {
    return <OwnerDashboard />
  }
  return <CoachOperationalDashboard />
}

export default CoachAreaDashboardPage
