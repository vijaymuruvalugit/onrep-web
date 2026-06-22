import http from '../../../api/http'

export const eventsApi = {
  // ── Admin / Coach ─────────────────────────────────────────────────────────

  async listEvents(params = {}) {
    const { data } = await http.get('/events', { params })
    return data
  },

  async getEvent(id) {
    const { data } = await http.get(`/events/${encodeURIComponent(id)}`)
    return data
  },

  async createEvent(payload) {
    const { data } = await http.post('/events', payload)
    return data
  },

  async updateEvent(id, payload) {
    const { data } = await http.put(`/events/${encodeURIComponent(id)}`, payload)
    return data
  },

  async deleteEvent(id) {
    await http.delete(`/events/${encodeURIComponent(id)}`)
  },

  async publishEvent(id, payload = {}) {
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/publish`, payload)
    return data
  },

  async cancelEvent(id, payload = {}) {
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/cancel`, payload)
    return data
  },

  async completeEvent(id, payload = {}) {
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/complete`, payload)
    return data
  },

  async closeRegistration(id) {
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/close-registration`)
    return data
  },

  async listRegistrations(id) {
    const { data } = await http.get(`/events/${encodeURIComponent(id)}/registrations`)
    return data
  },

  async addRegistrations(id, studentIds, status = 'REGISTERED') {
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/registrations`, {
      student_ids: studentIds,
      status,
    })
    return data
  },

  async updateRegistration(eventId, studentId, payload) {
    const { data } = await http.put(
      `/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(studentId)}`,
      payload,
    )
    return data
  },

  async getResults(id) {
    const { data } = await http.get(`/events/${encodeURIComponent(id)}/results`)
    return data
  },

  async upsertResults(id, items) {
    const { data } = await http.put(`/events/${encodeURIComponent(id)}/results`, { items })
    return data
  },

  async getMedia(id) {
    const { data } = await http.get(`/events/${encodeURIComponent(id)}/media`)
    return data
  },

  async uploadMedia(id, file, { mediaType, label, isCover } = {}) {
    const form = new FormData()
    form.append('file', file)
    if (mediaType) form.append('media_type', mediaType)
    if (label) form.append('label', label)
    if (isCover) form.append('is_cover', 'true')
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteMedia(eventId, mediaId) {
    await http.delete(`/events/${encodeURIComponent(eventId)}/media/${encodeURIComponent(mediaId)}`)
  },

  async getTimeline(id) {
    const { data } = await http.get(`/events/${encodeURIComponent(id)}/timeline`)
    return data
  },

  async addMilestone(id, payload) {
    const { data } = await http.post(`/events/${encodeURIComponent(id)}/timeline`, payload)
    return data
  },

  // ── Parent ────────────────────────────────────────────────────────────────

  async getParentEvents(params = {}) {
    const { data } = await http.get('/parent/events', { params })
    return data
  },

  async getParentUpcomingEvents(params = {}) {
    const { data } = await http.get('/parent/events/upcoming', { params })
    return data
  },

  async getParentEvent(id) {
    const { data } = await http.get(`/parent/events/${encodeURIComponent(id)}`)
    return data
  },

  async familyRegister(eventId, registrations) {
    const { data } = await http.post(`/parent/events/${encodeURIComponent(eventId)}/family-register`, {
      registrations,
    })
    return data
  },

  async setRsvp(eventId, studentId, rsvpStatus) {
    const { data } = await http.put(`/parent/events/${encodeURIComponent(eventId)}/rsvp`, {
      student_id: studentId,
      rsvp_status: rsvpStatus,
    })
    return data
  },

  async getParentEventResults(eventId) {
    const { data } = await http.get(`/parent/events/${encodeURIComponent(eventId)}/results`)
    return data
  },

  async getParentEventTimeline(eventId) {
    const { data } = await http.get(`/parent/events/${encodeURIComponent(eventId)}/timeline`)
    return data
  },
}

export default eventsApi
