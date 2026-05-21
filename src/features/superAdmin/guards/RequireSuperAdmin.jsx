import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner } from '@coreui/react'
import { isSuperAdminUser } from '../utils/superAdminAccess'

export default function RequireSuperAdmin({ children }) {
  const user = useSelector((s) => s.auth.user)
  const isRestored = useSelector((s) => s.auth.isRestored)

  if (!isRestored) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-50 p-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!isSuperAdminUser(user)) {
    return <Navigate to="/coach/dashboard" replace />
  }

  if (children) return children
  return <Outlet />
}
