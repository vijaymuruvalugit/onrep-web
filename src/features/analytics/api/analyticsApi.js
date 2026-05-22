import http from '../../../api/http'

/** Coaching-aware operational insights — curated DTOs only. */
export const analyticsApi = {
  getCoachInsights({ depth = 'embedded' } = {}) {
    return http.get('/analytics/coach', { params: { depth } }).then((r) => r.data?.insights || null)
  },
  getAcademyOperations({ depth = 'embedded' } = {}) {
    return http
      .get('/analytics/academy', { params: { depth } })
      .then((r) => r.data?.operations || null)
  },
  getParentProgress({ studentId } = {}) {
    return http
      .get('/analytics/family', { params: studentId ? { studentId } : {} })
      .then((r) => r.data?.progress || null)
  },
  getStudentMotivation() {
    return http.get('/analytics/family').then((r) => r.data?.motivation || null)
  },
  getPlatformGovernance() {
    return http.get('/analytics/platform').then((r) => r.data?.governance || null)
  },
}

export default analyticsApi
