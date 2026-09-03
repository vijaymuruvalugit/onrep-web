import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createTestStore } from 'src/test-utils/renderWithProviders'
import AcademySetupGuide from './AcademySetupGuide'

const { getSetupStatus } = vi.hoisted(() => ({
  getSetupStatus: vi.fn(),
}))

vi.mock('../api/academySetupStatusApi', () => ({
  default: { getSetupStatus },
}))

const ADMIN_USER = {
  id: 'profile-1',
  identity_id: 'identity-1',
  academy_id: 'acad-1',
  roles: ['academy_admin', 'coach'],
  memberships: [
    { role: 'academy_admin', status: 'active' },
    { role: 'coach', status: 'active' },
  ],
  hasAcademyAdmin: true,
}

const PARTIAL = {
  academyId: 'acad-1',
  activityId: null,
  readyToRun: false,
  coreCompleted: 2,
  coreTotal: 9,
  facts: {
    academyProfileComplete: true,
    enabledActivityCount: 1,
    activePlaceCount: 0,
    activeCoachCount: 0,
    activeStudentCount: 0,
    activeBatchCount: 0,
    enrolledStudentCount: 0,
    unstaffedBatchCount: 0,
    upcomingSessionCount: 0,
    activeFeeAssignmentCount: 0,
    approvedGuardianCount: 0,
  },
}

describe('AcademySetupGuide', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    getSetupStatus.mockResolvedValue(PARTIAL)
  })

  it('does not render for coach-only users', () => {
    const store = createTestStore({
      auth: {
        user: {
          id: 'c1',
          roles: ['coach'],
          memberships: [{ role: 'coach', status: 'active' }],
          academy_id: 'acad-1',
        },
        isAuthenticated: true,
      },
    })
    renderWithProviders(<AcademySetupGuide />, { store })
    expect(screen.queryByText('Get your academy ready')).not.toBeInTheDocument()
    expect(getSetupStatus).not.toHaveBeenCalled()
  })

  it('loads for a multi-capability admin/coach identity', async () => {
    const store = createTestStore({
      auth: { user: ADMIN_USER, isAuthenticated: true },
    })
    renderWithProviders(<AcademySetupGuide />, { store })
    expect(await screen.findByTestId('academy-setup-guide')).toBeInTheDocument()
    expect(getSetupStatus).toHaveBeenCalled()
  })

  it('retries after an error', async () => {
    const user = userEvent.setup()
    getSetupStatus.mockRejectedValueOnce({ message: 'Failed to load academy setup status.' })
    const store = createTestStore({
      auth: { user: ADMIN_USER, isAuthenticated: true },
    })
    renderWithProviders(<AcademySetupGuide />, { store })
    expect(await screen.findByTestId('academy-setup-guide-error')).toBeInTheDocument()
    getSetupStatus.mockResolvedValueOnce(PARTIAL)
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByTestId('academy-setup-guide')).toBeInTheDocument()
  })

  it('refetches when the active academy changes', async () => {
    const store = createTestStore({
      auth: { user: ADMIN_USER, isAuthenticated: true },
    })
    const { store: renderedStore } = renderWithProviders(<AcademySetupGuide />, { store })
    await screen.findByTestId('academy-setup-guide')
    expect(getSetupStatus).toHaveBeenCalledTimes(1)

    await act(async () => {
      renderedStore.dispatch({
        type: 'auth/patchCurrentUser',
        payload: { ...ADMIN_USER, academy_id: 'acad-2' },
      })
    })
    await waitFor(() => expect(getSetupStatus).toHaveBeenCalledTimes(2))
  })
})
