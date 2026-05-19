import React from 'react'
import { CButton, CFormInput, CFormLabel } from '@coreui/react'

export default function ProgressSetupPanel({
  experience,
  targetCount,
  distanceLabel,
  disabled,
  onTargetChange,
  onDistanceChange,
}) {
  return (
    <div className="progress-setup-panel">
      <CFormLabel className="small fw-semibold">
        {experience.progressionPluralLabel} target
      </CFormLabel>
      <div className="d-flex align-items-center gap-2 mb-3">
        <CButton
          type="button"
          color="light"
          disabled={disabled || targetCount <= 1}
          onClick={() => onTargetChange?.(targetCount - 1)}
        >
          −
        </CButton>
        <CFormInput
          type="number"
          min={1}
          max={100}
          value={targetCount}
          disabled={disabled}
          onChange={(e) => onTargetChange?.(Number(e.target.value))}
          className="text-center fw-bold"
        />
        <CButton
          type="button"
          color="light"
          disabled={disabled || targetCount >= 100}
          onClick={() => onTargetChange?.(targetCount + 1)}
        >
          +
        </CButton>
      </div>
      <CFormLabel className="small text-body-secondary">Distance (optional)</CFormLabel>
      <CFormInput
        type="text"
        placeholder="400m"
        value={distanceLabel || ''}
        disabled={disabled}
        onChange={(e) => onDistanceChange?.(e.target.value)}
      />
    </div>
  )
}
