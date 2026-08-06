import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { CAlert, CToast, CToastBody, CToaster } from '@coreui/react'
import usePayments from '../hooks/usePayments'
import {
  bulkMarkObligationsPaid,
  confirmParentReport,
  fetchObligations,
  fetchPendingParentReports,
  recordObligationPayment,
  rejectParentReport,
  sendObligationReminder,
} from '../slices/paymentsSlice'
import CoachPaymentsHeader from '../components/coach/CoachPaymentsHeader'
import ObligationsTable from '../components/coach/ObligationsTable'
import PendingReportsPanel from '../components/coach/PendingReportsPanel'
import PayModal from '../components/PayModal'
import BulkMarkPaidModal from '../components/BulkMarkPaidModal'

/**
 * Operational payments — fees are generated automatically from academy due-day
 * settings, batch fees, and optional student overrides when this page loads.
 */
const CoachPaymentsPage = ({ onDataChanged } = {}) => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId') || null
  const studentName = searchParams.get('studentName') || null

  const { coach, reports } = usePayments()

  const [selectedIds, setSelectedIds] = useState([])
  const [payModal, setPayModal] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((message, color = 'primary') => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, color }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const reload = useCallback(async () => {
    await Promise.all([
      dispatch(fetchObligations({ studentId })),
      dispatch(fetchPendingParentReports()),
    ])
    onDataChanged?.()
  }, [dispatch, studentId, onDataChanged])

  useEffect(() => {
    void reload()
  }, [reload])

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
      await reload()
    },
    [dispatch, payModal, pushToast, reload],
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
    await reload()
  }, [dispatch, pushToast, reload, validSelectedIds])

  const handleConfirmReport = useCallback(
    async (transactionId) => {
      const action = await dispatch(confirmParentReport(transactionId))
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to confirm.', 'danger')
        return
      }
      pushToast('Report confirmed — balance updated.', 'success')
      await reload()
    },
    [dispatch, pushToast, reload],
  )

  const handleRejectReport = useCallback(
    async (transactionId) => {
      const action = await dispatch(rejectParentReport(transactionId))
      if (action?.error) {
        pushToast(action.payload?.message || 'Unable to reject.', 'danger')
        return
      }
      pushToast('Report rejected.', 'success')
      await reload()
    },
    [dispatch, pushToast, reload],
  )

  return (
    <>
      <CoachPaymentsHeader studentName={studentName} />

      {!studentId ? (
        <CAlert color="info" className="py-2 mb-3">
          Monthly fees are created automatically from your batch and student fee settings, using
          your academy due date. Adjust amounts on the batch or student profile, and due dates under{' '}
          <strong>Payment settings</strong>.
        </CAlert>
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
        onRecordPayment={handleRecordPayment}
        onRemind={handleRemind}
        onBulkClick={() => setBulkOpen(true)}
        remindBusyById={coach.remindBusyById}
        bulkLoading={coach.bulkPaidLoading}
        onRefresh={reload}
        refreshDisabled={coach.obligationsLoading || reports.pendingLoading}
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
