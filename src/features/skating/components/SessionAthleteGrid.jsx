import React from 'react'
import { CBadge, CButton, CTable, CTableBody, CTableDataCell, CTableRow } from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'

/**
 * One row per resolved session athlete — tap selects skater for capture; optional roster source in dev.
 */
export default function SessionAthleteGrid({
  rows,
  lapStudentId,
  observedStudentIds,
  coachLive,
  onPickSkater,
  showRosterSource,
  onOpenSideCapture,
  sidePanelLabel = 'Side panel',
}) {
  if (!rows?.length) {
    return (
      <div className="border rounded p-3 bg-body-tertiary">
        <div className="fw-semibold text-body-secondary mb-1">
          {SESSION_OPS_COPY.emptyRosterTitle}
        </div>
        <p className="small text-body-secondary mb-2 mb-0">{SESSION_OPS_COPY.emptyRosterBody}</p>
        <p className="small text-muted mt-2 mb-0">{SESSION_OPS_COPY.emptyRosterCta}</p>
      </div>
    )
  }

  return (
    <div
      className="table-responsive border rounded"
      style={{ maxHeight: coachLive ? 'min(52vh, 440px)' : 280 }}
    >
      <CTable bordered small responsive className="mb-0">
        <CTableBody>
          {rows.map((r) => {
            const sid = String(r.id)
            const hasSignal = observedStudentIds?.has?.(sid)
            return (
              <CTableRow
                key={r.id}
                className={`${String(lapStudentId) === sid ? 'table-active skating-active-skater-row' : ''}${
                  hasSignal ? ' skating-athlete-has-signal' : ''
                }`}
                data-athlete-row={sid}
              >
                <CTableDataCell
                  className={coachLive ? 'py-3' : 'py-1'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPickSkater(sid)}
                >
                  <span className={coachLive ? 'fs-6' : undefined}>{r.full_name}</span>
                  {hasSignal ? (
                    <span
                      className="skating-signal-dot ms-2 align-middle"
                      title={SESSION_OPS_COPY.observationSavedThisSession}
                      aria-label={SESSION_OPS_COPY.observationSavedThisSession}
                    />
                  ) : null}
                  {showRosterSource && r.rosterSource ? (
                    <CBadge color="secondary" className="ms-2 text-uppercase">
                      {r.rosterSource}
                    </CBadge>
                  ) : null}
                </CTableDataCell>
                <CTableDataCell
                  className={`${coachLive ? 'py-3' : 'py-1'} text-end`}
                  style={{ width: 1 }}
                >
                  <CButton
                    type="button"
                    size="sm"
                    color="light"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenSideCapture(sid)
                    }}
                  >
                    {sidePanelLabel}
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            )
          })}
        </CTableBody>
      </CTable>
    </div>
  )
}
