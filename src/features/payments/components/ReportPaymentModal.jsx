import React, { useState } from 'react'
import {
  CAlert,
  CButton,
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
import PaymentScreenshotInput from './PaymentScreenshotInput'
import { formatInr } from '../utils/formatInr'

/**
 * Inner form — mounted fresh each time the modal opens so we don't need a
 * reset-on-open `useEffect` (React 19 `set-state-in-effect` rule).
 */
const ReportPaymentForm = ({ row, submitting, onClose, onSubmit, onUploadScreenshot }) => {
  const [utr, setUtr] = useState('')
  const [upload, setUpload] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const utrTrimmed = utr.trim()
  const utrValid = utrTrimmed === '' || utrTrimmed.length >= 8
  const canSubmit = !!row.payment_ref && !submitting && utrValid

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitError(null)
    const result = await onSubmit({
      obligationId: row.obligationId,
      amount: row.remaining,
      method: 'UPI',
      reference: utrTrimmed || undefined,
      payment_ref: row.payment_ref,
      screenshot_url: upload?.key || undefined,
    })
    if (result?.error) {
      setSubmitError(result.payload?.message || 'Could not submit. Try again.')
    }
  }

  return (
    <CForm onSubmit={handleSubmit}>
      <CModalBody>
        <div className="mb-3">
          <div className="text-body-secondary small">Student</div>
          <div className="fw-semibold">{row.studentName}</div>
        </div>
        <div className="mb-3 d-flex justify-content-between gap-3">
          <div>
            <div className="text-body-secondary small">Amount</div>
            <div className="fw-bold">₹{formatInr(row.remaining)}</div>
          </div>
          <div className="text-end">
            <div className="text-body-secondary small">Reference</div>
            <div className="fw-semibold text-break">{row.payment_ref || '—'}</div>
          </div>
        </div>

        {row.manualUpiVpa ? (
          <CAlert color="info" className="py-2">
            Pay to UPI ID <strong>{row.manualUpiVpa}</strong>, then submit the UTR or screenshot
            below.
          </CAlert>
        ) : null}

        {!row.payment_ref ? (
          <CAlert color="warning" className="py-2">
            This fee has no payment reference yet. Ask your coach to refresh it before reporting.
          </CAlert>
        ) : null}

        <div className="mb-3">
          <CFormLabel htmlFor="parent-utr">UTR (optional)</CFormLabel>
          <CFormInput
            id="parent-utr"
            value={utr}
            onChange={(event) => setUtr(event.target.value.toUpperCase())}
            placeholder="Bank or UPI reference"
            autoCapitalize="characters"
            invalid={!utrValid}
            disabled={submitting}
          />
          {!utrValid ? (
            <CFormText className="text-danger">
              UTR must be at least 8 characters when provided.
            </CFormText>
          ) : null}
        </div>

        <PaymentScreenshotInput
          value={upload}
          onChange={setUpload}
          onUpload={onUploadScreenshot}
          disabled={submitting}
        />

        {submitError ? (
          <CAlert color="danger" className="mt-3 mb-0 py-2">
            {submitError}
          </CAlert>
        ) : null}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </CButton>
        <CButton type="submit" color="primary" disabled={!canSubmit}>
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" /> Submitting…
            </>
          ) : (
            'Submit report'
          )}
        </CButton>
      </CModalFooter>
    </CForm>
  )
}

const ReportPaymentModal = ({
  visible,
  row,
  submitting,
  onClose,
  onSubmit,
  onUploadScreenshot,
}) => (
  <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static">
    <CModalHeader>
      <CModalTitle>Report payment</CModalTitle>
    </CModalHeader>
    {visible && row ? (
      <ReportPaymentForm
        key={row.obligationId}
        row={row}
        submitting={submitting}
        onClose={onClose}
        onSubmit={onSubmit}
        onUploadScreenshot={onUploadScreenshot}
      />
    ) : null}
  </CModal>
)

export default ReportPaymentModal
