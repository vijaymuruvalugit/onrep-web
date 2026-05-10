/**
 * Coach skating training REST (`/api/v1/skating/training/*`) — requires activity workspace (x-activity-id).
 * Aggregates: `/ops/snapshot`, `/sessions/:id/bundle` are low-chatter operational surfaces.
 */
import http from '../../../api/http'

const BASE = '/skating/training'

export const skatingOpsApi = {
  async getOpsSnapshot(dateYmd) {
    const { data } = await http.get(`${BASE}/ops/snapshot`, {
      params: { date: dateYmd },
    })
    return data
  },

  async getSessionBundle(sessionId, params = {}) {
    const { data } = await http.get(`${BASE}/sessions/${encodeURIComponent(sessionId)}/bundle`, {
      params,
    })
    return data?.bundle ?? null
  },

  async listSessions() {
    const { data } = await http.get(`${BASE}/sessions`)
    return data?.sessions ?? []
  },

  async createSession(body) {
    const { data } = await http.post(`${BASE}/sessions`, body)
    return data?.session
  },

  async patchSession(sessionId, body) {
    const { data } = await http.patch(`${BASE}/sessions/${encodeURIComponent(sessionId)}`, body)
    return data?.session
  },

  async recordLap(body) {
    const { data } = await http.post(`${BASE}/laps`, body)
    return data
  },

  /** Coach undo — requires session id for verification. */
  async deleteLap(lapId, trainingSessionId) {
    const { data } = await http.delete(`${BASE}/laps/${encodeURIComponent(lapId)}`, {
      params: { trainingSessionId },
    })
    return data
  },

  async listActiveSkaters() {
    const { data } = await http.get(`${BASE}/skaters/active`)
    return data?.skaters ?? []
  },

  async mergeGroup(sessionId, groupKey, body) {
    const { data } = await http.put(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/groups/${encodeURIComponent(groupKey)}`,
      body,
    )
    return data?.group
  },

  async addRace(sessionId, groupKey, body) {
    const { data } = await http.post(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/groups/${encodeURIComponent(groupKey)}/races`,
      body,
    )
    return data?.race
  },

  async listRacesAggregate(sessionId) {
    const { data } = await http.get(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/races-aggregate`,
    )
    return data?.races ?? []
  },

  /** Rapid Observation — session-linked KPI scores (student_assessments payload). */
  async postRapidObservation(sessionId, body) {
    const { data } = await http.post(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/rapid-observation`,
      body,
    )
    return data
  },
}

export default skatingOpsApi
