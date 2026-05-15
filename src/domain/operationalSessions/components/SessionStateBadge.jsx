import React from 'react'
import OperationalSessionBadge from './OperationalSessionBadge'

/**
 * @param {{ operationalState?: string|null, uiPaused?: boolean }} props
 */
export default function SessionStateBadge({ operationalState, uiPaused = false }) {
  const state = uiPaused ? 'paused' : operationalState
  return <OperationalSessionBadge state={state} />
}
