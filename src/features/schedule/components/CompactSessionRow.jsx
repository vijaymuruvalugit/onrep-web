import React from 'react'
import { Link } from 'react-router-dom'
import { CBadge, CButton } from '@coreui/react'
import {
  formatOperationalSessionRange,
  normalizeSessionDateYmd,
} from '../../classes/utils/sessionDisplay'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { sessionTypeLabel } from '../constants/sessionTypes'

function shortPlaceLabel(raw, maxLen = 42) {
  const s = stripDemoSuffix(String(raw || '').trim())
  if (!s) return ''
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

/**
 * Compact operational row — primary action opens session drawer.
 */
export default function CompactSessionRow({
  row,
  todayIso,
  placeFallback = '',
  attendancePath,
  onViewSession,
  /** When true, show a prominent Start link for attendance */
  canStartToday = false,
}) {
  const ymd = normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
  const isToday = Boolean(todayIso && ymd === todayIso)
  const dateLine = formatOperationalSessionRange(
    row.sessionDate ?? row.session_date,
    row.startTime ?? row.start_time,
    row.endTime ?? row.end_time,
    todayIso,
  )
  const rawPlace = row.placeName || row.location || placeFallback
  const place = shortPlaceLabel(rawPlace)
  const sid = row.sessionId || row.id
  const displayTitle =
    (row.title && String(row.title).trim()) || (row.batchName && String(row.batchName).trim()) || ''
  const typeLabel = sessionTypeLabel(row.sessionType ?? row.session_type)
  const hasActual = Boolean(row.actualStartTime || row.actualEndTime)
  const attendanceBlocked = row.attendanceEnabled === false || row.attendance_enabled === false
  return (
    <div
      className={[
        'onrep-session-row',
        isToday ? 'onrep-session-row--today' : '',
        row.isCancelled ? 'onrep-session-row--cancelled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="onrep-session-row__grid">
        <div className="onrep-session-row__stack">
          <div className="onrep-session-row__date onrep-type-level2">{dateLine}</div>
          <div className="onrep-session-row__meta onrep-type-muted">
            {place ? <span className="onrep-session-row__place">{place}</span> : null}
            {row.isExtraSession && !row.isOneTime ? (
              <span className="onrep-session-row__extra">{place ? ' · ' : ''}Extra</span>
            ) : null}
          </div>
          {displayTitle ? (
            <div className="onrep-session-row__title onrep-type-level2 text-truncate">
              {displayTitle}
            </div>
          ) : null}
          <div className="onrep-session-row__chips d-flex flex-wrap gap-1 align-items-center">
            {row.isOneTime ? (
              <CBadge color="primary" className="rounded-pill fw-normal px-2 py-0 opacity-75">
                One-time
              </CBadge>
            ) : null}
            {typeLabel ? (
              <CBadge color="light" className="text-dark border rounded-pill fw-normal px-2 py-0">
                {typeLabel}
              </CBadge>
            ) : null}
            {row.isCancelled ? (
              <CBadge color="secondary" className="rounded-pill fw-normal px-2 py-0">
                Cancelled
              </CBadge>
            ) : null}
            {hasActual ? (
              <CBadge color="light" className="text-dark border rounded-pill fw-normal px-2 py-0">
                Timing adjusted
              </CBadge>
            ) : null}
          </div>
        </div>
        <div className="onrep-session-row__actions">
          {canStartToday && attendancePath && !attendanceBlocked ? (
            <CButton
              as={Link}
              to={attendancePath}
              size="sm"
              color="primary"
              className="text-decoration-none px-3"
            >
              Start
            </CButton>
          ) : null}
          {onViewSession && sid ? (
            <CButton
              size="sm"
              color="link"
              className="onrep-session-row__cta text-decoration-none px-2 py-1"
              onClick={() => onViewSession(String(sid), row)}
            >
              View session
            </CButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
