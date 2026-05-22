import React, { useMemo } from 'react'
import { CBadge, CListGroup, CListGroupItem } from '@coreui/react'
import { buildParticipationTimeline, summarizeParticipation } from '../utils/participationMappers'
import { formatShortDate } from '../../parent/utils/formatParentDate'
import './ParticipationTimeline.scss'

const STATUS_BADGE = {
  present: { color: 'success', label: 'Attended' },
  absent: { color: 'danger', label: 'Missed' },
  unknown: { color: 'secondary', label: '—' },
}

/**
 * Canonical read-only participation history — attended/missed sessions over time.
 * @param {{ rows?: ReadonlyArray<object>, showStudentName?: boolean, emptyMessage?: string }} props
 */
export default function ParticipationTimeline({
  rows = [],
  showStudentName = false,
  emptyMessage = 'No session participation records yet.',
}) {
  const events = useMemo(() => buildParticipationTimeline(rows), [rows])
  const summary = useMemo(() => summarizeParticipation(events), [events])

  if (!events.length) {
    return <p className="small text-body-secondary mb-0">{emptyMessage}</p>
  }

  return (
    <div className="onrep-participation-timeline">
      <div className="onrep-participation-timeline__summary d-flex flex-wrap gap-2 mb-3">
        {summary.rate != null ? (
          <span className="badge bg-body-secondary text-dark">
            Consistency {summary.rate}%
          </span>
        ) : null}
        {summary.streak > 0 ? (
          <span className="badge bg-success-subtle text-success-emphasis">
            {summary.streak} session streak
          </span>
        ) : null}
        {summary.missed > 0 ? (
          <span className="badge bg-warning-subtle text-warning-emphasis">
            {summary.missed} missed
          </span>
        ) : null}
      </div>
      <CListGroup flush className="onrep-participation-timeline__list border rounded overflow-hidden">
        {events.map((e) => {
          const badge = STATUS_BADGE[e.status] || STATUS_BADGE.unknown
          return (
            <CListGroupItem
              key={e.id}
              className="onrep-participation-timeline__item d-flex justify-content-between align-items-start gap-2 py-2 px-3"
            >
              <div className="min-w-0">
                <div className="fw-semibold text-truncate">{e.sessionTitle}</div>
                <div className="small text-body-secondary">
                  {formatShortDate(e.sessionDate || e.markedAt)}
                  {showStudentName && e.studentName ? ` · ${e.studentName}` : ''}
                </div>
              </div>
              <CBadge color={badge.color} className="flex-shrink-0">
                {badge.label}
              </CBadge>
            </CListGroupItem>
          )
        })}
      </CListGroup>
    </div>
  )
}
