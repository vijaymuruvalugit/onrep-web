import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { hasAcademyAdminCapability } from '../../auth/utils/academyAdminAccess'

/**
 * Limits onboarding owner flows — coaches without admin redirect to operational dashboard.
 */
const RequireOwner = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  if (!hasAcademyAdminCapability(user)) {
    return <Navigate to="/coach/dashboard" replace />
  }
  return children
}

export default RequireOwner
