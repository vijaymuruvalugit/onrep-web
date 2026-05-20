import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
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
  preset,
  relayTeams: relayTeamsProp,
  skipReadySetup = false,
  autoStart = false,
  resumeRun: resumeRunRecord = null,
  initialPatch = null,
  operationalMode = false,
  hideFinishEarly = false,
  onRunComplete,
  onLiveUpdate,
}) {
  const [teams, setTeams] = useState(relayTeamsProp || [{ team_id: 'team-1', members: [] }])
  const [activeTeamId, setActiveTeamId] = useState(teams[0]?.team_id || 'team-1')
  const stopwatchRef = useRef(null)
  const startedRef = useRef(false)
  const resumedRef = useRef(false)

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

  const timerStartedAt =
    progression.payload?.race_meta?.timerStartedAt ?? initialPatch?.race_meta?.timerStartedAt

  useEffect(() => {
    if (relayTeamsProp?.length) setTeams(relayTeamsProp)
  }, [relayTeamsProp])

  useEffect(() => {
    if (resumeRunRecord && !resumedRef.current) {
      resumedRef.current = true
      progression.resumeRun(resumeRunRecord)
      const anchor = resumeRunRecord.runPayload?.race_meta?.timerStartedAt
      if (anchor) requestAnimationFrame(() => stopwatchRef.current?.restoreTimer?.(anchor))
    }
  }, [resumeRunRecord, progression])

  useEffect(() => {
    if (!autoStart || !skipReadySetup || startedRef.current || resumeRunRecord) return
    startedRef.current = true
    void (async () => {
      const patch = initialPatch || {
        teams: teams.map((t) => ({
          team_id: t.team_id,
          members: t.members || [],
          progress_events: [],
        })),
      }
      await progression.startRun(patch)
      const anchor = progression.payload?.race_meta?.timerStartedAt
      if (anchor) stopwatchRef.current?.restoreTimer?.(anchor)
      else stopwatchRef.current?.start()
    })()
  }, [autoStart, skipReadySetup, resumeRunRecord, initialPatch, teams, progression])

  useEffect(() => {
    onLiveUpdate?.({ runId: progression.runId })
  }, [progression.runId, onLiveUpdate])

  const teamEvents =
    progression.payload?.teams?.find((t) => String(t.team_id) === String(activeTeamId))
      ?.progress_events || []

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
    if (run) await onRunComplete?.()
  }

  if (skipReadySetup && progression.isReview) {
    return (
      <div className="relay-flow">
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="w-100 fw-bold"
          disabled={disabled || progression.saving}
          onClick={() => void handleFinish()}
        >
          Save race
        </CButton>
      </div>
    )
  }

  if (skipReadySetup && (progression.isActive || progression.resumed)) {
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
              Team {t.team_id.replace('team-', '')}
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
          hideFinishEarly={hideFinishEarly}
          operationalMode={operationalMode}
          timerStartedAt={timerStartedAt}
        />
        {progression.error ? (
          <CAlert color="danger" className="small py-2 mt-2">
            {progression.error}
          </CAlert>
        ) : null}
      </div>
    )
  }

  return null
}
