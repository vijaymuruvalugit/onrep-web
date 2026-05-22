/** Whether the user has owner-equivalent academy admin capability. */
export function hasAcademyAdminCapability(user) {
  if (!user) return false
  const ar = String(user.activeRole || '').toLowerCase()
  if (ar === 'academy_admin') return true
  const role = String(user.role || user.userRole || '').toLowerCase()
  if (role === 'academy_owner' || role === 'admin') return true
  const roles = Array.isArray(user.roles)
    ? user.roles.map((r) => String(r).toLowerCase())
    : Array.isArray(user.memberships)
      ? user.memberships.map((m) => String(m?.role || m).toLowerCase())
      : []
  return roles.includes('academy_admin')
}

/** Legal owner (`users.role = academy_owner`) — can assign/revoke delegated admins. */
export function isLegalAcademyOwner(user) {
  if (!user) return false
  if (user.is_legal_owner === true) return true
  return String(user.role || user.userRole || '').toLowerCase() === 'academy_owner'
}
