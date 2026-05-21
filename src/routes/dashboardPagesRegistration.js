/**
 * Single registration list for lazy dashboard pages — builds DASHBOARD_PAGES map.
 */
import React from 'react'

const CoachAreaDashboardPage = React.lazy(
  () => import('../features/coach/pages/CoachAreaDashboardPage'),
)
const ParentHomePage = React.lazy(() => import('../features/parent/pages/ParentHomePage'))
const ParentSchedulePage = React.lazy(() => import('../features/parent/pages/ParentSchedulePage'))
const ParentAttendancePage = React.lazy(
  () => import('../features/parent/pages/ParentAttendancePage'),
)
const ParentFeesPage = React.lazy(() => import('../features/parent/pages/ParentFeesPage'))
const ParentPaymentHistoryPage = React.lazy(
  () => import('../features/payments/pages/ParentPaymentHistoryPage'),
)
const CoachPaymentsPage = React.lazy(() => import('../features/payments/pages/CoachPaymentsPage'))
const BillingPage = React.lazy(() => import('../features/payments/pages/BillingPage'))
const PaywallPage = React.lazy(() => import('../features/payments/pages/PaywallPage'))
const PaymentSettingsPage = React.lazy(
  () => import('../features/payments/pages/PaymentSettingsPage'),
)
const PayoutDetailsPage = React.lazy(
  () => import('../features/payments/pages/PayoutDetailsPage'),
)
const OpsWebhooksPage = React.lazy(() => import('../features/payments/pages/OpsWebhooksPage'))
const OpsCollectionsPage = React.lazy(
  () => import('../features/payments/pages/OpsCollectionsPage'),
)
const OpsSettlementsPage = React.lazy(
  () => import('../features/payments/pages/OpsSettlementsPage'),
)
const ParentNotificationsPage = React.lazy(
  () => import('../features/parent/pages/ParentNotificationsPage'),
)
const ParentProfilePage = React.lazy(() => import('../features/parent/pages/ParentProfilePage'))
const ParentCompetitionsPage = React.lazy(
  () => import('../features/parent/pages/ParentCompetitionsPage'),
)
const ParentCompetitionLeaderboardPage = React.lazy(
  () => import('../features/parent/pages/ParentCompetitionLeaderboardPage'),
)
const StudentDashboard = React.lazy(() => import('../views/dashboard/onrep/StudentDashboard'))
const StudentsListPage = React.lazy(() => import('../features/students/pages/StudentsListPage'))
const StudentCreatePage = React.lazy(() => import('../features/students/pages/StudentCreatePage'))
const StudentImportPage = React.lazy(() => import('../features/students/pages/StudentImportPage'))
const StudentDetailPage = React.lazy(() => import('../features/students/pages/StudentDetailPage'))
const StudentEditPage = React.lazy(() => import('../features/students/pages/StudentEditPage'))
const BatchesListPage = React.lazy(() => import('../features/batches/pages/BatchesListPage'))
const BatchWorkspacePage = React.lazy(() => import('../features/batches/pages/BatchWorkspacePage'))
const SchedulePage = React.lazy(() => import('../features/schedule/pages/SchedulePage'))
const UpcomingClassesPage = React.lazy(
  () => import('../features/classes/pages/UpcomingClassesPage'),
)
const AttendanceDashboardPage = React.lazy(
  () => import('../features/attendance/pages/AttendanceDashboardPage'),
)
const AttendanceEntryPage = React.lazy(
  () => import('../features/attendance/pages/AttendanceEntryPage'),
)
const PlacesListPage = React.lazy(() => import('../features/places/pages/PlacesListPage'))
const PlaceCreatePage = React.lazy(() => import('../features/places/pages/PlaceCreatePage'))
const PlaceDetailPage = React.lazy(() => import('../features/places/pages/PlaceDetailPage'))
const PlaceEditPage = React.lazy(() => import('../features/places/pages/PlaceEditPage'))
const ParentsOverviewPage = React.lazy(() => import('../features/coach/pages/ParentsOverviewPage'))
const CoachInvitesPage = React.lazy(() => import('../features/onboarding/pages/CoachInvitesPage'))
const OnboardingSetupPage = React.lazy(
  () => import('../features/onboarding/pages/OnboardingSetupPage'),
)
const OnboardingCompletePage = React.lazy(
  () => import('../features/onboarding/pages/OnboardingCompletePage'),
)
const ManageActivitiesPage = React.lazy(
  () => import('../features/activities/pages/ManageActivitiesPage'),
)
const SkatingOpsPage = React.lazy(() => import('../features/skating/pages/SkatingOpsPage'))
const SkatingIntelligenceSettingsPage = React.lazy(
  () => import('../features/skating/pages/SkatingIntelligenceSettingsPage'),
)
const CoachOpsSessionRedirectPage = React.lazy(
  () => import('../features/skating/pages/CoachOpsSessionRedirectPage'),
)

/** @type {ReadonlyArray<{ path: string, component: React.LazyExoticComponent<React.ComponentType<any>> }>} */
export const DASHBOARD_PAGE_REGISTRATION = Object.freeze([
  { path: '/coach/dashboard', component: CoachAreaDashboardPage },
  { path: '/coach/skating', component: SkatingOpsPage },
  { path: '/coach/skating/intelligence', component: SkatingIntelligenceSettingsPage },
  { path: '/coach/ops/sessions/:sessionId', component: CoachOpsSessionRedirectPage },
  { path: '/coach/batches', component: BatchesListPage },
  { path: '/coach/batches/:batchId', component: BatchWorkspacePage },
  { path: '/coach/schedule', component: SchedulePage },
  { path: '/coach/classes/upcoming', component: UpcomingClassesPage },
  { path: '/coach/attendance', component: AttendanceDashboardPage },
  { path: '/coach/attendance/class/:classId', component: AttendanceEntryPage },
  { path: '/coach/students', component: StudentsListPage },
  { path: '/coach/students/import', component: StudentImportPage },
  { path: '/coach/students/new', component: StudentCreatePage },
  { path: '/coach/students/:studentId', component: StudentDetailPage },
  { path: '/coach/students/:studentId/edit', component: StudentEditPage },
  { path: '/coach/places', component: PlacesListPage },
  { path: '/coach/places/new', component: PlaceCreatePage },
  { path: '/coach/places/:placeId', component: PlaceDetailPage },
  { path: '/coach/places/:placeId/edit', component: PlaceEditPage },
  { path: '/coach/parents', component: ParentsOverviewPage },
  { path: '/coach/activities', component: ManageActivitiesPage },
  { path: '/coach/payments', component: CoachPaymentsPage },
  { path: '/coach/payments/settings', component: PaymentSettingsPage },
  { path: '/coach/payments/payout-details', component: PayoutDetailsPage },
  { path: '/coach/billing', component: BillingPage },
  { path: '/coach/billing/paywall', component: PaywallPage },
  { path: '/ops/webhooks', component: OpsWebhooksPage },
  { path: '/ops/collections', component: OpsCollectionsPage },
  { path: '/ops/settlements', component: OpsSettlementsPage },
  { path: '/coach/onboarding/coaches', component: CoachInvitesPage },
  { path: '/onboarding/setup', component: OnboardingSetupPage },
  { path: '/onboarding/complete', component: OnboardingCompletePage },
  { path: '/parent/home', component: ParentHomePage },
  { path: '/parent/schedule', component: ParentSchedulePage },
  { path: '/parent/attendance', component: ParentAttendancePage },
  { path: '/parent/fees', component: ParentFeesPage },
  { path: '/parent/payments/history', component: ParentPaymentHistoryPage },
  { path: '/parent/notifications', component: ParentNotificationsPage },
  { path: '/parent/profile', component: ParentProfilePage },
  { path: '/parent/competitions', component: ParentCompetitionsPage },
  {
    path: '/parent/competitions/:competitionId/leaderboard',
    component: ParentCompetitionLeaderboardPage,
  },
  { path: '/student/home', component: StudentDashboard },
])

export const DASHBOARD_PAGES = Object.freeze(
  Object.fromEntries(DASHBOARD_PAGE_REGISTRATION.map(({ path, component }) => [path, component])),
)
