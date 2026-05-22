/** Super Admin = first-class platform governance role. */
export function isSuperAdminUser(user) {
  if (!user) return false
  if (user.is_super_admin === true) return true
  if (String(user.role || '').toLowerCase() === 'super_admin') return true
  if (String(user.activeRole || '').toLowerCase() === 'super_admin') return true
  return Array.isArray(user.roles) && user.roles.includes('super_admin')
}
