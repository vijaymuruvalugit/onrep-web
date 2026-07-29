import http from '../../../api/http'

/**
 * Coach dashboard summary — `GET /api/v1/dashboard/summary`
 * (`onrep-backend/src/routes/dashboard.js`).
 *
 * Includes payment KPIs plus optional `paymentOps`:
 * `onlinePaidTodayInr`, `manualRecordedTodayInr`, `activePayLinksCount`,
 * `pendingParentReportsCount`, `paymentIssuesLast7Days`.
 */
export const dashboardApi = {
  async getCoachSummary() {
    const { data } = await http.get('/dashboard/summary')
    return data || {}
  },
}

export default dashboardApi
