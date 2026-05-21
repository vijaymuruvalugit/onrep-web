import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CSpinner,
} from '@coreui/react'
import { paymentSettingsApi } from '../api/paymentSettingsApi'
import {
  buildPayoutSavePayload,
  inferPayoutMethodFromServer,
  validatePayoutForm,
} from '../utils/payoutDetailsValidation'

const empty = {
  account_holder_name: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
}

export default function PayoutDetailsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [server, setServer] = useState(null)
  const [form, setForm] = useState(empty)
  const [payoutMethod, setPayoutMethod] = useState('bank')

  useEffect(() => {
    let cancelled = false
    paymentSettingsApi
      .getBankAccount()
      .then((data) => {
        if (cancelled) return
        setServer(data)
        if (data) {
          setForm({
            account_holder_name: data.account_holder_name || '',
            bank_name: data.bank_name || '',
            account_number: '',
            ifsc_code: data.ifsc_code || '',
            upi_id: data.upi_id || '',
          })
          setPayoutMethod(inferPayoutMethodFromServer(data))
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    const validationError = validatePayoutForm(payoutMethod, form, server)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    try {
      const payload = buildPayoutSavePayload(payoutMethod, form, server)
      const out = await paymentSettingsApi.saveBankAccount(payload)
      setServer(out)
      setForm((p) => ({
        ...p,
        account_number: '',
        account_holder_name: out?.account_holder_name || p.account_holder_name,
        bank_name: out?.bank_name || '',
        ifsc_code: out?.ifsc_code || '',
        upi_id: out?.upi_id || '',
      }))
      setPayoutMethod(inferPayoutMethodFromServer(out))
      setSuccess('Saved. Please double-check these payout details before collecting payments.')
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to save'
      setError(typeof msg === 'string' ? msg : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const payoutModeLabel =
    server?.upi_id && server?.account_number_last4
      ? 'Bank + UPI on file'
      : server?.upi_id
        ? 'UPI'
        : server?.account_number_last4 || server?.ifsc_code
          ? 'Bank account'
          : null

  if (loading) return <CSpinner />

  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-2">Payout details</h2>
      <p className="text-body-secondary small mb-3">
        Choose how OnRep should pay out your academy — bank transfer or UPI. You only need one method.
      </p>
      <CAlert color="warning">
        Enter these details carefully. OnRep uses them for settlements, and incorrect bank or UPI
        details can delay payouts or prevent customer payments from reaching your academy.
      </CAlert>
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {success ? <CAlert color="success">{success}</CAlert> : null}

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Current payout method</strong>{' '}
          {server ? (
            <CBadge color="success">Added</CBadge>
          ) : (
            <CBadge color="secondary">Not added</CBadge>
          )}
        </CCardHeader>
        <CCardBody>
          {server ? (
            <dl className="row mb-0">
              {payoutModeLabel ? (
                <>
                  <dt className="col-sm-4">Method</dt>
                  <dd className="col-sm-8">{payoutModeLabel}</dd>
                </>
              ) : null}
              <dt className="col-sm-4">Account holder</dt>
              <dd className="col-sm-8">{server.account_holder_name || '—'}</dd>
              {server.account_number_last4 || server.ifsc_code ? (
                <>
                  <dt className="col-sm-4">Bank</dt>
                  <dd className="col-sm-8">{server.bank_name || '—'}</dd>
                  <dt className="col-sm-4">Account no.</dt>
                  <dd className="col-sm-8">
                    {server.account_number_last4 ? `•••• ${server.account_number_last4}` : '—'}
                  </dd>
                  <dt className="col-sm-4">IFSC</dt>
                  <dd className="col-sm-8">{server.ifsc_code || '—'}</dd>
                </>
              ) : null}
              {server.upi_id ? (
                <>
                  <dt className="col-sm-4">UPI ID</dt>
                  <dd className="col-sm-8">{server.upi_id}</dd>
                </>
              ) : null}
            </dl>
          ) : (
            <em>Add bank details or a UPI ID below — one is enough.</em>
          )}
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <strong>{server ? 'Update payout method' : 'Add payout method'}</strong>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={(e) => e.preventDefault()}>
            <fieldset className="mb-4">
              <legend className="form-label fw-semibold mb-2">How should we pay you?</legend>
              <div className="d-flex flex-wrap gap-3">
                <CFormCheck
                  type="radio"
                  name="payoutMethod"
                  id="payout-bank"
                  label="Bank account (NEFT / IMPS)"
                  checked={payoutMethod === 'bank'}
                  onChange={() => setPayoutMethod('bank')}
                />
                <CFormCheck
                  type="radio"
                  name="payoutMethod"
                  id="payout-upi"
                  label="UPI"
                  checked={payoutMethod === 'upi'}
                  onChange={() => setPayoutMethod('upi')}
                />
              </div>
            </fieldset>

            {payoutMethod === 'bank' ? (
              <>
                <div className="mb-3">
                  <CFormLabel htmlFor="ahn">Account holder name</CFormLabel>
                  <CFormInput
                    id="ahn"
                    value={form.account_holder_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, account_holder_name: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="bank">Bank name</CFormLabel>
                  <CFormInput
                    id="bank"
                    value={form.bank_name}
                    onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="acn">
                    Account number {server?.account_number_last4 ? '(leave blank to keep existing)' : ''}
                  </CFormLabel>
                  <CFormInput
                    id="acn"
                    autoComplete="off"
                    value={form.account_number}
                    onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                  />
                  <div className="form-text">
                    Stored encrypted. Only the last 4 digits are shown after save.
                  </div>
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="ifsc">IFSC</CFormLabel>
                  <CFormInput
                    id="ifsc"
                    value={form.ifsc_code}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <CFormLabel htmlFor="ahn-upi">Account holder name (optional)</CFormLabel>
                  <CFormInput
                    id="ahn-upi"
                    value={form.account_holder_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, account_holder_name: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="upi">UPI ID (VPA)</CFormLabel>
                  <CFormInput
                    id="upi"
                    placeholder="academy@okhdfcbank"
                    value={form.upi_id}
                    onChange={(e) => setForm((p) => ({ ...p, upi_id: e.target.value.trim() }))}
                  />
                  <div className="form-text">Example: yourname@ybl or academy@okhdfcbank</div>
                </div>
              </>
            )}

            <CAlert color="warning">
              Please verify the account holder name, bank account number, IFSC, or UPI ID before
              saving. If these details are wrong, payouts from customer payments may not reach you.
            </CAlert>
            <CButton color="primary" onClick={handleSave} disabled={saving}>
              {saving ? <CSpinner size="sm" /> : 'Save'}
            </CButton>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  )
}
