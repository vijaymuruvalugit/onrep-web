import React from 'react'
import { CButtonGroup, CButton } from '@coreui/react'

export default function CaptureModeToggle({ mode = 'full', disabled = false, onChange }) {
  return (
    <CButtonGroup size="sm" className="capture-mode-toggle" aria-label="Capture mode">
      <CButton
        type="button"
        color={mode === 'fast' ? 'primary' : 'secondary'}
        variant={mode === 'fast' ? undefined : 'outline'}
        disabled={disabled}
        onClick={() => onChange?.('fast')}
      >
        Quick capture
      </CButton>
      <CButton
        type="button"
        color={mode === 'full' ? 'primary' : 'secondary'}
        variant={mode === 'full' ? undefined : 'outline'}
        disabled={disabled}
        onClick={() => onChange?.('full')}
      >
        Detailed
      </CButton>
    </CButtonGroup>
  )
}
