import http from '../../../api/http'

export const familyApi = {
  async getParentOverview() {
    const { data } = await http.get('/family/parent/overview')
    return data || { children: [] }
  },

  async getStudentProgress() {
    const { data } = await http.get('/family/student/progress')
    return data || {}
  },
}
