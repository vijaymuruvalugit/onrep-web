import React, { useEffect, useState } from 'react'
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CFormSelect, CSpinner } from '@coreui/react'
import paymentsApi from '../api/paymentsApi'

export default function BillingBasisCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [basis, setBasis] = useState('calendar_month')
  const [savedBasis, setSavedBasis] = useState('calendar_month')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    paymentsApi.getBillingBasis()
      .then((data) => {
        if (cancelled || !data) return
        setBasis(data.basis || 'calendar_month')
        setSavedBasis(data.basis || 'calendar_month')
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load monthly billing setting')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function previewChange() {
    setBusy(true)
    setError('')
    setPreview(null)
    try {
      const next = await paymentsApi.previewBillingBasis({ scope: 'academy', basis })
      setPreview(next)
    } catch (e) {
      setError(e.message || 'Could not preview the change')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      const applied = await paymentsApi.setBillingBasis({ scope: 'academy', basis })
      setSavedBasis(basis)
      setPreview(applied)
    } catch (e) {
      setError(e.message || 'Could not save monthly billing setting')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <CSpinner size="sm" className="mb-3" />

  return (
    <CCard className="shadow-sm mb-4">
      <CCardHeader className="fw-semibold">Monthly billing</CCardHeader>
      <CCardBody>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        <p className="small text-body-secondary">
          {savedBasis === 'joining_anniversary'
            ? 'Fees are due monthly on the student’s joining-date anniversary.'
            : 'Fees are due once each calendar month.'}
        </p>
        <CFormSelect
          className="mb-2"
          value={basis}
          onChange={(e) => {
            setBasis(e.target.value)
            setPreview(null)
          }}
        >
          <option value="calendar_month">Calendar-month billing</option>
          <option value="joining_anniversary">Joining-date monthly billing</option>
        </CFormSelect>
        <div className="d-flex gap-2">
          <CButton color="secondary" size="sm" variant="outline" disabled={busy} onClick={previewChange}>
            Preview change
          </CButton>
          <CButton color="primary" size="sm" disabled={busy || !preview?.canApply} onClick={confirm}>
            Confirm monthly billing
          </CButton>
        </div>
        {preview ? (
          <div className="small mt-3">
            <div>{preview.confirmation}</div>
            {(preview.warnings || []).map((w) => (
              <div key={`${w.code}-${w.studentId || ''}`} className="text-warning-emphasis mt-1">
                {w.message}
              </div>
            ))}
          </div>
        ) : null}
      </CCardBody>
    </CCard>
  )
}
