/**
 * Coach skating training REST (`/api/v1/skating/training/*`) — requires activity workspace (x-activity-id).
 * In-session only: bundle, laps, observations. Day lists use operationalSessionsApi day-board.
 */
import http from '../../../api/http'

const BASE = '/skating/training'

export const skatingOpsApi = {
  async getSessionBundle(sessionId, params) {
    const { data } = await http.get(`${BASE}/sessions/${encodeURIComponent(sessionId)}/bundle`, {
      params,
    })
    return data?.bundle ?? null
  },

  async listSessions() {
    const { data } = await http.get(`${BASE}/sessions`)
    return data?.sessions ?? []
  },

  async listSessionPresets() {
    const { data } = await http.get(`${BASE}/session-presets`)
    return data?.presets ?? []
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

  /** Phase 4 — batched coaching events (not formal assessments). */
  async postCoachingEventsBatch(sessionId, body) {
    const { data } = await http.post(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/coaching-events`,
      body,
    )
    return data
  },

  async listCoachingEvents(sessionId, params) {
    const { data } = await http.get(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/coaching-events`,
      { params },
    )
    return data?.events ?? []
  },

  /** Formal 9-KPI assessment → student_assessments. */
  async postRapidObservation(sessionId, body) {
    const { data } = await http.post(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/rapid-observation`,
      body,
    )
    return data
  },

  async postRaceResult(sessionId, body) {
    const { data } = await http.post(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/race-results`,
      body,
    )
    return data
  },

  async postRaceFinishOrder(sessionId, body) {
    const { data } = await http.post(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/race-results/finish-order`,
      body,
    )
    return data
  },

  async getLeaderboard(sessionId, params) {
    const { data } = await http.get(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}/leaderboard`,
      { params },
    )
    return data?.leaderboard ?? null
  },
}

export default skatingOpsApi
