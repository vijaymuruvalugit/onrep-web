import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createTestStore } from 'src/test-utils/renderWithProviders'
import ManageActivitiesPage from './ManageActivitiesPage'
import {
  PARENT_PERFORMANCE_SHARING_LABEL,
  PARENT_PERFORMANCE_SHARING_TOGGLE,
  PARENT_PERFORMANCE_SHARING_ENABLE_CONFIRM,
} from '../parentPerformanceSharingCopy'

const { listActivities, getParentPerformanceSharing, patchParentPerformanceSharing } = vi.hoisted(
  () => ({
    listActivities: vi.fn(),
    getParentPerformanceSharing: vi.fn(),
    patchParentPerformanceSharing: vi.fn(),
  }),
)

vi.mock('../../workspace/api/activitiesApi', () => ({
  listActivities,
  createActivity: vi.fn(),
  deactivateActivity: vi.fn(),
}))

vi.mock('../api/parentPerformanceSharingApi', () => ({
  getParentPerformanceSharing,
  patchParentPerformanceSharing,
}))

vi.mock('../../directory/api/directoryApi', () => ({
  listStaffCoaches: vi.fn(async () => []),
}))

vi.mock('../../academy/api/academyUiApi', () => ({
  getCoachUiConfig: vi.fn(async () => ({})),
  patchCoachUiConfig: vi.fn(),
}))

const OWNER = {
  id: 'owner-1',
  role: 'academy_owner',
  roles: ['academy_admin'],
  hasAcademyAdmin: true,
}

describe('ManageActivitiesPage parent performance sharing', () => {
  beforeEach(() => {
    listActivities.mockResolvedValue([{ id: 'act-skate', type: 'skating', name: 'Skating' }])
    getParentPerformanceSharing.mockResolvedValue({
      enabled: false,
      mode: 'explicit_only',
      updatedAt: null,
      updatedBy: null,
    })
    patchParentPerformanceSharing.mockResolvedValue({ enabled: true, mode: 'explicit_only' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('defaults the toggle off and uses explicit-only copy', async () => {
    const store = createTestStore({ auth: { user: OWNER } })
    renderWithProviders(<ManageActivitiesPage />, { store })
    await waitFor(() => expect(screen.getByText(PARENT_PERFORMANCE_SHARING_LABEL)).toBeInTheDocument())
    expect(screen.getByText(PARENT_PERFORMANCE_SHARING_TOGGLE)).toBeInTheDocument()
    const toggle = screen.getByRole('checkbox')
    expect(toggle).not.toBeChecked()
  })

  it('confirms before enabling', async () => {
    const user = userEvent.setup()
    const store = createTestStore({ auth: { user: OWNER } })
    renderWithProviders(<ManageActivitiesPage />, { store })
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeInTheDocument())
    await user.click(screen.getByRole('checkbox'))
    expect(window.confirm).toHaveBeenCalledWith(PARENT_PERFORMANCE_SHARING_ENABLE_CONFIRM)
    await waitFor(() =>
      expect(patchParentPerformanceSharing).toHaveBeenCalledWith('act-skate', true),
    )
  })
})
