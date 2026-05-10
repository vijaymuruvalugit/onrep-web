import React from 'react'

const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage'))
const ForgotPasswordPage = React.lazy(() => import('../features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = React.lazy(() => import('../features/auth/pages/ResetPasswordPage'))
const VerifyEmailPage = React.lazy(() => import('../features/auth/pages/VerifyEmailPage'))
const Page404 = React.lazy(() => import('../views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('../views/pages/page500/Page500'))

export const publicRoutes = [
  { path: '/auth/login', name: 'Login', element: LoginPage },
  { path: '/auth/forgot-password', name: 'Forgot Password', element: ForgotPasswordPage },
  { path: '/auth/reset-password', name: 'Reset Password', element: ResetPasswordPage },
  { path: '/auth/reset-password/:token', name: 'Reset Password', element: ResetPasswordPage },
  { path: '/auth/verify-email', name: 'Verify Email', element: VerifyEmailPage },
  { path: '/auth/verify-email/:token', name: 'Verify Email', element: VerifyEmailPage },
  { path: '/404', name: '404', element: Page404 },
  { path: '/500', name: '500', element: Page500 },
  { path: '/login', name: 'Legacy Login Redirect', element: LoginPage },
]

export default publicRoutes
