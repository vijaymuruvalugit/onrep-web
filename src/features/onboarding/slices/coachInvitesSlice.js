import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import coachInvitesApi from '../api/coachInvitesApi'

const initialState = {
  invites: [],
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
  async ({ email, name }, thunkApi) => {
    try {
      const data = await coachInvitesApi.postCoachInvite({ email, name })
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
  },
})

export const { clearCoachInviteSubmitState, clearCoachInviteRevokeError, clearCoachInviteResendState } =
  coachInvitesSlice.actions
export default coachInvitesSlice.reducer
