import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormText,
  CRow,
  CSpinner,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { cilWallet } from '@coreui/icons'

/**
 * Top of `CoachPaymentsPage`: title + optional academy UPI editor.
 * The UPI editor is hidden when the page is filtered to a single student
 * (matching RN behavior) — the field is academy-wide, not per-student.
 */
const CoachPaymentsHeader = ({
  studentName,
  showUpiEditor,
  feeUpi,
  feeUpiLoading,
  feeUpiSaving,
  feeUpiError,
  onSaveUpi,
}) => {
  // Reset draft to upstream value whenever it changes (after load / save).
  // This is the "adjust state during render based on prop change" idiom from
  // the React docs — preferred over a useEffect that calls setState.
  const upstream = feeUpi || ''
  const [committedUpi, setCommittedUpi] = useState(upstream)
  const [draft, setDraft] = useState(upstream)
  if (committedUpi !== upstream) {
    setCommittedUpi(upstream)
    setDraft(upstream)
  }
  const [savedJustNow, setSavedJustNow] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (feeUpiSaving) return
    const trimmed = (draft || '').trim()
    if (!trimmed) return
    const result = await onSaveUpi(trimmed)
    if (result?.error) {
      setSavedJustNow(false)
    } else {
      setSavedJustNow(true)
      setTimeout(() => setSavedJustNow(false), 2500)
    }
  }

  return (
    <>
      <CRow className="mb-3 align-items-center">
        <CCol>
          <h2 className="mb-0">{studentName ? `Payments — ${studentName}` : 'Payments'}</h2>
          <p className="text-body-secondary small mb-0">
            Fees are generated from your settings. Record payments and confirm parent reports here.
          </p>
        </CCol>
        <CCol xs="auto" className="d-flex gap-2">
          <Link to="/coach/payments/settings">
            <CButton size="sm" color="secondary" variant="outline">
              Payment settings
            </CButton>
          </Link>
          <Link to="/coach/payments/payout-details">
            <CButton size="sm" color="secondary" variant="outline">
              Payout details
            </CButton>
          </Link>
          <Link to="/coach/billing">
            <CButton size="sm" color="primary" variant="outline">
              Billing
            </CButton>
          </Link>
        </CCol>
      </CRow>

      {showUpiEditor ? (
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center gap-2">
            <CIcon icon={cilWallet} />
            <strong>Academy UPI</strong>
            <span className="text-body-secondary small ms-2">where parent fees are sent</span>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <CRow className="g-3 align-items-end">
                <CCol md={7}>
                  <CFormLabel htmlFor="academy-upi">UPI ID</CFormLabel>
                  <CFormInput
                    id="academy-upi"
                    placeholder="yourname@upi"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    autoCapitalize="none"
                    inputMode="email"
                    spellCheck={false}
                    disabled={feeUpiLoading || feeUpiSaving}
                  />
                  <CFormText>
                    Parents see this address when reporting a manual UPI payment. Set once for the
                    academy.
                  </CFormText>
                </CCol>
                <CCol md="auto">
                  <CButton
                    type="submit"
                    color="primary"
                    disabled={feeUpiSaving || feeUpiLoading || !draft.trim()}
                  >
                    {feeUpiSaving ? (
                      <>
                        <CSpinner size="sm" className="me-2" /> Saving…
                      </>
                    ) : (
                      'Save UPI ID'
                    )}
                  </CButton>
                </CCol>
              </CRow>
              {feeUpi && !savedJustNow ? (
                <div className="text-body-secondary small mt-2">
                  Saved: <span className="fw-semibold">{feeUpi}</span>
                </div>
              ) : null}
              {savedJustNow ? (
                <CAlert color="success" className="mt-3 mb-0 py-2">
                  UPI saved.
                </CAlert>
              ) : null}
              {feeUpiError ? (
                <CAlert color="danger" className="mt-3 mb-0 py-2">
                  {feeUpiError.message || 'Unable to save UPI.'}
                </CAlert>
              ) : null}
            </CForm>
          </CCardBody>
        </CCard>
      ) : null}

      {!showUpiEditor && !feeUpi ? (
        <CAlert color="warning" className="d-flex align-items-start gap-2">
          <CIcon icon={cilWallet} className="mt-1" />
          <div>
            Academy UPI isn&apos;t set yet. Open the Payments page (without a student filter) to add
            the UPI ID parents pay to.
          </div>
        </CAlert>
      ) : null}
    </>
  )
}

export default CoachPaymentsHeader
