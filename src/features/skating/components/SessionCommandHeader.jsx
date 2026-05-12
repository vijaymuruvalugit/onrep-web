import React from 'react'
import { CBadge, CButton } from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

export default function SessionCommandHeader({
  placeName,
  lifecycle,
  elapsedLabel,
  todaySummaryParts,
  guidanceLine,
  onPauseToggle,
  pauseLabel,
  onEnd,
  onStart,
  onSwitchSession,
  canStart,
  canPause,
  canEnd,
}) {
  return (
    <div className="session-command-header border-bottom pb-3 mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <strong className="me-2">{SESSION_OPS_COPY.liveSessionTitle}</strong>
          <CBadge color={lifecycle.badgeColor}>{lifecycle.label}</CBadge>
          {placeName ? <span className="small text-body-secondary ms-2">{placeName}</span> : null}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {canStart ? (
            <CButton size="sm" color="success" onClick={onStart}>
              Start
            </CButton>
          ) : null}
          {canPause ? (
            <CButton size="sm" color="warning" variant="outline" onClick={onPauseToggle}>
              {pauseLabel}
            </CButton>
          ) : null}
          {canEnd ? (
            <CButton size="sm" color="dark" variant="outline" onClick={onEnd}>
              End
            </CButton>
          ) : null}
          {onSwitchSession ? (
            <CButton
              size="sm"
              color="link"
              className="text-decoration-none"
              onClick={onSwitchSession}
            >
              {SESSION_OPS_COPY.switchSession}
            </CButton>
          ) : null}
        </div>
      </div>
      {elapsedLabel ? (
        <div className="small fw-medium text-body mb-1" aria-live="polite">
          {elapsedLabel}
        </div>
      ) : null}
      {todaySummaryParts?.length ? (
        <div className="small text-body-secondary skating-today-summary mb-2" aria-live="polite">
          {todaySummaryParts.join(' · ')}
        </div>
      ) : null}
      {guidanceLine ? (
        <div className="small text-body-secondary fst-italic">{guidanceLine}</div>
      ) : null}
    </div>
  )
}
