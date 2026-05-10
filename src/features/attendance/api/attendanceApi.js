import http from '../../../api/http'

export const attendanceApi = {
  async getClassRoster(classId) {
    const { data } = await http.get(`/sessions/${encodeURIComponent(classId)}/roster`)
    return data || {}
  },

  async markBulkAttendance(classId, marks) {
    const { data } = await http.post(`/sessions/${encodeURIComponent(classId)}/attendance/bulk`, {
      marks,
    })
    return data || {}
  },
}

export default attendanceApi
