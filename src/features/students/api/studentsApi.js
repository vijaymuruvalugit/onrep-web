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

  async createStudent(payload) {
    const { data } = await http.post('/students', payload)
    return data || {}
  },

  async updateStudent(studentId, payload) {
    const { data } = await http.patch(`/students/${encodeURIComponent(studentId)}`, payload)
    return data || {}
  },
}

export default studentsApi
