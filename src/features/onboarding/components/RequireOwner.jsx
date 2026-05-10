import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * Limits onboarding owner flows — coaches/admins redirect to operational dashboard.
 */
const RequireOwner = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  const isOwner = String(user?.role || user?.userRole || '').toLowerCase() === 'academy_owner'
  if (!isOwner) {
    return <Navigate to="/coach/dashboard" replace />
  }
  return children
}

export default RequireOwner
