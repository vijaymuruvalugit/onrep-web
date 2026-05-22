import http from '../../../api/http'

export const academyCoachesApi = {
  async listCoaches() {
    const { data } = await http.get('/academy/coaches')
    return data || {}
  },

  async grantAdmin(userId) {
    const { data } = await http.post(`/academy/coaches/${encodeURIComponent(userId)}/grant-admin`)
    return data || {}
  },

  async revokeAdmin(userId) {
    const { data } = await http.delete(
      `/academy/coaches/${encodeURIComponent(userId)}/revoke-admin`,
    )
    return data || {}
  },
}

export default academyCoachesApi
