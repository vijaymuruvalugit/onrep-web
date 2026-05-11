import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import { authStorage } from '../../../api/authStorage'
import { authApi } from '../api/authApi'
import { normalizeOnboardingDtoFromApi } from '../../onboarding/utils/onboardingSteps'
import { persistLastKnownSubscription, clearLastKnownSubscription } from '../lastKnownSubscription'

function syncLastKnownSubscription(user) {
  if (!user) {
    clearLastKnownSubscription()
    return
  }
  const academyName = user.academy?.name || user.academy_name || user.academyName || null
  persistLastKnownSubscription({ subscription: user.subscription || null, academyName })
}

/**
 * Merge `/login` and `/me` extras into the persisted user object (single storage shape).
 * Backend remains source of truth — this only attaches API siblings to `user` for the client.
 */
export function mergeSessionIntoUser(user, session = {}) {
  if (!user) return user
  const next = { ...user }
  if (session.onboarding != null) {
    next.onboarding = normalizeOnboardingDtoFromApi(session.onboarding)
  }
  if (session.subscription != null) next.subscription = session.subscription
  if (session.modules != null) next.modules = session.modules
  if (session.coachSetup != null) next.coachSetup = session.coachSetup
  if (session.payment_url !== undefined) next.payment_url = session.payment_url
  if (session.payment_required_after_verification !== undefined) {
    next.payment_required_after_verification = session.payment_required_after_verification
  }
  if (session.next_action !== undefined) next.next_action = session.next_action
  return next
}

function extractAuthPayload(responseData = {}) {
  const token =
    responseData?.token ||
    responseData?.accessToken ||
    responseData?.data?.token ||
    responseData?.data?.accessToken ||
    null

  const rawUser = responseData?.user || responseData?.data?.user || responseData?.profile || null
  const user = mergeSessionIntoUser(rawUser, {
    onboarding: responseData.onboarding,
    subscription: responseData.subscription,
    modules: responseData.modules,
    coachSetup: responseData.coachSetup,
    payment_url: responseData.payment_url,
    payment_required_after_verification: responseData.payment_required_after_verification,
    next_action: responseData.next_action,
  })
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

/** Refresh user + onboarding/subscription from GET /auth/me (canonical backend state). */
export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.getMe()
      const user = mergeSessionIntoUser(data?.user, {
        onboarding: data?.onboarding,
        subscription: data?.subscription,
        modules: data?.modules,
        coachSetup: data?.coachSetup,
        payment_url: data?.payment_url,
        payment_required_after_verification: data?.payment_required_after_verification,
      })
      return { user }
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

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
      const raw = authStorage.getUser()
      const user =
        raw && raw.onboarding != null
          ? { ...raw, onboarding: normalizeOnboardingDtoFromApi(raw.onboarding) }
          : raw
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
    patchCurrentUser(state, action) {
      if (!state.user) return
      state.user = { ...state.user, ...action.payload }
      authStorage.setUser(state.user)
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
        syncLastKnownSubscription(user)
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
      .addCase(refreshSession.fulfilled, (state, action) => {
        if (action.payload?.user) {
          state.user = action.payload.user
          authStorage.setUser(state.user)
          syncLastKnownSubscription(state.user)
        }
      })
      .addCase(refreshSession.rejected, () => {
        /* 401 handled by http interceptor; avoid clobbering user on transient errors */
      })
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        authStorage.clear()
        clearLastKnownSubscription()
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
        clearLastKnownSubscription()
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

export const { restoreSession, forceLogout, clearAuthError, patchCurrentUser } = authSlice.actions
export default authSlice.reducer
