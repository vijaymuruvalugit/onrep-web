import React from 'react'
import { CBadge, CButton, CTableDataCell, CTableRow } from '@coreui/react'
import SessionStateBadge from './SessionStateBadge'

function formatTime(isoOrDate) {
  if (!isoOrDate) return '—'
  try {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

/**
 * @param {{
 *   session: import('../types').OperationalSession,
 *   selected?: boolean,
 *   onSelect: (id: string) => void,
 *   uiPaused?: boolean,
 * }} props
 */
export default function OperationalSessionCard({
  session: s,
  selected = false,
  onSelect,
  uiPaused = false,
}) {
  if (!s?.id) return null
  const whenParts = []
  if (s.sessionDate) whenParts.push(String(s.sessionDate).slice(0, 10))
  const startIso = s.actualStartAt || s.scheduledStartAt
  if (startIso) whenParts.push(formatTime(startIso))
  const endIso = s.actualEndAt || s.scheduledEndAt
  if (endIso) whenParts.push(`→ ${formatTime(endIso)}`)

  return (
    <CTableRow
      className={selected ? 'table-active' : ''}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(String(s.id))}
    >
      <CTableDataCell>{whenParts.join(' · ') || '—'}</CTableDataCell>
      <CTableDataCell>{s.placeName || s.batchName || '—'}</CTableDataCell>
      <CTableDataCell>
        <SessionStateBadge operationalState={s.state} uiPaused={uiPaused} />
        {s.athleteCount > 0 ? (
          <CBadge color="light" className="ms-1 text-dark border">
            {s.athleteCount} athletes
          </CBadge>
        ) : null}
      </CTableDataCell>
      <CTableDataCell className="text-end">
        <CButton
          size="sm"
          color="primary"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(String(s.id))
          }}
        >
          Open
        </CButton>
      </CTableDataCell>
    </CTableRow>
  )
}
