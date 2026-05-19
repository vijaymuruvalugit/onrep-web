import React, { useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
import ProgressionStagePrimitive from '../components/primitives/ProgressionStagePrimitive'
import { resolveActivityExperience } from '../utils/activityExperience'
import { useProgressionRun } from '../hooks/useProgressionRun'
import { RUN_STATES } from '../hooks/useProgressionStateMachine'

/**
 * PER_PARTICIPANT progression (Endurance, Flying Lap).
 */
export default function ParticipantProgressionFlow({
  definition,
  athletes,
  disabled,
  busy,
  runType,
  operationalSessionId,
  phaseId,
  onRunComplete,
}) {
  const [selectedId, setSelectedId] = useState('')
  const [dnfIds, setDnfIds] = useState([])
  const stopwatchRef = useRef(null)

  const progression = useProgressionRun({
    operationalSessionId,
    phaseId,
    runType,
    definition,
    progressionMode: 'PER_PARTICIPANT',
    participantIds: selectedId ? [selectedId] : [],
  })

  const experience = useMemo(
    () =>
      resolveActivityExperience(definition, {
        current: progression.currentProgressIndex,
        target: progression.targetCount,
      }),
    [definition, progression.currentProgressIndex, progression.targetCount],
  )

  const selectedAthletes = athletes.filter((a) => {
    const sid = String(a.studentId || a.id)
    return sid === selectedId
  })

  const activeEvents =
    progression.payload?.results?.find((r) => String(r.student_id) === selectedId)
      ?.progress_events || []

  const handleStart = async () => {
    if (!selectedId) return
    await progression.startRun({
      results: [
        {
          student_id: selectedId,
          participated: true,
          source: 'COACH_CONFIRMED',
          progress_events: [],
          dnf: false,
        },
      ],
    })
    stopwatchRef.current?.start()
  }

  const handleCaptureParticipant = (studentId) => {
    if (progression.state !== RUN_STATES.ACTIVE) return
    const timing = stopwatchRef.current?.captureProgressEvent()
    if (!timing) return
    progression.captureForParticipant(studentId, timing)
  }

  const handleFinish = async () => {
    const results = (progression.payload.results || []).map((r) => ({
      ...r,
      dnf: dnfIds.includes(String(r.student_id)),
    }))
    const run = await progression.finalizeRun({ results })
    if (run) {
      await onRunComplete?.()
      progression.resetAll()
      setSelectedId('')
      setDnfIds([])
    }
  }

  if (progression.isReady) {
    return (
      <div className="participant-progression-flow">
        <AthleteSelectionGrid
          athletes={athletes}
          selectedId={selectedId}
          disabled={disabled}
          onSelect={setSelectedId}
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
          className="w-100 mt-3 activity-runs-sticky-action fw-bold"
          disabled={disabled || !selectedId || progression.saving}
          onClick={() => void handleStart()}
        >
          {experience.startActionLabel} →
        </CButton>
      </div>
    )
  }

  if (progression.isReview || progression.isActive) {
    return (
      <div className="participant-progression-flow">
        <ProgressionStagePrimitive
          experience={experience}
          state={progression.isActive ? RUN_STATES.ACTIVE : RUN_STATES.READY}
          targetCount={progression.targetCount}
          currentIndex={progression.currentProgressIndex}
          metrics={progression.metrics}
          progressEvents={activeEvents}
          showParticipantGrid={progression.isActive}
          athletes={selectedAthletes}
          results={progression.payload.results || []}
          activeStudentId={selectedId}
          disabled={disabled}
          busy={busy || progression.saving}
          stopwatchRef={stopwatchRef}
          onCaptureParticipant={handleCaptureParticipant}
          onFinishProgress={progression.finishProgress}
        />
        {progression.isReview ? (
          <>
            <label className="small text-white-50 mt-2 d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={dnfIds.includes(selectedId)}
                onChange={(e) => {
                  setDnfIds((prev) =>
                    e.target.checked
                      ? [...prev, selectedId]
                      : prev.filter((id) => id !== selectedId),
                  )
                }}
              />
              Mark DNF
            </label>
            <CButton
              type="button"
              color="primary"
              size="lg"
              className="w-100 mt-3"
              disabled={disabled || progression.saving}
              onClick={() => void handleFinish()}
            >
              {experience.completeActionLabel}
            </CButton>
          </>
        ) : null}
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
