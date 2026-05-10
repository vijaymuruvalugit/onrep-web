import http from '../../../api/http'

const AUTH_ENDPOINTS = {
  login: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/auth/login',
  logout: import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/auth/logout',
  forgotPassword: import.meta.env.VITE_AUTH_FORGOT_PASSWORD_ENDPOINT || '/auth/forgot-password',
  resetPassword: import.meta.env.VITE_AUTH_RESET_PASSWORD_ENDPOINT || '/auth/reset-password',
  verifyEmail: import.meta.env.VITE_AUTH_VERIFY_EMAIL_ENDPOINT || '/auth/verify-email',
  resendVerification:
    import.meta.env.VITE_AUTH_RESEND_VERIFICATION_ENDPOINT || '/auth/resend-verification',
}

export const authApi = {
  login(payload) {
    return http.post(AUTH_ENDPOINTS.login, payload)
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
}

export default authApi
