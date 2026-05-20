import { useCallback, useMemo, useRef, useState } from 'react'
import sessionRunsApi from '../api/sessionRunsApi'
import { buildRunPayload } from '../utils/buildRunPayload'
import { normalizeProgressionPayload } from '../utils/normalizeProgressionPayload'
import {
  appendProgressEventForParticipant,
  appendProgressEventForTeam,
  appendProgressEventPack,
  computeProgressMetrics,
} from '../utils/progressionPayload'
import { useProgressionStateMachine, RUN_STATES } from './useProgressionStateMachine'

const PATCH_DEBOUNCE_MS = 400

function buildRaceMetaPatch(payload, extras = {}) {
  const meta = payload?.race_meta || {}
  const results = payload?.results || []
  const firstEvents = results[0]?.progress_events || []
  const currentLap = firstEvents.length
  return {
    race_meta: {
      ...meta,
      ...extras,
      currentLap,
      targetLaps:
        extras.targetLaps ??
        meta.targetLaps ??
        payload?.progression_config?.target_progress_count ??
        null,
    },
  }
}

/**
 * @param {object} p
 */
export function useProgressionRun({
  operationalSessionId,
  phaseId,
  runType,
  definition,
  progressionMode,
  participantIds = [],
  teamId = null,
  heatNumber = 1,
}) {
  const [payload, setPayload] = useState(() => buildRunPayload(runType, { heat_number: heatNumber }))
  const [runId, setRunId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resumed, setResumed] = useState(false)
  const patchTimer = useRef(null)

  const targetCount =
    payload?.progression_config?.target_progress_count ??
    definition?.progressionConfig?.defaultCount ??
    5

  const sm = useProgressionStateMachine({ targetProgressCount: targetCount })

  const metrics = useMemo(() => computeProgressMetrics(payload), [payload])

  const flushPatch = useCallback(
    async (nextPayload) => {
      if (!runId) return
      setSaving(true)
      try {
        await sessionRunsApi.updateRun(runId, {
          runPayload: normalizeProgressionPayload(nextPayload),
          partial: true,
        })
      } catch (e) {
        setError(e?.message || 'Could not save progress')
      } finally {
        setSaving(false)
      }
    },
    [runId],
  )

  const schedulePatch = useCallback(
    (nextPayload) => {
      if (patchTimer.current) clearTimeout(patchTimer.current)
      patchTimer.current = setTimeout(() => {
        void flushPatch(nextPayload)
      }, PATCH_DEBOUNCE_MS)
    },
    [flushPatch],
  )

  const setTargetProgressCount = useCallback((count) => {
    setPayload((prev) => ({
      ...prev,
      progression_config: {
        ...(prev.progression_config || {}),
        target_progress_count: Math.max(1, Number(count) || 1),
        locked: false,
      },
    }))
  }, [])

  const startRun = useCallback(
    async (initialPatch = {}) => {
      setError('')
      if (!operationalSessionId || !phaseId) {
        setError('Session and phase required')
        return null
      }
      const timerStartedAt = initialPatch.race_meta?.timerStartedAt ?? Date.now()
      const startPayload = normalizeProgressionPayload({
        ...payload,
        ...initialPatch,
        progression_config: {
          ...(payload.progression_config || {}),
          ...(initialPatch.progression_config || {}),
          locked: true,
          progression_mode:
            initialPatch.progression_config?.progression_mode ||
            progressionMode ||
            definition?.progressionMode ||
            'PACK',
        },
        race_meta: {
          status: 'active',
          startedAt: new Date().toISOString(),
          timerStartedAt,
          participantIds: participantIds.map(String),
          raceSequence: initialPatch.heat_number ?? heatNumber,
          currentLap: 0,
          targetLaps:
            initialPatch.progression_config?.target_progress_count ??
            targetCount,
          ...(initialPatch.race_meta || {}),
        },
      })
      setSaving(true)
      try {
        const run = await sessionRunsApi.createRun(operationalSessionId, {
          runType,
          phaseId,
          runPayload: startPayload,
        })
        setRunId(run?.id ?? null)
        setPayload(startPayload)
        sm.startRun()
        setResumed(false)
        return run
      } catch (e) {
        setError(e?.message || 'Could not start race')
        return null
      } finally {
        setSaving(false)
      }
    },
    [
      operationalSessionId,
      phaseId,
      payload,
      runType,
      progressionMode,
      definition,
      sm,
      participantIds,
      heatNumber,
      targetCount,
    ],
  )

  const resumeRun = useCallback(
    (run) => {
      if (!run?.id) return
      const p = normalizeProgressionPayload(run.runPayload || {})
      setRunId(run.id)
      setPayload(p)
      setResumed(true)

      const events = p.results?.[0]?.progress_events || []
      const completed = events.length
      const target = p.progression_config?.target_progress_count ?? targetCount

      if (p.race_meta?.status === 'completed') {
        sm.completeRun()
      } else if (target > 0 && completed >= target) {
        sm.finishProgress()
        sm.recordCapture(completed)
      } else if (completed > 0) {
        sm.startRun()
        sm.recordCapture(completed)
      } else {
        sm.startRun()
      }
    },
    [sm, targetCount],
  )

  const applyCapture = useCallback(
    (timingMetrics) => {
      const metrics = {
        split_time_ms: timingMetrics.splitTimeMs,
        cumulative_time_ms: timingMetrics.cumulativeTimeMs,
      }
      let next = payload
      const mode = progressionMode || definition?.progressionMode || 'PACK'
      if (mode === 'PER_PARTICIPANT' && participantIds.length === 1) {
        next = appendProgressEventForParticipant(payload, participantIds[0], metrics)
      } else if (mode === 'PER_PARTICIPANT') {
        next = payload
      } else if (mode === 'PER_TEAM') {
        const tid = teamId || payload.teams?.[0]?.team_id || 'team-1'
        next = appendProgressEventForTeam(payload, tid, metrics)
        const team = next.teams?.find((t) => String(t.team_id) === String(tid))
        const count = team?.progress_events?.length ?? 0
        sm.recordCapture(count)
      } else {
        next = appendProgressEventPack(payload, participantIds, metrics)
        const completed = next.results?.[0]?.progress_events?.length ?? 0
        sm.recordCapture(completed)
      }
      next = {
        ...next,
        ...buildRaceMetaPatch(next, {
          timerStartedAt: next.race_meta?.timerStartedAt ?? payload.race_meta?.timerStartedAt,
        }),
      }
      if (next.race_meta?.timerStartedAt == null) {
        next.race_meta = { ...next.race_meta, timerStartedAt: Date.now() }
      }
      setPayload(next)
      schedulePatch(next)
      return next
    },
    [payload, progressionMode, definition, participantIds, teamId, sm, schedulePatch],
  )

  const captureForParticipant = useCallback(
    (studentId, timingMetrics) => {
      const metrics = {
        split_time_ms: timingMetrics.splitTimeMs,
        cumulative_time_ms: timingMetrics.cumulativeTimeMs,
      }
      let next = appendProgressEventForParticipant(payload, studentId, metrics)
      next = { ...next, ...buildRaceMetaPatch(next) }
      setPayload(next)
      const row = next.results?.find((r) => String(r.student_id) === String(studentId))
      const count = row?.progress_events?.length ?? 0
      sm.recordCapture(count)
      if (targetCount > 0 && count >= targetCount) {
        sm.finishProgress()
      }
      schedulePatch(next)
      return next
    },
    [payload, targetCount, sm, schedulePatch],
  )

  const finalizeRun = useCallback(
    async (patch = {}) => {
      if (!runId) return null
      setSaving(true)
      setError('')
      try {
        const merged = normalizeProgressionPayload({
          ...payload,
          ...patch,
          race_meta: {
            ...(payload.race_meta || {}),
            ...(patch.race_meta || {}),
            status: 'completed',
          },
        })
        const run = await sessionRunsApi.updateRun(runId, {
          runPayload: merged,
          partial: false,
        })
        sm.completeRun()
        return run
      } catch (e) {
        setError(e?.message || 'Could not save race')
        return null
      } finally {
        setSaving(false)
      }
    },
    [runId, payload, sm],
  )

  const resetAll = useCallback(() => {
    if (patchTimer.current) clearTimeout(patchTimer.current)
    setRunId(null)
    setPayload(buildRunPayload(runType, { heat_number: heatNumber }))
    sm.resetRun()
    setResumed(false)
    setError('')
  }, [runType, heatNumber, sm])

  return {
    ...sm,
    RUN_STATES,
    payload,
    setPayload,
    runId,
    saving,
    error,
    resumed,
    metrics,
    targetCount,
    setTargetProgressCount,
    startRun,
    resumeRun,
    applyCapture,
    captureForParticipant,
    finalizeRun,
    resetAll,
  }
}

export default useProgressionRun
