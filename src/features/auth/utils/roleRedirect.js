import { getDefaultRouteForRole } from '../../../navigation'

export { getDefaultRouteForRole }

/** Maps API membership_role to app nav role. */
export function membershipToNavRole(membershipRole) {
  const m = String(membershipRole || '').toLowerCase()
  if (m === 'academy_admin') return 'academy_owner'
  if (m === 'student') return 'student'
  if (m === 'parent') return 'parent'
  if (m === 'super_admin') return 'admin'
  return 'coach'
}

export function resolveUserRole(user) {
  if (user?.activeRole) return membershipToNavRole(user.activeRole)
  return (
    user?.role || user?.userRole || user?.accountType || user?.type || user?.roles?.[0] || 'coach'
  )
}

export function getRoleRedirectPath(user) {
  return getDefaultRouteForRole(resolveUserRole(user))
}

export function paymentsPathForRole(user) {
  const r = resolveUserRole(user)
  if (r === 'parent') return '/parent/payments'
  if (r === 'student') return '/student/payments'
  return '/coach/payments'
}
