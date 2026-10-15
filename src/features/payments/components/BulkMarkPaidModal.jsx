import React, { useMemo, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CFormInput,
  CFormLabel,
  CFormText,
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
const BulkMarkPaidModal = ({ visible, obligations, submitting, error, outcome, onStartNew, onClose, onConfirm }) => {
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const sent = useRef(null)
  const stats = useMemo(() => {
    const studentSet = new Set()
    let totalPaise = 0n
    for (const ob of obligations) {
      if (ob.student_id) studentSet.add(ob.student_id)
      const raw = String(ob.outstanding_amount || ob.remaining_amount || '0')
      const [whole, frac = ''] = raw.split('.')
      totalPaise += BigInt(whole || '0') * 100n + BigInt((frac + '00').slice(0, 2))
    }
    return {
      count: obligations.length,
      studentCount: studentSet.size,
      totalRemaining: `${totalPaise / 100n}.${(totalPaise % 100n).toString().padStart(2, '0')}`,
    }
  }, [obligations])
  const needsReference = method !== 'CASH'

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
        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {outcome === 'uncertain' ? (
          <CAlert color="warning">This bulk collection was not confirmed. Retry uses the same submission.</CAlert>
        ) : null}
        {outcome === 'mismatch' ? (
          <CAlert color="danger">
            This submission is already tied to different details. Refresh before starting another bulk collection.
          </CAlert>
        ) : null}
        <div className="mb-3">
          <CFormLabel>Payment method</CFormLabel>
          <div className="d-flex gap-2">
            {['CASH', 'UPI', 'BANK'].map((option) => (
              <CButton
                key={option}
                type="button"
                color={method === option ? 'primary' : 'secondary'}
                variant={method === option ? undefined : 'outline'}
                onClick={() => setMethod(option)}
                disabled={outcome === 'uncertain'}
              >
                {option}
              </CButton>
            ))}
          </div>
          {needsReference ? (
            <CFormInput
              className="mt-2"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              disabled={outcome === 'uncertain'}
              placeholder="UTR or transfer reference"
            />
          ) : (
            <CFormText>Cash does not need a bank reference.</CFormText>
          )}
        </div>
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
        {outcome === 'mismatch' ? (
          <CButton
            color="secondary"
            onClick={() => {
              sent.current = null
              onStartNew?.()
            }}
            disabled={submitting}
          >
            Start a new bulk collection
          </CButton>
        ) : null}
        <CButton
          color="primary"
          onClick={() => {
            const payload = outcome === 'uncertain' && sent.current
              ? sent.current
              : { method, reference: needsReference ? reference.trim() : null }
            sent.current = payload
            onConfirm(payload)
          }}
          disabled={submitting || stats.count === 0 || (outcome !== 'uncertain' && needsReference && !reference.trim())}
        >
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" /> Marking…
            </>
          ) : outcome === 'uncertain' ? (
            'Retry same collection'
          ) : (
            'Yes, mark as paid'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default BulkMarkPaidModal
