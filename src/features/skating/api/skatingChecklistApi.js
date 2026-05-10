/** Skating checklist — skills & progression (`/api/v1/skating/*`). */
import http from '../../../api/http'

export const skatingChecklistApi = {
  async listSkills(params = {}) {
    const { data } = await http.get('/skating/skills', { params })
    return data?.skills ?? []
  },

  /** Ranked benchmark matches + `topBand` for confidence-tier UX (`high` | `moderate` | `low` | `none`). */
  async getEffortSuggestions(query = {}) {
    const { data } = await http.get('/skating/efforts/suggestions', { params: query })
    return data
  },

  /** Query-only tagged-effort hints — capped on server (operational PB phrases, not analytics). */
  async getEffortLapHints(studentId, params = {}) {
    const { data } = await http.get(
      `/skating/students/${encodeURIComponent(studentId)}/effort-lap-hints`,
      { params },
    )
    return data
  },

  /** Coach glance bundle — momentum, PB hint, note snippet (Layer 1 read path). */
  async getCoachSummary(studentId) {
    const { data } = await http.get(`/skating/students/${encodeURIComponent(studentId)}/coach-summary`)
    return data
  },

  async getStudentProgress(studentId) {
    const { data } = await http.get(`/skating/students/${encodeURIComponent(studentId)}/progress`)
    return data?.progress ?? []
  },

  async applyProgressFromLap(body) {
    const { data } = await http.post('/skating/progress/apply-lap', body)
    return data
  },

  async updateProgress(body) {
    const { data } = await http.post('/skating/progress', body)
    return data?.progress
  },
}

export default skatingChecklistApi
