import React, { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { CSpinner } from '@coreui/react'
import { authApi } from '../features/auth/api/authApi'
import { patchCurrentUser } from '../features/auth/slices/authSlice'
import { authStorage } from '../api/authStorage'
import OwnerRoleSetupModal from '../features/auth/components/OwnerRoleSetupModal'

/**
 * Returns true when an authenticated owner has no URM rows yet.
 * The backend populates user.memberships on every /me response.
 * An empty array means the owner skipped (or pre-dates) role assignment.
 */
function ownerNeedsRoleSetup(user) {
  if (!user?.is_legal_owner) return false
  const memberships = user?.memberships
  if (!Array.isArray(memberships)) return false
  // Filter out any legacy academy_owner rows — only coach/academy_admin count as "real" roles
  const operationalRoles = memberships.filter(
    (m) => m.role === 'coach' || m.role === 'academy_admin',
  )
  return operationalRoles.length === 0
}

const RequireAuth = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, isRestored, user } = useSelector((state) => state.auth)
  const [setupLoading, setSetupLoading] = useState(false)

  const handleRoleSetup = async (choice) => {
    setSetupLoading(true)
    try {
      const { data } = await authApi.setupOwnerRoles(choice)
      // Persist fresh token and update Redux so the modal closes and
      // the app re-renders with the new roles immediately.
      if (data?.token) authStorage.setToken(data.token)
      if (data?.user) {
        dispatch(patchCurrentUser(data.user))
      }
    } catch (err) {
      console.error('[OwnerRoleSetup] failed', err)
    } finally {
      setSetupLoading(false)
    }
  }

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

  const role = user?.role
  const mobileOnlyRoles = ['parent', 'student']
  if (role && mobileOnlyRoles.includes(role)) {
    return <Navigate to="/mobile-only" replace />
  }

  if (
    (user?.force_password_change === true || user?.next_action === 'FORCE_PASSWORD_CHANGE') &&
    location.pathname !== '/auth/change-password'
  ) {
    return <Navigate to="/auth/change-password" replace />
  }

  return (
    <>
      <OwnerRoleSetupModal
        visible={ownerNeedsRoleSetup(user)}
        onConfirm={handleRoleSetup}
        loading={setupLoading}
      />
      <Outlet />
    </>
  )
}

export default RequireAuth
