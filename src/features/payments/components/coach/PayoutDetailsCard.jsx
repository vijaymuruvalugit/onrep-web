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

import { paymentSettingsApi } from '../../api/paymentSettingsApi'
import {
  buildPayoutSavePayload,
  inferPayoutMethodFromServer,
  validatePayoutForm,
} from '../../utils/payoutDetailsValidation'

const empty = {
  account_holder_name: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
}

export default function PayoutDetailsCard({ onSaved }) {
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
        if (!cancelled) setError(e?.message || 'Failed to load payout details')
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
      if (onSaved) await onSaved(out)
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to save payout details'
      setError(typeof msg === 'string' ? msg : 'Failed to save payout details')
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

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Payout details</strong>{' '}
          {server ? (
            <CBadge color="success">Added</CBadge>
          ) : (
            <CBadge color="secondary">Not added</CBadge>
          )}
        </CCardHeader>
        <CCardBody>
          <p className="text-body-secondary small mb-3">
            Choose where OnRep should settle online fee collections. Add either a bank account or a
            UPI ID.
          </p>
          <CAlert color="warning" className="py-2">
            Enter these details carefully. Incorrect bank or UPI details can delay payouts or
            prevent customer payments from reaching your academy.
          </CAlert>
          {error ? <CAlert color="danger">{error}</CAlert> : null}
          {success ? <CAlert color="success">{success}</CAlert> : null}

          {loading ? (
            <CSpinner size="sm" />
          ) : (
            <>
              <div className="border rounded p-3 mb-4">
                <strong className="d-block mb-2">Current payout method</strong>
                {server ? (
                  <dl className="row mb-0">
                    {payoutModeLabel ? (
                      <>
                        <dt className="col-sm-4">Method</dt>
                        <dd className="col-sm-8">{payoutModeLabel}</dd>
                      </>
                    ) : null}
                    <dt className="col-sm-4">Account holder</dt>
                    <dd className="col-sm-8">{server.account_holder_name || '-'}</dd>
                    {server.account_number_last4 || server.ifsc_code ? (
                      <>
                        <dt className="col-sm-4">Bank</dt>
                        <dd className="col-sm-8">{server.bank_name || '-'}</dd>
                        <dt className="col-sm-4">Account no.</dt>
                        <dd className="col-sm-8">
                          {server.account_number_last4
                            ? `**** ${server.account_number_last4}`
                            : '-'}
                        </dd>
                        <dt className="col-sm-4">IFSC</dt>
                        <dd className="col-sm-8">{server.ifsc_code || '-'}</dd>
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
                  <em>Add bank details or a UPI ID below. One is enough.</em>
                )}
              </div>

              <CForm onSubmit={(e) => e.preventDefault()}>
                <fieldset className="mb-4">
                  <legend className="form-label fw-semibold mb-2">
                    {server ? 'Update payout method' : 'Add payout method'}
                  </legend>
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
                      <CFormLabel htmlFor="payoutAccountHolder">Account holder name</CFormLabel>
                      <CFormInput
                        id="payoutAccountHolder"
                        value={form.account_holder_name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, account_holder_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <CFormLabel htmlFor="payoutBank">Bank name</CFormLabel>
                      <CFormInput
                        id="payoutBank"
                        value={form.bank_name}
                        onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
                      />
                    </div>
                    <div className="mb-3">
                      <CFormLabel htmlFor="payoutAccountNumber">
                        Account number{' '}
                        {server?.account_number_last4 ? '(leave blank to keep existing)' : ''}
                      </CFormLabel>
                      <CFormInput
                        id="payoutAccountNumber"
                        autoComplete="off"
                        value={form.account_number}
                        onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                      />
                      <div className="form-text">
                        Stored encrypted. Only the last 4 digits are shown after save.
                      </div>
                    </div>
                    <div className="mb-3">
                      <CFormLabel htmlFor="payoutIfsc">IFSC</CFormLabel>
                      <CFormInput
                        id="payoutIfsc"
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
                      <CFormLabel htmlFor="payoutUpiHolder">
                        Account holder name (optional)
                      </CFormLabel>
                      <CFormInput
                        id="payoutUpiHolder"
                        value={form.account_holder_name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, account_holder_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <CFormLabel htmlFor="payoutUpi">UPI ID (VPA)</CFormLabel>
                      <CFormInput
                        id="payoutUpi"
                        placeholder="academy@okhdfcbank"
                        value={form.upi_id}
                        onChange={(e) => setForm((p) => ({ ...p, upi_id: e.target.value.trim() }))}
                      />
                      <div className="form-text">Example: yourname@ybl or academy@okhdfcbank</div>
                    </div>
                  </>
                )}

                <CButton color="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <CSpinner size="sm" /> : 'Save payout details'}
                </CButton>
              </CForm>
            </>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}
