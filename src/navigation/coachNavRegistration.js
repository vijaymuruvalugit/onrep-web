/**
 * Coach sidebar metadata — icons resolved in coachNav.jsx (avoids duplicating CNavItem boilerplate per row).
 */
import {
  cilCalendar,
  cilDollar,
  cilLayers,
  cilLocationPin,
  cilMediaPlay,
  cilPeople,
  cilPuzzle,
  cilSpeedometer,
  cilUser,
} from '@coreui/icons'

/** @type {ReadonlyArray<{ name: string, to: string, icon: string[] | Record<string, unknown> }>} */
export const COACH_NAV_REGISTRATION = Object.freeze([
  { name: 'Home', to: '/coach/dashboard', icon: cilSpeedometer },
  /** Plain path (no ?session=) — day board overview; open a session from a card. */
  { name: 'Live sessions', to: { pathname: '/coach/skating', search: '' }, icon: cilMediaPlay },
  { name: 'Batches', to: '/coach/batches', icon: cilLayers },
  { name: 'Schedule', to: '/coach/schedule', icon: cilCalendar },
  { name: 'Students', to: '/coach/students', icon: cilPeople },
  { name: 'Parents', to: '/coach/parents', icon: cilUser },
  { name: 'Places', to: '/coach/places', icon: cilLocationPin },
  { name: 'Academy activities', to: '/coach/activities', icon: cilPuzzle },
  { name: 'Payments', to: '/coach/payments', icon: cilDollar },
])
