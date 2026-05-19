import React from 'react'
import { CButton } from '@coreui/react'

export default function CaptureProgressButton({ label, disabled, busy, onCapture }) {
  return (
    <CButton
      type="button"
      color="warning"
      size="lg"
      className="w-100 capture-progress-btn fw-bold activity-runs-sticky-action"
      disabled={disabled || busy}
      onClick={onCapture}
    >
      {label}
    </CButton>
  )
}
