/** Skating governance + athlete intelligence REST (`/api/v1/skating/intelligence/*`). */
import http from '../../../api/http'

const BASE = '/skating/intelligence'

export const skatingIntelligenceApi = {
  async getSkillCatalog(params) {
    const { data } = await http.get(BASE + '/skill-catalog', { params })
    return data
  },

  async patchStudentSkill(studentId, skillDefinitionId, body) {
    const { data } = await http.patch(
      `${BASE}/students/${encodeURIComponent(studentId)}/skills/${encodeURIComponent(skillDefinitionId)}`,
      body,
    )
    return data
  },

  async getStudentKpiSnapshots(studentId, params) {
    const { data } = await http.get(
      `${BASE}/students/${encodeURIComponent(studentId)}/kpi-snapshots`,
      { params },
    )
    return data
  },

  async getTimeline(studentId) {
    const { data } = await http.get(`${BASE}/students/${encodeURIComponent(studentId)}/timeline`)
    return data
  },

  async getAcademySettings() {
    const { data } = await http.get(`${BASE}/academy-settings`)
    return data
  },

  async patchAcademySettings(body) {
    const { data } = await http.patch(`${BASE}/academy-settings`, body)
    return data
  },

  async createCustomSkill(body) {
    const { data } = await http.post(`${BASE}/custom-skills`, body)
    return data
  },

  async putBatchFocus(batchId, body) {
    const { data } = await http.put(`${BASE}/batches/${encodeURIComponent(batchId)}/focus-skills`, body)
    return data
  },
}
