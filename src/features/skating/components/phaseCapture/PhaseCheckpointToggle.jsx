import React from 'react'
import { CFormCheck } from '@coreui/react'

export default function PhaseCheckpointToggle({ label, checked = false, disabled = false, onChange }) {
  return (
    <CFormCheck
      type="checkbox"
      label={label}
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)}
    />
  )
}
