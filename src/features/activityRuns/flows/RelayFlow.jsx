import React, { useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import TeamBuilderPrimitive from '../components/primitives/TeamBuilderPrimitive'
import StopwatchPrimitive from '../components/primitives/StopwatchPrimitive'
import { buildRunPayload } from '../utils/buildRunPayload'

export default function RelayFlow({ definition, athletes, disabled, busy, onSaveRun }) {
  const [teams, setTeams] = useState([{ team_id: 'team-1', members: [], time_ms: null }])
  const [teamTimeMs, setTeamTimeMs] = useState(null)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    try {
      const payload = buildRunPayload('RELAY_RACE', {
        teams: teams.map((t) => ({
          ...t,
          time_ms: teamTimeMs,
        })),
      })
      await onSaveRun?.('RELAY_RACE', payload)
      setTeams([{ team_id: 'team-1', members: [], time_ms: null }])
      setTeamTimeMs(null)
    } catch (e) {
      setError(e?.message || 'Could not save relay')
    }
  }

  return (
    <div className="relay-flow">
      <TeamBuilderPrimitive athletes={athletes} disabled={disabled} onTeamsChange={setTeams} />
      {definition.capabilities.timing ? (
        <StopwatchPrimitive disabled={disabled} onStopMs={setTeamTimeMs} className="my-3" />
      ) : null}
      {error ? <CAlert color="danger" className="small py-2">{error}</CAlert> : null}
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 mt-3"
        disabled={disabled || busy}
        onClick={() => void save()}
      >
        Save relay
      </CButton>
    </div>
  )
}
