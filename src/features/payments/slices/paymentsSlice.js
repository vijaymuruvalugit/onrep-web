import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import paymentsApi from '../api/paymentsApi'
import dashboardApi from '../api/dashboardApi'

const initialState = {
  coachPayments: {
    obligations: [],
    obligationsLoading: false,
    obligationsError: null,
    feeUpi: '',
    feeUpiLoading: false,
    feeUpiSaving: false,
    feeUpiError: null,
    lastStudentFilterId: null,
    createObligationLoading: false,
    bulkPaidLoading: false,
    recordPaymentLoading: false,
    remindBusyById: {},
    remindError: null,
  },
  parentPayments: {
    summary: null,
    summaryLoading: false,
    summaryError: null,
    feeUpi: null,
    feeUpiLoading: false,
    createLinkBusyById: {},
    reportBusyById: {},
    /** Bumps to invalidate in-flight pollers when state resets. */
    pollGeneration: 0,
  },
  reports: {
    pending: [],
    pendingLoading: false,
    pendingError: null,
    confirmBusyById: {},
    rejectBusyById: {},
  },
  ownerKpis: {
    summary: null,
    loading: false,
    error: null,
  },
}

// ──────────── coach thunks ────────────

export const fetchObligations = createAsyncThunk(
  'payments/fetchObligations',
  async ({ studentId } = {}, { rejectWithValue }) => {
    try {
      const obligations = await paymentsApi.getObligations({ studentId })
      return { obligations, studentId: studentId || null }
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchCoachFeeUpi = createAsyncThunk(
  'payments/fetchCoachFeeUpi',
  async (_, { rejectWithValue }) => {
    try {
      const upi = await paymentsApi.getCoachFeeUpi()
      return upi || ''
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const saveCoachFeeUpi = createAsyncThunk(
  'payments/saveCoachFeeUpi',
  async (upiVpa, { rejectWithValue }) => {
    try {
      await paymentsApi.patchCoachFeeUpi({ upiVpa })
      return upiVpa
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const createObligation = createAsyncThunk(
  'payments/createObligation',
  async (payload, { rejectWithValue }) => {
    try {
      return await paymentsApi.createObligation(payload)
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const bulkMarkObligationsPaid = createAsyncThunk(
  'payments/bulkMarkPaid',
  async (obligationIds, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.bulkMarkPaid(obligationIds)
      return { obligationIds, updatedIds: data?.updatedIds || obligationIds }
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const recordObligationPayment = createAsyncThunk(
  'payments/recordPayment',
  async (payload, { rejectWithValue }) => {
    try {
      return await paymentsApi.recordPayment(payload)
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const sendObligationReminder = createAsyncThunk(
  'payments/sendReminder',
  async (obligationId, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.sendReminder(obligationId)
      return { obligationId, ...data }
    } catch (error) {
      return rejectWithValue({ obligationId, ...normalizeApiError(error) })
    }
  },
)

// ──────────── reports thunks ────────────

export const fetchPendingParentReports = createAsyncThunk(
  'payments/fetchPendingReports',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentsApi.getPendingParentReports()
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const confirmParentReport = createAsyncThunk(
  'payments/confirmParentReport',
  async (transactionId, { rejectWithValue }) => {
    try {
      await paymentsApi.confirmParentReport(transactionId)
      return transactionId
    } catch (error) {
      return rejectWithValue({ transactionId, ...normalizeApiError(error) })
    }
  },
)

export const rejectParentReport = createAsyncThunk(
  'payments/rejectParentReport',
  async (transactionId, { rejectWithValue }) => {
    try {
      await paymentsApi.rejectParentReport(transactionId)
      return transactionId
    } catch (error) {
      return rejectWithValue({ transactionId, ...normalizeApiError(error) })
    }
  },
)

// ──────────── parent thunks ────────────

export const fetchParentSummary = createAsyncThunk(
  'payments/fetchParentSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentsApi.getParentSummary()
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchParentFeeUpi = createAsyncThunk(
  'payments/fetchParentFeeUpi',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentsApi.getParentFeeUpi()
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const createParentPaymentLink = createAsyncThunk(
  'payments/createParentPaymentLink',
  async (obligationId, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.createParentPaymentLink(obligationId)
      return { obligationId, ...(data || {}) }
    } catch (error) {
      return rejectWithValue({ obligationId, ...normalizeApiError(error) })
    }
  },
)

export const reportParentPayment = createAsyncThunk(
  'payments/reportParentPayment',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.reportParentPaid(payload)
      return { obligationId: payload.obligationId, response: data }
    } catch (error) {
      return rejectWithValue({ obligationId: payload?.obligationId, ...normalizeApiError(error) })
    }
  },
)

// ──────────── owner KPI thunk ────────────

export const fetchOwnerPaymentKpis = createAsyncThunk(
  'payments/fetchOwnerKpis',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardApi.getCoachSummary()
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

// ──────────── slice ────────────

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearCoachPaymentsError(state) {
      state.coachPayments.obligationsError = null
      state.coachPayments.feeUpiError = null
      state.coachPayments.remindError = null
    },
    clearParentSummary(state) {
      state.parentPayments.summary = null
      state.parentPayments.summaryError = null
      state.parentPayments.pollGeneration += 1
    },
    bumpParentPollGeneration(state) {
      state.parentPayments.pollGeneration += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchObligations.pending, (state, action) => {
        state.coachPayments.obligationsLoading = true
        state.coachPayments.obligationsError = null
        state.coachPayments.lastStudentFilterId = action.meta.arg?.studentId || null
      })
      .addCase(fetchObligations.fulfilled, (state, action) => {
        state.coachPayments.obligationsLoading = false
        state.coachPayments.obligations = action.payload.obligations
      })
      .addCase(fetchObligations.rejected, (state, action) => {
        state.coachPayments.obligationsLoading = false
        state.coachPayments.obligationsError = action.payload || { message: 'Unable to load fees.' }
      })

      .addCase(fetchCoachFeeUpi.pending, (state) => {
        state.coachPayments.feeUpiLoading = true
        state.coachPayments.feeUpiError = null
      })
      .addCase(fetchCoachFeeUpi.fulfilled, (state, action) => {
        state.coachPayments.feeUpiLoading = false
        state.coachPayments.feeUpi = action.payload || ''
      })
      .addCase(fetchCoachFeeUpi.rejected, (state, action) => {
        state.coachPayments.feeUpiLoading = false
        state.coachPayments.feeUpiError = action.payload || { message: 'Unable to load UPI.' }
      })

      .addCase(saveCoachFeeUpi.pending, (state) => {
        state.coachPayments.feeUpiSaving = true
        state.coachPayments.feeUpiError = null
      })
      .addCase(saveCoachFeeUpi.fulfilled, (state, action) => {
        state.coachPayments.feeUpiSaving = false
        state.coachPayments.feeUpi = action.payload || ''
      })
      .addCase(saveCoachFeeUpi.rejected, (state, action) => {
        state.coachPayments.feeUpiSaving = false
        state.coachPayments.feeUpiError = action.payload || { message: 'Unable to save UPI.' }
      })

      .addCase(createObligation.pending, (state) => {
        state.coachPayments.createObligationLoading = true
      })
      .addCase(createObligation.fulfilled, (state) => {
        state.coachPayments.createObligationLoading = false
      })
      .addCase(createObligation.rejected, (state, action) => {
        state.coachPayments.createObligationLoading = false
        state.coachPayments.obligationsError = action.payload || {
          message: 'Unable to create fee.',
        }
      })

      .addCase(bulkMarkObligationsPaid.pending, (state) => {
        state.coachPayments.bulkPaidLoading = true
      })
      .addCase(bulkMarkObligationsPaid.fulfilled, (state) => {
        state.coachPayments.bulkPaidLoading = false
      })
      .addCase(bulkMarkObligationsPaid.rejected, (state, action) => {
        state.coachPayments.bulkPaidLoading = false
        state.coachPayments.obligationsError = action.payload || {
          message: 'Unable to mark fees as paid.',
        }
      })

      .addCase(recordObligationPayment.pending, (state) => {
        state.coachPayments.recordPaymentLoading = true
      })
      .addCase(recordObligationPayment.fulfilled, (state) => {
        state.coachPayments.recordPaymentLoading = false
      })
      .addCase(recordObligationPayment.rejected, (state, action) => {
        state.coachPayments.recordPaymentLoading = false
        state.coachPayments.obligationsError = action.payload || {
          message: 'Unable to record payment.',
        }
      })

      .addCase(sendObligationReminder.pending, (state, action) => {
        const id = action.meta.arg
        state.coachPayments.remindBusyById[id] = true
        state.coachPayments.remindError = null
      })
      .addCase(sendObligationReminder.fulfilled, (state, action) => {
        const id = action.meta.arg
        delete state.coachPayments.remindBusyById[id]
        return undefined
      })
      .addCase(sendObligationReminder.rejected, (state, action) => {
        const id = action.meta.arg
        delete state.coachPayments.remindBusyById[id]
        state.coachPayments.remindError = action.payload || { message: 'Reminder failed.' }
      })

      .addCase(fetchPendingParentReports.pending, (state) => {
        state.reports.pendingLoading = true
        state.reports.pendingError = null
      })
      .addCase(fetchPendingParentReports.fulfilled, (state, action) => {
        state.reports.pendingLoading = false
        state.reports.pending = action.payload || []
      })
      .addCase(fetchPendingParentReports.rejected, (state, action) => {
        state.reports.pendingLoading = false
        state.reports.pendingError = action.payload || {
          message: 'Unable to load pending reports.',
        }
      })

      .addCase(confirmParentReport.pending, (state, action) => {
        state.reports.confirmBusyById[action.meta.arg] = true
      })
      .addCase(confirmParentReport.fulfilled, (state, action) => {
        delete state.reports.confirmBusyById[action.meta.arg]
      })
      .addCase(confirmParentReport.rejected, (state, action) => {
        delete state.reports.confirmBusyById[action.meta.arg]
        state.reports.pendingError = action.payload || {
          message: 'Unable to confirm parent report.',
        }
      })

      .addCase(rejectParentReport.pending, (state, action) => {
        state.reports.rejectBusyById[action.meta.arg] = true
      })
      .addCase(rejectParentReport.fulfilled, (state, action) => {
        delete state.reports.rejectBusyById[action.meta.arg]
      })
      .addCase(rejectParentReport.rejected, (state, action) => {
        delete state.reports.rejectBusyById[action.meta.arg]
        state.reports.pendingError = action.payload || {
          message: 'Unable to reject parent report.',
        }
      })

      .addCase(fetchParentSummary.pending, (state) => {
        state.parentPayments.summaryLoading = true
        state.parentPayments.summaryError = null
      })
      .addCase(fetchParentSummary.fulfilled, (state, action) => {
        state.parentPayments.summaryLoading = false
        state.parentPayments.summary = action.payload
      })
      .addCase(fetchParentSummary.rejected, (state, action) => {
        state.parentPayments.summaryLoading = false
        state.parentPayments.summaryError = action.payload || { message: 'Unable to load fees.' }
      })

      .addCase(fetchParentFeeUpi.pending, (state) => {
        state.parentPayments.feeUpiLoading = true
      })
      .addCase(fetchParentFeeUpi.fulfilled, (state, action) => {
        state.parentPayments.feeUpiLoading = false
        state.parentPayments.feeUpi = action.payload
      })
      .addCase(fetchParentFeeUpi.rejected, (state) => {
        state.parentPayments.feeUpiLoading = false
        state.parentPayments.feeUpi = null
      })

      .addCase(createParentPaymentLink.pending, (state, action) => {
        state.parentPayments.createLinkBusyById[action.meta.arg] = true
      })
      .addCase(createParentPaymentLink.fulfilled, (state, action) => {
        delete state.parentPayments.createLinkBusyById[action.meta.arg]
      })
      .addCase(createParentPaymentLink.rejected, (state, action) => {
        delete state.parentPayments.createLinkBusyById[action.meta.arg]
      })

      .addCase(reportParentPayment.pending, (state, action) => {
        const id = action.meta.arg?.obligationId
        if (id) state.parentPayments.reportBusyById[id] = true
      })
      .addCase(reportParentPayment.fulfilled, (state, action) => {
        const id = action.meta.arg?.obligationId
        if (id) delete state.parentPayments.reportBusyById[id]
      })
      .addCase(reportParentPayment.rejected, (state, action) => {
        const id = action.meta.arg?.obligationId
        if (id) delete state.parentPayments.reportBusyById[id]
      })

      .addCase(fetchOwnerPaymentKpis.pending, (state) => {
        state.ownerKpis.loading = true
        state.ownerKpis.error = null
      })
      .addCase(fetchOwnerPaymentKpis.fulfilled, (state, action) => {
        state.ownerKpis.loading = false
        state.ownerKpis.summary = action.payload
      })
      .addCase(fetchOwnerPaymentKpis.rejected, (state, action) => {
        state.ownerKpis.loading = false
        state.ownerKpis.error = action.payload || { message: 'Unable to load owner KPIs.' }
      })
  },
})

export const { clearCoachPaymentsError, clearParentSummary, bumpParentPollGeneration } =
  paymentsSlice.actions
export default paymentsSlice.reducer
