import React from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/slices/authSlice'
import workspaceReducer from '../features/workspace/slices/workspaceSlice'
import studentsReducer from '../features/students/slices/studentsSlice'
import studentParentsReducer from '../features/students/slices/studentParentsSlice'
import uiReducer from '../features/ui/uiSlice'
import batchesReducer from '../features/batches/slices/batchesSlice'
import scheduleReducer from '../features/schedule/slices/scheduleSlice'
import classesReducer from '../features/classes/slices/classesSlice'
import attendanceReducer from '../features/attendance/slices/attendanceSlice'
import placesReducer from '../features/places/slices/placesSlice'
import parentReducer from '../features/parent/slices/parentSlice'
import coachParentsReducer from '../features/coach/slices/coachParentsSlice'
import coachInvitesReducer from '../features/onboarding/slices/coachInvitesSlice'
import paymentsReducer from '../features/payments/slices/paymentsSlice'

const rootReducer = {
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
}

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

/**
 * RTL helper: same reducer shape as production store.
 * @param {React.ReactElement} ui
 * @param {{ store?: import('@reduxjs/toolkit').EnhancedStore, route?: string, initialEntries?: string[] }} options
 */
export function renderWithProviders(ui, options = {}) {
  const { store = createTestStore(), route = '/', initialEntries } = options
  const entries = initialEntries ?? [route]
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>
      </Provider>,
    ),
  }
}
