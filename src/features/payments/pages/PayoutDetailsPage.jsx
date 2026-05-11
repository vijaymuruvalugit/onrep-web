import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CSpinner,
} from '@coreui/react'
import { paymentSettingsApi } from '../api/paymentSettingsApi'

/**
 * Bank account / payout details (Phase 5.1).
 *
 * Editing any field unverifies the row — ops must re-verify before payouts.
 * We never display the full account number; backend returns only the last 4.
 */
const empty = {
  account_holder_name: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
}

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/

export default function PayoutDetailsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [server, setServer] = useState(null)
  const [form, setForm] = useState(empty)

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
    if (form.ifsc_code && !IFSC_RE.test(form.ifsc_code.toUpperCase())) {
      setError('IFSC must be 11 characters (e.g. HDFC0001234).')
      return
    }
    if (form.account_number) {
      const digits = String(form.account_number).replace(/\s+/g, '')
      if (!/^[0-9]{6,20}$/.test(digits)) {
        setError('Account number must be 6–20 digits.')
        return
      }
    }
    if (!form.account_number && !server) {
      setError('Account number is required.')
      return
    }
    setSaving(true)
    try {
      const out = await paymentSettingsApi.saveBankAccount({
        account_holder_name: form.account_holder_name || null,
        bank_name: form.bank_name || null,
        account_number: form.account_number || null,
        ifsc_code: form.ifsc_code ? form.ifsc_code.toUpperCase() : null,
        upi_id: form.upi_id || null,
      })
      setServer(out)
      setForm((p) => ({ ...p, account_number: '' }))
      setSuccess('Saved. Verification by OnRep ops is required before settlements.')
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <CSpinner />

  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">Payout details</h2>
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {success ? <CAlert color="success">{success}</CAlert> : null}

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Current bank account</strong>{' '}
          {server?.is_verified ? (
            <CBadge color="success">Verified</CBadge>
          ) : server ? (
            <CBadge color="warning">Awaiting verification</CBadge>
          ) : (
            <CBadge color="secondary">Not added</CBadge>
          )}
        </CCardHeader>
        <CCardBody>
          {server ? (
            <dl className="row mb-0">
              <dt className="col-sm-4">Account holder</dt>
              <dd className="col-sm-8">{server.account_holder_name || '—'}</dd>
              <dt className="col-sm-4">Bank</dt>
              <dd className="col-sm-8">{server.bank_name || '—'}</dd>
              <dt className="col-sm-4">Account no.</dt>
              <dd className="col-sm-8">
                {server.account_number_last4 ? `•••• ${server.account_number_last4}` : '—'}
              </dd>
              <dt className="col-sm-4">IFSC</dt>
              <dd className="col-sm-8">{server.ifsc_code || '—'}</dd>
              <dt className="col-sm-4">UPI ID</dt>
              <dd className="col-sm-8">{server.upi_id || '—'}</dd>
            </dl>
          ) : (
            <em>Add your bank or UPI details below.</em>
          )}
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader>
          <strong>{server ? 'Update details' : 'Add details'}</strong>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={(e) => e.preventDefault()}>
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
              <CFormLabel htmlFor="acn">Account number {server ? '(leave blank to keep existing)' : ''}</CFormLabel>
              <CFormInput
                id="acn"
                autoComplete="off"
                value={form.account_number}
                onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
              />
              <div className="form-text">
                Stored encrypted on our servers. Only the last 4 digits are ever shown back.
              </div>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="ifsc">IFSC</CFormLabel>
              <CFormInput
                id="ifsc"
                value={form.ifsc_code}
                onChange={(e) => setForm((p) => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="upi">UPI ID (VPA)</CFormLabel>
              <CFormInput
                id="upi"
                placeholder="academy@bank"
                value={form.upi_id}
                onChange={(e) => setForm((p) => ({ ...p, upi_id: e.target.value }))}
              />
            </div>
            <CAlert color="info">
              Editing any field will mark the account as unverified. OnRep ops will re-verify
              before the next settlement.
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
