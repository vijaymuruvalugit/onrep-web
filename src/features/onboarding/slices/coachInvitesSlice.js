import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import coachInvitesApi from '../api/coachInvitesApi'
import academyCoachesApi from '../api/academyCoachesApi'

const initialState = {
  invites: [],
  staff: [],
  staffLoading: false,
  staffError: null,
  adminActionLoadingId: null,
  adminActionError: null,
  listLoading: false,
  listError: null,
  submitLoading: false,
  submitError: null,
  submitSuccess: false,
  lastInviteResponse: null,
  revokeLoadingId: null,
  revokeError: null,
  resendLoadingId: null,
  resendError: null,
  resendSuccess: false,
}

export const fetchCoachInvites = createAsyncThunk('coachInvites/fetchList', async (_, thunkApi) => {
  try {
    const data = await coachInvitesApi.listCoachInvites()
    return data.invites || []
  } catch (error) {
    return thunkApi.rejectWithValue(normalizeApiError(error))
  }
})

export const createCoachInvite = createAsyncThunk(
  'coachInvites/create',
  async ({ email, name, phoneNumber }, thunkApi) => {
    try {
      const data = await coachInvitesApi.postCoachInvite({ email, name, phoneNumber })
      return data
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const revokeCoachInviteThunk = createAsyncThunk(
  'coachInvites/revoke',
  async (userId, thunkApi) => {
    try {
      await coachInvitesApi.revokeCoachInvite(userId)
      return userId
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchAcademyStaff = createAsyncThunk('coachInvites/fetchStaff', async (_, thunkApi) => {
  try {
    const data = await academyCoachesApi.listCoaches()
    return data.coaches || []
  } catch (error) {
    return thunkApi.rejectWithValue(normalizeApiError(error))
  }
})

export const grantCoachAdminThunk = createAsyncThunk(
  'coachInvites/grantAdmin',
  async (userId, thunkApi) => {
    try {
      await academyCoachesApi.grantAdmin(userId)
      return userId
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const revokeCoachAdminThunk = createAsyncThunk(
  'coachInvites/revokeAdmin',
  async (userId, thunkApi) => {
    try {
      await academyCoachesApi.revokeAdmin(userId)
      return userId
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const resendCoachInviteThunk = createAsyncThunk(
  'coachInvites/resend',
  async (userId, thunkApi) => {
    try {
      const data = await coachInvitesApi.resendCoachInvite(userId)
      return { userId, ...data }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const coachInvitesSlice = createSlice({
  name: 'coachInvites',
  initialState,
  reducers: {
    clearCoachInviteSubmitState(state) {
      state.submitError = null
      state.submitSuccess = false
      state.lastInviteResponse = null
    },
    clearCoachInviteRevokeError(state) {
      state.revokeError = null
    },
    clearCoachInviteResendState(state) {
      state.resendError = null
      state.resendSuccess = false
    },
    clearCoachAdminActionError(state) {
      state.adminActionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoachInvites.pending, (state) => {
        state.listLoading = true
        state.listError = null
      })
      .addCase(fetchCoachInvites.fulfilled, (state, action) => {
        state.listLoading = false
        state.invites = action.payload
      })
      .addCase(fetchCoachInvites.rejected, (state, action) => {
        state.listLoading = false
        state.listError = action.payload || { message: 'Unable to load coach invites.' }
      })
      .addCase(createCoachInvite.pending, (state) => {
        state.submitLoading = true
        state.submitError = null
        state.submitSuccess = false
        state.lastInviteResponse = null
      })
      .addCase(createCoachInvite.fulfilled, (state, action) => {
        state.submitLoading = false
        state.submitSuccess = true
        state.lastInviteResponse = action.payload
      })
      .addCase(createCoachInvite.rejected, (state, action) => {
        state.submitLoading = false
        state.submitError = action.payload || { message: 'Unable to send invite.' }
      })
      .addCase(revokeCoachInviteThunk.pending, (state, action) => {
        state.revokeLoadingId = action.meta.arg
        state.revokeError = null
      })
      .addCase(revokeCoachInviteThunk.fulfilled, (state) => {
        state.revokeLoadingId = null
      })
      .addCase(revokeCoachInviteThunk.rejected, (state, action) => {
        state.revokeLoadingId = null
        state.revokeError = action.payload || { message: 'Unable to revoke invite.' }
      })
      .addCase(resendCoachInviteThunk.pending, (state, action) => {
        state.resendLoadingId = action.meta.arg
        state.resendError = null
        state.resendSuccess = false
      })
      .addCase(resendCoachInviteThunk.fulfilled, (state) => {
        state.resendLoadingId = null
        state.resendSuccess = true
      })
      .addCase(resendCoachInviteThunk.rejected, (state, action) => {
        state.resendLoadingId = null
        state.resendError = action.payload || { message: 'Unable to resend invite.' }
      })
      .addCase(fetchAcademyStaff.pending, (state) => {
        state.staffLoading = true
        state.staffError = null
      })
      .addCase(fetchAcademyStaff.fulfilled, (state, action) => {
        state.staffLoading = false
        state.staff = action.payload
      })
      .addCase(fetchAcademyStaff.rejected, (state, action) => {
        state.staffLoading = false
        state.staffError = action.payload || { message: 'Unable to load staff.' }
      })
      .addCase(grantCoachAdminThunk.pending, (state, action) => {
        state.adminActionLoadingId = action.meta.arg
        state.adminActionError = null
      })
      .addCase(grantCoachAdminThunk.fulfilled, (state, action) => {
        state.adminActionLoadingId = null
        const id = action.payload
        const row = state.staff.find((s) => s.id === id)
        if (row) row.isAcademyAdmin = true
      })
      .addCase(grantCoachAdminThunk.rejected, (state, action) => {
        state.adminActionLoadingId = null
        state.adminActionError = action.payload || { message: 'Unable to grant admin.' }
      })
      .addCase(revokeCoachAdminThunk.pending, (state, action) => {
        state.adminActionLoadingId = action.meta.arg
        state.adminActionError = null
      })
      .addCase(revokeCoachAdminThunk.fulfilled, (state, action) => {
        state.adminActionLoadingId = null
        const id = action.payload
        const row = state.staff.find((s) => s.id === id)
        if (row) row.isAcademyAdmin = false
      })
      .addCase(revokeCoachAdminThunk.rejected, (state, action) => {
        state.adminActionLoadingId = null
        state.adminActionError = action.payload || { message: 'Unable to revoke admin.' }
      })
  },
})

export const {
  clearCoachInviteSubmitState,
  clearCoachInviteRevokeError,
  clearCoachInviteResendState,
  clearCoachAdminActionError,
} = coachInvitesSlice.actions
export default coachInvitesSlice.reducer
