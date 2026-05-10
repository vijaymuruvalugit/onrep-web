import http from '../../../api/http'

/**
 * Mirrors `ezyplay-frontend` `manualPaymentService` against the existing
 * `/payments/*` REST surface. No new endpoints are introduced — all paths,
 * payloads, and response shapes match the React Native client and the
 * routes registered in `ezyplay-backend/src/routes/payments.js`.
 */
export const paymentsApi = {
  async getObligations({ studentId } = {}) {
    const { data } = await http.get('/payments/obligations', {
      params: studentId ? { studentId } : undefined,
    })
    return data?.obligations || []
  },

  async createObligation({ studentId, periodMonth, dueDate, amountDue }) {
    const { data } = await http.post('/payments/obligations', {
      studentId,
      periodMonth,
      dueDate,
      amountDue,
    })
    return data?.obligation || null
  },

  async bulkMarkPaid(obligationIds) {
    const { data } = await http.post('/payments/bulk-mark-paid', { obligationIds })
    return data || {}
  },

  async recordPayment({ obligationId, amount, method, reference }) {
    const { data } = await http.post(`/payments/obligations/${obligationId}/transactions`, {
      amount,
      method,
      reference,
    })
    return data?.obligation || null
  },

  async sendReminder(obligationId) {
    const { data } = await http.post(`/payments/obligations/${obligationId}/remind`)
    return data || {}
  },

  async getCoachFeeUpi() {
    const { data } = await http.get('/payments/academy/fee-upi')
    return data?.upiVpa ?? null
  },

  async patchCoachFeeUpi({ upiVpa }) {
    const { data } = await http.patch('/payments/academy/fee-upi', { upiVpa })
    return data || {}
  },

  async getPendingParentReports() {
    const { data } = await http.get('/payments/pending-parent-reports')
    return data?.reports || []
  },

  async confirmParentReport(transactionId) {
    const { data } = await http.post(
      `/payments/transactions/${transactionId}/confirm-parent-report`,
    )
    return data?.obligation || null
  },

  async rejectParentReport(transactionId) {
    const { data } = await http.post(`/payments/transactions/${transactionId}/reject-parent-report`)
    return data || {}
  },

  async getParentSummary() {
    const { data } = await http.get('/payments/parent-summary')
    return data || { students: [], transactions: [], summary: { total_due: 0, total_paid: 0 } }
  },

  async getParentFeeUpi() {
    const { data } = await http.get('/payments/parent/fee-upi')
    return data?.upiVpa ?? null
  },

  async createParentPaymentLink(obligationId) {
    const { data } = await http.post(`/payments/parent/obligations/${obligationId}/create-link`)
    return data || null
  },

  async reportParentPaid({
    obligationId,
    amount,
    method,
    reference,
    payment_ref: paymentRef,
    screenshot_url: screenshotUrl,
  }) {
    const { data } = await http.post(`/payments/parent/obligations/${obligationId}/report-paid`, {
      amount,
      method: method ?? 'UPI',
      reference,
      payment_ref: paymentRef,
      screenshot_url: screenshotUrl,
    })
    return data || null
  },

  /**
   * Multipart upload of a parent-side payment screenshot.
   * `onUploadProgress(percent)` receives 0-100 values when the browser exposes them.
   * Backend returns `{ path, key, isAbsolute }` — we forward the same shape.
   */
  async uploadParentPaymentScreenshot({ file, onUploadProgress }) {
    const form = new FormData()
    form.append('file', file, file.name || 'screenshot.jpg')

    const { data } = await http.post('/payments/parent/upload-screenshot', form, {
      onUploadProgress(progressEvent) {
        if (!onUploadProgress) return
        const total = progressEvent.total || file.size
        if (!total) return
        const pct = Math.min(100, Math.round((progressEvent.loaded / total) * 100))
        onUploadProgress(pct)
      },
    })
    return {
      path: data?.path || null,
      key: data?.key || null,
      isAbsolute: data?.isAbsolute === true,
    }
  },
}

export default paymentsApi
