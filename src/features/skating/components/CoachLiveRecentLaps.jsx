import React, { memo } from 'react'
import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

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

function lapSecondsFromRow(row) {
  const ms = row?.lapMs != null ? row.lapMs : row?.lap_ms
  if (ms == null) return '—'
  return (Number(ms) / 1000).toFixed(2)
}

function raceLabelForLap(row, races) {
  if (!row?.raceId) return '—'
  const rc = (races || []).find((r) => String(r.id) === String(row.raceId))
  return rc?.label || rc?.groupName || 'Lane'
}

function CoachLiveRecentLaps({
  recentLaps,
  recentLapCount,
  races,
  showTimingLaneColumn,
  expanded,
  onToggleExpanded,
  syncing,
}) {
  const laps = recentLaps || []
  if (laps.length === 0) {
    if (syncing) {
      return (
        <div className="coach-live-recent-laps mt-3 small text-body-secondary">
          {SESSION_OPS_COPY.recentLapsTitle}…
        </div>
      )
    }
    return null
  }

  return (
    <div className="coach-live-recent-laps mt-3" data-testid="coach-live-recent-laps">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
        <span className="fw-semibold">{SESSION_OPS_COPY.recentLapsTitle}</span>
        {laps.length > 6 ? (
          <CButton color="link" size="sm" className="p-0" onClick={onToggleExpanded}>
            {expanded ? 'Show fewer' : `Show all (${recentLapCount || laps.length})`}
          </CButton>
        ) : null}
      </div>
      <div className="table-responsive">
        <CTable small responsive hover className="mb-0 coach-live-laps-table">
          <CTableHead color="light">
            <CTableRow>
              <CTableHeaderCell>Time</CTableHeaderCell>
              <CTableHeaderCell>Skater</CTableHeaderCell>
              {showTimingLaneColumn ? (
                <CTableHeaderCell>{SESSION_OPS_COPY.timingLaneColumn}</CTableHeaderCell>
              ) : null}
              <CTableHeaderCell className="text-end">Lap</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {(expanded ? laps : laps.slice(0, 6)).map((row) => (
              <CTableRow key={row.id}>
                <CTableDataCell className="text-nowrap">
                  {formatTime(row.recordedAt ?? row.recorded_at)}
                </CTableDataCell>
                <CTableDataCell>
                  {row.studentName ?? row.student_full_name ?? row.student_id}
                </CTableDataCell>
                {showTimingLaneColumn ? (
                  <CTableDataCell className="small">{raceLabelForLap(row, races)}</CTableDataCell>
                ) : null}
                <CTableDataCell className="text-end font-monospace">
                  {lapSecondsFromRow(row)}
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </div>
    </div>
  )
}

export default memo(CoachLiveRecentLaps)
