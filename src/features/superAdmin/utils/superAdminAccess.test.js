import { describe, it, expect } from 'vitest'
import { isSuperAdminUser } from './superAdminAccess'

describe('isSuperAdminUser', () => {
  it('accepts the first-class super_admin role', () => {
    expect(isSuperAdminUser({ role: 'super_admin' })).toBe(true)
    expect(isSuperAdminUser({ activeRole: 'super_admin' })).toBe(true)
    expect(isSuperAdminUser({ roles: ['super_admin'] })).toBe(true)
    expect(isSuperAdminUser({ is_super_admin: true })).toBe(true)
    expect(isSuperAdminUser({ is_platform_admin: true })).toBe(false)
    expect(isSuperAdminUser({ role: 'coach' })).toBe(false)
  })
})
