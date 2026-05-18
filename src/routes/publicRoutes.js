import React from 'react'

const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage'))
const OnboardingLandingPage = React.lazy(() => import('../features/onboarding/pages/OnboardingLandingPage'))
const CreateAcademyPage = React.lazy(() => import('../features/onboarding/pages/CreateAcademyPage'))
const ForgotPasswordPage = React.lazy(() => import('../features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = React.lazy(() => import('../features/auth/pages/ResetPasswordPage'))
const VerifyEmailPage = React.lazy(() => import('../features/auth/pages/VerifyEmailPage'))
const AcceptCoachInvitePage = React.lazy(() => import('../features/auth/pages/AcceptCoachInvitePage'))
const AcceptParentInvitePage = React.lazy(() => import('../features/auth/pages/AcceptParentInvitePage'))
const Page404 = React.lazy(() => import('../views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('../views/pages/page500/Page500'))

export const publicRoutes = [
  { path: '/onboarding', name: 'Onboarding', element: OnboardingLandingPage },
  { path: '/onboarding/create-academy', name: 'Create Academy', element: CreateAcademyPage },
  { path: '/auth/login', name: 'Login', element: LoginPage },
  { path: '/auth/forgot-password', name: 'Forgot Password', element: ForgotPasswordPage },
  { path: '/auth/reset-password', name: 'Reset Password', element: ResetPasswordPage },
  { path: '/auth/reset-password/:token', name: 'Reset Password', element: ResetPasswordPage },
  { path: '/auth/verify-email', name: 'Verify Email', element: VerifyEmailPage },
  { path: '/auth/verify-email/:token', name: 'Verify Email', element: VerifyEmailPage },
  { path: '/accept-invite', name: 'Accept Coach Invite', element: AcceptCoachInvitePage },
  { path: '/accept-parent-invite', name: 'Accept Parent Invite', element: AcceptParentInvitePage },
  { path: '/404', name: '404', element: Page404 },
  { path: '/500', name: '500', element: Page500 },
  { path: '/login', name: 'Legacy Login Redirect', element: LoginPage },
]

export default publicRoutes
