import React, { useRef, useState } from 'react'
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
import { classifyCollectionResult } from '../utils/submissionOutcome'

const METHODS = ['CASH', 'UPI', 'BANK']

/**
 * Inner form — mounted fresh each time the modal opens so we don't need a
 * reset-on-open `useEffect` (React 19 `set-state-in-effect` rule).
 */
function newSubmissionKey() {
  return globalThis.crypto?.randomUUID?.() || `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const PayModalForm = ({ obligation, submitting, error, onClose, onSubmit }) => {
  const charge = obligation.effective_amount_due || obligation.amount_due || '0.00'
  const collected = obligation.cash_collected || obligation.amount_paid || '0.00'
  const waived = obligation.waived_amount || obligation.waived_amount_cache || '0.00'
  const remaining = obligation.outstanding_amount || obligation.remaining_amount || charge
  const submissionKey = useRef(newSubmissionKey())
  const lockedPayload = useRef(null)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [outcome, setOutcome] = useState(null)

  const locked = outcome === 'uncertain'
  const valid = /^\d+(\.\d{1,2})?$/.test(amount) && amount !== '0' && amount !== '0.0' && amount !== '0.00'
  const needsReference = method !== 'CASH'
  const referenceOk = !needsReference || reference.trim().length > 0

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const payload = locked && lockedPayload.current
      ? lockedPayload.current
      : {
          amount,
          method,
          reference: needsReference ? reference.trim() : null,
          recordedAt: recordedAt || null,
          clientMutationId: submissionKey.current,
        }
    if (!locked && (!valid || !referenceOk)) return
    lockedPayload.current = payload
    const result = await onSubmit(payload)
    if (!result) {
      setOutcome(null)
      return
    }
    const next = classifyCollectionResult(result)
    setOutcome(next)
    if (next !== 'uncertain') {
      lockedPayload.current = null
    }
  }

  const startNewCollection = () => {
    submissionKey.current = newSubmissionKey()
    lockedPayload.current = null
    setOutcome(null)
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
            <div className="text-body-secondary small">Outstanding</div>
            <div className="fw-bold">₹{formatInr(remaining)}</div>
          </div>
        </div>
        <div className="mb-3 small text-body-secondary">
          Charge ₹{formatInr(charge)} · Collected ₹{formatInr(collected)} · Waived ₹{formatInr(waived)}
        </div>
        {error ? <CFormText className="text-danger d-block mb-2">{error}</CFormText> : null}
        {outcome === 'uncertain' ? (
          <CFormText className="text-warning d-block mb-2">
            The collection was not confirmed. Retry sends the same amount and reference. Editing is locked until you start a new collection.
          </CFormText>
        ) : null}
        {outcome === 'mismatch' ? (
          <CFormText className="text-danger d-block mb-2">
            This submission key is already tied to different details. Refresh the balance before starting another collection.
          </CFormText>
        ) : null}
        <div className="mb-3">
          <CFormLabel htmlFor="pay-amount">Amount received (₹)</CFormLabel>
          <CFormInput
            id="pay-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={locked}
            placeholder="Amount"
            autoFocus
          />
          <CFormText>Amount cannot exceed the outstanding balance.</CFormText>
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
                disabled={locked}
              >
                {option}
              </CButton>
            ))}
          </CButtonGroup>
        </div>
        {needsReference ? (
          <div className="mb-3">
            <CFormLabel htmlFor="pay-reference">Reference</CFormLabel>
            <CFormInput
              id="pay-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              disabled={locked}
              placeholder="UTR or transfer reference"
            />
          </div>
        ) : (
          <CFormText className="d-block mb-3">Cash does not need a bank reference.</CFormText>
        )}
        <div className="mb-2">
          <CFormLabel htmlFor="pay-date">Collection date</CFormLabel>
          <CFormInput
            id="pay-date"
            type="date"
            value={recordedAt}
            onChange={(event) => setRecordedAt(event.target.value)}
            disabled={locked}
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </CButton>
        {outcome === 'mismatch' ? (
          <CButton color="secondary" type="button" onClick={startNewCollection} disabled={submitting}>
            Start a new collection
          </CButton>
        ) : null}
        <CButton color="primary" type="submit" disabled={(!locked && (!valid || !referenceOk)) || submitting}>
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" /> Saving…
            </>
          ) : (
            locked ? 'Retry same collection' : 'Save payment'
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
const PayModal = ({ visible, obligation, submitting, error, onClose, onSubmit }) => (
  <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static">
    <CModalHeader>
      <CModalTitle>Record payment</CModalTitle>
    </CModalHeader>
    {visible && obligation ? (
      <PayModalForm
        key={obligation.id}
        obligation={obligation}
        submitting={submitting}
        error={error}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    ) : null}
  </CModal>
)

export default PayModal
