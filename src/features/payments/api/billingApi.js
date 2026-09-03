import http from '../../../api/http'

/**
 * Web-only billing surface (Phase 2.1).
 * Mobile clients must NEVER hit `/billing/*` — payments originate from the web
 * control plane.
 */
export const billingApi = {
  async getPlans() {
    const { data } = await http.get('/billing/plans')
    return Array.isArray(data) ? data : []
  },
  async createLink({ plan, next } = {}) {
    const body = { plan }
    if (typeof next === 'string' && next.startsWith('/')) body.next = next.slice(0, 256)
    const { data } = await http.post('/billing/create-link', body)
    return data || null
  },
  async getPayments({ limit = 12 } = {}) {
    const { data } = await http.get('/billing/payments', { params: { limit } })
    return data?.payments || []
  },
}

export default billingApi
