import React from 'react'
import { CButton } from '@coreui/react'

export default function PhaseMetricCounter({ value = 0, min = 0, max = 999, disabled = false, onChange }) {
  const n = Number(value) || 0
  return (
    <div className="phase-counter">
      <CButton
        type="button"
        size="sm"
        color="secondary"
        variant="outline"
        disabled={disabled || n <= min}
        onClick={() => onChange?.(Math.max(min, n - 1))}
      >
        −
      </CButton>
      <span className="phase-counter__value">{n}</span>
      <CButton
        type="button"
        size="sm"
        color="secondary"
        variant="outline"
        disabled={disabled || n >= max}
        onClick={() => onChange?.(Math.min(max, n + 1))}
      >
        +
      </CButton>
    </div>
  )
}
