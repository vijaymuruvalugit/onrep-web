import React from 'react'
import { CCard, CCardBody } from '@coreui/react'
import OperationalSessionBadge from './OperationalSessionBadge'
import OperationalSessionModeBadge from './OperationalSessionModeBadge'
import OperationalSessionActions from './OperationalSessionActions'
import { sessionDisplayTitle, sessionTimeRangeLabel } from '../helpers/sessionDisplay'
import { isLiveSession } from '../helpers/sessionActions'

/**
 * Scannable operational session card for the day board.
 * @param {{
 *   session: import('../types').OperationalSession,
 *   selected?: boolean,
 *   pinned?: boolean,
 *   primaryBusy?: boolean,
 *   onPrimary: (session: import('../types').OperationalSession, action: string) => void,
 *   onSelect?: (id: string) => void,
 * }} props
 */
export default function OperationalSessionCard({
  session: s,
  selected = false,
  pinned = false,
  primaryBusy = false,
  onPrimary,
  onSelect,
}) {
  if (!s?.id) return null
  const title = sessionDisplayTitle(s)
  const time = sessionTimeRangeLabel(s)
  const live = isLiveSession(s)

  const scheduleEditHref = s.batchId
    ? `/coach/schedule?batchId=${encodeURIComponent(s.batchId)}`
    : '/coach/schedule'

  return (
    <CCard
      className={[
        'op-session-card h-100',
        selected ? 'op-session-card--selected' : '',
        pinned || live ? 'op-session-card--live' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect?.(String(s.id))}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(String(s.id))
        }
      }}
    >
      <CCardBody className="d-flex flex-column gap-3 p-3 p-md-4">
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <OperationalSessionBadge state={s.state} />
            <OperationalSessionModeBadge mode={s.sessionMode} />
            {pinned ? (
              <span className="small fw-semibold text-success text-uppercase">Coaching now</span>
            ) : null}
          </div>
          <h3 className="h6 fw-semibold mb-1 text-body">{title}</h3>
          <p className="small text-body-secondary mb-0">{time}</p>
        </div>

        <dl className="op-session-card__meta small mb-0">
          <div className="op-session-card__meta-row">
            <dt>Place</dt>
            <dd>{s.placeName || '—'}</dd>
          </div>
          <div className="op-session-card__meta-row">
            <dt>Coach</dt>
            <dd>{s.coachName || '—'}</dd>
          </div>
          <div className="op-session-card__meta-row">
            <dt>Athletes</dt>
            <dd>{s.athleteCount > 0 ? s.athleteCount : '—'}</dd>
          </div>
        </dl>

        <div
          className="mt-auto pt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <OperationalSessionActions
            session={s}
            onPrimary={onPrimary}
            primaryBusy={primaryBusy}
            scheduleEditHref={scheduleEditHref}
          />
        </div>
      </CCardBody>
    </CCard>
  )
}
