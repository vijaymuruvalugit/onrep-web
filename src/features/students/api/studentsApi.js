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

  async getStudentObservations(studentId, params = {}) {
    const { data } = await http.get(`/students/${encodeURIComponent(studentId)}/observations`, {
      params: { limit: 20, ...params },
    })
    return data?.observations || []
  },

  async getCoachingPriority(studentId) {
    const { data } = await http.get(
      `/students/${encodeURIComponent(studentId)}/coaching-priority`,
    )
    return data?.priority ?? null
  },

  async getStudentFollowUps(studentId) {
    const { data } = await http.get(`/students/${encodeURIComponent(studentId)}/follow-ups`)
    return data?.followUps || []
  },

  async getStudentProgressCards(studentId, params = {}) {
    const { data } = await http.get(`/students/${encodeURIComponent(studentId)}/progress-cards`, {
      params: { limit: 30, ...params },
    })
    return data?.cards || []
  },

  async revokeProgressCard(cardId, clientMutationId) {
    const { data } = await http.post(`/progress-cards/${encodeURIComponent(cardId)}/revoke`, {
      clientMutationId,
    })
    return data?.card ?? null
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
