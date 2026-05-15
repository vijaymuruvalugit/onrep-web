import React from 'react'
import { CBadge } from '@coreui/react'
import {
  operationalStateBadgeColor,
  operationalStateDisplayLabel,
} from '../helpers/stateLabels'

/**
 * Distinct operational state badge for day-board cards.
 * @param {{ state?: string|null, className?: string }} props
 */
export default function OperationalSessionBadge({ state, className = '' }) {
  const label = operationalStateDisplayLabel(state)
  const color = operationalStateBadgeColor(state)
  const s = String(state || '').toLowerCase()
  const extra =
    s === 'active' ? 'op-session-badge--live' : s === 'paused' ? 'op-session-badge--paused' : ''
  return (
    <CBadge color={color} className={`op-session-badge ${extra} ${className}`.trim()}>
      {label}
    </CBadge>
  )
}
