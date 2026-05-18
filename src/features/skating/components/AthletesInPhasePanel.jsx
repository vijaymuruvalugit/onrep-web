import React, { useMemo } from 'react'
import { CSpinner } from '@coreui/react'
import PhaseAthleteChip from './PhaseAthleteChip'

const RACE_PHASE_TYPES = new Set(['race', 'race_simulation'])

/**
 * Athletes in the active coaching phase — exception-only operational placement.
 */
export default function AthletesInPhasePanel({
  phaseTitle,
  phaseId,
  blockType,
  athletes = [],
  allPhases = [],
  loading = false,
  busy = false,
  onMoveAthlete,
  onSetLane,
  onSetHeat,
  onSetStatus,
}) {
  const isRacePhase = RACE_PHASE_TYPES.has(blockType)
  const otherPhases = useMemo(
    () => allPhases.filter((p) => String(p.id) !== String(phaseId)),
    [allPhases, phaseId],
  )

  const groupedByHeat = useMemo(() => {
    if (!isRacePhase) return null
    const groups = new Map()
    for (const a of athletes) {
      const key = a.heatNumber != null ? Number(a.heatNumber) : 0
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(a)
    }
    const keys = [...groups.keys()].sort((a, b) => a - b)
    return keys.map((k) => ({
      heatNumber: k === 0 ? null : k,
      label: k === 0 ? 'No heat' : `Heat ${k}`,
      athletes: groups.get(k),
    }))
  }, [athletes, isRacePhase])

  if (!phaseId) {
    return (
      <div className="athletes-in-phase-panel border rounded p-2 bg-body-tertiary">
        <p className="small text-body-secondary mb-0">Select a phase to see athletes in this phase.</p>
      </div>
    )
  }

  return (
    <section
      className="athletes-in-phase-panel border rounded p-2 mb-3"
      data-testid="athletes-in-phase-panel"
      aria-label="Athletes in this phase"
    >
      <div className="d-flex justify-content-between align-items-baseline gap-2 mb-2">
        <h3 className="h6 fw-semibold mb-0">Athletes in this phase</h3>
        {phaseTitle ? (
          <span className="small text-body-secondary text-truncate">{phaseTitle}</span>
        ) : null}
      </div>
      {loading ? (
        <CSpinner size="sm" />
      ) : athletes.length === 0 ? (
        <p className="small text-body-secondary mb-0">
          Roster will appear here when the session loads.
        </p>
      ) : isRacePhase && groupedByHeat ? (
        <div className="athletes-in-phase-panel__heats">
          {groupedByHeat.map((g) => (
            <div key={g.label} className="athletes-in-phase-panel__heat-group mb-2">
              <div className="small text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem' }}>
                {g.label}
              </div>
              <div className="phase-athlete-chip-list">
                {g.athletes.map((athlete) => (
                  <PhaseAthleteChip
                    key={athlete.id}
                    athlete={athlete}
                    phaseId={phaseId}
                    isRacePhase={isRacePhase}
                    otherPhases={otherPhases}
                    busy={busy}
                    onMove={(toPhaseId) => onMoveAthlete(athlete.studentId, toPhaseId)}
                    onLane={(lane) => onSetLane(athlete.studentId, lane)}
                    onHeat={(heatNumber) => onSetHeat(athlete.studentId, heatNumber)}
                    onStatus={(status) => onSetStatus(athlete.studentId, status)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="phase-athlete-chip-list">
          {athletes.map((athlete) => (
            <PhaseAthleteChip
              key={athlete.id}
              athlete={athlete}
              phaseId={phaseId}
              isRacePhase={isRacePhase}
              otherPhases={otherPhases}
              busy={busy}
              onMove={(toPhaseId) => onMoveAthlete(athlete.studentId, toPhaseId)}
              onLane={(lane) => onSetLane(athlete.studentId, lane)}
              onHeat={(heatNumber) => onSetHeat(athlete.studentId, heatNumber)}
              onStatus={(status) => onSetStatus(athlete.studentId, status)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
