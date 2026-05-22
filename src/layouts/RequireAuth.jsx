import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner } from '@coreui/react'

const RequireAuth = () => {
  const location = useLocation()
  const { isAuthenticated, isRestored, user } = useSelector((state) => state.auth)

  if (!isRestored) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />
  }

  if (
    (user?.force_password_change === true || user?.next_action === 'FORCE_PASSWORD_CHANGE') &&
    location.pathname !== '/auth/change-password'
  ) {
    return <Navigate to="/auth/change-password" replace />
  }

  return <Outlet />
}

export default RequireAuth
