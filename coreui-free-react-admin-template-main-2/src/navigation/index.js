/**
 * Role-based navigation for OnRep admin (structure from onrep-frontend).
 * Roles match src/core/auth/roles in onrep: academy_owner, coach, admin, parent, student.
 */

import { coachNav } from './coachNav'
import { adminNav } from './adminNav'
import { parentNav } from './parentNav'
import { studentNav } from './studentNav'

export { VALID_APP_ROLES } from './roles'

export function normalizeAppRole(role) {
  return String(role || 'coach').toLowerCase()
}

export function getNavigationForRole(role) {
  const r = normalizeAppRole(role)
  if (r === 'parent') return parentNav
  if (r === 'student') return studentNav
  if (r === 'academy_owner') return adminNav
  return coachNav
}

export function getDefaultRouteForRole(role) {
  const r = normalizeAppRole(role)
  if (r === 'parent') return '/parent/home'
  if (r === 'student') return '/student/home'
  return '/coach/dashboard'
}
