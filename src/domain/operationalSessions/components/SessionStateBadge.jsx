import React from 'react'
import { CBadge } from '@coreui/react'
import { deriveSessionLifecycle } from '../../../features/skating/utils/sessionLifecycle'
import { operationalStateToLegacyOpsState } from '../helpers/stateLabels'

/**
 * @param {{ operationalState?: string|null, uiPaused?: boolean }} props
 */
export default function SessionStateBadge({ operationalState, uiPaused = false }) {
  const legacy = operationalStateToLegacyOpsState(operationalState)
  const { badgeColor, label } = deriveSessionLifecycle({
    opsState: legacy,
    uiPaused,
    operationalState,
  })
  return (
    <CBadge color={badgeColor} className="text-capitalize">
      {label}
    </CBadge>
  )
}
