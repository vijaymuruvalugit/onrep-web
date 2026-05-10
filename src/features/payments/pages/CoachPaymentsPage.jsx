import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../auth/hooks/useAuth'
import { useSearchParams } from 'react-router-dom'
import { CAlert, CToast, CToastBody, CToaster } from '@coreui/react'
import usePayments from '../hooks/usePayments'
import {
  bulkMarkObligationsPaid,
  confirmParentReport,
  createObligation,
  fetchCoachFeeUpi,
  fetchObligations,
  fetchPendingParentReports,
  recordObligationPayment,
  rejectParentReport,
  saveCoachFeeUpi,
  sendObligationReminder,
} from '../slices/paymentsSlice'
import CoachPaymentsHeader from '../components/coach/CoachPaymentsHeader'
import ObligationsTable from '../components/coach/ObligationsTable'
import PendingReportsPanel from '../components/coach/PendingReportsPanel'
import AddFeeModal from '../components/coach/AddFeeModal'
import PayModal from '../components/PayModal'
import BulkMarkPaidModal from '../components/BulkMarkPaidModal'
import FeeCollectionModeCard from '../components/coach/FeeCollectionModeCard'

/**
 * Operational core — ports `ezyplay-frontend` `CoachPaymentsScreen` to web.
 * Composes three sub-views (header / obligations table / pending reports)
 * and owns the two confirmation modals.
 *
 * Deep-link: `?studentId=<uuid>` filters the table to that student and
 * unlocks the create-fee form (matching RN behavior).
 */
const CoachPaymentsPage = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const isAcademyOwner = String(user?.role || user?.userRole || '').toLowerCase() === 'academy_owner'
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId') || null
  const studentName = searchParams.get('studentName') || null

  const { coach, reports } = usePayments()

  const [selectedIds, setSelectedIds] = useState([])
  const [payModal, setPayModal] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addFeeOpen, setAddFeeOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((message, color = 'primary') => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, color }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Fetch only depends on `dispatch` + URL param so the effect runs once per
  // student filter change. We dispatch raw thunks to keep `reload` referentially
  // stable across slice updates (loading flags) — otherwise the effect retriggers
  // forever when each pending action mutates state.
  const reload = useCallback(() => {
    dispatch(fetchObligations({ studentId }))
    dispatch(fetchCoachFeeUpi())
    dispatch(fetchPendingParentReports())
  }, [dispatch, studentId])

  useEffect(() => {
    reload()
  }, [reload])

  // Selections may include stale ids after a refresh; derive the valid subset
  // during render rather than mutating state from an effect (React 19 rule).
  const validSelectedIds = useMemo(() => {
    const ids = new Set(coach.obligations.map((ob) => ob.id))
    return selectedIds.filter((id) => ids.has(id))
  }, [coach.obligations, selectedIds])

  const filteredPending = useMemo(() => {
    if (!studentId) return reports.pending
    return reports.pending.filter((report) => report.student_id === studentId)
  }, [reports.pending, studentId])

  const selectedObligations = useMemo(
    () => coach.obligations.filter((ob) => validSelectedIds.includes(ob.id)),
    [coach.obligations, validSelectedIds],
  )

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existingId) => existingId !== id) : [...prev, id],
    )
  }, [])

  const handleSelectAll = useCallback((ids, shouldSelect) => {
    setSelectedIds(shouldSelect ? [...ids] : [])
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const handleSaveUpi = useCallback(
    async (upiVpa) => {
      const action = await dispatch(saveCoachFeeUpi(upiVpa))
      if (action?.error) {
        return { error: action.payload || { message: 'Unable to save UPI.' } }
      }
      pushToast('UPI saved.', 'success')
      return { ok: true }
    },
    [dispatch, pushToast],
  )

  const handleCreateObligation = useCallback(
    async ({ studentId: sid, periodMonth, dueDate }) => {
      const action = await dispatch(createObligation({ studentId: sid, periodMonth, dueDate }))
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to create fee.', 'danger')
        return
      }
      pushToast('Fee created.', 'success')
      await dispatch(fetchObligations({ studentId }))
    },
    [dispatch, pushToast, studentId],
  )

  const handleSubmitAddFee = useCallback(
    async ({ studentId: sid, periodMonth, dueDate }) => {
      const action = await dispatch(createObligation({ studentId: sid, periodMonth, dueDate }))
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to create fee.', 'danger')
        return
      }
      pushToast('Fee created.', 'success')
      setAddFeeOpen(false)
      await dispatch(fetchObligations({ studentId }))
    },
    [dispatch, pushToast, studentId],
  )

  const handleRemind = useCallback(
    async (obligationId) => {
      const action = await dispatch(sendObligationReminder(obligationId))
      if (action?.error) {
        pushToast(action.payload?.message || 'Reminder failed.', 'danger')
        return
      }
      const data = action.payload || {}
      if (data.sent > 0) {
        pushToast(`Reminder sent to ${data.sent} parent(s).`, 'success')
      } else if (data.reason === 'no_parent') {
        pushToast('No parent linked to this student.', 'warning')
      } else if (data.reason === 'no_tokens') {
        pushToast('Parent has no device registered for notifications.', 'warning')
      } else if (data.reason === 'throttled') {
        pushToast('Reminder already sent recently.', 'warning')
      } else {
        pushToast('Reminder not sent.', 'secondary')
      }
    },
    [dispatch, pushToast],
  )

  const handleRecordPayment = useCallback((obligation) => {
    setPayModal(obligation)
  }, [])

  const handleSubmitPayment = useCallback(
    async ({ amount, method }) => {
      if (!payModal) return
      const action = await dispatch(
        recordObligationPayment({ obligationId: payModal.id, amount, method }),
      )
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to record payment.', 'danger')
        return
      }
      pushToast('Payment recorded.', 'success')
      setPayModal(null)
      await dispatch(fetchObligations({ studentId }))
    },
    [dispatch, payModal, pushToast, studentId],
  )

  const handleBulkConfirm = useCallback(async () => {
    if (validSelectedIds.length === 0) return
    const action = await dispatch(bulkMarkObligationsPaid([...validSelectedIds]))
    if (action?.error) {
      pushToast(action.payload?.message || 'Bulk mark paid failed.', 'danger')
      return
    }
    pushToast(`Marked ${validSelectedIds.length} fee(s) as paid.`, 'success')
    setBulkOpen(false)
    setSelectedIds([])
    await dispatch(fetchObligations({ studentId }))
  }, [dispatch, pushToast, studentId, validSelectedIds])

  const handleConfirmReport = useCallback(
    async (transactionId) => {
      const action = await dispatch(confirmParentReport(transactionId))
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to confirm.', 'danger')
        return
      }
      pushToast('Report confirmed — balance updated.', 'success')
      await Promise.all([
        dispatch(fetchPendingParentReports()),
        dispatch(fetchObligations({ studentId })),
      ])
    },
    [dispatch, pushToast, studentId],
  )

  const handleRejectReport = useCallback(
    async (transactionId) => {
      const action = await dispatch(rejectParentReport(transactionId))
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to reject.', 'danger')
        return
      }
      pushToast('Report rejected.', 'success')
      await dispatch(fetchPendingParentReports())
    },
    [dispatch, pushToast],
  )

  const showUpiEditor = !studentId

  return (
    <>
      <CoachPaymentsHeader
        studentName={studentName}
        showUpiEditor={showUpiEditor}
        feeUpi={coach.feeUpi}
        feeUpiLoading={coach.feeUpiLoading}
        feeUpiSaving={coach.feeUpiSaving}
        feeUpiError={coach.feeUpiError}
        onSaveUpi={handleSaveUpi}
      />

      {isAcademyOwner ? (
        <FeeCollectionModeCard initialPaymentModule={user?.payment_module} />
      ) : null}

      {coach.remindError ? (
        <CAlert color="danger" className="py-2">
          {coach.remindError.message || 'Reminder failed.'}
        </CAlert>
      ) : null}

      <PendingReportsPanel
        reports={filteredPending}
        loading={reports.pendingLoading}
        error={reports.pendingError}
        confirmBusyById={reports.confirmBusyById}
        rejectBusyById={reports.rejectBusyById}
        onConfirm={handleConfirmReport}
        onReject={handleRejectReport}
      />

      <ObligationsTable
        obligations={coach.obligations}
        loading={coach.obligationsLoading}
        error={coach.obligationsError}
        studentId={studentId}
        studentName={studentName}
        selectedIds={validSelectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onCreateObligation={handleCreateObligation}
        createLoading={coach.createObligationLoading}
        onRecordPayment={handleRecordPayment}
        onRemind={handleRemind}
        onBulkClick={() => setBulkOpen(true)}
        remindBusyById={coach.remindBusyById}
        bulkLoading={coach.bulkPaidLoading}
        onRefresh={reload}
        refreshDisabled={coach.obligationsLoading || reports.pendingLoading}
        onAddFeeClick={studentId ? undefined : () => setAddFeeOpen(true)}
      />

      <PayModal
        visible={!!payModal}
        obligation={payModal}
        submitting={coach.recordPaymentLoading}
        onClose={() => setPayModal(null)}
        onSubmit={handleSubmitPayment}
      />

      <BulkMarkPaidModal
        visible={bulkOpen}
        obligations={selectedObligations}
        submitting={coach.bulkPaidLoading}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkConfirm}
      />

      <AddFeeModal
        visible={addFeeOpen}
        submitting={coach.createObligationLoading}
        onClose={() => setAddFeeOpen(false)}
        onSubmit={handleSubmitAddFee}
      />

      <CToaster placement="top-end">
        {toasts.map((toast) => (
          <CToast
            key={toast.id}
            autohide
            visible
            color={toast.color}
            className="text-white align-items-center"
            onClose={() => dismissToast(toast.id)}
          >
            <div className="d-flex">
              <CToastBody>{toast.message}</CToastBody>
            </div>
          </CToast>
        ))}
      </CToaster>
    </>
  )
}

export default CoachPaymentsPage
