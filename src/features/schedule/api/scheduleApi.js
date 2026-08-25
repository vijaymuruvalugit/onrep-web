import http from '../../../api/http'

/**
 * Legacy batch-schedule endpoints stay (mobile coach app uses them; this admin
 * also depends on them in places). New recurring-pattern endpoints are
 * `/recurring-patterns/*` and `/batches/:batchId/recurring-patterns`.
 */
export const scheduleApi = {
  /** Ensure recurring patterns are materialized into training + operational sessions. */
  async materializeBatchSessions(batchId, { fromDate, toDate } = {}) {
    const { data } = await http.post(
      `/batch-schedules/${encodeURIComponent(batchId)}/materialize`,
      { fromDate, toDate },
      { timeout: 90000 },
    )
    return data || {}
  },

  async listBatchSchedules(batchId, opts = {}) {
    const params = new URLSearchParams()
    if (opts.includeHistory) params.set('include_history', 'true')
    const qs = params.toString() ? `?${params.toString()}` : ''
    const { data } = await http.get(`/batch-schedules/${encodeURIComponent(batchId)}${qs}`)
    return data || {}
  },

  async createSchedule(payload) {
    const { data } = await http.post('/batch-schedules', payload, { timeout: 60000 })
    return data || {}
  },

  async updateSchedule(scheduleId, payload) {
    const { data } = await http.patch(`/batch-schedules/${encodeURIComponent(scheduleId)}`, payload)
    return data || {}
  },

  /**
   * Dry-run occurrence expansion. Returns count, first/last, warnings, and
   * `previewFingerprint` required by bulk create.
   *
   * @param {string} batchId
   * @param {{ patterns: object[], effectiveFrom?: string, effectiveUntil?: string,
   *   placeId?: string, coachId?: string, sessionMode?: string }} body
   */
  async previewRecurringPatterns(batchId, body) {
    const { data } = await http.post(
      `/batches/${encodeURIComponent(batchId)}/recurring-patterns/preview`,
      body,
    )
    return data || {}
  },

  /**
   * Create one or more patterns in one transaction. Requires
   * `clientMutationId` + `previewFingerprint`.
   *
   * @param {string} batchId
   * @param {{ patterns: object[], effectiveFrom?: string, effectiveUntil?: string,
   *   clientMutationId: string, previewFingerprint: string,
   *   placeId?: string, coachId?: string, sessionMode?: string }} body
   */
  async bulkCreateRecurringPatterns(batchId, body) {
    const { data } = await http.post(
      `/batches/${encodeURIComponent(batchId)}/recurring-patterns/bulk`,
      body,
      { timeout: 60000 },
    )
    return data || {}
  },

  /**
   * Audit-safe pattern edit. Body matches {@link UpdateRecurringPatternRequest}
   * in `@onrep/contracts/recurring-patterns`. Always end-and-replace under the
   * hood — preserves historical session links.
   *
   * @param {string} patternId
   * @param {{ mode: 'update_upcoming' | 'new_from', effectiveFrom?: string,
   *   occurrenceCutoverDate?: string, horizonDays?: number, changes: object }} payload
   */
  async patchRecurringPattern(patternId, payload) {
    const { data } = await http.patch(
      `/recurring-patterns/${encodeURIComponent(patternId)}`,
      payload,
    )
    return data || {}
  },

  /** Close a pattern as of today. Removes safely-deletable future sessions. */
  async deactivateRecurringPattern(patternId) {
    const { data } = await http.post(
      `/recurring-patterns/${encodeURIComponent(patternId)}/deactivate`,
    )
    return data || {}
  },

  /**
   * Manual pattern-scoped generation (legacy). Prefer automatic rolling
   * materialization on the server; kept for ops/debug scripts only.
   */
  async generateForPattern(patternId, payload) {
    const { data } = await http.post(
      `/recurring-patterns/${encodeURIComponent(patternId)}/generate`,
      payload,
    )
    return data || {}
  },
}

export default scheduleApi
