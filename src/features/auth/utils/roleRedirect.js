import { getDefaultRouteForRole } from '../../../navigation'

export function resolveUserRole(user) {
  return (
    user?.role || user?.userRole || user?.accountType || user?.type || user?.roles?.[0] || 'coach'
  )
}

export function getRoleRedirectPath(user) {
  return getDefaultRouteForRole(resolveUserRole(user))
}
