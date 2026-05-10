import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { login, logout, forceLogout } from '../../auth/slices/authSlice'
import { listActivities } from '../api/activitiesApi'
import {
  broadcastWorkspaceChange,
  readPersistedActivityId,
  writePersistedActivityId,
} from '../../../core/activityWorkspace/workspacePersistence'
import { isValidUuid } from '../../../core/activityWorkspace/apiActivityContext'

function normalizeActivity(row) {
  if (!row) return null
  return {
    id: String(row.id),
    name: row.name || '',
    type: row.type || '',
    label: row.label != null ? String(row.label) : '',
    icon: row.icon != null ? String(row.icon) : '',
    capabilities: row.capabilities && typeof row.capabilities === 'object' ? row.capabilities : {},
  }
}

export const bootstrapWorkspace = createAsyncThunk(
  'workspace/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      const raw = await listActivities()
      const activities = raw.map(normalizeActivity).filter((a) => a && isValidUuid(a.id))
      const persisted = readPersistedActivityId()
      let activeActivityId = null
      if (activities.length === 1) {
        activeActivityId = activities[0].id
      } else if (persisted && activities.some((a) => a.id === persisted)) {
        activeActivityId = persisted
      }
      if (activeActivityId) {
        writePersistedActivityId(activeActivityId)
        broadcastWorkspaceChange(activeActivityId)
      } else {
        writePersistedActivityId(null)
        broadcastWorkspaceChange(null)
      }
      return { activities, activeActivityId }
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const refreshActivities = createAsyncThunk(
  'workspace/refreshActivities',
  async (_, { rejectWithValue, getState }) => {
    try {
      const raw = await listActivities()
      const activities = raw.map(normalizeActivity).filter((a) => a && isValidUuid(a.id))
      const prevId = getState().workspace.activeActivityId
      const still = prevId && activities.some((a) => a.id === prevId)
      let activeActivityId = still ? prevId : null
      if (activities.length === 1) activeActivityId = activities[0].id
      if (!still && prevId) {
        writePersistedActivityId(activeActivityId)
        broadcastWorkspaceChange(activeActivityId)
      }
      return { activities, activeActivityId, invalidated: Boolean(prevId && !still) }
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

const initialState = {
  activities: [],
  activeActivityId: null,
  status: 'idle',
  error: null,
  bootstrapComplete: false,
  /** User-visible workspace failure — partition invalid; clear and reselect. */
  workspaceFault: null,
  lastRefreshInvalidated: false,
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspace(state, action) {
      const id = action.payload == null ? null : String(action.payload)
      state.activeActivityId = id && isValidUuid(id) ? id : null
      state.workspaceFault = null
      writePersistedActivityId(state.activeActivityId)
      broadcastWorkspaceChange(state.activeActivityId)
    },
    clearWorkspace(state) {
      state.activeActivityId = null
      state.workspaceFault = null
      writePersistedActivityId(null)
      broadcastWorkspaceChange(null)
    },
    /** Storage / other tab updated persistence — reconcile runtime SoT. */
    applyExternalPersistedWorkspace(state, action) {
      const id = action.payload == null ? null : String(action.payload)
      const next = id && isValidUuid(id) ? id : null
      if (next && state.activities.length && !state.activities.some((a) => a.id === next)) {
        state.activeActivityId = null
        state.workspaceFault = {
          code: 'workspace_out_of_sync',
          message: 'Your workspace was updated in another tab. Pick an activity workspace to continue.',
        }
        writePersistedActivityId(null)
        return
      }
      state.activeActivityId = next
      state.workspaceFault = null
    },
    setWorkspaceFault(state, action) {
      state.workspaceFault = action.payload || null
      if (action.payload?.clearPersistence) {
        state.activeActivityId = null
        writePersistedActivityId(null)
        broadcastWorkspaceChange(null)
      }
    },
    resetWorkspaceState: () => ({ ...initialState, bootstrapComplete: true }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapWorkspace.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(bootstrapWorkspace.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.activities = action.payload.activities
        state.activeActivityId = action.payload.activeActivityId
        state.bootstrapComplete = true
        state.workspaceFault = null
      })
      .addCase(bootstrapWorkspace.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || { message: 'Unable to load activities.' }
        state.bootstrapComplete = true
      })
      .addCase(refreshActivities.fulfilled, (state, action) => {
        state.activities = action.payload.activities
        state.activeActivityId = action.payload.activeActivityId
        state.lastRefreshInvalidated = action.payload.invalidated
        if (action.payload.invalidated) {
          state.workspaceFault = {
            code: 'activity_invalid',
            message:
              'This activity workspace is no longer available or your access changed. Choose another workspace.',
          }
        }
      })
      .addCase(refreshActivities.rejected, (state, action) => {
        state.error = action.payload || { message: 'Unable to refresh activities.' }
      })
      .addCase(login.fulfilled, () => ({ ...initialState }))
      .addCase(logout.fulfilled, () => ({ ...initialState }))
      .addCase(logout.rejected, () => ({ ...initialState }))
      .addCase(forceLogout, () => ({ ...initialState }))
  },
})

export const {
  setActiveWorkspace,
  clearWorkspace,
  applyExternalPersistedWorkspace,
  setWorkspaceFault,
  resetWorkspaceState,
} = workspaceSlice.actions

export function selectActiveActivity(state) {
  const { activeActivityId, activities } = state.workspace
  if (!activeActivityId) return null
  return activities.find((a) => a.id === activeActivityId) || null
}

export default workspaceSlice.reducer
