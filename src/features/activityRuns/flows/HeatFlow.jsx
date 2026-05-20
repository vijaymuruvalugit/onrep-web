import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
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
  const [selectedIds, setSelectedIds] = useState(() =>
    (participantIdsProp.length ? participantIdsProp : []).map(String),
  )
  const [distanceLabel, setDistanceLabel] = useState(preset?.distanceLabel || '')
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

  const timerStartedAt = progression.payload?.race_meta?.timerStartedAt ?? null

  useEffect(() => {
    if (preset?.targetProgressCount != null && progression.isReady) {
      progression.setTargetProgressCount(preset.targetProgressCount)
    }
  }, [preset?.targetProgressCount, progression.isReady, progression.setTargetProgressCount])

  useEffect(() => {
    if (resumeRunRecord && !resumedRef.current) {
      resumedRef.current = true
      progression.resumeRun(resumeRunRecord)
      const ids =
        resumeRunRecord.runPayload?.race_meta?.participantIds ||
        resumeRunRecord.runPayload?.results?.map((r) => String(r.student_id)) ||
        []
      if (ids.length) setSelectedIds(ids.map(String))
      const anchor = resumeRunRecord.runPayload?.race_meta?.timerStartedAt
      if (anchor != null) {
        requestAnimationFrame(() => stopwatchRef.current?.restoreTimer?.(anchor))
      }
    }
  }, [resumeRunRecord, progression])

  useEffect(() => {
    if (!autoStart || !skipReadySetup) return
    if (startedRef.current || resumeRunRecord) return
    if (!selectedIds.length) return
    startedRef.current = true
    void (async () => {
      await progression.startRun(initialPatch || {})
      const anchor = progression.payload?.race_meta?.timerStartedAt
      if (!anchor) stopwatchRef.current?.start()
      else stopwatchRef.current?.restoreTimer?.(anchor)
    })()
  }, [
    autoStart,
    skipReadySetup,
    resumeRunRecord,
    selectedIds.length,
    initialPatch,
    progression.startRun,
  ])

  useEffect(() => {
    onLiveUpdate?.({
      runId: progression.runId,
      currentLap: progression.currentProgressIndex,
    })
  }, [progression.runId, progression.currentProgressIndex, onLiveUpdate])

  const packEvents =
    progression.payload?.results?.find((r) => selectedIds.includes(String(r.student_id)))
      ?.progress_events || []

  const handleStart = async () => {
    const patch = initialPatch
      ? {
          ...initialPatch,
          results: selectedIds.map((sid) => ({
            student_id: String(sid),
            participated: true,
            source: 'COACH_CONFIRMED',
            progress_events: [],
          })),
          race_meta: {
            ...(initialPatch.race_meta || {}),
            participantIds: selectedIds.map(String),
            timerStartedAt: Date.now(),
          },
        }
      : {
          heat_number: heatNumber,
          progression_config: {
            enabled: true,
            target_progress_count: progression.targetCount,
            progression_mode: preset?.progressionMode || 'PACK',
            distance_label: distanceLabel || preset?.distanceLabel || null,
            locked: true,
          },
          results: selectedIds.map((sid) => ({
            student_id: String(sid),
            participated: true,
            source: 'COACH_CONFIRMED',
            progress_events: [],
          })),
        }
    await progression.startRun(patch)
    stopwatchRef.current?.start()
  }

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
    if (run) {
      await onRunComplete?.()
      if (!skipReadySetup) {
        progression.resetAll()
        setSelectedIds([])
      }
    }
  }

  const handleRunAgain = () => {
    progression.resetAll()
    setSelectedIds([])
  }

  if (progression.isCompleted && !skipReadySetup) {
    return (
      <div className="heat-flow text-center">
        <p className="fw-semibold mb-3">Race saved</p>
        <CButton type="button" color="light" size="lg" onClick={handleRunAgain}>
          Run again
        </CButton>
      </div>
    )
  }

  if (progression.isReview) {
    return (
      <div className="heat-flow">
        <p className="fw-semibold mb-2 text-white">
          {skipReadySetup ? 'Finish order' : 'Capture finish order'}
        </p>
        {!skipReadySetup ? (
          <RunResultsCard
            results={(progression.payload.results || []).map((r) => {
              const a = athletes.find((x) => String(x.studentId || x.id) === String(r.student_id))
              return { ...r, student_name: a?.fullName || a?.full_name }
            })}
          />
        ) : null}
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

  if (progression.isReady && !skipReadySetup) {
    return (
      <div className="heat-flow">
        <p className="small text-body-secondary mb-2">Select athletes for this race</p>
        <AthleteSelectionGrid
          athletes={athletes}
          selectedIds={selectedIds}
          disabled={disabled}
          multi
          onSelect={(sid) => {
            setSelectedIds((prev) =>
              prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
            )
          }}
        />
        <ProgressionStagePrimitive
          experience={experience}
          state={RUN_STATES.READY}
          targetCount={progression.targetCount}
          distanceLabel={distanceLabel}
          disabled={disabled}
          onTargetChange={progression.setTargetProgressCount}
          onDistanceChange={setDistanceLabel}
        />
        <CButton
          type="button"
          color="primary"
          size="lg"
          className="w-100 mt-3 activity-runs-sticky-action heat-flow__go-btn fw-bold"
          disabled={disabled || selectedIds.length < 2 || progression.saving}
          onClick={() => void handleStart()}
        >
          {experience.startActionLabel} →
        </CButton>
        {progression.error ? (
          <CAlert color="danger" className="small py-2 mt-2">
            {progression.error}
          </CAlert>
        ) : null}
      </div>
    )
  }

  if (progression.isActive || progression.resumed) {
    return (
      <div className="heat-flow">
        {!skipReadySetup ? (
          <p className="fw-semibold mb-2 text-white">Race {heatNumber}</p>
        ) : null}
        <ProgressionStagePrimitive
          experience={experience}
          state={RUN_STATES.ACTIVE}
          targetCount={progression.targetCount}
          currentIndex={progression.currentProgressIndex}
          distanceLabel={distanceLabel || preset?.distanceLabel}
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

  return null
}
