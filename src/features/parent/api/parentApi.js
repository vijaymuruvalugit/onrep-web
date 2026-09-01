import http from '../../../api/http'

/**
 * Parent read API — contract-aligned with GET /api/v1/parent/*
 */
export const parentApi = {
  async getDashboard() {
    const { data } = await http.get('/parent/dashboard')
    return data || {}
  },

  async getSchedule(params = {}) {
    const { data } = await http.get('/parent/schedule', { params })
    return data || {}
  },

  async getAttendance(params = {}) {
    const { data } = await http.get('/parent/attendance', { params })
    return data || {}
  },

  async getFees(params = {}) {
    const { data } = await http.get('/parent/fees', { params })
    return data || {}
  },

  async getNotifications(params = {}) {
    const { data } = await http.get('/parent/notifications', { params })
    return data || {}
  },
}

export default parentApi
