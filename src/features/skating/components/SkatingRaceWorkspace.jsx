import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAlert } from '@coreui/react'
import RacePickerSheet from '../../activityRuns/components/RacePickerSheet'
import CustomRaceSheet from '../../activityRuns/components/CustomRaceSheet'
import LiveRunStage from '../../activityRuns/components/LiveRunStage'
import SessionRunTimeline from '../../activityRuns/components/SessionRunTimeline'
import TeamBuilderPrimitive from '../../activityRuns/components/primitives/TeamBuilderPrimitive'
import sessionRunsApi from '../../activityRuns/api/sessionRunsApi'
import { getActivityRunDefinition } from '../../activityRuns/activityRunDefinitions'
import { getRunLaunchMeta } from '../../activityRuns/utils/runLaunchMeta'
import { getFlowComponent } from '../../activityRuns/runFlowRegistry'
import { useSessionRuns } from '../../activityRuns/hooks/useSessionRuns'
import {
  athleteIdsFromSession,
  buildPresetStartPatch,
  CUSTOM_PRESET,
  buildPresetSubtitle,
  listPickerPresets,
  resolvePreset,
  resolvePresetForSession,
} from '../race/racePresets'
import { clearRaceSession, writeRaceSession } from '../race/raceSessionStorage'
import '../../activityRuns/activity-runs.css'

function findActiveRun(runs) {
  return (runs || []).find((r) => r.runPayload?.race_meta?.status === 'active') || null
}

function presetFromActiveRun(activeRun) {
  const meta = activeRun?.runPayload?.race_meta || {}
  return (
    resolvePreset(meta.presetId) || {
      id: 'RESUMED',
      title: meta.title || 'Race',
      flowMode: getActivityRunDefinition(activeRun.runType)?.ui?.mode || 'HEAT',
      runType: activeRun.runType,
      progressionMode: activeRun.runPayload?.progression_config?.progression_mode,
      targetProgressCount: activeRun.runPayload?.progression_config?.target_progress_count ?? 5,
    }
  )
}

export default function SkatingRaceWorkspace({
  operationalSessionId,
  phaseId,
  athletes = [],
  heatNumber = 1,
  phaseTitle,
  disabled,
  busy,
  onRefresh,
}) {
  const [view, setView] = useState('picker')
  const [activePreset, setActivePreset] = useState(null)
  const [customConfig, setCustomConfig] = useState(null)
  const [relayTeams, setRelayTeams] = useState([{ team_id: 'team-1', members: [] }])
  const [pendingPreset, setPendingPreset] = useState(null)
  const [hydrating, setHydrating] = useState(true)
  const [ending, setEnding] = useState(false)
  const [resetReady, setResetReady] = useState(false)
  const [resetParticipantIds, setResetParticipantIds] = useState([])
  const liveKeyRef = useRef(0)

  const { runs, loading, error, refresh } = useSessionRuns(operationalSessionId, phaseId)

  const presets = useMemo(() => listPickerPresets(), [])
  const activeRun = useMemo(() => findActiveRun(runs), [runs])

  useEffect(() => {
    if (!loading) setHydrating(false)
  }, [loading])

  const launchPreset = useCallback((preset, custom = null) => {
    const resolved = resolvePresetForSession(preset)
    if (resolved.requiresTeamSetup) {
      setPendingPreset(resolved)
      setView('relay_setup')
      return
    }

    const laps = custom?.targetProgressCount ?? resolved.targetProgressCount
    const customPreset = {
      ...resolved,
      id: custom ? 'CUSTOM' : resolved.id,
      runType: resolved.runType || 'HEAT_RACE',
      flowMode: resolved.flowMode || 'HEAT',
      progressionMode: resolved.progressionMode || 'PACK',
      targetProgressCount: laps,
      distanceLabel: custom?.distanceLabel ?? resolved.distanceLabel,
      title: custom ? `Custom (${laps} laps)` : resolved.title,
      subtitle: custom
        ? buildPresetSubtitle({
            targetProgressCount: laps,
            distanceLabel: custom.distanceLabel,
            venueType: 'RINK',
            context: { autoVenueLabel: true },
          })
        : resolved.subtitle,
    }

    setActivePreset(customPreset)
    setCustomConfig(custom)
    setResetReady(false)
    setResetParticipantIds([])
    setView('setup')
    liveKeyRef.current += 1
  }, [])

  const handleSelectPreset = (preset) => {
    if (disabled || busy) return
    launchPreset(preset)
  }

  const handleSelectCustom = () => setView('custom')

  const handleCustomConfirm = (config) => {
    const base = {
      ...CUSTOM_PRESET,
      title: 'Custom',
      runType: 'HEAT_RACE',
      flowMode: 'HEAT',
      progressionMode: 'PACK',
      requiresParticipantPick: false,
      requiresTeamSetup: false,
      targetProgressCount: config.targetProgressCount,
    }
    launchPreset(base, config)
  }

  const handleRelayStart = () => {
    if (!pendingPreset) return
    launchPreset(pendingPreset)
    setPendingPreset(null)
  }

  const handleResumeActive = useCallback(() => {
    if (!activeRun) return
    const preset = presetFromActiveRun(activeRun)
    setActivePreset(preset)
    setResetReady(false)
    setResetParticipantIds([])
    setView('live')
    liveKeyRef.current += 1
    writeRaceSession(phaseId, {
      view: 'live',
      presetId: preset.id,
      runId: activeRun.id,
    })
  }, [activeRun, phaseId])

  const abandonActiveRun = useCallback(async () => {
    if (!activeRun?.id) return
    const meta = activeRun.runPayload?.race_meta || {}
    await sessionRunsApi.updateRun(activeRun.id, {
      runPayload: {
        race_meta: {
          ...meta,
          status: 'abandoned',
          endedAt: new Date().toISOString(),
        },
      },
      partial: true,
    })
    await refresh()
  }, [activeRun, refresh])

  const resetToPicker = useCallback(() => {
    clearRaceSession(phaseId)
    setActivePreset(null)
    setCustomConfig(null)
    setResetReady(false)
    setResetParticipantIds([])
    setView('picker')
  }, [phaseId])

  const handleRunComplete = useCallback(async () => {
    resetToPicker()
    await refresh()
    onRefresh?.()
  }, [resetToPicker, refresh, onRefresh])

  const handleCancelSetup = useCallback(() => {
    if (window.confirm('Cancel this race setup?')) {
      resetToPicker()
    }
  }, [resetToPicker])

  const handleEndRace = useCallback(async () => {
    if (!window.confirm('End this race without saving?')) return
    setEnding(true)
    try {
      await abandonActiveRun()
      resetToPicker()
      onRefresh?.()
    } catch (e) {
      window.alert(e?.message || 'Could not end race')
    } finally {
      setEnding(false)
    }
  }, [abandonActiveRun, resetToPicker, onRefresh])

  const handleLiveUpdate = useCallback(() => {
    if (!resetReady) void refresh()
  }, [refresh, resetReady])

  const handleRaceResetReady = useCallback((participantIds = []) => {
    setResetParticipantIds(participantIds.map(String))
    setResetReady(true)
    setView('live')
  }, [])

  const handleRaceRestart = useCallback(async () => {
    await refresh()
  }, [refresh])

  useEffect(() => {
    if (!resetReady || !activeRun) return
    const frameId = window.requestAnimationFrame(() => {
      setResetReady(false)
      setResetParticipantIds([])
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [resetReady, activeRun])

  useEffect(() => {
    if (view === 'picker' && !activeRun) {
      clearRaceSession(phaseId)
    }
  }, [view, activeRun, phaseId])

  useEffect(() => {
    if (loading || view !== 'setup') return
    const run = findActiveRun(runs)
    if (run) {
      setActivePreset(presetFromActiveRun(run))
      setView('live')
    }
  }, [loading, runs, view])

  const definition = activePreset?.runType ? getActivityRunDefinition(activePreset.runType) : null
  const FlowComponent = activePreset?.flowMode ? getFlowComponent(activePreset.flowMode) : null
  const launchMeta = activePreset?.runType ? getRunLaunchMeta(activePreset.runType) : null

  const raceSequence = activeRun?.runPayload?.race_meta?.raceSequence ?? heatNumber ?? 1
  const isSetup = view === 'setup' && activePreset && FlowComponent && definition
  const isLive =
    view === 'live' && activePreset && FlowComponent && definition && (activeRun || resetReady)

  const stageTitle = activePreset ? `${launchMeta?.emoji || '🏁'} ${activePreset.title}`.trim() : ''
  const stageSubtitle =
    heatNumber != null
      ? `Race ${raceSequence} · ${athletes.length} athletes`
      : `${athletes.length} athletes`

  const flowProps = {
    definition,
    athletes,
    disabled: disabled || ending,
    busy: busy || ending,
    heatNumber: raceSequence,
    runType: activePreset?.runType,
    operationalSessionId,
    phaseId,
    preset: activePreset,
    initialPatch: buildPresetStartPatch(activePreset || {}, {
      raceSequence: heatNumber ?? 1,
      participantIds: [],
      customLaps: customConfig?.targetProgressCount,
      customDistance: customConfig?.distanceLabel,
    }),
    relayTeams,
    operationalMode: false,
    hideFinishEarly: false,
    onRunComplete: handleRunComplete,
    onLiveUpdate: handleLiveUpdate,
    onRaceResetReady: handleRaceResetReady,
    onRaceRestart: handleRaceRestart,
  }

  if (hydrating && loading) {
    return <p className="small text-body-secondary py-2">Loading races…</p>
  }

  if (view === 'custom') {
    return (
      <CustomRaceSheet
        disabled={disabled}
        busy={busy}
        onConfirm={handleCustomConfirm}
        onCancel={() => setView('picker')}
      />
    )
  }

  if (view === 'relay_setup' && pendingPreset) {
    return (
      <div className="activity-run-workspace">
        <p className="fw-semibold mb-2">{pendingPreset.title}</p>
        <p className="small text-body-secondary mb-2">Set up teams, then start the race</p>
        <TeamBuilderPrimitive
          athletes={athletes}
          disabled={disabled}
          onTeamsChange={setRelayTeams}
        />
        <button
          type="button"
          className="btn btn-primary btn-lg w-100 mt-3 fw-bold"
          disabled={disabled || relayTeams.every((t) => !t.members?.length)}
          onClick={handleRelayStart}
        >
          Start race →
        </button>
        <button type="button" className="btn btn-link w-100 mt-2" onClick={() => setView('picker')}>
          Back
        </button>
      </div>
    )
  }

  if (isSetup || isLive) {
    if (activePreset?.requiresTeamSetup && relayTeams.length) {
      flowProps.initialPatch.teams = relayTeams.map((t) => ({
        team_id: t.team_id,
        members: t.members || [],
        progress_events: [],
      }))
    }

    return (
      <div
        className={`activity-run-workspace${isLive ? ' activity-run-workspace--live' : ''}`}
        data-testid="skating-race-workspace"
      >
        {phaseTitle ? (
          <p className="activity-run-workspace__phase-context small mb-2">
            <span className="activity-run-workspace__phase-dot" aria-hidden />
            {phaseTitle}
          </p>
        ) : null}
        {isSetup ? (
          <button
            type="button"
            className="btn btn-link btn-sm px-0 mb-2"
            onClick={handleCancelSetup}
          >
            ← Back to race formats
          </button>
        ) : null}
        <LiveRunStage
          title={stageTitle}
          subtitle={stageSubtitle}
          live={isLive}
          onEnd={isLive ? handleEndRace : handleCancelSetup}
        >
          <FlowComponent
            key={`${activePreset.id}-${liveKeyRef.current}-${activeRun?.id || 'reset-ready'}`}
            {...flowProps}
            participantIds={
              resetReady ? resetParticipantIds : isLive ? athleteIdsFromSession(athletes) : []
            }
            skipReadySetup={isLive}
            autoStart={false}
            resumeRun={isLive && activeRun ? activeRun : null}
            initialRestartReady={resetReady}
          />
        </LiveRunStage>
        <SessionRunTimeline
          runs={runs}
          athletes={athletes}
          compact
          headingLabel="Completed races"
          defaultCollapsed
          variant="history"
        />
        {error ? (
          <CAlert color="danger" className="small py-2 mt-2">
            {error}
          </CAlert>
        ) : null}
      </div>
    )
  }

  return (
    <div className="activity-run-workspace" data-testid="skating-race-workspace">
      {phaseTitle ? (
        <p className="activity-run-workspace__phase-context small mb-2">
          <span className="activity-run-workspace__phase-dot" aria-hidden />
          {phaseTitle}
        </p>
      ) : null}
      <div className="activity-run-workspace__idle-hero activity-run-workspace__idle-hero--compact">
        <span className="activity-run-workspace__idle-mark" aria-hidden>
          🏁
        </span>
        <p className="activity-run-workspace__idle-title">Ready to race</p>
        <p className="activity-run-workspace__idle-hint small mb-0">Tap a format below to begin</p>
      </div>
      {activeRun ? (
        <div className="mb-3">
          <button
            type="button"
            className="race-picker-card w-100 text-start"
            disabled={disabled || busy || ending}
            onClick={handleResumeActive}
          >
            <span className="race-picker-card__title">Resume in-progress race</span>
            <span className="race-picker-card__subtitle">
              {presetFromActiveRun(activeRun).title} · tap to continue timing
            </span>
          </button>
          <button
            type="button"
            className="btn btn-link btn-sm px-0 mt-1"
            disabled={ending}
            onClick={() => void handleEndRace()}
          >
            Discard in-progress race
          </button>
        </div>
      ) : null}
      <RacePickerSheet
        presets={presets}
        disabled={disabled || busy || ending}
        onSelectPreset={handleSelectPreset}
        onSelectCustom={handleSelectCustom}
      />
      {loading ? <p className="small text-body-secondary mt-3 mb-0">Loading races…</p> : null}
      <SessionRunTimeline
        runs={runs}
        athletes={athletes}
        headingLabel="Completed races"
        defaultCollapsed
        variant="history"
      />
      {error ? (
        <CAlert color="danger" className="small py-2 mt-2">
          {error}
        </CAlert>
      ) : null}
    </div>
  )
}
