import React from 'react'
import { useSelector } from 'react-redux'

import CoachOperationalDashboard from './CoachOperationalDashboard'
import OwnerDashboard from '../../../views/dashboard/onrep/OwnerDashboard'
import { resolveUserRole } from '../../auth/utils/roleRedirect'

/**
 * Role-aware coach home: owner/admin perspective sees business dashboard; coaches see operational dashboard.
 */
const CoachAreaDashboardPage = () => {
  const user = useSelector((state) => state.auth.user)
  const navRole = resolveUserRole(user)
  if (String(navRole).toLowerCase() === 'academy_owner') {
    return <OwnerDashboard />
  }
  return <CoachOperationalDashboard />
}

export default CoachAreaDashboardPage
