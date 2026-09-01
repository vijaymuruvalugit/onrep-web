import http from '../../../api/http'

/**
 * Per-student parents lifecycle. Mirrors backend phase2 routes:
 *   GET    /students/:id/parents
 *   POST   /invites                          (multi-parent: accepts { studentId, email, name, expiresInDays })
 *   POST   /invites/parent/:inviteId/resend
 *   DELETE /invites/parent/:inviteId
 *   DELETE /students/:id/parents/:guardianIdentityId
 */
export const studentParentsApi = {
  async listParents(studentId) {
    const { data } = await http.get(`/students/${encodeURIComponent(studentId)}/parents`)
    return data || { linked: [], invites: [] }
  },

  async inviteParent(studentId, { email, name, expiresInDays, phoneNumber } = {}) {
    const payload = { studentId }
    if (email != null && String(email).trim() !== '') payload.email = String(email).trim()
    if (name != null && String(name).trim() !== '') payload.name = String(name).trim()
    if (Number.isFinite(Number(expiresInDays)) && Number(expiresInDays) > 0) {
      payload.expiresInDays = Number(expiresInDays)
    }
    if (phoneNumber != null && String(phoneNumber).trim() !== '') {
      payload.phoneNumber = String(phoneNumber).trim()
    }
    const { data } = await http.post('/invites', payload)
    return data || {}
  },

  async resendInvite(inviteId, { expiresInDays } = {}) {
    const body = {}
    if (Number.isFinite(Number(expiresInDays)) && Number(expiresInDays) > 0) {
      body.expiresInDays = Number(expiresInDays)
    }
    const { data } = await http.post(`/invites/parent/${encodeURIComponent(inviteId)}/resend`, body)
    return data || {}
  },

  async revokeInvite(inviteId) {
    const { data } = await http.delete(`/invites/parent/${encodeURIComponent(inviteId)}`)
    return data || {}
  },

  async unlinkParent(studentId, guardianIdentityId) {
    const { data } = await http.delete(
      `/students/${encodeURIComponent(studentId)}/parents/${encodeURIComponent(guardianIdentityId)}`,
    )
    return data || {}
  },
}

export default studentParentsApi
