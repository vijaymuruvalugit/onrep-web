/**
 * Role-based navigation for OnRep admin (structure from onrep-frontend).
 * Roles match src/core/auth/roles in onrep: academy_owner, coach, admin, parent, student.
 */

import { coachNav } from './coachNav'
import { adminNav } from './adminNav'
import { parentNav } from './parentNav'
import { studentNav } from './studentNav'
import { superAdminNav } from './superAdminNav'
import { isSuperAdminUser } from '../features/superAdmin/utils/superAdminAccess'
import { hasAcademyAdminCapability } from '../features/auth/utils/academyAdminAccess'

export { VALID_APP_ROLES } from './roles'
export { superAdminNav }

export function normalizeAppRole(role) {
  const r = String(role || 'coach').toLowerCase()
  if (r === 'academy_admin') return 'academy_owner'
  return r
}

export function getNavigationForRole(role, user = null) {
  if (isSuperAdminUser(user)) return superAdminNav
  const r = normalizeAppRole(role)
  if (r === 'parent') return parentNav
  if (r === 'student') return studentNav
  if (r === 'academy_owner' || (user && hasAcademyAdminCapability(user) && user.activeRole === 'academy_admin')) {
    return adminNav
  }
  if (user && hasAcademyAdminCapability(user) && !user.activeRole) {
    return adminNav
  }
  return coachNav
}

export function getDefaultRouteForRole(role, user = null) {
  if (isSuperAdminUser(user)) return '/super-admin/overview'
  const r = normalizeAppRole(role)
  if (r === 'parent') return '/parent/home'
  if (r === 'student') return '/student/home'
  return '/coach/dashboard'
}
