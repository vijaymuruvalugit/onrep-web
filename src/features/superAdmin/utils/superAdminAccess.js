/** Super Admin = platform governance (`users.is_platform_admin`). */
export function isSuperAdminUser(user) {
  if (!user) return false
  return user.is_super_admin === true || user.is_platform_admin === true
}
