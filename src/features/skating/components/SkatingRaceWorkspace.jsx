import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAlert } from '@coreui/react'
import RacePickerSheet from '../../activityRuns/components/RacePickerSheet'
import CustomRaceSheet from '../../activityRuns/components/CustomRaceSheet'
import LiveRaceStage from '../../activityRuns/components/LiveRaceStage'
import SessionRunTimeline from '../../activityRuns/components/SessionRunTimeline'
import TeamBuilderPrimitive from '../../activityRuns/components/primitives/TeamBuilderPrimitive'
import { getActivityRunDefinition } from '../../activityRuns/activityRunDefinitions'
import { getFlowComponent } from '../../activityRuns/runFlowRegistry'
import { useSessionRuns } from '../../activityRuns/hooks/useSessionRuns'
import {
  athleteIdsFromSession,
  buildPresetStartPatch,
  buildRaceStatusLine,
  CUSTOM_PRESET,
  buildPresetSubtitle,
  listPickerPresets,
  resolvePreset,
  resolvePresetForSession,
} from '../race/racePresets'
import { clearRaceSession, readRaceSession, writeRaceSession } from '../race/raceSessionStorage'
import useRecentRaces from '../race/useRecentRaces'
import '../../activityRuns/activity-runs.css'

function findActiveRun(runs) {
  return (runs || []).find((r) => r.runPayload?.race_meta?.status === 'active') || null
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
  const liveKeyRef = useRef(0)

  const { runs, loading, error, refresh } = useSessionRuns(operationalSessionId, phaseId)
  const { recentRaces, recordRecent } = useRecentRaces(operationalSessionId)

  const presets = useMemo(() => listPickerPresets(), [])
  const participantIds = useMemo(() => athleteIdsFromSession(athletes), [athletes])

  const activeRun = useMemo(() => findActiveRun(runs), [runs])

  const resumePreset = useMemo(() => {
    const id = activeRun?.runPayload?.race_meta?.presetId
    return id ? resolvePreset(id) : null
  }, [activeRun])

  useEffect(() => {
    const stored = readRaceSession(phaseId)
    if (stored?.view === 'live' && stored.presetId) {
      setView('live')
      setActivePreset(resolvePreset(stored.presetId))
    }
  }, [phaseId])

  useEffect(() => {
    if (loading) return
    if (activeRun) {
      const preset = resolvePreset(activeRun.runPayload?.race_meta?.presetId) || {
        id: 'RESUMED',
        title: activeRun.runPayload?.race_meta?.title || 'Race',
        flowMode: getActivityRunDefinition(activeRun.runType)?.ui?.mode || 'HEAT',
        runType: activeRun.runType,
        progressionMode: activeRun.runPayload?.progression_config?.progression_mode,
      }
      setActivePreset(preset)
      setView('live')
      writeRaceSession(phaseId, {
        view: 'live',
        presetId: preset.id,
        runId: activeRun.id,
      })
    } else if (view === 'live' && !activeRun) {
      const stored = readRaceSession(phaseId)
      if (!stored) setView('picker')
    }
    setHydrating(false)
  }, [loading, activeRun, phaseId, view])

  const syncStorage = useCallback(
    (patch) => {
      writeRaceSession(phaseId, {
        view: 'live',
        presetId: activePreset?.id,
        ...patch,
      })
    },
    [phaseId, activePreset?.id],
  )

  const launchPreset = useCallback(
    async (preset, custom = null) => {
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

      recordRecent({
        presetId: resolved.id,
        title: customPreset.title,
        subtitle: custom ? buildPresetSubtitle(customPreset) : resolved.subtitle,
        customSnapshot: custom,
      })

      setActivePreset(customPreset)
      setCustomConfig(custom)
      setView('live')
      liveKeyRef.current += 1
      syncStorage({ presetId: customPreset.id })
    },
    [recordRecent, syncStorage],
  )

  const handleSelectPreset = (preset) => {
    if (disabled || busy) return
    void launchPreset(preset)
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
    void launchPreset(base, config)
  }

  const handleRelayStart = () => {
    if (!pendingPreset) return
    void launchPreset(pendingPreset)
    setPendingPreset(null)
  }

  const handleRunComplete = useCallback(async () => {
    clearRaceSession(phaseId)
    setActivePreset(null)
    setCustomConfig(null)
    setView('picker')
    await refresh()
    onRefresh?.()
  }, [phaseId, refresh, onRefresh])

  const handleEndRace = useCallback(() => {
    if (window.confirm('End this race without saving?')) {
      clearRaceSession(phaseId)
      setActivePreset(null)
      setView('picker')
    }
  }, [phaseId])

  const definition = activePreset?.runType
    ? getActivityRunDefinition(activePreset.runType)
    : null
  const FlowComponent = activePreset?.flowMode
    ? getFlowComponent(activePreset.flowMode)
    : null

  const raceSequence = activeRun?.runPayload?.race_meta?.raceSequence ?? heatNumber ?? 1
  const currentLap = activeRun?.runPayload?.race_meta?.currentLap ?? 0
  const targetLaps =
    activeRun?.runPayload?.progression_config?.target_progress_count ??
    activePreset?.targetProgressCount ??
    5

  const statusLine = buildRaceStatusLine({
    raceSequence,
    currentLap,
    targetLaps,
    isLive: view === 'live',
  })

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
      <div className="skating-race-workspace">
        <p className="fw-semibold mb-2">{pendingPreset.title}</p>
        <p className="small text-body-secondary mb-2">Set up teams, then start the race</p>
        <TeamBuilderPrimitive athletes={athletes} disabled={disabled} onTeamsChange={setRelayTeams} />
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

  if (view === 'live' && activePreset && FlowComponent && definition) {
    const initialPatch = buildPresetStartPatch(activePreset, {
      raceSequence: heatNumber ?? 1,
      participantIds: activePreset.requiresParticipantPick ? [] : participantIds,
      customLaps: customConfig?.targetProgressCount,
      customDistance: customConfig?.distanceLabel,
    })
    if (activePreset.requiresTeamSetup && relayTeams.length) {
      initialPatch.teams = relayTeams.map((t) => ({
        team_id: t.team_id,
        members: t.members || [],
        progress_events: [],
      }))
    }

    return (
      <div className="skating-race-workspace skating-race-workspace--live">
        {phaseTitle ? (
          <p className="activity-run-workspace__phase-context small mb-2">
            <span className="activity-run-workspace__phase-dot" aria-hidden />
            {phaseTitle}
          </p>
        ) : null}
        <LiveRaceStage
          title={activePreset.title}
          statusLine={statusLine}
          subtitle={`${participantIds.length} athletes`}
          onEnd={handleEndRace}
        >
          <FlowComponent
            key={`${activePreset.id}-${liveKeyRef.current}-${activeRun?.id || 'new'}`}
            definition={definition}
            athletes={athletes}
            disabled={disabled}
            busy={busy}
            heatNumber={raceSequence}
            runType={activePreset.runType}
            operationalSessionId={operationalSessionId}
            phaseId={phaseId}
            preset={activePreset}
            participantIds={participantIds}
            skipReadySetup
            autoStart={!activeRun && liveKeyRef.current > 0}
            resumeRun={activeRun}
            initialPatch={initialPatch}
            relayTeams={relayTeams}
            operationalMode
            hideFinishEarly
            onRunComplete={handleRunComplete}
            onLiveUpdate={() => {
              syncStorage({})
              void refresh()
            }}
          />
        </LiveRaceStage>
        <SessionRunTimeline runs={runs} compact headingLabel="Completed races" />
        {error ? (
          <CAlert color="danger" className="small py-2 mt-2">
            {error}
          </CAlert>
        ) : null}
      </div>
    )
  }

  return (
    <div className="skating-race-workspace" data-testid="skating-race-workspace">
      {phaseTitle ? (
        <p className="activity-run-workspace__phase-context small mb-2">
          <span className="activity-run-workspace__phase-dot" aria-hidden />
          {phaseTitle}
        </p>
      ) : null}
      <RacePickerSheet
        presets={presets}
        recentRaces={recentRaces}
        disabled={disabled || busy}
        onSelectPreset={handleSelectPreset}
        onSelectCustom={handleSelectCustom}
      />
      <SessionRunTimeline runs={runs} headingLabel="Completed races" />
      {error ? (
        <CAlert color="danger" className="small py-2 mt-2">
          {error}
        </CAlert>
      ) : null}
    </div>
  )
}
