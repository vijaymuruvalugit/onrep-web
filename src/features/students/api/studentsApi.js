import http from '../../../api/http'

export const studentsApi = {
  async listStudents(params = {}) {
    const { data } = await http.get('/students', { params })
    return data || {}
  },

  async getStudent(studentId) {
    const { data } = await http.get(`/students/${encodeURIComponent(studentId)}`)
    return data || {}
  },

  async getParticipationSummary(studentId, params = {}) {
    const { data } = await http.get(
      `/students/${encodeURIComponent(studentId)}/participation-summary`,
      { params },
    )
    return data || {}
  },

  async createStudent(payload) {
    const { data } = await http.post('/students', payload)
    return data || {}
  },

  async updateStudent(studentId, payload) {
    const { data } = await http.patch(`/students/${encodeURIComponent(studentId)}`, payload)
    return data || {}
  },

  async getLoginStatus(studentId) {
    const { data } = await http.get(`/students/${encodeURIComponent(studentId)}/login-status`)
    return data || {}
  },

  async enableLogin(studentId, phone) {
    const { data } = await http.post(`/students/${encodeURIComponent(studentId)}/enable-login`, { phone })
    return data || {}
  },

  async disableLogin(studentId) {
    const { data } = await http.delete(`/students/${encodeURIComponent(studentId)}/enable-login`)
    return data || {}
  },
}

export default studentsApi
