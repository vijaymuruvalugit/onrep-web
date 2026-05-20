import React, { useEffect, useMemo, useRef } from 'react'
import { CAlert, CButton } from '@coreui/react'
import RankingPrimitive from '../components/primitives/RankingPrimitive'
import ProgressionStagePrimitive from '../components/primitives/ProgressionStagePrimitive'
import RunResultsCard from '../components/RunResultsCard'
import { resolveActivityExperience } from '../utils/activityExperience'
import { participationMeta } from '../utils/buildRunPayload'
import { useProgressionRun } from '../hooks/useProgressionRun'
import { RUN_STATES } from '../hooks/useProgressionStateMachine'

export default function HeatFlow({
  definition,
  athletes,
  disabled,
  busy,
  heatNumber = 1,
  operationalSessionId,
  phaseId,
  runType = 'HEAT_RACE',
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
  const selectedIds = useMemo(
    () => (participantIdsProp.length ? participantIdsProp : []).map(String),
    [participantIdsProp],
  )
  const stopwatchRef = useRef(null)
  const startedRef = useRef(false)
  const resumedRef = useRef(false)

  const progression = useProgressionRun({
    operationalSessionId,
    phaseId,
    runType,
    definition,
    progressionMode: preset?.progressionMode || 'PACK',
    participantIds: selectedIds,
    heatNumber,
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
    if (resumeRunRecord && !resumedRef.current) {
      resumedRef.current = true
      progression.resumeRun(resumeRunRecord)
      const anchor = resumeRunRecord.runPayload?.race_meta?.timerStartedAt
      if (anchor) {
        requestAnimationFrame(() => stopwatchRef.current?.restoreTimer?.(anchor))
      }
    }
  }, [resumeRunRecord, progression])

  useEffect(() => {
    if (!autoStart || skipReadySetup === false) return
    if (startedRef.current || resumeRunRecord) return
    if (!selectedIds.length) return
    startedRef.current = true
    void (async () => {
      await progression.startRun(initialPatch || {})
      const anchor = progression.payload?.race_meta?.timerStartedAt
      if (!anchor) stopwatchRef.current?.start()
      else stopwatchRef.current?.restoreTimer?.(anchor)
    })()
  }, [autoStart, skipReadySetup, resumeRunRecord, selectedIds.length, initialPatch, progression.startRun])

  useEffect(() => {
    onLiveUpdate?.({
      runId: progression.runId,
      currentLap: progression.currentProgressIndex,
    })
  }, [progression.runId, progression.currentProgressIndex, onLiveUpdate])

  const packEvents =
    progression.payload?.results?.find((r) => selectedIds.includes(String(r.student_id)))
      ?.progress_events || []

  const handleCapture = () => {
    const timing = stopwatchRef.current?.captureProgressEvent()
    if (!timing) return
    progression.applyCapture(timing)
  }

  const buildResultsFromOrder = (order) =>
    order.map((studentId, i) => {
      const existing = progression.payload.results?.find(
        (r) => String(r.student_id) === String(studentId),
      )
      return {
        student_id: studentId,
        finish_order: i + 1,
        time_ms: existing?.time_ms ?? null,
        progress_events: existing?.progress_events || [],
        ...participationMeta(),
      }
    })

  const handleFinishOrder = async (order) => {
    const results = buildResultsFromOrder(order)
    const run = await progression.finalizeRun({ results, heat_number: heatNumber })
    if (run) await onRunComplete?.()
  }

  if (skipReadySetup && progression.isReview) {
    return (
      <div className="heat-flow">
        <p className="fw-semibold mb-2 text-white">Finish order</p>
        {definition.capabilities.ranking ? (
          <RankingPrimitive
            athletes={athletes.filter((a) =>
              selectedIds.includes(String(a.studentId || a.id)),
            )}
            disabled={disabled}
            busy={busy || progression.saving}
            onSubmitOrder={handleFinishOrder}
          />
        ) : (
          <CButton
            type="button"
            color="primary"
            size="lg"
            className="w-100 mt-3 fw-bold"
            disabled={disabled || progression.saving}
            onClick={() => void handleFinishOrder(selectedIds)}
          >
            Save race
          </CButton>
        )}
        {progression.error ? (
          <CAlert color="danger" className="small py-2 mt-2">
            {progression.error}
          </CAlert>
        ) : null}
      </div>
    )
  }

  if (skipReadySetup && (progression.isActive || progression.resumed)) {
    return (
      <div className="heat-flow">
        <ProgressionStagePrimitive
          experience={experience}
          state={RUN_STATES.ACTIVE}
          targetCount={progression.targetCount}
          currentIndex={progression.currentProgressIndex}
          metrics={progression.metrics}
          progressEvents={packEvents}
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

  if (progression.isReady && !skipReadySetup) {
    return (
      <div className="heat-flow">
        <p className="small text-body-secondary mb-2">Legacy setup — use race picker</p>
      </div>
    )
  }

  return null
}
