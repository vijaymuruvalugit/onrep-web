import http from '../../../api/http'

export const coachParentsApi = {
  async getOverview(params = {}) {
    const { data } = await http.get('/parents/overview', { params })
    return data || {}
  },

  async revokeParentInvite(inviteId) {
    const { data } = await http.delete(`/invites/parent/${encodeURIComponent(inviteId)}`)
    return data || {}
  },

  async resendParentInvite(inviteId, body = {}) {
    const { data } = await http.post(`/invites/parent/${encodeURIComponent(inviteId)}/resend`, body)
    return data || {}
  },
}

export default coachParentsApi
