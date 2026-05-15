import React from 'react'
import { CButton } from '@coreui/react'
import OperationalSessionBadge from '../../../domain/operationalSessions/components/OperationalSessionBadge'
import { sessionDisplayTitle, sessionTimeRangeLabel } from '../../../domain/operationalSessions/helpers/sessionDisplay'
import { SKATING_OPS_COPY } from '../constants/skatingOpsCopy'

/**
 * @param {{
 *   session: import('../../../domain/operationalSessions/types').OperationalSession|null,
 *   onBack: () => void,
 * }} props
 */
export default function SkatingOpsWorkspaceChrome({ session, onBack }) {
  const title = session ? sessionDisplayTitle(session) : SKATING_OPS_COPY.workspaceHint
  const time = session ? sessionTimeRangeLabel(session) : ''

  return (
    <header
      className="skating-ops-workspace-chrome d-flex flex-wrap align-items-center gap-3"
      data-testid="skating-ops-workspace-chrome"
    >
      <CButton color="link" className="p-0 text-decoration-none" onClick={onBack}>
        ← {SKATING_OPS_COPY.backToDayBoard}
      </CButton>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <h2 className="h5 fw-semibold mb-0 text-truncate">{title}</h2>
          {session ? <OperationalSessionBadge state={session.state} /> : null}
        </div>
        {time ? <p className="small text-body-secondary mb-0">{time}</p> : null}
      </div>
    </header>
  )
}
