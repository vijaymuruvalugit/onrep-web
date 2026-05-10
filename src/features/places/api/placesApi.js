import http from '../../../api/http'

export const placesApi = {
  async listPlaces(params = {}) {
    const { data } = await http.get('/places', { params })
    return data || {}
  },

  async createPlace(payload) {
    const { data } = await http.post('/places', payload)
    return data || {}
  },

  async updatePlace(placeId, payload) {
    const { data } = await http.patch(`/places/${encodeURIComponent(placeId)}`, payload)
    return data || {}
  },

  async deactivatePlace(placeId) {
    const { data } = await http.patch(`/places/${encodeURIComponent(placeId)}/deactivate`)
    return data || {}
  },

  async reactivatePlace(placeId) {
    const { data } = await http.patch(`/places/${encodeURIComponent(placeId)}/reactivate`)
    return data || {}
  },

  async autocomplete(input, sessionToken) {
    const params = { input: String(input || '').trim() }
    if (sessionToken) params.sessionToken = sessionToken
    const { data } = await http.get('/places/autocomplete', { params })
    return data || {}
  },

  async getPlaceDetails(placeId, sessionToken) {
    const params = { placeId }
    if (sessionToken) params.sessionToken = sessionToken
    const { data } = await http.get('/places/details', { params })
    return data || null
  },
}

export default placesApi
