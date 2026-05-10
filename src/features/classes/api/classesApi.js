import http from '../../../api/http'

export const classesApi = {
  async listClasses(params = {}) {
    const { data } = await http.get('/sessions', { params })
    return data || {}
  },

  async getClassRoster(classId) {
    const { data } = await http.get(`/sessions/${encodeURIComponent(classId)}/roster`)
    return data || {}
  },
}

export default classesApi
