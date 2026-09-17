import { describe, it, expect } from 'vitest'
import { hasAcademyAdminCapability, hasAcademyAdminMembership } from './academyAdminAccess'

describe('hasAcademyAdminMembership', () => {
  it('does not treat activeRole / UI perspective as authorization', () => {
    expect(
      hasAcademyAdminMembership({
        activeRole: 'academy_admin',
        role: 'coach',
        roles: ['coach'],
        memberships: [{ role: 'coach', status: 'active' }],
      }),
    ).toBe(false)
  })

  it('allows academy_admin membership and capability flags', () => {
    expect(
      hasAcademyAdminMembership({
        activeRole: 'coach',
        roles: ['academy_admin', 'coach'],
        memberships: [
          { role: 'academy_admin', status: 'active' },
          { role: 'coach', status: 'active' },
        ],
      }),
    ).toBe(true)
    expect(hasAcademyAdminMembership({ hasAcademyAdmin: true, roles: ['coach'] })).toBe(true)
    expect(hasAcademyAdminMembership({ capabilities: { academyAdmin: true } })).toBe(true)
  })

  it('rejects coach-only users', () => {
    expect(
      hasAcademyAdminMembership({
        role: 'coach',
        roles: ['coach'],
        memberships: [{ role: 'coach', status: 'active' }],
      }),
    ).toBe(false)
  })
})

describe('hasAcademyAdminCapability (existing dashboard gate)', () => {
  it('still lets a multi-capability admin/coach identity into Admin', () => {
    expect(
      hasAcademyAdminCapability({
        roles: ['academy_admin', 'coach'],
        memberships: [{ role: 'academy_admin' }, { role: 'coach' }],
      }),
    ).toBe(true)
  })

  it('treats authenticated academy_admin membership role without hasAdmin flag', () => {
    expect(
      hasAcademyAdminCapability({
        role: 'academy_admin',
        activeRole: 'academy_admin',
        roles: ['academy_admin'],
        memberships: [{ role: 'academy_admin', status: 'active' }],
      }),
    ).toBe(true)
    expect(hasAcademyAdminCapability({ role: 'academy_admin' })).toBe(true)
    expect(hasAcademyAdminCapability({ hasAcademyAdmin: true, role: 'coach' })).toBe(true)
  })

  it('does not treat coach-only users as academy admin', () => {
    expect(
      hasAcademyAdminCapability({
        role: 'coach',
        roles: ['coach'],
        memberships: [{ role: 'coach', status: 'active' }],
      }),
    ).toBe(false)
  })
})
