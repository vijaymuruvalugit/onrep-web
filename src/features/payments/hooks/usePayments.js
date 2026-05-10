import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  bulkMarkObligationsPaid,
  clearCoachPaymentsError,
  clearParentSummary,
  confirmParentReport,
  createObligation,
  createParentPaymentLink,
  fetchCoachFeeUpi,
  fetchObligations,
  fetchOwnerPaymentKpis,
  fetchParentFeeUpi,
  fetchParentSummary,
  fetchPendingParentReports,
  recordObligationPayment,
  rejectParentReport,
  reportParentPayment,
  saveCoachFeeUpi,
  sendObligationReminder,
} from '../slices/paymentsSlice'

/**
 * One hook intentionally — it returns three sub-objects (`coach`, `parent`,
 * `reports`, `ownerKpis`) so a page only consumes what it needs. Keeps the
 * slice's nested shape visible in components.
 */
export default function usePayments() {
  const dispatch = useDispatch()
  const coachState = useSelector((state) => state.payments.coachPayments)
  const parentState = useSelector((state) => state.payments.parentPayments)
  const reportsState = useSelector((state) => state.payments.reports)
  const ownerKpisState = useSelector((state) => state.payments.ownerKpis)

  // Coach
  const loadObligations = useCallback(
    (params) => dispatch(fetchObligations(params || {})),
    [dispatch],
  )
  const loadCoachFeeUpi = useCallback(() => dispatch(fetchCoachFeeUpi()), [dispatch])
  const saveFeeUpi = useCallback((upiVpa) => dispatch(saveCoachFeeUpi(upiVpa)), [dispatch])
  const createCoachObligation = useCallback(
    (payload) => dispatch(createObligation(payload)),
    [dispatch],
  )
  const bulkPaid = useCallback(
    (obligationIds) => dispatch(bulkMarkObligationsPaid(obligationIds)),
    [dispatch],
  )
  const recordPayment = useCallback(
    (payload) => dispatch(recordObligationPayment(payload)),
    [dispatch],
  )
  const sendReminder = useCallback(
    (obligationId) => dispatch(sendObligationReminder(obligationId)),
    [dispatch],
  )
  const clearCoachError = useCallback(() => dispatch(clearCoachPaymentsError()), [dispatch])

  // Reports
  const loadPendingReports = useCallback(() => dispatch(fetchPendingParentReports()), [dispatch])
  const confirmReport = useCallback(
    (transactionId) => dispatch(confirmParentReport(transactionId)),
    [dispatch],
  )
  const rejectReport = useCallback(
    (transactionId) => dispatch(rejectParentReport(transactionId)),
    [dispatch],
  )

  // Parent
  const loadParentSummary = useCallback(() => dispatch(fetchParentSummary()), [dispatch])
  const loadParentFeeUpi = useCallback(() => dispatch(fetchParentFeeUpi()), [dispatch])
  const createPaymentLink = useCallback(
    (obligationId) => dispatch(createParentPaymentLink(obligationId)),
    [dispatch],
  )
  const submitPaymentReport = useCallback(
    (payload) => dispatch(reportParentPayment(payload)),
    [dispatch],
  )
  const resetParentSummary = useCallback(() => dispatch(clearParentSummary()), [dispatch])

  // Owner KPIs
  const loadOwnerKpis = useCallback(() => dispatch(fetchOwnerPaymentKpis()), [dispatch])

  /**
   * Stable composite objects — spreading slice state into a fresh `{ …methods }`
   * object every render breaks `useCallback` / `useEffect` deps in consumers and
   * caused infinite reload loops (frozen Payments page).
   */
  const coach = useMemo(
    () => ({
      ...coachState,
      loadObligations,
      loadCoachFeeUpi,
      saveFeeUpi,
      createCoachObligation,
      bulkPaid,
      recordPayment,
      sendReminder,
      clearCoachError,
    }),
    [
      coachState,
      loadObligations,
      loadCoachFeeUpi,
      saveFeeUpi,
      createCoachObligation,
      bulkPaid,
      recordPayment,
      sendReminder,
      clearCoachError,
    ],
  )

  const parent = useMemo(
    () => ({
      ...parentState,
      loadParentSummary,
      loadParentFeeUpi,
      createPaymentLink,
      submitPaymentReport,
      resetParentSummary,
    }),
    [
      parentState,
      loadParentSummary,
      loadParentFeeUpi,
      createPaymentLink,
      submitPaymentReport,
      resetParentSummary,
    ],
  )

  const reports = useMemo(
    () => ({
      ...reportsState,
      loadPendingReports,
      confirmReport,
      rejectReport,
    }),
    [reportsState, loadPendingReports, confirmReport, rejectReport],
  )

  const ownerKpis = useMemo(
    () => ({
      ...ownerKpisState,
      loadOwnerKpis,
    }),
    [ownerKpisState, loadOwnerKpis],
  )

  return { coach, parent, reports, ownerKpis }
}
