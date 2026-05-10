import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import workspaceReducer, {
  setActiveWorkspace,
  applyExternalPersistedWorkspace,
  setWorkspaceFault,
} from './workspaceSlice'

vi.mock('../api/activitiesApi', () => ({
  listActivities: vi.fn(),
}))

vi.mock('../../../core/activityWorkspace/workspacePersistence', () => ({
  broadcastWorkspaceChange: vi.fn(),
  readPersistedActivityId: vi.fn(() => null),
  writePersistedActivityId: vi.fn(),
}))

describe('workspaceSlice continuity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('setActiveWorkspace accepts valid uuid and clears fault', () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const store = configureStore({ reducer: { workspace: workspaceReducer } })
    store.dispatch(setWorkspaceFault({ code: 'activity_forbidden', message: 'no access' }))
    store.dispatch(setActiveWorkspace(id))
    const s = store.getState().workspace
    expect(s.activeActivityId).toBe(id)
    expect(s.workspaceFault).toBeNull()
  })

  it('applyExternalPersistedWorkspace sets fault when id not in activities', () => {
    const store = configureStore({
      reducer: { workspace: workspaceReducer },
      preloadedState: {
        workspace: {
          activities: [
            {
              id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
              name: 'S',
              type: 'skating',
              label: '',
              icon: '',
              capabilities: {},
            },
          ],
          activeActivityId: null,
          status: 'idle',
          error: null,
          bootstrapComplete: true,
          workspaceFault: null,
          lastRefreshInvalidated: false,
        },
      },
    })
    store.dispatch(applyExternalPersistedWorkspace('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'))
    expect(store.getState().workspace.workspaceFault?.code).toBe('workspace_out_of_sync')
  })
})
