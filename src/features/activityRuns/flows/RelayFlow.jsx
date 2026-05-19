import React, { useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import TeamBuilderPrimitive from '../components/primitives/TeamBuilderPrimitive'
import ProgressionStagePrimitive from '../components/primitives/ProgressionStagePrimitive'
import { resolveActivityExperience } from '../utils/activityExperience'
import { useProgressionRun } from '../hooks/useProgressionRun'
import { RUN_STATES } from '../hooks/useProgressionStateMachine'

export default function RelayFlow({
  definition,
  athletes,
  disabled,
  busy,
  operationalSessionId,
  phaseId,
  runType = 'RELAY_RACE',
  onRunComplete,
}) {
  const [teams, setTeams] = useState([{ team_id: 'team-1', members: [] }])
  const [activeTeamId, setActiveTeamId] = useState('team-1')
  const stopwatchRef = useRef(null)

  const progression = useProgressionRun({
    operationalSessionId,
    phaseId,
    runType,
    definition,
    progressionMode: 'PER_TEAM',
    teamId: activeTeamId,
  })

  const experience = useMemo(
    () =>
      resolveActivityExperience(definition, {
        current: progression.currentProgressIndex,
        target: progression.targetCount,
      }),
    [definition, progression.currentProgressIndex, progression.targetCount],
  )

  const teamEvents =
    progression.payload?.teams?.find((t) => String(t.team_id) === String(activeTeamId))
      ?.progress_events || []

  const handleStart = async () => {
    await progression.startRun({
      teams: teams.map((t) => ({
        team_id: t.team_id,
        members: t.members || [],
        progress_events: [],
      })),
    })
    stopwatchRef.current?.start()
  }

  const handleCapture = () => {
    const timing = stopwatchRef.current?.captureProgressEvent()
    if (!timing) return
    progression.applyCapture(timing)
  }

  const handleFinish = async () => {
    const run = await progression.finalizeRun({
      teams: teams.map((t) => {
        const saved = progression.payload.teams?.find(
          (x) => String(x.team_id) === String(t.team_id),
        )
        return { ...t, ...(saved || {}), members: t.members }
      }),
    })
    if (run) {
      await onRunComplete?.()
      progression.resetAll()
      setTeams([{ team_id: 'team-1', members: [] }])
    }
  }

  if (progression.isReady) {
    return (
      <div className="relay-flow">
        <TeamBuilderPrimitive
          athletes={athletes}
          disabled={disabled}
          onTeamsChange={(next) => {
            setTeams(next)
            if (next[0]?.team_id) setActiveTeamId(next[0].team_id)
          }}
        />
        <ProgressionStagePrimitive
          experience={experience}
          state={RUN_STATES.READY}
          targetCount={progression.targetCount}
          disabled={disabled}
          onTargetChange={progression.setTargetProgressCount}
        />
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="w-100 mt-3"
          disabled={disabled || progression.saving}
          onClick={() => void handleStart()}
        >
          {experience.startActionLabel} →
        </CButton>
      </div>
    )
  }

  if (progression.isActive) {
    return (
      <div className="relay-flow">
        <div className="d-flex gap-2 mb-2 flex-wrap">
          {teams.map((t) => (
            <CButton
              key={t.team_id}
              type="button"
              size="sm"
              color={activeTeamId === t.team_id ? 'warning' : 'light'}
              onClick={() => setActiveTeamId(t.team_id)}
            >
              {t.team_id}
            </CButton>
          ))}
        </div>
        <ProgressionStagePrimitive
          experience={experience}
          state={RUN_STATES.ACTIVE}
          targetCount={progression.targetCount}
          currentIndex={progression.currentProgressIndex}
          metrics={progression.metrics}
          progressEvents={teamEvents}
          disabled={disabled}
          busy={busy || progression.saving}
          stopwatchRef={stopwatchRef}
          onCapture={handleCapture}
          onFinishProgress={progression.finishProgress}
        />
        {progression.error ? (
          <CAlert color="danger" className="small py-2 mt-2">
            {progression.error}
          </CAlert>
        ) : null}
      </div>
    )
  }

  if (progression.isReview) {
    return (
      <div className="relay-flow">
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="w-100"
          disabled={disabled || progression.saving}
          onClick={() => void handleFinish()}
        >
          {experience.completeActionLabel}
        </CButton>
      </div>
    )
  }

  return null
}
