import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
} from '@coreui/react'
import { phaseCaptureApi } from '../../../../domain/phaseCapture/phaseCaptureApi'
import { uiRoleLabel } from '../../utils/phaseCaptureDisplay'

const TYPE_OPTIONS = [
  { value: 'tags', label: 'Observation (tags)' },
  { value: 'rating', label: 'Skill / metric (1–5)' },
  { value: 'note', label: 'Observation (note)' },
  { value: 'boolean', label: 'Checkpoint' },
  { value: 'counter', label: 'Metric (counter)' },
]

/**
 * Pre-start / in-session phase configuration — coach-friendly language.
 */
export default function SessionPhaseSetupModal({
  visible,
  onClose,
  operationalSessionId,
  phases = [],
  onUpdated,
}) {
  const [activePhaseId, setActivePhaseId] = useState('')
  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState('tags')
  const [uiRole, setUiRole] = useState('observation')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const phaseId = activePhaseId || (phases[0] ? String(phases[0].id) : '')
  const phase = phases.find((p) => String(p.id) === String(phaseId))

  const handleAdd = async () => {
    setError('')
    if (!phaseId || !label.trim()) {
      setError('Choose a phase and enter a label.')
      return
    }
    setBusy(true)
    try {
      await phaseCaptureApi.addCaptureItem(phaseId, {
        label: label.trim(),
        fieldType,
        uiRole,
        displayTier: fieldType === 'note' || fieldType === 'counter' ? 'drawer' : 'inline',
      })
      setLabel('')
      onUpdated?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not add')
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader>Configure phases</CModalHeader>
      <CModalBody>
        <p className="small text-body-secondary">
          Each phase tracks what matters for that part of practice. Add tools, metrics, or
          observations — not more than a few on athlete cards.
        </p>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        <div className="mb-3">
          <label className="form-label">Phase</label>
          <CFormSelect value={phaseId} onChange={(e) => setActivePhaseId(e.target.value)}>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </CFormSelect>
        </div>
        {phase ? (
          <ul className="small mb-3">
            {(phase.captureItems || []).map((it) => (
              <li key={it.id}>
                {uiRoleLabel(it.configurationJson?.uiRole)} · {it.label}
                <span className="text-body-secondary">
                  {' '}
                  ({it.configurationJson?.displayTier || 'drawer'})
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="border-top pt-3">
          <p className="fw-semibold small mb-2">Add to this phase</p>
          <div className="row g-2">
            <div className="col-md-5">
              <CFormInput
                placeholder="Label e.g. Balance"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <CFormSelect value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="col-md-3">
              <CButton color="primary" disabled={busy} onClick={() => void handleAdd()}>
                {busy ? <CSpinner size="sm" /> : 'Add'}
              </CButton>
            </div>
          </div>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Done
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
