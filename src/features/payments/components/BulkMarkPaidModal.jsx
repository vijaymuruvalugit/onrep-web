import React, { useMemo } from 'react'
import {
  CAlert,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning } from '@coreui/icons'
import { formatInr } from '../utils/formatInr'

/**
 * Confirmation gate for `POST /payments/bulk-mark-paid`. Shows the number of
 * obligations, distinct students, and total amount being marked paid in one
 * action. Web operators move faster than RN coaches — explicit confirmation
 * + irreversible warning are required by the plan.
 */
const BulkMarkPaidModal = ({ visible, obligations, submitting, onClose, onConfirm }) => {
  const stats = useMemo(() => {
    const studentSet = new Set()
    let totalRemaining = 0
    for (const ob of obligations) {
      if (ob.student_id) studentSet.add(ob.student_id)
      const due = Number(ob.amount_due) || 0
      const paid = Number(ob.amount_paid) || 0
      totalRemaining += Math.max(0, due - paid)
    }
    return {
      count: obligations.length,
      studentCount: studentSet.size,
      totalRemaining,
    }
  }, [obligations])

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle>Mark fees as paid?</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p className="mb-3">
          You are about to record full payment for{' '}
          <strong>
            {stats.count} {stats.count === 1 ? 'fee' : 'fees'}
          </strong>{' '}
          across <strong>{stats.studentCount}</strong>{' '}
          {stats.studentCount === 1 ? 'student' : 'students'}.
        </p>
        <p className="mb-3">
          Total being recorded: <strong>₹{formatInr(stats.totalRemaining)}</strong>
        </p>
        <CAlert color="warning" className="d-flex align-items-start gap-2 mb-0">
          <CIcon icon={cilWarning} className="mt-1" />
          <div>
            This creates coach-side payment transactions that count toward each fee&apos;s balance.
            The action is not reversible from the parent app — make sure these payments have
            actually been collected.
          </div>
        </CAlert>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={onConfirm} disabled={submitting || stats.count === 0}>
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" /> Marking…
            </>
          ) : (
            'Yes, mark as paid'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default BulkMarkPaidModal
