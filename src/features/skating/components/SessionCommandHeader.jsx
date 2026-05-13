import React from 'react'
import { CBadge, CButton } from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

export default function SessionCommandHeader({
  placeName,
  lifecycle,
  elapsedLabel,
  todaySummaryParts,
  guidanceLine,
  /** Optional next-step taps (e.g. Add athletes) — keep sparse; primary actions stay in the header button row. */
  guidanceActions,
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
        <div className="d-flex flex-wrap align-items-center gap-2">
          <strong>{SESSION_OPS_COPY.liveSessionTitle}</strong>
          <CBadge color={lifecycle.badgeColor}>{lifecycle.label}</CBadge>
          {elapsedLabel ? (
            <span className="small fw-medium text-body" aria-live="polite">
              {elapsedLabel}
            </span>
          ) : null}
          {placeName ? <span className="small text-body-secondary">{placeName}</span> : null}
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
      {todaySummaryParts?.length ? (
        <div className="small text-body-secondary skating-today-summary mb-2" aria-live="polite">
          {todaySummaryParts.join(' · ')}
        </div>
      ) : null}
      {guidanceLine ? (
        <div className="small text-body-secondary fst-italic">{guidanceLine}</div>
      ) : null}
      {guidanceActions?.length ? (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
          {guidanceActions.map((a) => (
            <CButton
              key={a.key}
              type="button"
              size="sm"
              color={a.color || 'primary'}
              variant={a.variant || 'outline'}
              onClick={a.onClick}
            >
              {a.label}
            </CButton>
          ))}
        </div>
      ) : null}
    </div>
  )
}
