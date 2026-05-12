import React from 'react'
import { CButton, CFormInput } from '@coreui/react'
import SessionAthleteGrid from './SessionAthleteGrid'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

/** Left column — sole athlete picker for live capture; empty states include CTA. */
export default function AthletesInSessionPanel({
  coachLive,
  rosterFiltered,
  lapStudentId,
  onPickSkater,
  onOpenSideCapture,
  rosterFilter,
  onRosterFilterChange,
  onAddAthletesRequest,
  listRef,
}) {
  const hasRows = rosterFiltered?.length > 0

  return (
    <div ref={listRef} className="athletes-in-session-panel" tabIndex={-1}>
      <div
        className={`small text-body-secondary mb-1${coachLive ? ' coach-recede coach-recede-latent' : ''}`}
      >
        {SESSION_OPS_COPY.athletesInSession} ({rosterFiltered?.length ?? 0})
      </div>
      <CFormInput
        size="sm"
        className={`mb-2${coachLive ? ' coach-recede coach-recede-latent' : ''}`}
        placeholder={SESSION_OPS_COPY.rosterFilterPlaceholder}
        value={rosterFilter}
        onChange={(e) => onRosterFilterChange(e.target.value)}
      />
      {!hasRows ? (
        <div className="border rounded p-3 bg-body-tertiary text-center">
          <div className="fw-semibold text-body-secondary mb-1">
            {SESSION_OPS_COPY.emptyRosterTitle}
          </div>
          <p className="small text-body-secondary mb-3">{SESSION_OPS_COPY.emptyRosterBody}</p>
          {onAddAthletesRequest ? (
            <CButton color="primary" size="sm" onClick={onAddAthletesRequest}>
              {SESSION_OPS_COPY.emptyRosterCta}
            </CButton>
          ) : null}
        </div>
      ) : (
        <SessionAthleteGrid
          rows={rosterFiltered}
          lapStudentId={lapStudentId}
          onPickSkater={onPickSkater}
          showRosterSource={Boolean(import.meta.env?.DEV)}
          onOpenSideCapture={onOpenSideCapture}
          sidePanelLabel={SESSION_OPS_COPY.sidePanel}
        />
      )}
    </div>
  )
}
