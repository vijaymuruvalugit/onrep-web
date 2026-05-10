/**
 * Canonical paths and breadcrumb names for OnRep (aligned with ezyplay-frontend flows).
 * Kept separate from routes.jsx to avoid circular imports with PlaceholderPage.
 */

export const ONREP_ROUTE_DEFS = [
  // Coach area redirects
  { path: '/coach', name: 'Coach', exact: true },
  { path: '/parent', name: 'Parent', exact: true },
  { path: '/student', name: 'Student', exact: true },

  // Coach — mirrors CoachTabs + CoachHomeStack + CoachAcademyMenu + Skating stack
  { path: '/coach/dashboard', name: 'Dashboard', exact: true },
  { path: '/coach/students', name: 'Students', exact: true },
  { path: '/coach/payments', name: 'Manual Payments', exact: true },
  { path: '/coach/sessions', name: 'Classes', exact: true },
  { path: '/coach/sessions/new', name: 'Create Class', exact: true },
  { path: '/coach/sessions/detail', name: 'Session', exact: true },
  { path: '/coach/batches', name: 'Batches', exact: true },
  { path: '/coach/batches/recurring', name: 'Batch Schedules', exact: true },
  { path: '/coach/attendance/session', name: 'Session Attendance', exact: true },
  { path: '/coach/attendance/history', name: 'Attendance History', exact: true },
  { path: '/coach/training', name: 'Training', exact: true },
  { path: '/coach/skating', name: 'Skating', exact: true },
  { path: '/coach/skating/skills', name: 'Skills', exact: true },
  { path: '/coach/skating/races', name: 'Races', exact: true },
  { path: '/coach/manage', name: 'Manage', exact: true },
  { path: '/coach/coaches', name: 'Coaches', exact: true },
  { path: '/coach/parents', name: 'Parents', exact: true },
  { path: '/coach/activities', name: 'Activities', exact: true },
  { path: '/coach/places', name: 'Places', exact: true },
  { path: '/coach/onboarding/getting-started', name: 'Getting Started', exact: true },
  { path: '/coach/onboarding/fee-collection', name: 'Fee Collection', exact: true },
  { path: '/coach/reports/revenue', name: 'Revenue Overview', exact: true },
  { path: '/coach/reports/operations', name: 'Operations Reports', exact: true },
  { path: '/coach/billing', name: 'Billing', exact: true },
  { path: '/coach/settings', name: 'Settings', exact: true },

  // Parent — mirrors ParentTabs + ParentStack
  { path: '/parent/home', name: 'Home', exact: true },
  { path: '/parent/schedule', name: 'Schedule', exact: true },
  { path: '/parent/attendance', name: 'Attendance', exact: true },
  { path: '/parent/fees', name: 'Fees', exact: true },
  { path: '/parent/competitions', name: 'Competitions', exact: true },
  { path: '/parent/competitions/leaderboard', name: 'Leaderboard', exact: true },
  { path: '/parent/notifications', name: 'Notifications', exact: true },
  { path: '/parent/payments/history', name: 'Payment History', exact: true },
  { path: '/parent/profile', name: 'Profile', exact: true },

  // Student — mirrors StudentTabs
  { path: '/student/home', name: 'Home', exact: true },
  { path: '/student/schedule', name: 'Schedule', exact: true },
  { path: '/student/attendance', name: 'Attendance', exact: true },
  { path: '/student/progress', name: 'Progress', exact: true },
  { path: '/student/competitions', name: 'Competitions', exact: true },
  { path: '/student/competitions/leaderboard', name: 'Leaderboard', exact: true },
  { path: '/student/notifications', name: 'Notifications', exact: true },
  { path: '/student/profile', name: 'Profile', exact: true },
]
