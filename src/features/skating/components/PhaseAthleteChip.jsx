import React, { useState } from 'react'
import { CFormSelect } from '@coreui/react'
import { PARTICIPATION_STATUS_OPTIONS } from '../../../domain/phaseAthletes/phaseAthletesApi'

const STATUS_CLASS = {
  active: '',
  resting: 'phase-athlete-chip--resting',
  skipped: 'phase-athlete-chip--skipped',
  injured: 'phase-athlete-chip--injured',
}

const LANE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]
const HEAT_OPTIONS = [1, 2, 3, 4, 5, 6]

/**
 * Compact athlete-in-phase control — inline lane/heat/status/move (no modals).
 *
 * @param {{
 *   athlete: { id: string, studentId: string, fullName: string, lane?: number|null, heatNumber?: number|null, participationStatus: string },
 *   phaseId: string,
 *   isRacePhase: boolean,
 *   otherPhases: Array<{ id: string, title: string }>,
 *   busy?: boolean,
 *   onMove: (toPhaseId: string) => void | Promise<void>,
 *   onLane: (lane: number|null) => void | Promise<void>,
 *   onHeat: (heatNumber: number|null) => void | Promise<void>,
 *   onStatus: (status: string) => void | Promise<void>,
 * }} props
 */
export default function PhaseAthleteChip({
  athlete,
  phaseId: _phaseId,
  isRacePhase,
  otherPhases,
  busy = false,
  onMove,
  onLane,
  onHeat,
  onStatus,
}) {
  const [moveOpen, setMoveOpen] = useState(false)
  const status = athlete.participationStatus || 'active'
  const statusClass = STATUS_CLASS[status] || ''

  return (
    <div
      className={`phase-athlete-chip ${statusClass}`.trim()}
      data-testid={`phase-athlete-chip-${athlete.studentId}`}
    >
      <span className="phase-athlete-chip__name text-truncate" title={athlete.fullName}>
        {athlete.fullName || 'Athlete'}
      </span>
      {isRacePhase ? (
        <div className="phase-athlete-chip__race-fields">
          <label className="phase-athlete-chip__mini-label">
            <span className="visually-hidden">Lane</span>
            <CFormSelect
              size="sm"
              className="phase-athlete-chip__select"
              value={athlete.lane ?? ''}
              disabled={busy}
              aria-label={`Lane for ${athlete.fullName}`}
              onChange={(e) => {
                const v = e.target.value
                void onLane(v === '' ? null : Number(v))
              }}
            >
              <option value="">Ln</option>
              {LANE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </CFormSelect>
          </label>
          <label className="phase-athlete-chip__mini-label">
            <span className="visually-hidden">Heat</span>
            <CFormSelect
              size="sm"
              className="phase-athlete-chip__select"
              value={athlete.heatNumber ?? ''}
              disabled={busy}
              aria-label={`Heat for ${athlete.fullName}`}
              onChange={(e) => {
                const v = e.target.value
                void onHeat(v === '' ? null : Number(v))
              }}
            >
              <option value="">Ht</option>
              {HEAT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </CFormSelect>
          </label>
        </div>
      ) : null}
      <CFormSelect
        size="sm"
        className="phase-athlete-chip__select phase-athlete-chip__status"
        value={status}
        disabled={busy}
        aria-label={`Status for ${athlete.fullName}`}
        onChange={(e) => void onStatus(e.target.value)}
      >
        {PARTICIPATION_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </CFormSelect>
      {otherPhases.length > 0 ? (
        <div className="phase-athlete-chip__move">
          {!moveOpen ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary phase-athlete-chip__move-btn"
              disabled={busy}
              onClick={() => setMoveOpen(true)}
            >
              Move to phase…
            </button>
          ) : (
            <CFormSelect
              size="sm"
              className="phase-athlete-chip__select"
              disabled={busy}
              aria-label={`Move ${athlete.fullName} to phase`}
              defaultValue=""
              onChange={(e) => {
                const to = e.target.value
                setMoveOpen(false)
                if (to) void onMove(to)
              }}
              onBlur={() => setMoveOpen(false)}
            >
              <option value="">Choose phase…</option>
              {otherPhases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || 'Phase'}
                </option>
              ))}
            </CFormSelect>
          )}
        </div>
      ) : null}
    </div>
  )
}
