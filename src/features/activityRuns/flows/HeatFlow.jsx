import React, { useMemo, useRef, useState } from 'react'
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
  onRunComplete,
}) {
  const [selectedIds, setSelectedIds] = useState([])
  const [distanceLabel, setDistanceLabel] = useState('')
  const stopwatchRef = useRef(null)

  const progression = useProgressionRun({
    operationalSessionId,
    phaseId,
    runType,
    definition,
    progressionMode: 'PACK',
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

  const packEvents =
    progression.payload?.results?.find((r) => selectedIds.includes(String(r.student_id)))
      ?.progress_events || []

  const handleStart = async () => {
    await progression.startRun({
      heat_number: heatNumber,
      progression_config: {
        target_progress_count: progression.targetCount,
        distance_label: distanceLabel || null,
      },
    })
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
      progression.resetAll()
      setSelectedIds([])
    }
  }

  const handleRunAgain = () => {
    progression.resetAll()
    setSelectedIds([])
  }

  if (progression.isCompleted) {
    return (
      <div className="heat-flow text-center">
        <p className="fw-semibold mb-3">Heat saved</p>
        <CButton type="button" color="light" size="lg" onClick={handleRunAgain}>
          Run again
        </CButton>
      </div>
    )
  }

  if (progression.isReady) {
    return (
      <div className="heat-flow">
        <p className="small text-body-secondary mb-2">Select athletes for this heat</p>
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

  if (progression.isReview) {
    return (
      <div className="heat-flow">
        <p className="fw-semibold mb-2">Capture finish order</p>
        <RunResultsCard
          results={(progression.payload.results || []).map((r) => {
            const a = athletes.find((x) => String(x.studentId || x.id) === String(r.student_id))
            return { ...r, student_name: a?.fullName || a?.full_name }
          })}
        />
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
            className="w-100 mt-3"
            disabled={disabled || progression.saving}
            onClick={() => void handleFinishOrder(selectedIds)}
          >
            {experience.completeActionLabel}
          </CButton>
        )}
      </div>
    )
  }

  return (
    <div className="heat-flow">
      <p className="fw-semibold mb-2">Heat {heatNumber}</p>
      <ProgressionStagePrimitive
        experience={experience}
        state={RUN_STATES.ACTIVE}
        targetCount={progression.targetCount}
        currentIndex={progression.currentProgressIndex}
        distanceLabel={distanceLabel}
        metrics={progression.metrics}
        progressEvents={packEvents}
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
