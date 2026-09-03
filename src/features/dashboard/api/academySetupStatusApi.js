import http from '../../../api/http'

/** Academy launch-readiness facts — `GET /api/v1/dashboard/setup-status`. */
const academySetupStatusApi = {
  async getSetupStatus() {
    const { data } = await http.get('/dashboard/setup-status')
    return data || {}
  },
}

export default academySetupStatusApi
