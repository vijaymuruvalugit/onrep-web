import React from 'react'
import { CAlert, CCard, CCardBody } from '@coreui/react'
import ActiveSessionWorkspaceShell from '../components/ActiveSessionWorkspaceShell'
import SkatingOpsWorkspaceChrome from '../components/SkatingOpsWorkspaceChrome'
import CoachLiveSessionView from '../components/CoachLiveSessionView'
import CoachLiveTimingSection from '../components/CoachLiveTimingSection'
import CoachLiveRecentLaps from '../components/CoachLiveRecentLaps'

/**
 * In-session workspace — shell renders first; sync domains enrich without remounting.
 */
export default function SkatingOpsSessionWorkspace({
  selSession,
  onBack,
  syncError,
  shellError,
  reEntryWarmth,
  unifiedLiveCoaching,
  liveViewProps,
}) {
  const err = syncError || shellError

  return (
    <>
      <SkatingOpsWorkspaceChrome session={selSession ?? null} onBack={onBack} />
      <ActiveSessionWorkspaceShell>
        <CCard className={`mb-3${liveViewProps.opsState === 'active' ? ' coach-session-live' : ''}`}>
          <CCardBody>
            {err ? <CAlert color="danger">{err}</CAlert> : null}
            {reEntryWarmth ? (
              <div className="small text-body-secondary skating-reentry-hint mb-2 px-1 py-1 rounded">
                {reEntryWarmth}
              </div>
            ) : null}
            {unifiedLiveCoaching && selSession ? (
              <CoachLiveSessionView {...liveViewProps} />
            ) : null}
          </CCardBody>
        </CCard>
      </ActiveSessionWorkspaceShell>
    </>
  )
}

export function buildLiveTimingSection(props) {
  return <CoachLiveTimingSection {...props} />
}

export function buildRecentLapsSection(props) {
  return <CoachLiveRecentLaps {...props} />
}
