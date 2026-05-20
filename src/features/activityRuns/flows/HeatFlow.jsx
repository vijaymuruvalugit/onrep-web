import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
import ProgressionStagePrimitive from '../components/primitives/ProgressionStagePrimitive'
import RunResultsCard from '../components/RunResultsCard'
import StopwatchPrimitive from '../components/primitives/StopwatchPrimitive'
import { resolveActivityExperience } from '../utils/activityExperience'
import { participationMeta } from '../utils/buildRunPayload'
import { getTimingMetrics } from '../utils/progressionPayload'
import { useProgressionRun } from '../hooks/useProgressionRun'
import { RUN_STATES } from '../hooks/useProgressionStateMachine'

function formatMs(ms) {
  const n = Number(ms)
  return Number.isFinite(n) && n > 0 ? `${(n / 1000).toFixed(2)}s` : 'No time'
}

function athleteName(athlete) {
  return athlete?.fullName || athlete?.full_name || athlete?.name || 'Athlete'
}

function finishTimeForResult(row) {
  if (row?.time_ms != null) return Number(row.time_ms)
  const last = row?.progress_events?.[row.progress_events.length - 1]
  return getTimingMetrics(last)?.cumulative_time_ms ?? null
}

function FinishOrderEditor({ athletes = [], results = [], disabled, busy, onSubmitOrder }) {
  const initialOrder = useMemo(
    () =>
      [...results]
        .filter((r) => finishTimeForResult(r) != null)
        .sort((a, b) => Number(finishTimeForResult(a)) - Number(finishTimeForResult(b)))
        .map((r) => String(r.student_id)),
    [results],
  )
  const [order, setOrder] = useState(initialOrder)

  const move = (sid, delta) => {
    setOrder((prev) => {
      const index = prev.indexOf(sid)
      const nextIndex = index + delta
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const athleteById = new Map(athletes.map((a) => [String(a.studentId || a.id), a]))
  const resultById = new Map(results.map((r) => [String(r.student_id), r]))

  return (
    <div className="finish-order-editor">
      <p className="small text-body-secondary mb-2">
        Ordered by recorded finish time. Adjust if needed, then save.
      </p>
      <div className="finish-order-editor__list">
        {order.map((sid, index) => {
          const row = resultById.get(sid)
          return (
            <div key={sid} className="finish-order-editor__row">
              <span className="finish-order-editor__rank">{index + 1}</span>
              <span className="finish-order-editor__name">{athleteName(athleteById.get(sid))}</span>
              <span className="finish-order-editor__time font-monospace">
                {formatMs(finishTimeForResult(row))}
              </span>
              <span className="finish-order-editor__actions">
                <CButton
                  type="button"
                  size="sm"
                  color="light"
                  disabled={disabled || busy || index === 0}
                  onClick={() => move(sid, -1)}
                >
                  ↑
                </CButton>
                <CButton
                  type="button"
                  size="sm"
                  color="light"
                  disabled={disabled || busy || index === order.length - 1}
                  onClick={() => move(sid, 1)}
                >
                  ↓
                </CButton>
              </span>
            </div>
          )
        })}
      </div>
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 mt-3 fw-bold"
        disabled={disabled || busy || order.length < 1}
        onClick={() => onSubmitOrder?.(order)}
      >
        Save race
      </CButton>
    </div>
  )
}

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
  onRunComplete,
  onLiveUpdate,
}) {
  const [selectedIds, setSelectedIds] = useState(() =>
    (participantIdsProp.length ? participantIdsProp : []).map(String),
  )
  const [distanceLabel, setDistanceLabel] = useState(preset?.distanceLabel || '')
  const [clockStopped, setClockStopped] = useState(false)
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
      const anchor = resumeRunRecord.runPayload?.race_meta?.timerStartedAt
      requestAnimationFrame(() => {
        if (ids.length) setSelectedIds(ids.map(String))
        if (anchor != null) stopwatchRef.current?.restoreTimer?.(anchor)
      })
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
    setClockStopped(false)
    stopwatchRef.current?.start()
  }

  const handleCapture = (studentId) => {
    const timing = stopwatchRef.current?.captureProgressEvent()
    if (!timing) return
    progression.recordParticipantFinish(studentId, timing)
  }

  const handleStopRaceClock = () => {
    setClockStopped(true)
  }

  const handleResetRace = async () => {
    await progression.abandonRun()
    setSelectedIds([])
    setClockStopped(false)
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
    setClockStopped(false)
  }

  const selectedAthletes = athletes.filter((a) => selectedIds.includes(String(a.studentId || a.id)))
  const recordedResults = progression.payload.results || []
  const recordedCount = selectedIds.filter((sid) => {
    const row = recordedResults.find((r) => String(r.student_id) === String(sid))
    return finishTimeForResult(row) != null
  }).length
  const allFinishTimesRecorded = selectedIds.length > 0 && recordedCount >= selectedIds.length

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
          {skipReadySetup ? 'Finish order' : 'Confirm finish order'}
        </p>
        <RunResultsCard
          results={(progression.payload.results || []).map((r) => {
            const a = athletes.find((x) => String(x.studentId || x.id) === String(r.student_id))
            return { ...r, student_name: a?.fullName || a?.full_name }
          })}
        />
        {definition.capabilities.ranking ? (
          <FinishOrderEditor
            athletes={selectedAthletes}
            results={recordedResults}
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
        {!skipReadySetup ? <p className="fw-semibold mb-2 text-white">Race {heatNumber}</p> : null}
        <div className="race-finish-capture">
          <p className="progression-stage__heading h4 fw-bold mb-1">Record finishers</p>
          <p className="small text-body-secondary mb-2">
            Tap Record as each student finishes. Stop the clock after the final finisher.
          </p>
          <StopwatchPrimitive
            ref={stopwatchRef}
            disabled={disabled}
            autoStart={!timerStartedAt}
            timerStartedAt={timerStartedAt}
            raceControls
            onStopMs={handleStopRaceClock}
            onResetRace={() => void handleResetRace()}
            className="mb-3"
          />
          <div className="race-finish-capture__summary small text-body-secondary mb-2">
            {recordedCount} / {selectedIds.length} finish times recorded
          </div>
          <div className="race-finish-capture__grid">
            {selectedAthletes.map((athlete) => {
              const sid = String(athlete.studentId || athlete.id)
              const row = recordedResults.find((r) => String(r.student_id) === sid)
              const time = finishTimeForResult(row)
              const recorded = time != null
              return (
                <button
                  key={sid}
                  type="button"
                  className={`race-finish-card${recorded ? ' race-finish-card--recorded' : ''}`}
                  disabled={disabled || busy || progression.saving || recorded || clockStopped}
                  onClick={() => handleCapture(sid)}
                >
                  <span className="race-finish-card__name">{athleteName(athlete)}</span>
                  <span className="race-finish-card__meta">
                    {recorded ? formatMs(time) : 'Record'}
                  </span>
                </button>
              )
            })}
          </div>
          <CButton
            type="button"
            color="primary"
            size="lg"
            className="w-100 mt-3 fw-bold"
            disabled={
              disabled || busy || progression.saving || !allFinishTimesRecorded || !clockStopped
            }
            onClick={progression.finishProgress}
          >
            Review finish order →
          </CButton>
          {allFinishTimesRecorded && !clockStopped ? (
            <p className="small text-body-secondary text-center mt-2 mb-0">
              Press Stop to unlock finish order review.
            </p>
          ) : null}
        </div>
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
