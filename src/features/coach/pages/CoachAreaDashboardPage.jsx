import React from 'react'
import { useSelector } from 'react-redux'

import CoachOperationalDashboard from './CoachOperationalDashboard'
import OwnerDashboard from '../../../views/dashboard/onrep/OwnerDashboard'
import { hasAcademyAdminCapability } from '../../auth/utils/academyAdminAccess'

/**
 * Role-aware coach home: owner/admin perspective sees business dashboard; coaches see operational dashboard.
 */
const CoachAreaDashboardPage = () => {
  const user = useSelector((state) => state.auth.user)
  if (hasAcademyAdminCapability(user)) {
    return <OwnerDashboard />
  }
  return <CoachOperationalDashboard />
}

export default CoachAreaDashboardPage
