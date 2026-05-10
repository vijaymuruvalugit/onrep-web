import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { authStorage } from '../../../api/authStorage'
import { authApi } from '../api/authApi'

function extractAuthPayload(responseData = {}) {
  const token =
    responseData?.token ||
    responseData?.accessToken ||
    responseData?.data?.token ||
    responseData?.data?.accessToken ||
    null

  const user = responseData?.user || responseData?.data?.user || responseData?.profile || null
  return { token, user }
}

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(payload)
    return extractAuthPayload(data)
  } catch (error) {
    return rejectWithValue(normalizeApiError(error))
  }
})

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout()
    return true
  } catch (error) {
    return rejectWithValue(normalizeApiError(error))
  }
})

const initialState = {
  user: null,
  token: null,
  status: 'idle',
  loading: false,
  error: null,
  isAuthenticated: false,
  authBlock: null,
  isRestored: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreSession(state) {
      const token = authStorage.getToken()
      const user = authStorage.getUser()
      state.token = token
      state.user = user
      state.isAuthenticated = Boolean(token)
      state.status = token ? 'authenticated' : 'unauthenticated'
      state.loading = false
      state.error = null
      state.authBlock = null
      state.isRestored = true
    },
    forceLogout(state, action) {
      authStorage.clear()
      state.user = null
      state.token = null
      state.status = 'unauthenticated'
      state.loading = false
      state.error = null
      state.isAuthenticated = false
      state.authBlock = action.payload || 'logged_out'
      state.isRestored = true
    },
    clearAuthError(state) {
      state.error = null
      state.authBlock = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'authenticating'
        state.loading = true
        state.error = null
        state.authBlock = null
      })
      .addCase(login.fulfilled, (state, action) => {
        const { token, user } = action.payload
        state.token = token
        state.user = user
        state.loading = false
        state.isAuthenticated = Boolean(token)
        state.status = state.isAuthenticated ? 'authenticated' : 'unauthenticated'
        state.error = null
        state.authBlock = null
        state.isRestored = true
        authStorage.setToken(token)
        authStorage.setUser(user)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.status = 'unauthenticated'
        state.error = action.payload || { message: 'Invalid credentials' }
        state.isAuthenticated = false
        state.token = null
        state.user = null
        state.isRestored = true
      })
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        authStorage.clear()
        state.user = null
        state.token = null
        state.loading = false
        state.status = 'unauthenticated'
        state.error = null
        state.isAuthenticated = false
        state.authBlock = 'logged_out'
        state.isRestored = true
      })
      .addCase(logout.rejected, (state) => {
        authStorage.clear()
        state.user = null
        state.token = null
        state.loading = false
        state.status = 'unauthenticated'
        state.error = null
        state.isAuthenticated = false
        state.authBlock = 'logged_out'
        state.isRestored = true
      })
  },
})

export const { restoreSession, forceLogout, clearAuthError } = authSlice.actions
export default authSlice.reducer
