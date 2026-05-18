import React from 'react'
import { CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'

function formatMs(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const sec = ms / 1000
  return sec >= 60 ? `${(sec / 60).toFixed(2)}m` : `${sec.toFixed(2)}s`
}

export default function LiveLeaderboard({ leaderboard }) {
  const entries = leaderboard?.entries || []
  if (entries.length === 0) {
    return <p className="small text-body-secondary mb-0">No results yet — tap finish order or enter times.</p>
  }

  return (
    <div className="live-leaderboard">
      <CTable small responsive className="mb-0 align-middle">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>#</CTableHeaderCell>
            <CTableHeaderCell>Athlete</CTableHeaderCell>
            <CTableHeaderCell>Time</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {entries
            .slice()
            .sort((a, b) => (a.finishRank ?? 999) - (b.finishRank ?? 999))
            .map((row) => (
              <CTableRow key={row.id || `${row.studentId}-${row.finishRank}`}>
                <CTableDataCell>{row.finishRank ?? '—'}</CTableDataCell>
                <CTableDataCell>
                  {row.studentName || 'Athlete'}
                  {row.isPersonalBest ? (
                    <span className="badge bg-success-subtle text-success-emphasis ms-1">PB</span>
                  ) : null}
                  {row.isSessionBest ? (
                    <span className="badge bg-primary-subtle text-primary-emphasis ms-1">Session</span>
                  ) : null}
                </CTableDataCell>
                <CTableDataCell>{formatMs(row.timeMs)}</CTableDataCell>
              </CTableRow>
            ))}
        </CTableBody>
      </CTable>
    </div>
  )
}
