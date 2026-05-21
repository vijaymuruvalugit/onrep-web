import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CSpinner,
  CBadge,
} from '@coreui/react'
import { paymentSettingsApi } from '../api/paymentSettingsApi'
import paymentsApi from '../api/paymentsApi'
import FeeCollectionModeCard from '../components/coach/FeeCollectionModeCard'
import { copyForReason } from '../constants/checkoutReadiness'
import { monthStr } from '../utils/formatDueShort'

function defaultGenerateMonth() {
  return monthStr(new Date())
}

function normalizePaymentModule(raw) {
  return String(raw || 'MANUAL').toUpperCase() === 'AUTOMATED' ? 'AUTOMATED' : 'MANUAL'
}

function readinessFromApi(data) {
  return {
    checkout_ready_ok: data.checkout_ready_ok,
    checkout_ready_reasons: data.checkout_ready_reasons,
  }
}

function ReadinessPanel({ readiness }) {
  if (!readiness) return null
  const ok = readiness.checkout_ready_ok === true
  const reasons = Array.isArray(readiness.checkout_ready_reasons)
    ? readiness.checkout_ready_reasons
    : []
  const visibleReasons = reasons.filter(
    (code) => !(code === 'PAYMENTS_DISABLED' && reasons.length > 1),
  )
  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>Online payment status</strong>{' '}
        {ok ? <CBadge color="success">Ready</CBadge> : <CBadge color="warning">Needs setup</CBadge>}
      </CCardHeader>
      <CCardBody>
        {ok ? (
          <p className="text-success mb-0">Parents can pay online.</p>
        ) : (
          <>
            <p className="text-body-secondary small">
              Complete these items before parents can use online checkout.
            </p>
            <ul className="mb-0">
              {visibleReasons.length === 0 ? <li>Online checkout is turned off.</li> : null}
              {visibleReasons.map((code) => {
                const copy = copyForReason(code)
                return (
                  <li key={code} className="mb-2">
                    <strong>{copy.title}</strong>
                    <div className="small text-muted">{copy.detail}</div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

function AcademyUpiCard({ paymentModule = 'MANUAL', onSaved }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [upiVpa, setUpiVpa] = useState('')
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let cancelled = false
    paymentsApi
      .getCoachFeeUpi()
      .then((value) => {
        if (cancelled) return
        const next = value || ''
        setUpiVpa(next)
        setDraft(next)
      })
      .catch((e) => {
        if (!cancelled)
          setMessage({ color: 'danger', text: e?.message || 'Unable to load UPI ID.' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setMessage(null)
    try {
      const out = await paymentsApi.patchCoachFeeUpi({ upiVpa: trimmed })
      const saved = out?.upiVpa || trimmed
      setUpiVpa(saved)
      setDraft(saved)
      setMessage({ color: 'success', text: 'UPI ID saved.' })
      if (onSaved) await onSaved()
    } catch (e) {
      setMessage({ color: 'danger', text: e?.message || 'Unable to save UPI ID.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>
          {paymentModule === 'AUTOMATED' ? 'UPI payout details' : 'Manual payment UPI ID'}
        </strong>
      </CCardHeader>
      <CCardBody>
        <p className="text-body-secondary small">
          {paymentModule === 'AUTOMATED'
            ? 'OnRep can use this UPI ID as the payout destination for online fee collections. Bank details are optional if this UPI ID is correct.'
            : 'Parents use this UPI ID when they pay outside online checkout and report the payment in OnRep. This is the same UPI ID collected during signup.'}
        </p>
        {loading ? (
          <CSpinner size="sm" />
        ) : (
          <CForm onSubmit={handleSave}>
            <div className="mb-3">
              <CFormLabel htmlFor="academyUpi">UPI ID</CFormLabel>
              <CFormInput
                id="academyUpi"
                placeholder="your-academy@upi"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                inputMode="email"
                spellCheck={false}
                disabled={saving}
              />
              {upiVpa ? (
                <div className="form-text">
                  Current UPI ID: <strong>{upiVpa}</strong>
                </div>
              ) : null}
            </div>
            <CButton color="primary" type="submit" disabled={saving || !draft.trim()}>
              {saving ? <CSpinner size="sm" /> : 'Save UPI ID'}
            </CButton>
          </CForm>
        )}
        {message ? (
          <CAlert color={message.color} className="mt-3 mb-0 py-2">
            {message.text}
          </CAlert>
        ) : null}
        {paymentModule === 'AUTOMATED' ? (
          <div className="mt-3">
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              as={Link}
              to="/coach/payments/payout-details"
            >
              Use bank account instead
            </CButton>
          </div>
        ) : null}
      </CCardBody>
    </CCard>
  )
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    default_fee_due_day: 31,
  })
  const [readiness, setReadiness] = useState(null)
  const [paymentModule, setPaymentModule] = useState('MANUAL')
  const [generateMonth, setGenerateMonth] = useState(defaultGenerateMonth)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState(null)

  /** Keeps `accepts_online_payments` aligned with How parents pay (payment_module). */
  const syncAcceptsOnlinePayments = useCallback(async (module) => {
    const out = await paymentSettingsApi.updateSettings({
      accepts_online_payments: module === 'AUTOMATED',
    })
    if (out?.readiness) {
      setReadiness(out.readiness)
      return
    }
    const r = await paymentSettingsApi.refreshReadiness()
    if (r) setReadiness(r)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await paymentSettingsApi.getSettings()
        if (cancelled || !data) return
        const module = normalizePaymentModule(data.payment_module)
        setForm({
          default_fee_due_day: Number(data.default_fee_due_day || 31),
        })
        setPaymentModule(module)
        setReadiness(readinessFromApi(data))
        const acceptsOnline = data.accepts_online_payments !== false
        const wantsOnline = module === 'AUTOMATED'
        if (wantsOnline !== acceptsOnline) {
          await syncAcceptsOnlinePayments(module)
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load settings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [syncAcceptsOnlinePayments])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const out = await paymentSettingsApi.updateSettings({
        default_fee_due_day: Number(form.default_fee_due_day) || 31,
      })
      if (out?.readiness) setReadiness(out.readiness)
    } catch (e) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateMissing = async () => {
    setGenerating(true)
    setError(null)
    setGenerateResult(null)
    try {
      const out = await paymentsApi.generateObligations({
        periodMonth: generateMonth,
        onlyMissing: true,
      })
      setGenerateResult(out)
    } catch (e) {
      setError(e?.message || 'Failed to generate fees')
    } finally {
      setGenerating(false)
    }
  }

  const handleRefreshReadiness = async () => {
    setSaving(true)
    setError(null)
    try {
      const r = await paymentSettingsApi.refreshReadiness()
      if (r) setReadiness(r)
    } catch (e) {
      setError(e?.message || 'Failed to refresh')
    } finally {
      setSaving(false)
    }
  }

  const handlePaymentModuleChange = useCallback(
    async (nextModule) => {
      const module = normalizePaymentModule(nextModule)
      setPaymentModule(module)
      setError(null)
      try {
        await syncAcceptsOnlinePayments(module)
      } catch (e) {
        setError(e?.message || 'Failed to update online payment settings')
      }
    },
    [syncAcceptsOnlinePayments],
  )

  if (loading) return <CSpinner />

  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">Payment settings</h2>
      {error ? <CAlert color="danger">{error}</CAlert> : null}

      <FeeCollectionModeCard
        initialPaymentModule={paymentModule}
        onPaymentModuleChange={handlePaymentModuleChange}
      />
      {paymentModule === 'AUTOMATED' ? (
        <>
          <AcademyUpiCard paymentModule={paymentModule} onSaved={handleRefreshReadiness} />
          <ReadinessPanel readiness={readiness} />
        </>
      ) : (
        <AcademyUpiCard paymentModule={paymentModule} />
      )}

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Automatic fees</strong>
        </CCardHeader>
        <CCardBody>
          <p className="text-body-secondary small">
            Fees are created automatically when you open Payments. Use this only if a month is
            missing rows (for example after adding students late).
          </p>
          <div className="mb-3">
            <CFormLabel htmlFor="generateFeeMonth">Month</CFormLabel>
            <CFormInput
              id="generateFeeMonth"
              type="month"
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
            />
          </div>
          <CButton
            color="secondary"
            variant="outline"
            onClick={handleGenerateMissing}
            disabled={generating}
          >
            {generating ? <CSpinner size="sm" /> : 'Generate missing fees'}
          </CButton>
          {generateResult ? (
            <div className="small text-body-secondary mt-2 mb-0">
              Created {generateResult.created ?? 0} fee(s) for {generateResult.periodMonth}.
              {generateResult.skippedZeroAmount > 0
                ? ` Skipped ${generateResult.skippedZeroAmount} student(s) with no batch or override fee.`
                : null}
            </div>
          ) : null}
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Fee due dates</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="defaultFeeDueDay">Default due day</CFormLabel>
              <CFormInput
                id="defaultFeeDueDay"
                type="number"
                min={1}
                max={31}
                value={form.default_fee_due_day}
                onChange={(e) =>
                  setForm((p) => ({ ...p, default_fee_due_day: Number(e.target.value) || '' }))
                }
              />
              <div className="form-text">
                Used for every student unless their profile has its own payment due day. If you pick
                31, shorter months use the last day of the month.
              </div>
            </div>
            <CButton color="primary" onClick={handleSave} disabled={saving}>
              {saving ? <CSpinner size="sm" /> : 'Save due date'}
            </CButton>
          </CForm>
        </CCardBody>
      </CCard>

      <div className="mb-4">
        <CButton
          color="secondary"
          variant="outline"
          onClick={handleRefreshReadiness}
          disabled={saving}
        >
          {saving ? <CSpinner size="sm" /> : 'Check online payment status'}
        </CButton>
      </div>
    </div>
  )
}
