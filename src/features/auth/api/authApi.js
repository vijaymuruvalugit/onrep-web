import http from '../../../api/http'

const AUTH_ENDPOINTS = {
  login: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/auth/login',
  logout: import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/auth/logout',
  signup: import.meta.env.VITE_AUTH_SIGNUP_ENDPOINT || '/auth/signup',
  me: import.meta.env.VITE_AUTH_ME_ENDPOINT || '/auth/me',
  forgotPassword: import.meta.env.VITE_AUTH_FORGOT_PASSWORD_ENDPOINT || '/auth/forgot-password',
  resetPassword: import.meta.env.VITE_AUTH_RESET_PASSWORD_ENDPOINT || '/auth/reset-password',
  verifyEmail: import.meta.env.VITE_AUTH_VERIFY_EMAIL_ENDPOINT || '/auth/verify-email',
  resendVerification:
    import.meta.env.VITE_AUTH_RESEND_VERIFICATION_ENDPOINT || '/auth/resend-verification-email',
  completeCoachInvite: '/auth/complete-coach-invite',
  completeParentInvite: '/auth/complete-parent-invite',
  parentInvitePreview: '/auth/parent-invite-preview',
}

export const authApi = {
  login(payload) {
    return http.post(AUTH_ENDPOINTS.login, payload)
  },
  /** Canonical academy + owner creation — matches `ezyplay-backend` POST /auth/signup. */
  signup(payload) {
    return http.post(AUTH_ENDPOINTS.signup, payload)
  },
  /** Authenticated session refresh — matches GET /auth/me. */
  getMe() {
    return http.get(AUTH_ENDPOINTS.me)
  },
  logout(payload) {
    return http.post(AUTH_ENDPOINTS.logout, payload || {})
  },
  forgotPassword(payload) {
    return http.post(AUTH_ENDPOINTS.forgotPassword, payload)
  },
  resetPassword(payload) {
    return http.post(AUTH_ENDPOINTS.resetPassword, payload)
  },
  verifyEmail(payload) {
    return http.post(AUTH_ENDPOINTS.verifyEmail, payload)
  },
  resendVerification(payload) {
    return http.post(AUTH_ENDPOINTS.resendVerification, payload)
  },
  completeCoachInvite(payload) {
    return http.post(AUTH_ENDPOINTS.completeCoachInvite, payload)
  },
  completeParentInvite(payload) {
    return http.post(AUTH_ENDPOINTS.completeParentInvite, payload)
  },
  parentInvitePreview(code) {
    return http.get(AUTH_ENDPOINTS.parentInvitePreview, { params: { code } })
  },
}

export default authApi
