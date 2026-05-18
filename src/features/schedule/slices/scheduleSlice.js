import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { normalizeScheduleRowForUi } from '../../places/utils/placeMappers'
import scheduleApi from '../api/scheduleApi'

const initialState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
  mutationError: null,
  latestScheduleRequestId: null,
}

export const fetchSchedule = createAsyncThunk(
  'schedule/fetchSchedule',
  async (batchId, thunkApi) => {
    try {
      const response = await scheduleApi.listBatchSchedules(batchId)
      const rows = response.schedules || []
      return rows.map((r) => normalizeScheduleRowForUi(r))
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const createSchedule = createAsyncThunk(
  'schedule/createSchedule',
  async (payload, thunkApi) => {
    try {
      const response = await scheduleApi.createSchedule(payload)
      const row = response.schedule || null
      return {
        schedule: row ? normalizeScheduleRowForUi(row) : null,
        materialization: response.materialization ?? null,
      }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

/**
 * Audit-safe end-and-replace edit. Payload mirrors the backend contract:
 *   { patternId, mode, effectiveFrom?, horizonDays?, changes }
 * Returns the full response (previous + next pattern + counts) so the UI can
 * surface the post-save toast ("12 upcoming regenerated, 3 past kept").
 */
export const updatePattern = createAsyncThunk(
  'schedule/updatePattern',
  async ({ patternId, ...rest }, thunkApi) => {
    try {
      const response = await scheduleApi.patchRecurringPattern(patternId, rest)
      return response
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const deactivatePattern = createAsyncThunk(
  'schedule/deactivatePattern',
  async ({ patternId }, thunkApi) => {
    try {
      const response = await scheduleApi.deactivateRecurringPattern(patternId)
      return response
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearScheduleErrors(state) {
      state.error = null
      state.mutationError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedule.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.latestScheduleRequestId = action.meta.requestId
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestScheduleRequestId) return
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestScheduleRequestId) return
        state.loading = false
        state.error = action.payload || { message: 'Unable to load schedule.' }
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.saving = false
        const row = action.payload?.schedule
        if (row?.id) {
          const id = String(row.id)
          const without = state.items.filter((p) => String(p.id) !== id)
          state.items = [row, ...without]
        }
      })
      .addCase(createSchedule.pending, (state) => {
        state.saving = true
        state.mutationError = null
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.saving = false
        state.mutationError = action.payload || { message: 'Unable to save schedule.' }
      })
      .addCase(updatePattern.pending, (state) => {
        state.saving = true
        state.mutationError = null
      })
      .addCase(updatePattern.fulfilled, (state) => {
        state.saving = false
      })
      .addCase(updatePattern.rejected, (state, action) => {
        state.saving = false
        state.mutationError = action.payload || { message: 'Unable to update schedule.' }
      })
      .addCase(deactivatePattern.pending, (state) => {
        state.saving = true
        state.mutationError = null
      })
      .addCase(deactivatePattern.fulfilled, (state) => {
        state.saving = false
      })
      .addCase(deactivatePattern.rejected, (state, action) => {
        state.saving = false
        state.mutationError = action.payload || { message: 'Unable to delete schedule.' }
      })
  },
})

export const { clearScheduleErrors } = scheduleSlice.actions
export default scheduleSlice.reducer
