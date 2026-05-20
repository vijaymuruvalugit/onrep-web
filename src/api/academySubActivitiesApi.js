import http from './http'

export const academySubActivitiesApi = {
  async list({ activeOnly = true } = {}) {
    const { data } = await http.get('/academy-sub-activities', {
      params: activeOnly ? { activeOnly: 'true' } : { activeOnly: 'false' },
    })
    return data?.academySubActivities || []
  },

  async get(subActivityId) {
    const { data } = await http.get(`/academy-sub-activities/${subActivityId}`)
    return data?.academySubActivity
  },

  async create(body) {
    const { data } = await http.post('/academy-sub-activities', body)
    return data?.academySubActivity
  },

  async update(subActivityId, body) {
    const { data } = await http.patch(`/academy-sub-activities/${subActivityId}`, body)
    return data?.academySubActivity
  },

  async ensureGeneral() {
    const { data } = await http.post('/academy-sub-activities/ensure-general')
    return data?.academySubActivity
  },

  async resetRecommended(subActivityId) {
    const { data } = await http.post(`/academy-sub-activities/${subActivityId}/reset-recommended`)
    return data?.academySubActivity
  },
}
