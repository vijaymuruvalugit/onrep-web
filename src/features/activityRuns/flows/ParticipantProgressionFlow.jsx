import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import ProgressionStagePrimitive from '../components/primitives/ProgressionStagePrimitive'
import { resolveActivityExperience } from '../utils/activityExperience'
import { useProgressionRun } from '../hooks/useProgressionRun'
import { RUN_STATES } from '../hooks/useProgressionStateMachine'

export default function ParticipantProgressionFlow({
  definition,
  athletes,
  disabled,
  busy,
  runType,
  operationalSessionId,
  phaseId,
  preset,
  participantIds: participantIdsProp = [],
  skipReadySetup = false,
  autoStart = false,
  resumeRun: resumeRunRecord = null,
  initialPatch = null,
  operationalMode = false,
  hideFinishEarly = false,
  onRunComplete,
  onLiveUpdate,
}) {
  const participantIds = useMemo(
    () => participantIdsProp.map(String).filter(Boolean),
    [participantIdsProp],
  )
  const [activeStudentId, setActiveStudentId] = useState(participantIds[0] || '')
  const [dnfIds, setDnfIds] = useState([])
  const stopwatchRef = useRef(null)
  const startedRef = useRef(false)
  const resumedRef = useRef(false)

  const progression = useProgressionRun({
    operationalSessionId,
    phaseId,
    runType,
    definition,
    progressionMode: 'PER_PARTICIPANT',
    participantIds: activeStudentId ? [activeStudentId] : participantIds.slice(0, 1),
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
    if (participantIds.length && !activeStudentId) {
      setActiveStudentId(participantIds[0])
    }
  }, [participantIds, activeStudentId])

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
    if (!participantIds.length) return
    startedRef.current = true
    void (async () => {
      const patch =
        initialPatch ||
        {
          results: participantIds.map((sid) => ({
            student_id: sid,
            participated: true,
            source: 'COACH_CONFIRMED',
            progress_events: [],
          })),
        }
      await progression.startRun(patch)
      const anchor = progression.payload?.race_meta?.timerStartedAt
      if (anchor) stopwatchRef.current?.restoreTimer?.(anchor)
      else stopwatchRef.current?.start()
    })()
  }, [autoStart, skipReadySetup, resumeRunRecord, participantIds, initialPatch, progression])

  useEffect(() => {
    onLiveUpdate?.({ runId: progression.runId })
  }, [progression.runId, onLiveUpdate])

  const sessionAthletes = athletes.filter((a) =>
    participantIds.includes(String(a.studentId || a.id)),
  )

  const activeEvents =
    progression.payload?.results?.find((r) => String(r.student_id) === activeStudentId)
      ?.progress_events || []

  const handleCaptureParticipant = (studentId) => {
    if (progression.state !== RUN_STATES.ACTIVE) return
    setActiveStudentId(studentId)
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
    if (run) await onRunComplete?.()
  }

  if (skipReadySetup && progression.isReview) {
    return (
      <div className="participant-progression-flow">
        <p className="small text-white-50 mb-2">Mark DNF if needed, then save</p>
        {sessionAthletes.map((a) => {
          const sid = String(a.studentId || a.id)
          return (
            <label key={sid} className="d-flex align-items-center gap-2 text-white-50 small mb-1">
              <input
                type="checkbox"
                checked={dnfIds.includes(sid)}
                onChange={(e) => {
                  setDnfIds((prev) =>
                    e.target.checked ? [...prev, sid] : prev.filter((id) => id !== sid),
                  )
                }}
              />
              {a.fullName || a.full_name} — DNF
            </label>
          )
        })}
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="w-100 mt-3 fw-bold"
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
      <div className="participant-progression-flow">
        <ProgressionStagePrimitive
          experience={experience}
          state={RUN_STATES.ACTIVE}
          targetCount={progression.targetCount}
          currentIndex={progression.currentProgressIndex}
          metrics={progression.metrics}
          progressEvents={activeEvents}
          showParticipantGrid
          athletes={sessionAthletes}
          results={progression.payload.results || []}
          activeStudentId={activeStudentId}
          disabled={disabled}
          busy={busy || progression.saving}
          stopwatchRef={stopwatchRef}
          onCaptureParticipant={handleCaptureParticipant}
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
