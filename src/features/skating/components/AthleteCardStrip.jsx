import React, { useMemo } from 'react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

const STATUS_SUBLINE = {
  resting: 'Rest',
  injured: 'Injured',
  skipped: 'Skip',
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
 * Sticky horizontal athlete navigation — [Name • Phase|Status], tap selects workspace.
 */
export default function AthleteCardStrip({
  rows = [],
  lapStudentId,
  observedStudentIds,
  participationByStudentId = {},
  athletePhaseLabelByStudentId = {},
  onPickSkater,
  onAddAthletesRequest,
}) {
  const enriched = useMemo(
    () =>
      (rows || []).map((r) => {
        const sid = String(r.id)
        const placement = participationByStudentId[sid]
        const status = placement?.status || 'active'
        const phaseLabel = athletePhaseLabelByStudentId[sid] || ''
        const statusSub = STATUS_SUBLINE[status]
        const subline =
          status !== 'active' && statusSub ? statusSub : phaseLabel || '—'
        return {
          sid,
          fullName: r.full_name,
          shortName: firstName(r.full_name),
          subline,
          hasSignal: observedStudentIds?.has?.(sid),
        }
      }),
    [rows, observedStudentIds, participationByStudentId, athletePhaseLabelByStudentId],
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
    <div className="athlete-card-strip" data-testid="athlete-card-strip">
      <div className="athlete-card-strip__scroll" role="list">
        {enriched.map((a) => {
          const selected = String(lapStudentId) === a.sid
          return (
            <button
              key={a.sid}
              type="button"
              role="listitem"
              className={`athlete-card${selected ? ' athlete-card--selected' : ''}${
                a.hasSignal ? ' athlete-card--has-signal' : ''
              }`}
              data-athlete-id={a.sid}
              aria-pressed={selected}
              onClick={() => onPickSkater(a.sid)}
            >
              <span className="athlete-card__avatar" aria-hidden>
                {initials(a.fullName)}
              </span>
              <span className="athlete-card__label">
                <span className="athlete-card__name">{a.shortName}</span>
                <span className="athlete-card__sep" aria-hidden>
                  {' '}
                  ·{' '}
                </span>
                <span className="athlete-card__phase">{a.subline}</span>
              </span>
              {a.hasSignal ? <span className="athlete-card__signal" aria-hidden /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
