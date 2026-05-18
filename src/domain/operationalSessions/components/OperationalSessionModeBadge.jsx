import React from 'react'
import { CBadge } from '@coreui/react'
import { sessionModeBadgeColor, sessionModeLabel } from '../constants/sessionModes'

/**
 * Compact coaching-mode badge (Practice, Assessment, …).
 * @param {{ mode?: string|null, className?: string }} props
 */
export default function OperationalSessionModeBadge({ mode, className = '' }) {
  const label = sessionModeLabel(mode)
  const color = sessionModeBadgeColor(mode)
  return (
    <CBadge
      color={color}
      className={['text-capitalize op-session-mode-badge', className].filter(Boolean).join(' ')}
      data-testid="op-session-mode-badge"
    >
      {label}
    </CBadge>
  )
}
