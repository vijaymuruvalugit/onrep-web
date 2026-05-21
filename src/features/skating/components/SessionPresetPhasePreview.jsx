import React, { useState } from 'react'
import { CButton, CFormInput, CFormSelect } from '@coreui/react'
import { PHASE_TYPE_CATALOG } from '../utils/sessionPhaseOptions'

/**
 * Tiny phase list for create-session confirmation (not a planning canvas).
 */
export default function SessionPresetPhasePreview({
  phases = [],
  onPhasesChange,
  disabled = false,
}) {
  const [addType, setAddType] = useState('technical')
  const [customTitle, setCustomTitle] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const move = (index, dir) => {
    const next = [...phases]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    onPhasesChange?.(next)
  }

  const remove = (index) => {
    if (phases.length <= 1) return
    onPhasesChange?.(phases.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    if (addType === 'custom') {
      const title = customTitle.trim()
      if (!title) return
      onPhasesChange?.([
        ...phases,
        {
          key: `custom-${Date.now()}`,
          title,
          blockType: 'custom',
          isCustom: true,
          baselineTitle: title,
          copyObservationsFrom: 'technical',
        },
      ])
      setCustomTitle('')
      setShowCustomInput(false)
      setAddType('technical')
      return
    }
    const label = PHASE_TYPE_CATALOG.find((o) => o.value === addType)?.label || addType
    const blockType = addType === 'race' ? 'race_simulation' : addType
    onPhasesChange?.([
      ...phases,
      {
        key: `add-${Date.now()}`,
        title: label,
        blockType,
        isCustom: false,
        baselineTitle: label,
      },
    ])
  }

  return (
    <div className="session-preset-phase-preview border rounded p-2 mb-2 bg-body-tertiary">
      <p className="small text-body-secondary mb-2 mb-0">
        Phases that will be created — quick confirm only.
      </p>
      <ul className="list-unstyled mb-2 small">
        {phases.map((ph, index) => {
          const customized =
            ph.isCustom || (ph.baselineTitle && ph.title !== ph.baselineTitle)
          return (
            <li
              key={ph.key}
              className="d-flex align-items-center gap-1 py-1 border-bottom border-light-subtle"
            >
              <span className="text-body-secondary" style={{ width: '1.25rem' }}>
                {index + 1}.
              </span>
              <span className="flex-grow-1">
                {customized ? <span className="me-1">★</span> : null}
                {ph.title}
              </span>
              <CButton
                size="sm"
                variant="ghost"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                aria-label="Move up"
              >
                ↑
              </CButton>
              <CButton
                size="sm"
                variant="ghost"
                disabled={disabled || index === phases.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Move down"
              >
                ↓
              </CButton>
              <CButton
                size="sm"
                variant="ghost"
                color="danger"
                disabled={disabled || phases.length <= 1}
                onClick={() => remove(index)}
                aria-label="Remove phase"
              >
                ×
              </CButton>
            </li>
          )
        })}
      </ul>
      <div className="d-flex flex-wrap gap-1 align-items-center">
        <CFormSelect
          size="sm"
          style={{ maxWidth: 140 }}
          value={addType}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value
            setAddType(v)
            setShowCustomInput(v === 'custom')
          }}
        >
          {PHASE_TYPE_CATALOG.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </CFormSelect>
        {showCustomInput ? (
          <CFormInput
            size="sm"
            className="flex-grow-1"
            style={{ minWidth: 120 }}
            placeholder="Phase name"
            value={customTitle}
            disabled={disabled}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
        ) : null}
        <CButton size="sm" color="primary" variant="outline" disabled={disabled} onClick={handleAdd}>
          + Add phase
        </CButton>
      </div>
    </div>
  )
}
