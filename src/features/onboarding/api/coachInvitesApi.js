import http from '../../../api/http'

/**
 * Academy owner — onboarding coach invite lifecycle (existing backend contract).
 */
export const coachInvitesApi = {
  async listCoachInvites() {
    const { data } = await http.get('/onboarding/coach-invites')
    return data || {}
  },

  async postCoachInvite(payload) {
    const { data } = await http.post('/onboarding/coach-invite', payload)
    return data || {}
  },

  async revokeCoachInvite(userId) {
    const { data } = await http.delete(`/onboarding/coach-invites/${encodeURIComponent(userId)}`)
    return data || {}
  },

  async resendCoachInvite(userId) {
    const { data } = await http.post(
      `/onboarding/coach-invites/${encodeURIComponent(userId)}/resend`,
    )
    return data || {}
  },
}

export default coachInvitesApi
