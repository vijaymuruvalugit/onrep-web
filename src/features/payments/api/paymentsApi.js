import http from '../../../api/http'

/**
 * Mirrors `onrep-frontend` `manualPaymentService` against the existing
 * `/payments/*` REST surface. No new endpoints are introduced — all paths,
 * payloads, and response shapes match the React Native client and the
 * routes registered in `onrep-backend/src/routes/payments.js`.
 */
export const paymentsApi = {
  async getObligations({ studentId } = {}) {
    const { data } = await http.get('/payments/obligations', {
      params: studentId ? { studentId } : undefined,
    })
    return {
      obligations: data?.obligations || [],
      configurationIssues: data?.configurationIssues || [],
    }
  },

  async createObligation({ studentId, periodMonth, dueDate, amountDue }) {
    const payload = { studentId, periodMonth }
    if (dueDate) payload.dueDate = dueDate
    if (amountDue != null) payload.amountDue = amountDue
    const { data } = await http.post('/payments/obligations', payload)
    return data?.obligation || null
  },

  async generateObligations({ periodMonth, studentId, onlyMissing = true } = {}) {
    const { data } = await http.post('/payments/obligations/generate', {
      periodMonth,
      studentId,
      onlyMissing,
    })
    return data || {}
  },

  async bulkMarkPaid({ obligationIds, method, reference, clientMutationId }) {
    const { data } = await http.post(
      '/payments/bulk-mark-paid',
      {
        obligationIds,
        method,
        reference: reference || null,
        clientMutationId,
      },
      clientMutationId ? { headers: { 'Idempotency-Key': clientMutationId } } : undefined,
    )
    return data || {}
  },

  async recordPayment({ obligationId, amount, method, reference, recordedAt, clientMutationId }) {
    const { data } = await http.post(
      `/payments/obligations/${obligationId}/transactions`,
      {
        amount: amount == null ? amount : String(amount),
        method,
        reference: reference || null,
        recordedAt: recordedAt || null,
        clientMutationId,
      },
      clientMutationId ? { headers: { 'Idempotency-Key': clientMutationId } } : undefined,
    )
    return data?.obligation || null
  },

  async sendReminder(obligationId) {
    const { data } = await http.post(`/payments/obligations/${obligationId}/remind`)
    return data || {}
  },

  async saveEnrolmentFee({ assignmentId, studentId, activityId, batchId, amount }) {
    if (assignmentId) {
      const { data } = await http.patch(`/payments/fee-assignments/${assignmentId}`, { amount: String(amount) })
      return data?.feeAssignment || data || null
    }
    const { data } = await http.post('/payments/fee-assignments', {
      studentId,
      activityId,
      batchId,
      amount: String(amount),
    })
    return data?.feeAssignment || null
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

  /** Phase 1.5/3.2 post-redirect polling */
  async getParentObligationStatus(obligationId) {
    const { data } = await http.get(`/payments/parent/obligations/${obligationId}/status`)
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
  async getInvoices({ studentId, status, recipientType } = {}) {
    const { data } = await http.get('/payments/invoices', {
      params: {
        studentId: studentId || undefined,
        status: status || undefined,
        recipientType: recipientType || undefined,
      },
    })
    return data?.invoices || []
  },

  async getBillingMode() {
    const { data } = await http.get('/payments/billing-mode')
    return data
  },

  async previewBillingMode(body) {
    const { data } = await http.post('/payments/billing-mode/preview', body)
    return data?.preview
  },

  async setBillingMode(body) {
    const { data } = await http.post('/payments/billing-mode', body)
    return data
  },

  async getBillingBasis() {
    const { data } = await http.get('/payments/billing-basis')
    return data
  },

  async previewBillingBasis(body) {
    const { data } = await http.post('/payments/billing-basis/preview', body)
    return data?.preview
  },

  async setBillingBasis(body) {
    const { data } = await http.post('/payments/billing-basis', body)
    return data
  },

  async getEnrolmentBilling({ studentId, batchId, asOfYmd } = {}) {
    const { data } = await http.get('/payments/enrolment-billing', {
      params: { studentId, batchId, asOfYmd: asOfYmd || undefined },
    })
    return data?.enrolment
  },

  async searchInvoiceRecipients(params) {
    const { data } = await http.get('/payments/invoice-recipients', { params })
    return data
  },

  async createCustomer(body, clientMutationId) {
    const { data } = await http.post('/payments/customers', body, {
      headers: { 'Idempotency-Key': clientMutationId },
    })
    return data
  },

  async previewBulkInvoices(body) {
    const { data } = await http.post('/payments/invoices/bulk/preview', body)
    return data?.preview
  },

  async issueBulkInvoices(body, clientMutationId) {
    const { data } = await http.post('/payments/invoices/bulk/issue', body, {
      headers: { 'Idempotency-Key': clientMutationId },
    })
    return data
  },

  async previewInvoiceSend(invoiceIds) {
    const { data } = await http.post('/payments/invoices/send/preview', { invoiceIds })
    return data?.preview
  },

  async sendInvoices({ invoiceIds, resend }, clientMutationId) {
    const { data } = await http.post(
      '/payments/invoices/send',
      { invoiceIds, resend: resend === true },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data
  },

  async downloadBulkInvoicePdf(batchId) {
    const { data } = await http.get(`/payments/invoices/bulk/${batchId}/pdf`, { responseType: 'blob' })
    return data
  },

  async getInvoice(invoiceId) {
    const { data } = await http.get(`/payments/invoices/${invoiceId}`)
    return data?.invoice || null
  },

  async createInvoice({ studentId, billingCustomerId, lines, notes, clientMutationId }) {
    const { data } = await http.post(
      '/payments/invoices',
      { studentId: studentId || null, billingCustomerId: billingCustomerId || null, lines, notes: notes || null },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data?.invoice || null
  },

  async issueInvoice({ invoiceId, clientMutationId }) {
    const { data } = await http.post(
      `/payments/invoices/${invoiceId}/issue`,
      {},
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data?.invoice || null
  },

  async cancelInvoice({ invoiceId, reason, clientMutationId }) {
    const { data } = await http.post(
      `/payments/invoices/${invoiceId}/cancel`,
      { reason },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async recordInvoicePayment({ invoiceId, amount, method, reference, clientMutationId }) {
    const { data } = await http.post(
      `/payments/invoices/${invoiceId}/payments`,
      { amount: String(amount), method, reference: reference || null },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async waiveObligation({ obligationId, amount, reason, clientMutationId }) {
    const { data } = await http.post(
      `/payments/obligations/${obligationId}/waive`,
      { amount: String(amount), reason },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async prorateObligation({ obligationId, billableStart, billableEnd, reason, clientMutationId }) {
    const { data } = await http.post(
      `/payments/obligations/${obligationId}/prorate`,
      { billableStart, billableEnd, reason },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async setRecurringPrice({ assignmentId, amount, effectivePeriod, reason }) {
    const { data } = await http.post(`/payments/fee-assignments/${assignmentId}/recurring-price`, {
      amount: String(amount),
      effectivePeriod,
      reason,
    })
    return data?.assignment || null
  },

  async createInstalmentPlan({ studentId, description, instalments, clientMutationId }) {
    const { data } = await http.post(
      '/payments/instalment-plans',
      { studentId, description, instalments },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async rescheduleInstalment({ instalmentId, dueDate, reason, clientMutationId }) {
    const { data } = await http.post(
      `/payments/instalments/${instalmentId}/reschedule`,
      { dueDate, reason },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async previewChargeCorrection(obligationId) {
    const { data } = await http.get(`/payments/obligations/${obligationId}/correction-preview`)
    return data?.preview || null
  },

  async applyChargeCorrection({ obligationId, reason, clientMutationId }) {
    const { data } = await http.post(
      `/payments/obligations/${obligationId}/corrections`,
      { reason },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async recordRefundResult({ refundId, status, clientMutationId }) {
    const { data } = await http.post(
      `/payments/refunds/${refundId}/result`,
      { status },
      { headers: { 'Idempotency-Key': clientMutationId } },
    )
    return data || {}
  },

  async downloadInvoicePdf(invoiceId) {
    const res = await http.get(`/payments/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
    return res.data
  },

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
