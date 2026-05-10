import http from '../../../api/http'

export const scheduleApi = {
  async listBatchSchedules(batchId) {
    const { data } = await http.get(`/batch-schedules/${encodeURIComponent(batchId)}`)
    return data || {}
  },

  async createSchedule(payload) {
    const { data } = await http.post('/batch-schedules', payload)
    return data || {}
  },

  async updateSchedule(scheduleId, payload) {
    const { data } = await http.patch(`/batch-schedules/${encodeURIComponent(scheduleId)}`, payload)
    return data || {}
  },

  async generateClasses(payload) {
    const { data } = await http.post('/batch-schedules/generate', payload)
    return data || {}
  },
}

export default scheduleApi
