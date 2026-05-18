import React from 'react'
import { CBadge, CButton } from '@coreui/react'
import {
  formatOperationalSessionRange,
  normalizeSessionDateYmd,
  effectiveOperationalSessionDateYmd,
} from '../../classes/utils/sessionDisplay'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { sessionTypeLabel } from '../constants/sessionTypes'
import OperationalSessionModeBadge from '../../../domain/operationalSessions/components/OperationalSessionModeBadge'
import { isOperationalOneOff, isOperationalRecurring } from '../../classes/utils/sessionRow'
import { canMarkSessionAttendance } from '../../../domain/operationalSessions/helpers/attendanceEligibility'

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
  onViewSession,
  /** When true, show Start — calls onStartSession(row) after confirm (parent handles navigation + API). */
  canStartToday = false,
  /** When true, show Mark attendance — session is active or closed; parent navigates to attendance. */
  canMarkAttendanceToday = false,
  onStartSession,
  onMarkAttendance,
}) {
  const calendarYmd =
    effectiveOperationalSessionDateYmd(row) || normalizeSessionDateYmd(row.sessionDate ?? row.session_date)
  const ymd = normalizeSessionDateYmd(calendarYmd)
  const isToday = Boolean(todayIso && ymd === todayIso)
  const dateLine = formatOperationalSessionRange(
    calendarYmd || (row.sessionDate ?? row.session_date),
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
  const markAllowed = canMarkSessionAttendance(row)
  const oneOffRow = isOperationalOneOff(row)
  const recurringRow = isOperationalRecurring(row)

  return (
    <div
      className={[
        'onrep-session-row',
        isToday ? 'onrep-session-row--today' : '',
        row.isCancelled ? 'onrep-session-row--cancelled' : '',
        oneOffRow ? 'onrep-session-row--one-off' : '',
        recurringRow ? 'onrep-session-row--recurring' : '',
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
            {oneOffRow ? (
              <CBadge color="primary" className="rounded-pill fw-normal px-2 py-0 opacity-75">
                One-off
              </CBadge>
            ) : null}
            {recurringRow ? (
              <CBadge color="secondary" className="rounded-pill fw-normal px-2 py-0 opacity-75">
                Recurring
              </CBadge>
            ) : null}
            <OperationalSessionModeBadge mode={row.sessionMode} className="rounded-pill fw-normal" />
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
          {canMarkAttendanceToday &&
          markAllowed &&
          !attendanceBlocked &&
          typeof onMarkAttendance === 'function' ? (
            <CButton
              type="button"
              size="sm"
              color="primary"
              className="px-3"
              onClick={() => onMarkAttendance(row)}
            >
              Mark attendance
            </CButton>
          ) : null}
          {canStartToday && !attendanceBlocked && typeof onStartSession === 'function' ? (
            <CButton
              type="button"
              size="sm"
              color="primary"
              className="px-3"
              onClick={() => onStartSession(row)}
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
