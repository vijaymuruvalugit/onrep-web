import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CAlert, CButton, CFormInput, CFormSelect } from '@coreui/react'
import AthleteSelectionGrid from '../components/AthleteSelectionGrid'
import StopwatchPrimitive from '../components/primitives/StopwatchPrimitive'
import { participationMeta } from '../utils/buildRunPayload'
import { useProgressionRun } from '../hooks/useProgressionRun'

function formatMs(ms) {
  const n = Number(ms)
  return Number.isFinite(n) && n > 0 ? `${(n / 1000).toFixed(2)}s` : 'No time'
}

function athleteName(athlete) {
  return athlete?.fullName || athlete?.full_name || athlete?.name || 'Athlete'
}

function finishMarksFromPayload(payload) {
  const marks = Array.isArray(payload?.race_meta?.finish_marks)
    ? payload.race_meta.finish_marks
    : []
  return [...marks]
    .filter((mark) => Number.isFinite(Number(mark.time_ms)) && Number(mark.time_ms) > 0)
    .sort((a, b) => Number(a.finish_order || 0) - Number(b.finish_order || 0))
}

function FinishAssignmentEditor({
  athletes = [],
  marks = [],
  disabled,
  busy,
  onSubmitAssignments,
}) {
  const initialRows = useMemo(
    () =>
      marks.map((mark, index) => ({
        markId: String(mark.id || `finish-${index + 1}`),
        finishOrder: Number(mark.finish_order || index + 1),
        studentId: mark.student_id ? String(mark.student_id) : '',
        timeMs: Math.max(1, Math.round(Number(mark.time_ms) || 1)),
        capturedAt: mark.captured_at,
      })),
    [marks],
  )
  const [rows, setRows] = useState(initialRows)

  const updateRow = (markId, patch) => {
    setRows((prev) => prev.map((row) => (row.markId === markId ? { ...row, ...patch } : row)))
  }

  const assignedIds = rows.map((row) => row.studentId).filter(Boolean)
  const uniqueAssignedIds = new Set(assignedIds)
  const hasDuplicateStudents = assignedIds.length !== uniqueAssignedIds.size
  const canSave = rows.length > 0 && !hasDuplicateStudents

  const usedByOtherRows = (studentId, markId) =>
    rows.some((row) => row.markId !== markId && row.studentId === String(studentId))

  return (
    <div className="finish-assignment-editor">
      <p className="small text-body-secondary mb-2">
        Assign students only if you want named results. You can save the race with the recorded
        finish times as-is.
      </p>
      <div className="finish-assignment-editor__list">
        {rows.map((row) => (
          <div key={row.markId} className="finish-assignment-editor__row">
            <span className="finish-order-editor__rank">{row.finishOrder}</span>
            <CFormSelect
              size="sm"
              value={row.studentId}
              disabled={disabled || busy}
              aria-label={`Student for place ${row.finishOrder}`}
              onChange={(event) => updateRow(row.markId, { studentId: event.target.value })}
            >
              <option value="">Select student</option>
              {athletes.map((athlete) => {
                const sid = String(athlete.studentId || athlete.id)
                return (
                  <option key={sid} value={sid} disabled={usedByOtherRows(sid, row.markId)}>
                    {athleteName(athlete)}
                  </option>
                )
              })}
            </CFormSelect>
            <CFormInput
              type="number"
              min="0.01"
              step="0.01"
              size="sm"
              value={(row.timeMs / 1000).toFixed(2)}
              disabled={disabled || busy}
              aria-label={`Time for place ${row.finishOrder}`}
              onChange={(event) => {
                const seconds = Number(event.target.value)
                updateRow(row.markId, {
                  timeMs: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : 1,
                })
              }}
            />
          </div>
        ))}
      </div>
      {hasDuplicateStudents ? (
        <CAlert color="warning" className="small py-2 mt-2 mb-0">
          Each place needs a different student.
        </CAlert>
      ) : null}
      <CButton
        type="button"
        color="primary"
        size="lg"
        className="w-100 mt-3 fw-bold"
        disabled={disabled || busy || !canSave}
        onClick={() => onSubmitAssignments?.(rows)}
      >
        Save race
      </CButton>
    </div>
  )
}

function FinishMarksList({ marks = [] }) {
  if (!marks.length) {
    return <p className="small text-body-secondary mb-0">No finish times recorded yet.</p>
  }

  return (
    <div className="race-finish-marks">
      {marks.map((mark, index) => (
        <div key={mark.id || index} className="race-finish-mark">
          <span className="finish-order-editor__rank">{mark.finish_order || index + 1}</span>
          <span className="race-finish-mark__label">Place {mark.finish_order || index + 1}</span>
          <span className="race-finish-mark__time font-monospace">{formatMs(mark.time_ms)}</span>
        </div>
      ))}
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
  initialRestartReady = false,
  onRunComplete,
  onLiveUpdate,
  onRaceResetReady,
  onRaceRestart,
}) {
  const [selectedIds, setSelectedIds] = useState(() =>
    (participantIdsProp.length ? participantIdsProp : []).map(String),
  )
  const [distanceLabel, setDistanceLabel] = useState(preset?.distanceLabel || '')
  const [clockStopped, setClockStopped] = useState(false)
  const [restartReady, setRestartReady] = useState(initialRestartReady)
  const stopwatchRef = useRef(null)
  const finishMarkCountRef = useRef(0)
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
    const wasRestartReady = restartReady
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
    const run = await progression.startRun(patch)
    if (run) {
      finishMarkCountRef.current = 0
      setClockStopped(false)
      setRestartReady(false)
      stopwatchRef.current?.start()
      if (wasRestartReady) void onRaceRestart?.()
    }
  }

  const handleCapture = () => {
    if (!progression.runId || restartReady) return
    if (selectedIds.length > 0 && finishMarkCountRef.current >= selectedIds.length) return
    const timing = stopwatchRef.current?.captureProgressEvent()
    if (!timing) return
    const nextFinishCount = finishMarkCountRef.current + 1
    finishMarkCountRef.current = nextFinishCount
    progression.recordFinishMark(timing)
    if (selectedIds.length > 0 && nextFinishCount >= selectedIds.length) {
      stopwatchRef.current?.stop()
      setClockStopped(true)
    }
  }

  const handleStopRaceClock = () => {
    setClockStopped(true)
  }

  const handleResetRace = async () => {
    finishMarkCountRef.current = 0
    setRestartReady(true)
    onRaceResetReady?.(selectedIds)
    await progression.abandonRun()
    setClockStopped(false)
  }

  const buildResultsFromAssignments = (assignments) => {
    const assignmentsByStudentId = new Map(
      assignments
        .filter((assignment) => assignment.studentId)
        .map((assignment) => [String(assignment.studentId), assignment]),
    )

    return selectedIds.map((sid) => {
      const assignment = assignmentsByStudentId.get(String(sid))
      if (!assignment) {
        return {
          student_id: String(sid),
          progress_events: [],
          ...participationMeta(),
        }
      }

      return {
        student_id: String(sid),
        finish_order: assignment.finishOrder,
        time_ms: assignment.timeMs,
        progress_events: [
          {
            sequence: 1,
            captured_at: assignment.capturedAt || new Date().toISOString(),
            metrics: {
              split_time_ms: assignment.timeMs,
              cumulative_time_ms: assignment.timeMs,
            },
          },
        ],
        ...participationMeta(),
      }
    })
  }

  const handleFinishAssignments = async (assignments) => {
    const results = buildResultsFromAssignments(assignments)
    const finishMarks = assignments.map((assignment) => ({
      id: assignment.markId,
      finish_order: assignment.finishOrder,
      ...(assignment.studentId ? { student_id: assignment.studentId } : {}),
      time_ms: assignment.timeMs,
      captured_at: assignment.capturedAt,
    }))
    const run = await progression.finalizeRun({
      results,
      heat_number: heatNumber,
      race_meta: {
        currentFinishes: finishMarks.length,
        finish_marks: finishMarks,
        endedAt: new Date().toISOString(),
      },
    })
    if (run) {
      await onRunComplete?.()
      if (!skipReadySetup) {
        progression.resetAll()
        setSelectedIds([])
      }
    }
  }

  const handleRunAgain = () => {
    finishMarkCountRef.current = 0
    progression.resetAll()
    setSelectedIds([])
    setClockStopped(false)
    setRestartReady(false)
  }

  const selectedAthletes = athletes.filter((a) => selectedIds.includes(String(a.studentId || a.id)))
  const finishMarks = finishMarksFromPayload(progression.payload)
  useEffect(() => {
    finishMarkCountRef.current = finishMarks.length
  }, [finishMarks.length])
  const recordedCount = finishMarks.length
  const canRecordMoreFinishes = selectedIds.length < 1 || recordedCount < selectedIds.length
  const allFinishTimesRecorded = selectedIds.length > 0 && recordedCount >= selectedIds.length
  const canSaveRace = clockStopped || allFinishTimesRecorded

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
        <p className="fw-semibold mb-2 text-white">Review finish times</p>
        {definition.capabilities.ranking && finishMarks.length > 0 ? (
          <FinishAssignmentEditor
            athletes={selectedAthletes}
            marks={finishMarks}
            disabled={disabled}
            busy={busy || progression.saving}
            onSubmitAssignments={handleFinishAssignments}
          />
        ) : (
          <CButton
            type="button"
            color="primary"
            size="lg"
            className="w-100 mt-3 fw-bold"
            disabled={disabled || progression.saving}
            onClick={() => void handleFinishAssignments([])}
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

  if (
    (progression.isReady && !skipReadySetup) ||
    progression.isActive ||
    progression.resumed ||
    restartReady
  ) {
    const raceStarted = progression.isActive || progression.resumed
    const waitingToStart = !raceStarted || restartReady
    return (
      <div className="heat-flow">
        {!skipReadySetup ? <p className="fw-semibold mb-2 text-white">Race {heatNumber}</p> : null}
        <div className="race-finish-capture">
          <p className="progression-stage__heading h4 fw-bold mb-1">
            {waitingToStart ? 'Select racers' : 'Record finishers'}
          </p>
          <p className="small text-body-secondary mb-2">
            {restartReady
              ? 'Race reset. Press Start to restart with these students.'
              : waitingToStart
                ? 'Select students, then press Start when the race begins.'
                : 'Tap Record as each student finishes. Save when the clock is stopped or every time is recorded.'}
          </p>
          {waitingToStart ? (
            <div className="race-finish-capture__selection mb-3">
              <AthleteSelectionGrid
                athletes={athletes}
                selectedIds={selectedIds}
                disabled={disabled || progression.saving}
                multi
                onSelect={(sid) => {
                  setSelectedIds((prev) =>
                    prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
                  )
                }}
              />
            </div>
          ) : null}
          <StopwatchPrimitive
            ref={stopwatchRef}
            disabled={disabled || (waitingToStart && selectedIds.length < 2)}
            autoStart={raceStarted && !timerStartedAt && !restartReady}
            timerStartedAt={timerStartedAt}
            raceControls
            onStartRace={() => void handleStart()}
            onStopMs={handleStopRaceClock}
            onResetRace={() => void handleResetRace()}
            className="mb-3"
          />
          <div className="race-finish-capture__summary small text-body-secondary mb-2">
            {recordedCount} / {selectedIds.length} finish times recorded
          </div>
          {waitingToStart ? (
            <p className="small text-body-secondary text-center mb-0">
              Select at least 2 students to enable Start.
            </p>
          ) : !canSaveRace ? (
            <>
              <CButton
                type="button"
                color="warning"
                size="lg"
                className="w-100 capture-progress-btn fw-bold"
                disabled={
                  disabled ||
                  busy ||
                  clockStopped ||
                  restartReady ||
                  !progression.runId ||
                  !canRecordMoreFinishes
                }
                onClick={handleCapture}
              >
                Record
              </CButton>
              <FinishMarksList marks={finishMarks} />
              {recordedCount > 0 && !clockStopped ? (
                <p className="small text-body-secondary text-center mt-2 mb-0">
                  Press Stop when you are ready to save this race.
                </p>
              ) : null}
            </>
          ) : recordedCount < 1 ? (
            <>
              <FinishMarksList marks={finishMarks} />
              <CButton
                type="button"
                color="primary"
                size="lg"
                className="w-100 mt-3 fw-bold"
                disabled={disabled || busy || progression.saving}
                onClick={() => void handleFinishAssignments([])}
              >
                Save race
              </CButton>
            </>
          ) : (
            <FinishAssignmentEditor
              athletes={selectedAthletes}
              marks={finishMarks}
              disabled={disabled}
              busy={busy || progression.saving}
              onSubmitAssignments={handleFinishAssignments}
            />
          )}
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
