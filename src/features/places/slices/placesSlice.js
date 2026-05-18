import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { setActiveWorkspace } from '../../workspace/slices/workspaceSlice'
import batchesApi from '../../batches/api/batchesApi'
import scheduleApi from '../../schedule/api/scheduleApi'
import { createSchedule } from '../../schedule/slices/scheduleSlice'
import placesApi from '../api/placesApi'
import { mapPlaceFromApi } from '../utils/placeMappers'
import { buildUsageMaps } from '../utils/placeStats'
import { runWithConcurrency } from '../utils/runWithConcurrency'

const initialState = {
  items: [],
  selectedPlace: null,
  listTotal: 0,
  listLoading: false,
  detailLoading: false,
  mutationLoading: false,
  statsLoading: false,
  listError: null,
  detailError: null,
  mutationError: null,
  statsError: null,
  statsByPlaceId: {},
  rowsByPlaceId: {},
  filters: {
    q: '',
    status: 'active',
  },
  /** Ignore stale list responses when workspace changes or a newer fetch started. */
  latestPlacesRequestId: null,
}

export const fetchPlaces = createAsyncThunk('places/fetchPlaces', async (params = {}, thunkApi) => {
  try {
    const merged = {
      status: params.status ?? thunkApi.getState().places?.filters?.status ?? 'active',
      limit: params.limit ?? 200,
      offset: params.offset ?? 0,
      ...params,
    }
    if (params.q != null) merged.q = params.q
    const response = await placesApi.listPlaces(merged)
    const raw = response.places || []
    return {
      places: raw.map(mapPlaceFromApi).filter(Boolean),
      total: typeof response.total === 'number' ? response.total : raw.length,
    }
  } catch (error) {
    return thunkApi.rejectWithValue(normalizeApiError(error))
  }
})

export const fetchPlaceById = createAsyncThunk(
  'places/fetchPlaceById',
  async (placeId, thunkApi) => {
    try {
      const state = thunkApi.getState()
      const cached = state.places?.items?.find((p) => String(p.id) === String(placeId))
      if (cached) return cached

      const response = await placesApi.listPlaces({ status: 'all', limit: 500, offset: 0 })
      const raw = response.places || []
      const found = raw.map(mapPlaceFromApi).find((p) => String(p.id) === String(placeId))
      if (!found) {
        return thunkApi.rejectWithValue({ message: 'Place not found.' })
      }
      return found
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchPlacesUsageStats = createAsyncThunk(
  'places/fetchPlacesUsageStats',
  async (_, thunkApi) => {
    try {
      const { batches } = await batchesApi.listBatches()
      const list = Array.isArray(batches) ? batches : []
      const schedulesByBatchId = {}
      /** @type {Record<string, { name?: string }>} */
      const batchMetaById = {}

      for (const b of list) {
        if (b?.id) batchMetaById[String(b.id)] = { name: b.name }
      }

      await runWithConcurrency(list, 6, async (batch) => {
        const id = batch.id
        if (!id) return null
        try {
          const res = await scheduleApi.listBatchSchedules(id)
          schedulesByBatchId[String(id)] = res.schedules || []
        } catch {
          schedulesByBatchId[String(id)] = []
        }
        return null
      })

      return buildUsageMaps(schedulesByBatchId, batchMetaById)
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const createPlace = createAsyncThunk('places/createPlace', async (payload, thunkApi) => {
  try {
    const response = await placesApi.createPlace(payload)
    const raw = response.place
    return mapPlaceFromApi(raw)
  } catch (error) {
    return thunkApi.rejectWithValue(normalizeApiError(error))
  }
})

export const updatePlace = createAsyncThunk(
  'places/updatePlace',
  async ({ placeId, payload }, thunkApi) => {
    try {
      const response = await placesApi.updatePlace(placeId, payload)
      const raw = response.place
      return mapPlaceFromApi(raw)
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const deactivatePlace = createAsyncThunk(
  'places/deactivatePlace',
  async (placeId, thunkApi) => {
    try {
      const response = await placesApi.deactivatePlace(placeId)
      return mapPlaceFromApi(response.place)
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const reactivatePlace = createAsyncThunk(
  'places/reactivatePlace',
  async (placeId, thunkApi) => {
    try {
      const response = await placesApi.reactivatePlace(placeId)
      return mapPlaceFromApi(response.place)
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    setPlacesFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearPlacesErrors(state) {
      state.listError = null
      state.detailError = null
      state.mutationError = null
      state.statsError = null
    },
    clearSelectedPlace(state) {
      state.selectedPlace = null
    },
    setSelectedPlace(state, action) {
      state.selectedPlace = action.payload
    },
    invalidatePlaceStats(state) {
      state.statsByPlaceId = {}
      state.rowsByPlaceId = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaces.pending, (state, action) => {
        state.listLoading = true
        state.listError = null
        state.latestPlacesRequestId = action.meta.requestId
      })
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestPlacesRequestId) return
        state.listLoading = false
        state.items = action.payload.places
        state.listTotal = action.payload.total
      })
      .addCase(fetchPlaces.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestPlacesRequestId) return
        state.listLoading = false
        state.listError = action.payload || { message: 'Unable to load places.' }
      })
      .addCase(setActiveWorkspace, (state) => {
        state.items = []
        state.latestPlacesRequestId = null
      })
      .addCase(fetchPlaceById.pending, (state) => {
        state.detailLoading = true
        state.detailError = null
      })
      .addCase(fetchPlaceById.fulfilled, (state, action) => {
        state.detailLoading = false
        state.selectedPlace = action.payload
        const idx = state.items.findIndex((p) => String(p.id) === String(action.payload.id))
        if (idx >= 0) state.items[idx] = action.payload
      })
      .addCase(fetchPlaceById.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload || { message: 'Unable to load place.' }
      })
      .addCase(fetchPlacesUsageStats.pending, (state) => {
        state.statsLoading = true
        state.statsError = null
      })
      .addCase(fetchPlacesUsageStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.statsByPlaceId = action.payload.statsByPlaceId || {}
        state.rowsByPlaceId = action.payload.rowsByPlaceId || {}
      })
      .addCase(fetchPlacesUsageStats.rejected, (state, action) => {
        state.statsLoading = false
        state.statsError = action.payload || { message: 'Unable to load usage stats.' }
      })
      .addCase(createPlace.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(createPlace.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (action.payload) {
          state.items = [action.payload, ...state.items.filter((p) => p.id !== action.payload.id)]
          state.selectedPlace = action.payload
        }
      })
      .addCase(createPlace.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to create place.' }
      })
      .addCase(updatePlace.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(updatePlace.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (action.payload) {
          state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p))
          if (state.selectedPlace?.id === action.payload.id) {
            state.selectedPlace = action.payload
          }
        }
      })
      .addCase(updatePlace.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to update place.' }
      })
      .addCase(deactivatePlace.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(deactivatePlace.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (action.payload) {
          state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p))
          if (state.selectedPlace?.id === action.payload.id) {
            state.selectedPlace = action.payload
          }
        }
      })
      .addCase(deactivatePlace.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to deactivate place.' }
      })
      .addCase(reactivatePlace.pending, (state) => {
        state.mutationLoading = true
        state.mutationError = null
      })
      .addCase(reactivatePlace.fulfilled, (state, action) => {
        state.mutationLoading = false
        if (action.payload) {
          state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p))
          if (state.selectedPlace?.id === action.payload.id) {
            state.selectedPlace = action.payload
          }
        }
      })
      .addCase(reactivatePlace.rejected, (state, action) => {
        state.mutationLoading = false
        state.mutationError = action.payload || { message: 'Unable to reactivate place.' }
      })
      .addCase(createSchedule.fulfilled, (state) => {
        state.statsByPlaceId = {}
        state.rowsByPlaceId = {}
      })
  },
})

export const {
  setPlacesFilters,
  clearPlacesErrors,
  clearSelectedPlace,
  setSelectedPlace,
  invalidatePlaceStats,
} = placesSlice.actions

export default placesSlice.reducer
