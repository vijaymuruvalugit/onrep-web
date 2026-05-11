import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CSpinner,
  CBadge,
} from '@coreui/react'
import { paymentSettingsApi } from '../api/paymentSettingsApi'
import { copyForReason } from '../constants/checkoutReadiness'

/**
 * Owner-only Payment Settings (Phase 1.4 + 1.5).
 *
 * Surfaces:
 *   - `accepts_online_payments` toggle  (owner intent)
 *   - `allow_partial_payments`  + `minimum_partial_amount_paise` controls
 *   - System readiness panel — typed reason codes from the backend, never
 *     freestyle strings.
 *
 * Saving any field triggers a backend `refreshCheckoutReadiness` so the panel
 * shows the latest state.
 */
function ReadinessPanel({ readiness }) {
  if (!readiness) return null
  const ok = readiness.checkout_ready_ok === true
  const reasons = Array.isArray(readiness.checkout_ready_reasons)
    ? readiness.checkout_ready_reasons
    : []
  return (
    <CCard className="mb-4">
      <CCardHeader>
        <strong>Checkout readiness</strong>{' '}
        {ok ? (
          <CBadge color="success">Ready</CBadge>
        ) : (
          <CBadge color="warning">Action required</CBadge>
        )}
      </CCardHeader>
      <CCardBody>
        {ok ? (
          <p className="text-success mb-0">All checks passed — parents can pay online.</p>
        ) : (
          <ul className="mb-0">
            {reasons.length === 0 ? <li>Online payments disabled.</li> : null}
            {reasons.map((code) => {
              const copy = copyForReason(code)
              return (
                <li key={code} className="mb-2">
                  <strong>{copy.title}</strong>
                  <div className="small text-muted">{copy.detail}</div>
                </li>
              )
            })}
          </ul>
        )}
      </CCardBody>
    </CCard>
  )
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    accepts_online_payments: true,
    allow_partial_payments: false,
    minimum_partial_amount_paise: 50000,
  })
  const [readiness, setReadiness] = useState(null)

  useEffect(() => {
    let cancelled = false
    paymentSettingsApi
      .getSettings()
      .then((data) => {
        if (cancelled || !data) return
        setForm({
          accepts_online_payments: data.accepts_online_payments !== false,
          allow_partial_payments: data.allow_partial_payments === true,
          minimum_partial_amount_paise: Number(data.minimum_partial_amount_paise || 0),
        })
        setReadiness({
          checkout_ready_ok: data.checkout_ready_ok,
          checkout_ready_reasons: data.checkout_ready_reasons,
        })
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load settings')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const out = await paymentSettingsApi.updateSettings({
        accepts_online_payments: form.accepts_online_payments,
        allow_partial_payments: form.allow_partial_payments,
        minimum_partial_amount_paise: Number(form.minimum_partial_amount_paise) || 0,
      })
      if (out?.readiness) setReadiness(out.readiness)
    } catch (e) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
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

  if (loading) return <CSpinner />

  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">Payment settings</h2>
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      <ReadinessPanel readiness={readiness} />

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Online payments</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <div className="mb-3">
              <CFormCheck
                id="acceptsOnlinePayments"
                label="Accept online payments from parents"
                checked={form.accepts_online_payments}
                onChange={(e) =>
                  setForm((p) => ({ ...p, accepts_online_payments: e.target.checked }))
                }
              />
              <div className="form-text">
                Owner intent only — the actual readiness is shown above. Toggling this off
                immediately stops new Razorpay links from being created for parents.
              </div>
            </div>
            <div className="mb-3">
              <CFormCheck
                id="allowPartialPayments"
                label="Allow partial payments (Phase A: still 1 link per obligation)"
                checked={form.allow_partial_payments}
                onChange={(e) =>
                  setForm((p) => ({ ...p, allow_partial_payments: e.target.checked }))
                }
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="minPartial">Minimum partial payment (paise)</CFormLabel>
              <CFormInput
                id="minPartial"
                type="number"
                min={0}
                step={100}
                disabled={!form.allow_partial_payments}
                value={form.minimum_partial_amount_paise}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    minimum_partial_amount_paise: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
              <div className="form-text">
                e.g. <code>50000</code> = ₹500 minimum.
              </div>
            </div>
            <div className="d-flex gap-2">
              <CButton color="primary" onClick={handleSave} disabled={saving}>
                {saving ? <CSpinner size="sm" /> : 'Save'}
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleRefreshReadiness} disabled={saving}>
                Re-check readiness
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  )
}
