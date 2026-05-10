import http from '../../../api/http'

export const subActivitiesApi = {
  /** Requires activity workspace (x-activity-id); lists streams for current activity. */
  async list(params = {}) {
    const { data } = await http.get('/sub-activities', { params })
    return {
      subActivities: Array.isArray(data?.subActivities) ? data.subActivities : [],
    }
  },
}

export default subActivitiesApi
