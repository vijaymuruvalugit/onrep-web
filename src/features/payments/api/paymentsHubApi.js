import http from '../../../api/http'

export const paymentsHubApi = {
  async getHub() {
    const { data } = await http.get('/payments/hub')
    return data || {}
  },
}
