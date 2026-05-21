import http from '../../../api/http'

/** Platform governance API — requires `is_platform_admin` / super_admin. */
export const superAdminApi = {
  getOverview() {
    return http.get('/ops/platform/overview').then((r) => r.data?.overview || null)
  },
  getHealth() {
    return http.get('/ops/platform/health').then((r) => r.data?.health || null)
  },
  getAnalytics() {
    return http.get('/ops/platform/analytics').then((r) => r.data?.analytics || null)
  },
  listAcademies(params = {}) {
    return http.get('/ops/platform/academies', { params }).then((r) => r.data?.academies || [])
  },
  getAcademy(id) {
    return http.get(`/ops/platform/academies/${id}`).then((r) => r.data || null)
  },
  suspendAcademy(id, reason) {
    return http.post(`/ops/platform/academies/${id}/suspend`, { reason })
  },
  reactivateAcademy(id) {
    return http.post(`/ops/platform/academies/${id}/reactivate`)
  },
  searchUsers(params = {}) {
    return http.get('/ops/platform/users', { params }).then((r) => r.data?.users || [])
  },
  deactivateUser(id) {
    return http.post(`/ops/platform/users/${id}/deactivate`)
  },
  reactivateUser(id) {
    return http.post(`/ops/platform/users/${id}/reactivate`)
  },
  resetInvite(id) {
    return http.post(`/ops/platform/users/${id}/reset-invite`).then((r) => r.data)
  },
  getSubscriptions() {
    return http.get('/ops/platform/subscriptions').then((r) => r.data || { plans: [], academies: [] })
  },
  patchAcademySubscription(id, body) {
    return http.patch(`/ops/platform/academies/${id}/subscription`, body)
  },
  listFeatureFlags() {
    return http.get('/ops/platform/feature-flags').then((r) => r.data?.flags || [])
  },
  createFeatureFlag(body) {
    return http.post('/ops/platform/feature-flags', body)
  },
  updateFeatureFlag(id, body) {
    return http.patch(`/ops/platform/feature-flags/${id}`, body)
  },
  listFlagOverrides(flagId) {
    return http.get(`/ops/platform/feature-flags/${flagId}/overrides`).then((r) => r.data?.overrides || [])
  },
  setFlagOverride(flagId, academyId, enabled) {
    return http.put(`/ops/platform/feature-flags/${flagId}/academies/${academyId}`, { enabled })
  },
  listPresets(presetType) {
    return http
      .get('/ops/platform/presets', { params: presetType ? { preset_type: presetType } : {} })
      .then((r) => r.data?.presets || [])
  },
  upsertPreset(body) {
    return http.put('/ops/platform/presets', body)
  },
  deactivatePreset(id) {
    return http.delete(`/ops/platform/presets/${id}`)
  },
  listAuditLogs(params = {}) {
    return http.get('/ops/platform/audit-logs', { params }).then((r) => r.data?.logs || [])
  },
  startImpersonation({ targetUserId, reason, readOnly = true }) {
    return http
      .post('/ops/platform/impersonation/start', {
        target_user_id: targetUserId,
        reason,
        read_only: readOnly,
      })
      .then((r) => r.data)
  },
  endImpersonation(sessionId) {
    return http.post(`/ops/platform/impersonation/${sessionId}/end`)
  },
  listActiveImpersonations(actorOnly = true) {
    return http
      .get('/ops/platform/impersonation/active', { params: { actor_only: actorOnly ? 'true' : 'false' } })
      .then((r) => r.data?.sessions || [])
  },
}

export default superAdminApi
