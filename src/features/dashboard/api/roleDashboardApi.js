import http from '../../../api/http'

/**
 * Role-aware dashboard APIs (`onrep-backend/src/routes/dashboard.js`).
 * Distinct from {@link ../payments/api/dashboardApi} which wraps legacy `/dashboard/summary` (payment KPIs only).
 */
const roleDashboardApi = {
  async getOwnerSummary(params = {}) {
    const { data } = await http.get('/dashboard/owner-summary', { params })
    return data || {}
  },

  async getOwnerOperations(params = {}) {
    const { data } = await http.get('/dashboard/owner-operations', { params })
    return data || {}
  },

  /** Operational KPIs for coach home — not the legacy payment-only summary. */
  async getCoachOperationalSummary(params = {}) {
    const { data } = await http.get('/dashboard/coach-summary', { params })
    return data || {}
  },
}

export default roleDashboardApi
