import http from '../../../api/http'

/**
 * Owner-facing payment-settings + bank-account API (Phase 1.4 + 5.1).
 *
 * UI rule: never freestyle copy from server-returned readiness strings.
 * Switch on the typed code (`CHECKOUT_READINESS_REASONS`) only.
 */
export const paymentSettingsApi = {
  async getSettings() {
    const { data } = await http.get('/academy/payment-settings')
    return data || null
  },
  async updateSettings(patch) {
    const { data } = await http.put('/academy/payment-settings', patch)
    return data || null
  },
  async refreshReadiness() {
    const { data } = await http.post('/academy/payment-settings/refresh-readiness')
    return data?.readiness || null
  },
  async getBankAccount() {
    const { data } = await http.get('/academy/bank-account')
    return data?.bank_account || null
  },
  async saveBankAccount(payload) {
    const { data } = await http.put('/academy/bank-account', payload)
    return data?.bank_account || null
  },
}

export default paymentSettingsApi
