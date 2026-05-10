import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import classesApi from '../api/classesApi'
import { normalizeTrainingSessionRow } from '../utils/sessionRow'

const initialState = {
  today: [],
  upcoming: [],
  pastSessions: [],
  roster: [],
  loadingToday: false,
  loadingUpcoming: false,
  loadingPast: false,
  loadingRoster: false,
  todayError: null,
  upcomingError: null,
  pastError: null,
  rosterError: null,
}

export const fetchTodayClasses = createAsyncThunk(
  'classes/fetchTodayClasses',
  async (_, thunkApi) => {
    try {
      const response = await classesApi.listClasses({ scope: 'today' })
      const rows = response.sessions || []
      return rows.map((r) => normalizeTrainingSessionRow(r))
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchUpcomingClasses = createAsyncThunk(
  'classes/fetchUpcomingClasses',
  async (params = {}, thunkApi) => {
    try {
      const response = await classesApi.listClasses(params)
      const rows = response.sessions || []
      return rows.map((r) => normalizeTrainingSessionRow(r))
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchPastSessions = createAsyncThunk(
  'classes/fetchPastSessions',
  async (opts = {}, thunkApi) => {
    try {
      const limit = opts.limit ?? 50
      const response = await classesApi.listClasses({ scope: 'past', limit })
      const rows = response.sessions || []
      return rows.map((r) => normalizeTrainingSessionRow(r))
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchClassRoster = createAsyncThunk(
  'classes/fetchClassRoster',
  async (classId, thunkApi) => {
    try {
      const response = await classesApi.getClassRoster(classId)
      return response.students || response.roster || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayClasses.pending, (state) => {
        state.loadingToday = true
        state.todayError = null
      })
      .addCase(fetchTodayClasses.fulfilled, (state, action) => {
        state.loadingToday = false
        state.today = action.payload
      })
      .addCase(fetchTodayClasses.rejected, (state, action) => {
        state.loadingToday = false
        state.todayError = action.payload || { message: 'Unable to load today classes.' }
      })
      .addCase(fetchUpcomingClasses.pending, (state) => {
        state.loadingUpcoming = true
        state.upcomingError = null
      })
      .addCase(fetchUpcomingClasses.fulfilled, (state, action) => {
        state.loadingUpcoming = false
        state.upcoming = action.payload
      })
      .addCase(fetchUpcomingClasses.rejected, (state, action) => {
        state.loadingUpcoming = false
        state.upcomingError = action.payload || { message: 'Unable to load upcoming classes.' }
      })
      .addCase(fetchPastSessions.pending, (state) => {
        state.loadingPast = true
        state.pastError = null
      })
      .addCase(fetchPastSessions.fulfilled, (state, action) => {
        state.loadingPast = false
        state.pastSessions = action.payload
      })
      .addCase(fetchPastSessions.rejected, (state, action) => {
        state.loadingPast = false
        state.pastError = action.payload || { message: 'Unable to load past sessions.' }
      })
      .addCase(fetchClassRoster.pending, (state) => {
        state.loadingRoster = true
        state.rosterError = null
      })
      .addCase(fetchClassRoster.fulfilled, (state, action) => {
        state.loadingRoster = false
        state.roster = action.payload
      })
      .addCase(fetchClassRoster.rejected, (state, action) => {
        state.loadingRoster = false
        state.rosterError = action.payload || { message: 'Unable to load class roster.' }
      })
  },
})

export default classesSlice.reducer
