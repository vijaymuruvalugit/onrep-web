import http from '../../../api/http'

const BASE = '/operational-sessions'

export const sessionRunsApi = {
  async createRun(sessionId, body) {
    const { data } = await http.post(
      `${BASE}/${encodeURIComponent(sessionId)}/session-runs`,
      body,
    )
    return data?.run ?? null
  },

  async updateRun(runId, body) {
    const { data } = await http.patch(
      `${BASE}/session-runs/${encodeURIComponent(runId)}`,
      body,
    )
    return data?.run ?? data
  },

  async listRuns(sessionId, params = {}) {
    const { data } = await http.get(
      `${BASE}/${encodeURIComponent(sessionId)}/session-runs`,
      { params },
    )
    return data?.runs ?? []
  },
}

export default sessionRunsApi
