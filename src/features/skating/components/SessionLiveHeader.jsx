import React from 'react'
import { CBadge, CButton } from '@coreui/react'
import { liveLabel } from '../constants/coachLiveLabels'

/**
 * Compact sticky session header for live coaching.
 */
export default function SessionLiveHeader({
  placeName,
  sessionTitle,
  phaseLabel,
  athleteCount = 0,
  lifecycle,
  elapsedLabel,
  isRaceMode = false,
  onPauseToggle,
  pauseLabel,
  onEnd,
  onStart,
  onSwitchSession,
  canStart,
  canPause,
  canEnd,
  onRaceFocus,
}) {
  const skaterWord = athleteCount === 1 ? 'skater' : 'skaters'

  return (
    <header className="session-live-header" data-testid="session-live-header">
      <div className="session-live-header__row">
        <div className="session-live-header__meta">
          <div className="session-live-header__title text-truncate">
            {sessionTitle || placeName || 'Session'}
          </div>
          <div className="session-live-header__sub small text-body-secondary text-truncate">
            Live
            {phaseLabel ? (
              <>
                <span className="opacity-50 mx-1">·</span>
                {phaseLabel}
              </>
            ) : null}
            <span className="opacity-50 mx-1">·</span>
            {athleteCount} {skaterWord}
          </div>
        </div>
        <div className="session-live-header__actions d-flex flex-wrap gap-1 justify-content-end">
          {canStart ? (
            <CButton size="sm" color="success" onClick={onStart}>
              {liveLabel('start')}
            </CButton>
          ) : null}
          {canPause ? (
            <CButton size="sm" color="warning" variant="outline" onClick={onPauseToggle}>
              {pauseLabel}
            </CButton>
          ) : null}
          {canEnd ? (
            <CButton size="sm" color="dark" variant="outline" onClick={onEnd}>
              {liveLabel('end')}
            </CButton>
          ) : null}
          {isRaceMode && onRaceFocus ? (
            <CButton size="sm" color="danger" variant="outline" onClick={onRaceFocus}>
              {liveLabel('race')}
            </CButton>
          ) : null}
        </div>
      </div>
      <div className="session-live-header__badges d-flex flex-wrap align-items-center gap-2 mt-1">
        {lifecycle ? <CBadge color={lifecycle.badgeColor}>{lifecycle.label}</CBadge> : null}
        {elapsedLabel ? (
          <span className="small fw-medium" aria-live="polite">
            {elapsedLabel}
          </span>
        ) : null}
        {placeName && sessionTitle ? (
          <span className="small text-body-secondary text-truncate">{placeName}</span>
        ) : null}
      </div>
    </header>
  )
}
