import React from 'react'
import { CBadge, CButton, CTable, CTableBody, CTableDataCell, CTableRow } from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

/**
 * One row per resolved session athlete — tap selects skater for capture; optional roster source in dev.
 */
export default function SessionAthleteGrid({
  rows,
  lapStudentId,
  onPickSkater,
  showRosterSource,
  onOpenSideCapture,
}) {
  if (!rows?.length) {
    return (
      <div className="border rounded p-3 bg-body-tertiary">
        <div className="fw-semibold text-body-secondary mb-1">{SESSION_OPS_COPY.emptyRosterTitle}</div>
        <p className="small text-body-secondary mb-2 mb-0">{SESSION_OPS_COPY.emptyRosterBody}</p>
        <p className="small text-muted mt-2 mb-0">{SESSION_OPS_COPY.emptyRosterCta}</p>
      </div>
    )
  }

  return (
    <div className="table-responsive border rounded" style={{ maxHeight: 280 }}>
      <CTable bordered small responsive className="mb-0">
        <CTableBody>
          {rows.map((r) => (
            <CTableRow
              key={r.id}
              className={`${String(lapStudentId) === String(r.id) ? 'table-active skating-active-skater-row' : ''}`}
            >
              <CTableDataCell
                className="py-1"
                style={{ cursor: 'pointer' }}
                onClick={() => onPickSkater(String(r.id))}
              >
                <span>{r.full_name}</span>
                {showRosterSource && r.rosterSource ? (
                  <CBadge color="secondary" className="ms-2 text-uppercase">
                    {r.rosterSource}
                  </CBadge>
                ) : null}
              </CTableDataCell>
              <CTableDataCell className="py-1 text-end" style={{ width: 1 }}>
                <CButton
                  type="button"
                  size="sm"
                  color="light"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenSideCapture(String(r.id))
                  }}
                >
                  Side panel
                </CButton>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </div>
  )
}
