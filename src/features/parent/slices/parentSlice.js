import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import parentApi from '../api/parentApi'

const initialState = {
  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,

  scheduleSessions: [],
  scheduleLoading: false,
  scheduleError: null,

  attendance: [],
  attendanceLoading: false,
  attendanceError: null,

  fees: [],
  feesLoading: false,
  feesError: null,

  notifications: [],
  notificationsLoading: false,
  notificationsError: null,

  competitions: [],
  competitionsLoading: false,
  competitionsError: null,

  leaderboard: [],
  leaderboardLoading: false,
  leaderboardError: null,
  leaderboardCompetitionId: null,
}

export const fetchParentDashboard = createAsyncThunk(
  'parent/fetchDashboard',
  async (_, thunkApi) => {
    try {
      return await parentApi.getDashboard()
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentSchedule = createAsyncThunk(
  'parent/fetchSchedule',
  async (params = {}, thunkApi) => {
    try {
      const data = await parentApi.getSchedule(params)
      return data.sessions || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentAttendance = createAsyncThunk(
  'parent/fetchAttendance',
  async (params = {}, thunkApi) => {
    try {
      const data = await parentApi.getAttendance(params)
      return data.attendance || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentFees = createAsyncThunk(
  'parent/fetchFees',
  async (params = {}, thunkApi) => {
    try {
      const data = await parentApi.getFees(params)
      return data.fees || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentNotifications = createAsyncThunk(
  'parent/fetchNotifications',
  async (params = {}, thunkApi) => {
    try {
      const data = await parentApi.getNotifications(params)
      return data.notifications || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentCompetitions = createAsyncThunk(
  'parent/fetchCompetitions',
  async (params = {}, thunkApi) => {
    try {
      const data = await parentApi.getCompetitions(params)
      return data.competitions || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentCompetitionLeaderboard = createAsyncThunk(
  'parent/fetchCompetitionLeaderboard',
  async ({ competitionId, params = {} }, thunkApi) => {
    try {
      const data = await parentApi.getCompetitionLeaderboard(competitionId, params)
      const raw = data.leaderboard ?? data.rows ?? data
      const leaderboard = Array.isArray(raw) ? raw : []
      return { competitionId, leaderboard }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const parentSlice = createSlice({
  name: 'parent',
  initialState,
  reducers: {
    clearParentLeaderboard(state) {
      state.leaderboard = []
      state.leaderboardError = null
      state.leaderboardCompetitionId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParentDashboard.pending, (state) => {
        state.dashboardLoading = true
        state.dashboardError = null
      })
      .addCase(fetchParentDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false
        state.dashboard = action.payload
      })
      .addCase(fetchParentDashboard.rejected, (state, action) => {
        state.dashboardLoading = false
        state.dashboardError = action.payload || { message: 'Unable to load home.' }
      })
      .addCase(fetchParentSchedule.pending, (state) => {
        state.scheduleLoading = true
        state.scheduleError = null
      })
      .addCase(fetchParentSchedule.fulfilled, (state, action) => {
        state.scheduleLoading = false
        state.scheduleSessions = action.payload
      })
      .addCase(fetchParentSchedule.rejected, (state, action) => {
        state.scheduleLoading = false
        state.scheduleError = action.payload || { message: 'Unable to load schedule.' }
      })
      .addCase(fetchParentAttendance.pending, (state) => {
        state.attendanceLoading = true
        state.attendanceError = null
      })
      .addCase(fetchParentAttendance.fulfilled, (state, action) => {
        state.attendanceLoading = false
        state.attendance = action.payload
      })
      .addCase(fetchParentAttendance.rejected, (state, action) => {
        state.attendanceLoading = false
        state.attendanceError = action.payload || { message: 'Unable to load attendance.' }
      })
      .addCase(fetchParentFees.pending, (state) => {
        state.feesLoading = true
        state.feesError = null
      })
      .addCase(fetchParentFees.fulfilled, (state, action) => {
        state.feesLoading = false
        state.fees = action.payload
      })
      .addCase(fetchParentFees.rejected, (state, action) => {
        state.feesLoading = false
        state.feesError = action.payload || { message: 'Unable to load fees.' }
      })
      .addCase(fetchParentNotifications.pending, (state) => {
        state.notificationsLoading = true
        state.notificationsError = null
      })
      .addCase(fetchParentNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false
        state.notifications = action.payload
      })
      .addCase(fetchParentNotifications.rejected, (state, action) => {
        state.notificationsLoading = false
        state.notificationsError = action.payload || { message: 'Unable to load notifications.' }
      })
      .addCase(fetchParentCompetitions.pending, (state) => {
        state.competitionsLoading = true
        state.competitionsError = null
      })
      .addCase(fetchParentCompetitions.fulfilled, (state, action) => {
        state.competitionsLoading = false
        state.competitions = action.payload
      })
      .addCase(fetchParentCompetitions.rejected, (state, action) => {
        state.competitionsLoading = false
        state.competitionsError = action.payload || { message: 'Unable to load competitions.' }
      })
      .addCase(fetchParentCompetitionLeaderboard.pending, (state) => {
        state.leaderboardLoading = true
        state.leaderboardError = null
      })
      .addCase(fetchParentCompetitionLeaderboard.fulfilled, (state, action) => {
        state.leaderboardLoading = false
        state.leaderboardCompetitionId = action.payload.competitionId
        state.leaderboard = action.payload.leaderboard
      })
      .addCase(fetchParentCompetitionLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false
        state.leaderboardError = action.payload || { message: 'Unable to load leaderboard.' }
      })
  },
})

export const { clearParentLeaderboard } = parentSlice.actions
export default parentSlice.reducer
