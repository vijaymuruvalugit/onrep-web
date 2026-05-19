import React from 'react'
import { CFormTextarea } from '@coreui/react'

/** Note capture — drawer / detail only. */
export default function PhaseObservationNote({ value = '', disabled = false, onChange, rows = 2 }) {
  return (
    <CFormTextarea
      className="phase-note"
      rows={rows}
      value={value}
      disabled={disabled}
      placeholder="Observation…"
      onChange={(e) => onChange?.(e.target.value)}
    />
  )
}
