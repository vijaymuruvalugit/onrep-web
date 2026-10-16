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
} from '@coreui/react'
import { paymentSettingsApi } from '../api/paymentSettingsApi'
import paymentsApi from '../api/paymentsApi'
import FeePayoutSetupCard from '../components/coach/FeePayoutSetupCard'
import BillingModeCard from '../components/BillingModeCard'
import BillingBasisCard from '../components/BillingBasisCard'
import { monthStr } from '../utils/formatDueShort'

function defaultGenerateMonth() {
  return monthStr(new Date())
}

export default function PaymentSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    default_fee_due_day: 31,
    fee_reminder_auto_enabled: false,
    fee_reminder_days_before: 3,
    fee_reminder_on_due: true,
    fee_reminder_days_after: 7,
    timezone: 'Asia/Kolkata',
  })
  const [generateMonth, setGenerateMonth] = useState(defaultGenerateMonth)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    paymentSettingsApi
      .getSettings()
      .then((data) => {
        if (cancelled || !data) return
        setForm({
          default_fee_due_day: Number(data.default_fee_due_day || 31),
          fee_reminder_auto_enabled: data.fee_reminder_auto_enabled === true,
          fee_reminder_days_before: Number(data.fee_reminder_days_before ?? 3),
          fee_reminder_on_due: data.fee_reminder_on_due !== false,
          fee_reminder_days_after: Number(data.fee_reminder_days_after ?? 7),
          timezone: data.timezone || 'Asia/Kolkata',
        })
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load settings')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveDueDay = async () => {
    setSaving(true)
    setError(null)
    try {
      await paymentSettingsApi.updateSettings({
        default_fee_due_day: Number(form.default_fee_due_day) || 31,
        fee_reminder_auto_enabled: form.fee_reminder_auto_enabled === true,
        fee_reminder_days_before: Number(form.fee_reminder_days_before),
        fee_reminder_on_due: form.fee_reminder_on_due !== false,
        fee_reminder_days_after: Number(form.fee_reminder_days_after),
      })
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

  return (
    <div className="p-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-2">Payment settings</h2>
      <p className="text-body-secondary small mb-3">
        Set up how you receive money from parents. Everything else is optional.
      </p>
      {error ? <CAlert color="danger">{error}</CAlert> : null}

      <FeePayoutSetupCard />
      <BillingModeCard />
      <BillingBasisCard />

      <CButton
        color="link"
        className="px-0 mb-3"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        {advancedOpen ? 'Hide advanced' : 'Advanced (due dates & missing fees)'}
      </CButton>

      {advancedOpen ? (
        <>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Automatic fees</strong>
            </CCardHeader>
            <CCardBody>
              <p className="text-body-secondary small">
                Fees are created automatically when you open Payments. Use this only if a month is
                missing rows.
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
                  <CFormLabel htmlFor="defaultFeeDueDay">Default due date</CFormLabel>
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
                </div>
                <div className="mb-3">
                  <CFormCheck
                    id="feeReminderAuto"
                    label="Automatic fee reminders"
                    checked={form.fee_reminder_auto_enabled === true}
                    onChange={(e) => setForm((p) => ({ ...p, fee_reminder_auto_enabled: e.target.checked }))}
                  />
                  <div className="small text-body-secondary mt-1">
                    Off until you turn it on. Sends at 9:00 am ({form.timezone}). Amounts and student names stay off the lock screen.
                  </div>
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="feeReminderBefore">Days before due date</CFormLabel>
                  <CFormInput
                    id="feeReminderBefore"
                    type="number"
                    min={0}
                    max={30}
                    value={form.fee_reminder_days_before}
                    onChange={(e) => setForm((p) => ({ ...p, fee_reminder_days_before: Number(e.target.value) }))}
                  />
                </div>
                <div className="mb-3">
                  <CFormCheck
                    id="feeReminderOnDue"
                    label="On the due date"
                    checked={form.fee_reminder_on_due !== false}
                    onChange={(e) => setForm((p) => ({ ...p, fee_reminder_on_due: e.target.checked }))}
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel htmlFor="feeReminderAfter">Days after due date</CFormLabel>
                  <CFormInput
                    id="feeReminderAfter"
                    type="number"
                    min={0}
                    max={30}
                    value={form.fee_reminder_days_after}
                    onChange={(e) => setForm((p) => ({ ...p, fee_reminder_days_after: Number(e.target.value) }))}
                  />
                </div>
                <CButton color="primary" onClick={handleSaveDueDay} disabled={saving}>
                  {saving ? <CSpinner size="sm" /> : 'Save settings'}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </>
      ) : null}
    </div>
  )
}
