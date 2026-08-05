import http from '../../../api/http'

/**
 * Academy onboarding — matches `onrep-backend/src/routes/onboarding.js`.
 */
export const onboardingApi = {
  async getStatus() {
    const { data } = await http.get('/onboarding/status')
    return data || {}
  },

  /** Owner-only: `module` is `MANUAL` | `AUTOMATED`. */
  async setPaymentModule(module) {
    const { data } = await http.post('/onboarding/payment-module', { module })
    return data || {}
  },

  /**
   * Owner-only fee collection setup — matches POST /onboarding/payment-setup.
   * One-shot: `{ module, upiVpa }` for Manual / Online+UPI.
   * Online+bank: `{ module: 'AUTOMATED' }` then PUT /academy/bank-account.
   */
  async postPaymentSetup(payload = {}) {
    const { data } = await http.post('/onboarding/payment-setup', payload)
    return data || {}
  },
}

export default onboardingApi
