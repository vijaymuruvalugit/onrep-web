import React from 'react'
import { Navigate } from 'react-router-dom'

import { ONREP_ROUTE_DEFS } from '../routePaths'
import { DASHBOARD_PAGES } from './dashboardPagesRegistration'

const PlaceholderPage = React.lazy(() => import('../views/placeholders/PlaceholderPage'))

function RedirectCoachHome() {
  return React.createElement(Navigate, { to: '/coach/dashboard', replace: true })
}

function RedirectParentHome() {
  return React.createElement(Navigate, { to: '/parent/home', replace: true })
}

function RedirectStudentHome() {
  return React.createElement(Navigate, { to: '/student/home', replace: true })
}

const redirectRoutes = [
  { path: '/coach', name: 'Coach', element: RedirectCoachHome },
  { path: '/parent', name: 'Parent', element: RedirectParentHome },
  { path: '/student', name: 'Student', element: RedirectStudentHome },
]

const placeholderRoutes = ONREP_ROUTE_DEFS.filter(
  (definition) => !['/coach', '/parent', '/student'].includes(definition.path),
).map((definition) => ({
  path: definition.path,
  name: definition.name,
  exact: definition.exact,
  element: DASHBOARD_PAGES[definition.path] ?? PlaceholderPage,
}))

export const protectedRoutes = [...redirectRoutes, ...placeholderRoutes]

export default protectedRoutes
