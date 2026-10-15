import React, { useEffect, useState } from 'react'
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CFormInput, CFormSelect, CSpinner } from '@coreui/react'
import paymentsApi from '../api/paymentsApi'

export default function BillingModeCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('automatic')
  const [savedMode, setSavedMode] = useState('automatic')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    paymentsApi.getBillingMode()
      .then((data) => {
        if (cancelled || !data) return
        setMode(data.mode || 'automatic')
        setSavedMode(data.mode || 'automatic')
        setEffectiveFrom(data.automaticFrom || '')
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load billing mode')
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
      const next = await paymentsApi.previewBillingMode({
        scope: 'academy',
        mode,
        effectiveFrom: mode === 'automatic' ? effectiveFrom : null,
      })
      setPreview(next.preview || next)
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
      const applied = await paymentsApi.setBillingMode({
        scope: 'academy',
        mode,
        effectiveFrom: mode === 'automatic' ? effectiveFrom : null,
      })
      setSavedMode(mode)
      setPreview(applied)
    } catch (e) {
      setError(e.message || 'Could not save billing mode')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <CSpinner size="sm" className="mb-3" />

  return (
    <CCard className="shadow-sm mb-4">
      <CCardHeader className="fw-semibold">Billing mode</CCardHeader>
      <CCardBody>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        <p className="small text-body-secondary">
          {savedMode === 'manual'
            ? 'Manual invoicing — no monthly fees are generated automatically.'
            : 'Monthly fees are generated automatically. Outstanding amounts stay payable either way.'}
        </p>
        <CFormSelect className="mb-2" value={mode} onChange={(e) => { setMode(e.target.value); setPreview(null) }}>
          <option value="automatic">Automatic monthly billing</option>
          <option value="manual">Manual invoicing</option>
        </CFormSelect>
        {mode === 'automatic' ? (
          <CFormInput
            className="mb-2"
            type="month"
            value={effectiveFrom}
            onChange={(e) => { setEffectiveFrom(e.target.value); setPreview(null) }}
          />
        ) : null}
        <div className="d-flex gap-2">
          <CButton color="secondary" size="sm" variant="outline" disabled={busy} onClick={previewChange}>
            Preview change
          </CButton>
          <CButton color="primary" size="sm" disabled={busy || !preview} onClick={confirm}>
            Confirm billing mode
          </CButton>
        </div>
        {preview ? (
          <div className="small mt-3">
            <div>{preview.confirmation}</div>
            {preview.firstCharges?.length ? (
              <div className="mt-2">First automatic charges: {preview.firstCharges.length}</div>
            ) : null}
            {preview.flaggedManualTuition?.length ? (
              <CAlert color="warning" className="mt-2 mb-0">
                {preview.flaggedManualTuition.length} enrolment{preview.flaggedManualTuition.length === 1 ? '' : 's'} already {preview.flaggedManualTuition.length === 1 ? 'has' : 'have'} manual tuition for that month. Those will not be charged again.
              </CAlert>
            ) : null}
          </div>
        ) : null}
      </CCardBody>
    </CCard>
  )
}
