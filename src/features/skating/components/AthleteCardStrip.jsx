import React, { useMemo } from 'react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import './AthleteCardStrip.css'

const STATUS_LABEL = {
  resting: 'Resting',
  injured: 'Injured',
  skipped: 'Skipped',
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

function firstName(name) {
  return String(name || 'Athlete').trim().split(/\s+/)[0] || 'Athlete'
}

/**
 * Compact horizontal athlete strip — avatar, name, optional status dot.
 */
export default function AthleteCardStrip({
  rows = [],
  lapStudentId,
  observedStudentIds,
  participationByStudentId = {},
  athletePhaseLabelByStudentId: _athletePhaseLabelByStudentId,
  onPickSkater,
  onAddAthletesRequest,
  suppressPhaseSubline: _suppressPhaseSubline,
  /** 'tiles' — avatar + name tiles with horizontal scroll (Skating Ops live) */
  variant = 'default',
}) {
  const useTiles = variant === 'tiles'
  const enriched = useMemo(
    () =>
      (rows || []).map((r) => {
        const sid = String(r.id)
        const placement = participationByStudentId[sid]
        const status = placement?.status || 'active'
        return {
          sid,
          fullName: r.full_name,
          shortName: firstName(r.full_name),
          status,
          statusLabel: STATUS_LABEL[status] || null,
          hasSignal: observedStudentIds?.has?.(sid),
        }
      }),
    [rows, observedStudentIds, participationByStudentId],
  )

  if (!enriched.length) {
    return (
      <div className="athlete-card-strip athlete-card-strip--empty" data-testid="athlete-card-strip">
        <span className="small text-body-secondary">{SESSION_OPS_COPY.emptyRosterTitle}</span>
        {onAddAthletesRequest ? (
          <button type="button" className="btn btn-sm btn-link p-0" onClick={onAddAthletesRequest}>
            {SESSION_OPS_COPY.emptyRosterCta}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`athlete-card-strip${useTiles ? ' athlete-card-strip--tiles' : ''}`}
      data-testid="athlete-card-strip"
    >
      <div className="athlete-card-strip__scroll" role="list">
        {enriched.map((a) => {
          const selected = String(lapStudentId) === a.sid
          const showStatusDot = a.status !== 'active' && a.statusLabel
          return (
            <button
              key={a.sid}
              type="button"
              role="listitem"
              className={`athlete-card${useTiles ? ' athlete-card--tile' : ''}${selected ? ' athlete-card--selected' : ''}${
                a.hasSignal ? ' athlete-card--has-signal' : ''
              }`}
              data-athlete-id={a.sid}
              data-testid={`athlete-card-${a.sid}`}
              aria-pressed={selected}
              aria-label={
                showStatusDot
                  ? `${a.shortName}, ${a.statusLabel}`
                  : a.shortName
              }
              onClick={() => onPickSkater(a.sid)}
            >
              <span className="athlete-card__avatar-wrap">
                <span className="athlete-card__avatar" aria-hidden>
                  {initials(a.fullName)}
                </span>
                {showStatusDot ? (
                  <span
                    className={`athlete-card__status-dot athlete-card__status-dot--${a.status}`}
                    title={a.statusLabel}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="athlete-card__name">{a.shortName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
