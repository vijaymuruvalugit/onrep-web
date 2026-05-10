/**
 * Redux Store Configuration
 *
 * Simple Redux store managing global application state.
 * Handles sidebar visibility and theme preferences.
 *
 * @module store
 */

import { configureStore } from '@reduxjs/toolkit'
import { bindHttpAuth } from './api/http'
import authReducer, { forceLogout } from './features/auth/slices/authSlice'
import uiReducer from './features/ui/uiSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
})

bindHttpAuth({
  store,
  forceLogout,
})

export default store
