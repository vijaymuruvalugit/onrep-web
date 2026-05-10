import React, { useState } from 'react'
import {
  CButton,
  CButtonGroup,
  CForm,
  CFormInput,
  CFormLabel,
  CFormText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import { formatInr } from '../utils/formatInr'

const METHODS = ['CASH', 'UPI', 'BANK']

/**
 * Inner form — mounted fresh each time the modal opens so we don't need a
 * reset-on-open `useEffect` (React 19 `set-state-in-effect` rule).
 */
const PayModalForm = ({ obligation, submitting, onClose, onSubmit }) => {
  const due = Number(obligation.amount_due) || 0
  const paid = Number(obligation.amount_paid) || 0
  const remaining = Math.max(0, due - paid)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')

  const numericAmount = Number(amount)
  const valid = Number.isFinite(numericAmount) && numericAmount > 0

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!valid || submitting) return
    onSubmit({ amount: numericAmount, method })
  }

  return (
    <CForm onSubmit={handleSubmit}>
      <CModalBody>
        <div className="mb-3">
          <div className="text-body-secondary small">Student</div>
          <div className="fw-semibold">{obligation.student_name || obligation.student_id}</div>
        </div>
        <div className="mb-3 d-flex justify-content-between gap-3">
          <div>
            <div className="text-body-secondary small">Period</div>
            <div>{obligation.period_month || '—'}</div>
          </div>
          <div className="text-end">
            <div className="text-body-secondary small">Remaining</div>
            <div className="fw-bold">₹{formatInr(remaining)}</div>
          </div>
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="pay-amount">Amount received (₹)</CFormLabel>
          <CFormInput
            id="pay-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            autoFocus
          />
          {numericAmount > remaining && remaining > 0 ? (
            <CFormText className="text-warning">
              Exceeds remaining balance — only the remaining amount will count toward the fee, the
              rest is recorded as overpayment.
            </CFormText>
          ) : null}
        </div>
        <div className="mb-2">
          <CFormLabel className="d-block">Payment method</CFormLabel>
          <CButtonGroup role="group" aria-label="Payment method">
            {METHODS.map((option) => (
              <CButton
                key={option}
                type="button"
                color={method === option ? 'primary' : 'secondary'}
                variant={method === option ? undefined : 'outline'}
                onClick={() => setMethod(option)}
              >
                {option}
              </CButton>
            ))}
          </CButtonGroup>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </CButton>
        <CButton color="primary" type="submit" disabled={!valid || submitting}>
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" /> Saving…
            </>
          ) : (
            'Save payment'
          )}
        </CButton>
      </CModalFooter>
    </CForm>
  )
}

/**
 * Records a partial / full coach-side payment for a single obligation.
 * Pure controlled component — parent owns submit/loading/error state.
 */
const PayModal = ({ visible, obligation, submitting, onClose, onSubmit }) => (
  <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static">
    <CModalHeader>
      <CModalTitle>Record payment</CModalTitle>
    </CModalHeader>
    {visible && obligation ? (
      <PayModalForm
        key={obligation.id}
        obligation={obligation}
        submitting={submitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    ) : null}
  </CModal>
)

export default PayModal
