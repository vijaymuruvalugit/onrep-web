import http from '../../../api/http'

/**
 * Platform-ops surface (Phases 4 + 5). Every endpoint requires
 * `users.is_platform_admin = true`. The frontend only exposes these routes to
 * users whose `/auth/me` payload includes `is_platform_admin: true`.
 */
export const opsApi = {
  async listOrphans({ status = 'open', academyId = null, limit = 50 } = {}) {
    const params = { status, limit }
    if (academyId) params.academy_id = academyId
    const { data } = await http.get('/ops/webhooks/orphans', { params })
    return data?.orphans || []
  },
  async resolveOrphan(id, { action, obligationId = null, notes = null }) {
    const { data } = await http.post(`/ops/webhooks/orphans/${id}/resolve`, {
      action,
      obligation_id: obligationId,
      notes,
    })
    return data || null
  },
  async listProcessedEvents({ status = null, limit = 50 } = {}) {
    const params = { limit }
    if (status) params.status = status
    const { data } = await http.get('/ops/webhooks/processed', { params })
    return data?.events || []
  },
  async listRefunds(transactionId) {
    const { data } = await http.get(`/ops/transactions/${transactionId}/refunds`)
    return data?.refunds || []
  },
  async createRefund(transactionId, payload) {
    const { data } = await http.post(`/ops/transactions/${transactionId}/refunds`, payload)
    return data || null
  },
  async updateRefundStatus(refundId, payload) {
    const { data } = await http.put(`/ops/refunds/${refundId}/status`, payload)
    return data || null
  },
  async getBankAccount(academyId) {
    const { data } = await http.get(`/ops/academies/${academyId}/bank-account`)
    return data?.bank_account || null
  },
  async listSettlements(academyId, { limit = 50 } = {}) {
    const { data } = await http.get(`/ops/academies/${academyId}/settlements`, {
      params: { limit },
    })
    return data?.settlements || []
  },
  async generateSettlement(academyId, { startAt, endAt }) {
    const { data } = await http.post(`/ops/academies/${academyId}/settlements/generate`, {
      start_at: startAt,
      end_at: endAt,
    })
    return data || null
  },
  async setSettlementStatus(settlementId, payload) {
    const { data } = await http.put(`/ops/settlements/${settlementId}/status`, payload)
    return data || null
  },
  async getCollections({ start = null, end = null, format = null } = {}) {
    const params = {}
    if (start) params.start = start
    if (end) params.end = end
    if (format) params.format = format
    const { data } = await http.get('/ops/collections', {
      params,
      responseType: format === 'csv' ? 'text' : 'json',
    })
    return data
  },
  async getAuditLog({ entityType, entityId, limit = 50 }) {
    const { data } = await http.get('/ops/audit-logs', {
      params: { entity_type: entityType, entity_id: entityId, limit },
    })
    return data?.logs || []
  },
}

export default opsApi
