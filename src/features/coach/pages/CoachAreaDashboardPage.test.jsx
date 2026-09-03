import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, createTestStore } from 'src/test-utils/renderWithProviders'
import CoachAreaDashboardPage from './CoachAreaDashboardPage'

vi.mock('./CoachOperationalDashboard', () => ({
  default: () => <div data-testid="coach-ops-dashboard">Coach ops</div>,
}))

vi.mock('../../../views/dashboard/onrep/OwnerDashboard', () => ({
  default: () => <div data-testid="owner-dashboard">Owner dashboard</div>,
}))

describe('CoachAreaDashboardPage', () => {
  it('does not give coach-only users the admin dashboard', () => {
    const store = createTestStore({
      auth: {
        user: {
          role: 'coach',
          roles: ['coach'],
          memberships: [{ role: 'coach' }],
        },
        isAuthenticated: true,
      },
    })
    renderWithProviders(<CoachAreaDashboardPage />, { store })
    expect(screen.getByTestId('coach-ops-dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('owner-dashboard')).not.toBeInTheDocument()
  })

  it('shows the admin dashboard for a multi-capability admin/coach identity', () => {
    const store = createTestStore({
      auth: {
        user: {
          roles: ['academy_admin', 'coach'],
          memberships: [{ role: 'academy_admin' }, { role: 'coach' }],
        },
        isAuthenticated: true,
      },
    })
    renderWithProviders(<CoachAreaDashboardPage />, { store })
    expect(screen.getByTestId('owner-dashboard')).toBeInTheDocument()
  })
})
