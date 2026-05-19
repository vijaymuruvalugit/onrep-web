import React from 'react'
import { CButton } from '@coreui/react'

export default function PenaltyStepper({ value = 0, disabled, onChange, label = 'Penalties' }) {
  const n = Math.max(0, Math.round(Number(value) || 0))
  return (
    <div className="penalty-stepper d-flex align-items-center gap-3">
      <span className="fw-semibold">{label}</span>
      <CButton
        type="button"
        size="lg"
        color="light"
        disabled={disabled || n <= 0}
        onClick={() => onChange?.(n - 1)}
      >
        −
      </CButton>
      <span className="fs-4 font-monospace">{n}</span>
      <CButton type="button" size="lg" color="light" disabled={disabled} onClick={() => onChange?.(n + 1)}>
        +
      </CButton>
    </div>
  )
}
