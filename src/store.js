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
import attendanceReducer from './features/attendance/slices/attendanceSlice'
import placesReducer from './features/places/slices/placesSlice'
import parentReducer from './features/parent/slices/parentSlice'
import coachParentsReducer from './features/coach/slices/coachParentsSlice'
import coachInvitesReducer from './features/onboarding/slices/coachInvitesSlice'
import paymentsReducer from './features/payments/slices/paymentsSlice'

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
    attendance: attendanceReducer,
    places: placesReducer,
    parent: parentReducer,
    coachParents: coachParentsReducer,
    coachInvites: coachInvitesReducer,
    payments: paymentsReducer,
  },
})

bindHttpAuth({
  store,
  forceLogout,
})

registerActivityForbiddenHandler(() => {
  store.dispatch(
    setWorkspaceFault({
      code: 'activity_forbidden',
      message:
        'You can’t use this activity workspace anymore (inactive, removed, or no access). Pick another workspace.',
      clearPersistence: true,
    }),
  )
})

export default store
