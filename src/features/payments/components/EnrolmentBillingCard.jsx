import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CSpinner,
} from '@coreui/react'
import paymentsApi from '../api/paymentsApi'

export default function EnrolmentBillingCard({ studentId, batchIds = [] }) {
  const [batchId, setBatchId] = useState(batchIds[0] || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrolment, setEnrolment] = useState(null)
  const [basis, setBasis] = useState('inherit')
  const [joinedOn, setJoinedOn] = useState('')
  const [anchor, setAnchor] = useState('')
  const [firstCycle, setFirstCycle] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!batchId && batchIds[0]) setBatchId(batchIds[0])
  }, [batchIds, batchId])

  useEffect(() => {
    if (!studentId || !batchId) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    paymentsApi.getEnrolmentBilling({ studentId, batchId })
      .then((data) => {
        if (cancelled || !data) return
        setEnrolment(data)
        setBasis(data.enrolmentBasis || 'inherit')
        setJoinedOn(data.joinedOn || '')
        setAnchor(data.billingAnchorDate || data.joinedOn || '')
        setFirstCycle(data.anniversaryBillingFrom || '')
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load enrolment billing')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId, batchId])

  async function previewChange() {
    setBusy(true)
    setError('')
    setPreview(null)
    try {
      const next = await paymentsApi.previewBillingBasis({
        scope: 'enrolment',
        basis,
        studentId,
        batchId,
        joinedOn: joinedOn || null,
        billingAnchorDate: anchor || null,
        firstAnniversaryCycle: firstCycle || null,
      })
      setPreview(next)
      if (next.firstAnniversaryCycle && !firstCycle) setFirstCycle(next.firstAnniversaryCycle)
    } catch (e) {
      setError(e.message || 'Could not preview enrolment billing')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      const applied = await paymentsApi.setBillingBasis({
        scope: 'enrolment',
        basis,
        studentId,
        batchId,
        joinedOn: joinedOn || null,
        billingAnchorDate: anchor || null,
        firstAnniversaryCycle: firstCycle || null,
      })
      setPreview(applied)
      const refreshed = await paymentsApi.getEnrolmentBilling({ studentId, batchId })
      setEnrolment(refreshed)
    } catch (e) {
      setError(e.message || 'Could not save enrolment billing')
    } finally {
      setBusy(false)
    }
  }

  if (!studentId) return null
  if (!batchIds.length) {
    return (
      <CCard className="mb-3">
        <CCardHeader>Enrolment billing</CCardHeader>
        <CCardBody className="small text-body-secondary">
          Add this student to a batch before setting joining-date billing.
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CCard className="mb-3">
      <CCardHeader>Enrolment billing</CCardHeader>
      <CCardBody>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        {loading ? <CSpinner size="sm" /> : null}
        {batchIds.length > 1 ? (
          <CFormSelect className="mb-2" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batchIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </CFormSelect>
        ) : null}
        {enrolment ? (
          <div className="small text-body-secondary mb-2">
            Effective: {enrolment.effectiveBasis === 'joining_anniversary' ? 'Joining-date monthly' : 'Calendar month'}
            {enrolment.nextDueDate ? ` · Next due ${enrolment.nextDueDate}` : ''}
            {enrolment.nextServicePeriodStart && enrolment.nextServicePeriodEnd
              ? ` · ${enrolment.nextServicePeriodStart} to ${enrolment.nextServicePeriodEnd}`
              : ''}
            {enrolment.expectedCharge != null ? ` · ₹${enrolment.expectedCharge}` : ''}
          </div>
        ) : null}
        <CFormSelect className="mb-2" value={basis} onChange={(e) => { setBasis(e.target.value); setPreview(null) }}>
          <option value="inherit">Use academy default</option>
          <option value="calendar_month">Calendar-month billing</option>
          <option value="joining_anniversary">Joining-date monthly billing</option>
        </CFormSelect>
        <CFormLabel className="small mb-1">Joining date</CFormLabel>
        <CFormInput
          className="mb-2"
          type="date"
          value={joinedOn}
          onChange={(e) => { setJoinedOn(e.target.value); setPreview(null) }}
        />
        <CFormLabel className="small mb-1">Billing anniversary date</CFormLabel>
        <CFormInput
          className="mb-2"
          type="date"
          value={anchor}
          onChange={(e) => { setAnchor(e.target.value); setPreview(null) }}
        />
        {basis === 'joining_anniversary' || enrolment?.effectiveBasis === 'joining_anniversary' ? (
          <>
            <CFormLabel className="small mb-1">First anniversary cycle to generate</CFormLabel>
            <CFormInput
              className="mb-2"
              type="date"
              value={firstCycle}
              onChange={(e) => { setFirstCycle(e.target.value); setPreview(null) }}
            />
          </>
        ) : null}
        <div className="d-flex gap-2">
          <CButton color="secondary" size="sm" variant="outline" disabled={busy} onClick={previewChange}>
            Preview
          </CButton>
          <CButton color="primary" size="sm" disabled={busy || !preview?.canApply} onClick={confirm}>
            Save enrolment billing
          </CButton>
        </div>
        {preview ? (
          <div className="small mt-3">
            <div>{preview.confirmation}</div>
            {preview.firstCharge ? (
              <div className="mt-1">
                First cycle due {preview.firstCharge.dueDate}, covers {preview.firstCharge.servicePeriodStart} to {preview.firstCharge.servicePeriodEnd}
                {preview.firstCharge.amount != null ? `, ₹${preview.firstCharge.amount}` : ''}
                {preview.firstCharge.startsInFuture ? ' (starts in the future — not charged yet)' : ''}
              </div>
            ) : null}
            {(preview.warnings || []).map((w) => (
              <div key={w.code} className="text-warning-emphasis mt-1">{w.message}</div>
            ))}
          </div>
        ) : null}
      </CCardBody>
    </CCard>
  )
}
