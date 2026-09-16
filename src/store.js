/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit'
import { bindHttpAuth, registerActivityForbiddenHandler } from './api/http'
import authReducer, { forceLogout } from './features/auth/slices/authSlice'
import workspaceReducer, { setWorkspaceFault } from './features/workspace/slices/workspaceSlice'
import studentsReducer from './features/students/slices/studentsSlice'
import studentParentsReducer from './features/students/slices/studentParentsSlice'
import uiReducer from './features/ui/uiSlice'
import batchesReducer from './features/batches/slices/batchesSlice'
import scheduleReducer from './features/schedule/slices/scheduleSlice'
import classesReducer from './features/classes/slices/classesSlice'
import placesReducer from './features/places/slices/placesSlice'
import parentReducer from './features/parent/slices/parentSlice'
import coachParentsReducer from './features/coach/slices/coachParentsSlice'
import coachInvitesReducer from './features/onboarding/slices/coachInvitesSlice'
import paymentsReducer from './features/payments/slices/paymentsSlice'
import eventsReducer from './features/events/slices/eventsSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    students: studentsReducer,
    studentParents: studentParentsReducer,
    ui: uiReducer,
    batches: batchesReducer,
    schedule: scheduleReducer,
    classes: classesReducer,
    places: placesReducer,
    parent: parentReducer,
    coachParents: coachParentsReducer,
    coachInvites: coachInvitesReducer,
    payments: paymentsReducer,
    events: eventsReducer,
  },
})

bindHttpAuth({
  store,
  forceLogout,
})

registerActivityForbiddenHandler((errorBody) => {
  const raw = String(errorBody?.error || errorBody?.message || '')
  const msg = raw.toLowerCase()
  const capabilityDenied = msg.includes('capability')
  store.dispatch(
    setWorkspaceFault({
      code: capabilityDenied ? 'activity_capability' : 'activity_forbidden',
      message: capabilityDenied
        ? 'This screen is for Skating. Switch to Skating in the header, or use Home / Batches for Music.'
        : 'You can’t use this activity workspace anymore (inactive, removed, or no access). Pick another workspace.',
      // Capability mismatch must not wipe Music (or other) selection — only true access loss does.
      clearPersistence: !capabilityDenied,
    }),
  )
})

export default store
