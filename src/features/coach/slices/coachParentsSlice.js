import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import coachParentsApi from '../api/coachParentsApi'

const initialState = {
  parents: [],
  loading: false,
  error: null,
  resendLoadingId: null,
  revokeLoadingId: null,
  actionError: null,
}

export const fetchCoachParentsOverview = createAsyncThunk(
  'coachParents/fetchOverview',
  async (params = {}, thunkApi) => {
    try {
      const data = await coachParentsApi.getOverview(params)
      return data.parents || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const resendCoachParentInvite = createAsyncThunk(
  'coachParents/resendInvite',
  async ({ inviteId, expiresInDays }, thunkApi) => {
    try {
      await coachParentsApi.resendParentInvite(inviteId, { expiresInDays })
      return inviteId
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const revokeCoachParentInvite = createAsyncThunk(
  'coachParents/revokeInvite',
  async (inviteId, thunkApi) => {
    try {
      await coachParentsApi.revokeParentInvite(inviteId)
      return inviteId
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const coachParentsSlice = createSlice({
  name: 'coachParents',
  initialState,
  reducers: {
    clearCoachParentsActionError(state) {
      state.actionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoachParentsOverview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCoachParentsOverview.fulfilled, (state, action) => {
        state.loading = false
        state.parents = action.payload
      })
      .addCase(fetchCoachParentsOverview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || { message: 'Unable to load parents.' }
      })
      .addCase(resendCoachParentInvite.pending, (state, action) => {
        state.resendLoadingId = action.meta.arg.inviteId
        state.actionError = null
      })
      .addCase(resendCoachParentInvite.fulfilled, (state) => {
        state.resendLoadingId = null
      })
      .addCase(resendCoachParentInvite.rejected, (state, action) => {
        state.resendLoadingId = null
        state.actionError = action.payload || { message: 'Resend failed.' }
      })
      .addCase(revokeCoachParentInvite.pending, (state, action) => {
        state.revokeLoadingId = action.meta.arg
        state.actionError = null
      })
      .addCase(revokeCoachParentInvite.fulfilled, (state) => {
        state.revokeLoadingId = null
      })
      .addCase(revokeCoachParentInvite.rejected, (state, action) => {
        state.revokeLoadingId = null
        state.actionError = action.payload || { message: 'Revoke failed.' }
      })
  },
})

export const { clearCoachParentsActionError } = coachParentsSlice.actions
export default coachParentsSlice.reducer
