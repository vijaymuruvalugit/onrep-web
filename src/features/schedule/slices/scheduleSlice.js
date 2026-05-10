import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { normalizeScheduleRowForUi } from '../../places/utils/placeMappers'
import scheduleApi from '../api/scheduleApi'

const initialState = {
  items: [],
  loading: false,
  saving: false,
  generating: false,
  error: null,
  mutationError: null,
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
      return row ? normalizeScheduleRowForUi(row) : null
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const regenerateClasses = createAsyncThunk(
  'schedule/regenerateClasses',
  async (payload, thunkApi) => {
    try {
      const response = await scheduleApi.generateClasses(payload)
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
      .addCase(fetchSchedule.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || { message: 'Unable to load schedule.' }
      })
      .addCase(createSchedule.pending, (state) => {
        state.saving = true
        state.mutationError = null
      })
      .addCase(createSchedule.fulfilled, (state) => {
        state.saving = false
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.saving = false
        state.mutationError = action.payload || { message: 'Unable to save schedule.' }
      })
      .addCase(regenerateClasses.pending, (state) => {
        state.generating = true
        state.mutationError = null
      })
      .addCase(regenerateClasses.fulfilled, (state) => {
        state.generating = false
      })
      .addCase(regenerateClasses.rejected, (state, action) => {
        state.generating = false
        state.mutationError = action.payload || { message: 'Unable to generate classes.' }
      })
  },
})

export const { clearScheduleErrors } = scheduleSlice.actions
export default scheduleSlice.reducer
