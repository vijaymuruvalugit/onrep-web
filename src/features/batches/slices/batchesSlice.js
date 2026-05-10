import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { normalizeTrainingSessionRow } from '../../classes/utils/sessionRow'
import { normalizeScheduleRowForUi } from '../../places/utils/placeMappers'
import batchesApi from '../api/batchesApi'

const initialState = {
  items: [],
  selectedBatch: null,
  schedules: [],
  upcomingClasses: [],
  listLoading: false,
  detailLoading: false,
  schedulesLoading: false,
  classesLoading: false,
  mutationLoading: false,
  listError: null,
  detailError: null,
  schedulesError: null,
  classesError: null,
  mutationError: null,
}

export const fetchBatches = createAsyncThunk(
  'batches/fetchBatches',
  async (params = {}, thunkApi) => {
    try {
      const response = await batchesApi.listBatches(params)
      return response.batches || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchBatchById = createAsyncThunk(
  'batches/fetchBatchById',
  async (batchId, thunkApi) => {
    try {
      const response = await batchesApi.getBatch(batchId)
      return response.batch || null
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchBatchSchedules = createAsyncThunk(
  'batches/fetchBatchSchedules',
  async (batchId, thunkApi) => {
    try {
      const response = await batchesApi.listBatchSchedules(batchId)
      return response.schedules || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchBatchUpcomingClasses = createAsyncThunk(
  'batches/fetchBatchUpcomingClasses',
  async ({ batchId, fromDate, toDate } = {}, thunkApi) => {
    try {
      const response = await batchesApi.listClasses({
        batchId,
        fromDate,
        toDate,
        includeCancelled: true,
      })
      return response.sessions || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const createBatch = createAsyncThunk('batches/createBatch', async (payload, thunkApi) => {
  try {
    const response = await batchesApi.createBatch(payload)
    return response.batch || null
  } catch (error) {
    return thunkApi.rejectWithValue(normalizeApiError(error))
  }
})

export const saveBatchSettings = createAsyncThunk(
  'batches/saveBatchSettings',
  async ({ batchId, payload }, thunkApi) => {
    try {
      const response = await batchesApi.updateBatch(batchId, payload)
      return response.batch || null
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const assignBatchStudents = createAsyncThunk(
  'batches/assignBatchStudents',
  async ({ batchId, studentIds }, thunkApi) => {
    try {
      await batchesApi.replaceBatchStudents(batchId, studentIds)
      return studentIds
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    clearBatchErrors(state) {
      state.listError = null
      state.detailError = null
      state.schedulesError = null
      state.classesError = null
      state.mutationError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatches.pending, (state) => {
        state.listLoading = true
        state.listError = null
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.listLoading = false
        state.items = action.payload
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.listLoading = false
        state.listError = action.payload || { message: 'Unable to load batches.' }
      })
      .addCase(fetchBatchById.pending, (state) => {
        state.detailLoading = true
        state.detailError = null
      })
      .addCase(fetchBatchById.fulfilled, (state, action) => {
        state.detailLoading = false
        state.selectedBatch = action.payload
      })
      .addCase(fetchBatchById.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload || { message: 'Unable to load batch.' }
      })
      .addCase(fetchBatchSchedules.pending, (state) => {
        state.schedulesLoading = true
        state.schedulesError = null
      })
      .addCase(fetchBatchSchedules.fulfilled, (state, action) => {
        state.schedulesLoading = false
        const rows = action.payload || []
        state.schedules = rows.map((r) => normalizeScheduleRowForUi(r))
      })
      .addCase(fetchBatchSchedules.rejected, (state, action) => {
        state.schedulesLoading = false
        state.schedulesError = action.payload || { message: 'Unable to load schedule.' }
      })
      .addCase(fetchBatchUpcomingClasses.pending, (state) => {
        state.classesLoading = true
        state.classesError = null
      })
      .addCase(fetchBatchUpcomingClasses.fulfilled, (state, action) => {
        state.classesLoading = false
        const rows = action.payload || []
        state.upcomingClasses = rows.map((r) => normalizeTrainingSessionRow(r))
      })
      .addCase(fetchBatchUpcomingClasses.rejected, (state, action) => {
        state.classesLoading = false
        state.classesError = action.payload || { message: 'Unable to load classes.' }
      })
      .addCase(saveBatchSettings.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(saveBatchSettings.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (action.payload) {
          state.selectedBatch = action.payload
          state.items = state.items.map((batch) =>
            batch.id === action.payload.id ? action.payload : batch,
          )
        }
      })
      .addCase(saveBatchSettings.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to save batch settings.' }
      })
      .addCase(assignBatchStudents.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(assignBatchStudents.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (state.selectedBatch) {
          state.selectedBatch = {
            ...state.selectedBatch,
            studentIds: action.payload,
          }
        }
      })
      .addCase(assignBatchStudents.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to update students for batch.' }
      })
      .addCase(createBatch.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(createBatch.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (action.payload) {
          const exists = state.items.some(
            (b) => String(b.id || b._id) === String(action.payload.id || action.payload._id),
          )
          if (!exists) {
            state.items = [...state.items, action.payload]
          }
        }
      })
      .addCase(createBatch.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to create batch.' }
      })
  },
})

export const { clearBatchErrors } = batchesSlice.actions

export default batchesSlice.reducer
