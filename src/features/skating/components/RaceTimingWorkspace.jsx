import React, { useState } from 'react'
import { CAlert } from '@coreui/react'
import FinishOrderCapture from './FinishOrderCapture'
import LiveLeaderboard from './LiveLeaderboard'
import RaceTimeEntryRow from './RaceTimeEntryRow'
import StopwatchHelper from './StopwatchHelper'

const RACE_PHASE_TYPES = new Set(['race', 'race_simulation'])

export function isRacePhaseBlock(block) {
  return block && RACE_PHASE_TYPES.has(block.blockType || block.block_type)
}

export default function RaceTimingWorkspace({
  athletes = [],
  leaderboard,
  disabled,
  busy,
  heatNumber,
  onFinishOrder,
  onManualTime,
  onStopwatchTime,
}) {
  const [raceError, setRaceError] = useState('')
  const [stopwatchTargetId, setStopwatchTargetId] = useState('')

  const handleFinish = async (order) => {
    setRaceError('')
    try {
      await onFinishOrder?.(order)
    } catch (e) {
      setRaceError(e?.message || 'Could not record finish order')
    }
  }

  const handleManual = async (studentId, seconds) => {
    setRaceError('')
    try {
      await onManualTime?.(studentId, seconds)
    } catch (e) {
      setRaceError(e?.message || 'Could not save time')
    }
  }

  return (
    <div className="race-timing-workspace">
      <h2 className="h5 fw-semibold mb-2">Heat results</h2>
      {heatNumber != null ? (
        <p className="small text-body-secondary mb-3">Heat {heatNumber}</p>
      ) : null}

      <div className="race-timing-workspace__leaderboard mb-4">
        <LiveLeaderboard leaderboard={leaderboard} />
      </div>

      <FinishOrderCapture
        athletes={athletes}
        disabled={disabled}
        busy={busy}
        onSubmitOrder={handleFinish}
      />

      {raceError ? (
        <CAlert color="danger" className="small py-2 mt-2">
          {raceError}
        </CAlert>
      ) : null}

      <hr className="my-4" />

      <h3 className="h6 fw-semibold mb-2">Manual times</h3>
      <StopwatchHelper
        disabled={disabled}
        onStop={(sec) => {
          if (stopwatchTargetId) void handleManual(stopwatchTargetId, sec)
        }}
      />
      <p className="small text-body-secondary mb-2">Optional: pick athlete then stopwatch fills their row.</p>
      {athletes.map((a) => {
        const sid = String(a.studentId || a.id)
        return (
          <div key={sid} className="mb-1">
            <RaceTimeEntryRow
              studentName={a.fullName || a.full_name}
              disabled={disabled}
              busy={busy}
              onSave={(sec) => handleManual(sid, sec)}
            />
            <button
              type="button"
              className="btn btn-link btn-sm p-0 ms-2 small"
              onClick={() => setStopwatchTargetId(sid)}
            >
              Use stopwatch for this athlete
            </button>
          </div>
        )
      })}
    </div>
  )
}
