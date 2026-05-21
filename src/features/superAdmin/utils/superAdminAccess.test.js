import { describe, it, expect } from 'vitest'
import { isSuperAdminUser } from './superAdminAccess'

describe('isSuperAdminUser', () => {
  it('accepts is_platform_admin or is_super_admin', () => {
    expect(isSuperAdminUser({ is_platform_admin: true })).toBe(true)
    expect(isSuperAdminUser({ is_super_admin: true })).toBe(true)
    expect(isSuperAdminUser({ role: 'coach' })).toBe(false)
  })
})
