import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormCheck,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
} from '@coreui/react'
import { phaseCaptureApi } from '../../../../domain/phaseCapture/phaseCaptureApi'

export default function CoachCaptureDefaultsPanel({ visible, onClose }) {
  const [defaults, setDefaults] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const d = await phaseCaptureApi.getCoachDefaults()
        if (!cancelled) setDefaults(d || {})
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visible])

  const save = async (patch) => {
    setSaving(true)
    setMsg('')
    try {
      const d = await phaseCaptureApi.patchCoachDefaults(patch)
      setDefaults(d)
      setMsg('Saved')
    } catch (e) {
      setMsg(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>Coaching preferences</CModalHeader>
      <CModalBody>
        {loading ? <CSpinner /> : null}
        <p className="small text-body-secondary">
          How you usually capture during practice. New sessions start with these settings.
        </p>
        <div className="mb-3">
          <label className="form-label">Default capture mode</label>
          <CFormSelect
            value={defaults.defaultCaptureMode || 'full'}
            disabled={saving}
            onChange={(e) =>
              setDefaults((d) => ({ ...d, defaultCaptureMode: e.target.value }))
            }
          >
            <option value="full">Full capture</option>
            <option value="fast">Fast capture (exceptions only)</option>
          </CFormSelect>
        </div>
        <CFormCheck
          className="mb-3"
          label="Show observations before ratings"
          checked={defaults.observationsFirst !== false}
          disabled={saving}
          onChange={(e) => setDefaults((d) => ({ ...d, observationsFirst: e.target.checked }))}
        />
        <CFormCheck
          className="mb-3"
          label="No ratings during Warmup"
          checked={Boolean(defaults.phaseOverrides?.warmup?.hideInlineRatings)}
          disabled={saving}
          onChange={(e) =>
            setDefaults((d) => ({
              ...d,
              phaseOverrides: {
                ...(d.phaseOverrides || {}),
                warmup: {
                  ...(d.phaseOverrides?.warmup || {}),
                  hideInlineRatings: e.target.checked,
                },
              },
            }))
          }
        />
        {msg ? <CAlert color="success" className="py-2 small mb-0">{msg}</CAlert> : null}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Close
        </CButton>
        <CButton color="primary" disabled={saving || loading} onClick={() => void save(defaults)}>
          Save preferences
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
