import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAlert, CButton } from '@coreui/react'
import RacePickerSheet from '../../../activityRuns/components/RacePickerSheet'
import CustomRaceSheet from '../../../activityRuns/components/CustomRaceSheet'
import LiveRunStage from '../../../activityRuns/components/LiveRunStage'
import SessionRunTimeline from '../../../activityRuns/components/SessionRunTimeline'
import ParticipantProgressionFlow from '../../../activityRuns/flows/ParticipantProgressionFlow'
import sessionRunsApi from '../../../activityRuns/api/sessionRunsApi'
import { getActivityRunDefinition } from '../../../activityRuns/activityRunDefinitions'
import { useSessionRuns } from '../../../activityRuns/hooks/useSessionRuns'
import {
  buildOperationalStartPatch,
  getSkillModule,
  listFlyingLapPreset,
  listLapTimingPresets,
  toLapTimingPreset,
} from '../../constants/skillModules'
import { CUSTOM_PRESET } from '../../race/racePresets'
import '../../../activityRuns/activity-runs.css'

function findActiveRunForModule(runs, moduleId) {
  return (
    (runs || []).find((r) => {
      const meta = r.runPayload?.race_meta || {}
      return meta.status === 'active' && String(meta.skillModuleId || '') === String(moduleId)
    }) || null
  )
}

function filterCompletedRuns(runs, moduleId, phaseId) {
  return (runs || []).filter((r) => {
    const meta = r.runPayload?.race_meta || {}
    if (String(meta.skillModuleId || '') !== String(moduleId)) return false
    if (phaseId && String(r.phaseId || r.phase_id || '') !== String(phaseId)) return false
    return meta.status !== 'active'
  })
}

export default function OperationalTimingWorkspace({
  moduleId,
  athleteName,
  studentId,
  athletes = [],
  operationalSessionId,
  phaseId,
  disabled = false,
  busy = false,
  onClose,
  onRefresh,
}) {
  const mod = getSkillModule(moduleId)
  const [view, setView] = useState(moduleId === 'LAP_TIMING' ? 'presets' : 'live')

  useEffect(() => {
    if (moduleId === 'FLYING_LAP' && studentId) {
      setActivePreset(listFlyingLapPreset())
      setView('live')
    }
  }, [moduleId, studentId])
  const [activePreset, setActivePreset] = useState(
    moduleId === 'FLYING_LAP' ? listFlyingLapPreset() : null,
  )
  const [customConfig, setCustomConfig] = useState(null)
  const [ending, setEnding] = useState(false)
  const liveKeyRef = useRef(0)

  const { runs, loading, error, refresh } = useSessionRuns(operationalSessionId, phaseId)
  const activeRun = useMemo(() => findActiveRunForModule(runs, moduleId), [runs, moduleId])
  const completedRuns = useMemo(
    () => filterCompletedRuns(runs, moduleId, phaseId),
    [runs, moduleId, phaseId],
  )

  const lapPresets = useMemo(() => listLapTimingPresets(), [])
  const definition = activePreset?.runType ? getActivityRunDefinition(activePreset.runType) : null

  const participantIds = useMemo(
    () => (studentId ? [String(studentId)] : []),
    [studentId],
  )

  const launchPreset = useCallback(
    (preset, custom = null) => {
      const resolved = toLapTimingPreset(preset)
      const laps = custom?.targetProgressCount ?? resolved.targetProgressCount
      setActivePreset({
        ...resolved,
        targetProgressCount: laps,
        title: custom ? `Custom (${laps} laps)` : resolved.title,
      })
      setCustomConfig(custom)
      setView('live')
      liveKeyRef.current += 1
    },
    [],
  )

  const handleSelectPreset = (preset) => {
    if (disabled || busy) return
    launchPreset(preset)
  }

  const handleSelectCustom = () => setView('custom')

  const handleCustomConfirm = (config) => {
    launchPreset(
      {
        ...CUSTOM_PRESET,
        runType: 'ENDURANCE_LAPS',
        flowMode: 'TIMER',
        progressionMode: 'PER_PARTICIPANT',
        targetProgressCount: config.targetProgressCount,
      },
      config,
    )
  }

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

  const handleEndAttempt = useCallback(async () => {
    if (!window.confirm('End this attempt without saving?')) return
    setEnding(true)
    try {
      await abandonActiveRun()
      if (moduleId === 'LAP_TIMING') setView('presets')
      else setView('live')
      onRefresh?.()
    } catch (e) {
      window.alert(e?.message || 'Could not end attempt')
    } finally {
      setEnding(false)
    }
  }, [abandonActiveRun, moduleId, onRefresh])

  const handleRunComplete = useCallback(async () => {
    await refresh()
    onRefresh?.()
    if (moduleId === 'LAP_TIMING') {
      setView('presets')
      setActivePreset(null)
    }
  }, [refresh, onRefresh, moduleId])

  useEffect(() => {
    if (!loading && activeRun && view !== 'custom') {
      const presetId = activeRun.runPayload?.race_meta?.presetId
      const base =
        moduleId === 'FLYING_LAP'
          ? listFlyingLapPreset()
          : lapPresets.find((p) => p.id === presetId) || lapPresets[1]
      if (base) setActivePreset(toLapTimingPreset(base))
      setView('live')
    }
  }, [loading, activeRun, moduleId, lapPresets, view])

  if (!mod || !studentId) {
    return (
      <div className="operational-timing-workspace operational-timing-workspace--prompt">
        <p className="fw-semibold mb-1">Choose an athlete</p>
        <p className="small text-body-secondary mb-2">
          Select a student above, then open this drill again.
        </p>
        {onClose ? (
          <CButton color="link" size="sm" className="px-0" onClick={onClose}>
            ← Back to Skills
          </CButton>
        ) : null}
      </div>
    )
  }

  const initialPatch = buildOperationalStartPatch(moduleId, activePreset?.id, {
    participantIds,
    customLaps: customConfig?.targetProgressCount,
    customDistance: customConfig?.distanceLabel,
    raceSequence: completedRuns.length + 1,
    attemptNumber: completedRuns.length + 1,
  })

  const stageTitle = `${mod.displayName}${athleteName ? ` · ${athleteName}` : ''}`
  const stageSubtitle =
    activePreset?.subtitle ||
    (activePreset?.targetProgressCount
      ? `${activePreset.targetProgressCount} lap${activePreset.targetProgressCount === 1 ? '' : 's'}`
      : 'Training drill')

  if (view === 'custom') {
    return (
      <CustomRaceSheet
        disabled={disabled}
        busy={busy || ending}
        onConfirm={handleCustomConfirm}
        onCancel={() => setView('presets')}
      />
    )
  }

  if (view === 'presets' && moduleId === 'LAP_TIMING') {
    return (
      <div className="operational-timing-workspace" data-testid="operational-timing-presets">
        <CButton color="link" size="sm" className="px-0 mb-2" onClick={onClose}>
          ← Back to Skills
        </CButton>
        <p className="fw-semibold mb-1">Lap Timing — {athleteName || 'Athlete'}</p>
        <p className="small text-body-secondary mb-3">Choose a preset to start timing.</p>
        <RacePickerSheet
          presets={lapPresets}
          disabled={disabled || busy || ending}
          onSelectPreset={handleSelectPreset}
          onSelectCustom={handleSelectCustom}
        />
        <SessionRunTimeline
          runs={completedRuns}
          athletes={athletes}
          compact
          headingLabel="Completed attempts"
          defaultCollapsed
          variant="history"
        />
      </div>
    )
  }

  if (view === 'live' && definition && activePreset && participantIds.length) {
    return (
      <div
        className="operational-timing-workspace operational-timing-workspace--live"
        data-testid="operational-timing-live"
      >
        <CButton color="link" size="sm" className="px-0 mb-2" onClick={onClose}>
          ← Back to Skills
        </CButton>
        <LiveRunStage
          title={stageTitle}
          subtitle={stageSubtitle}
          live
          onEnd={handleEndAttempt}
        >
          <ParticipantProgressionFlow
            key={`${moduleId}-${liveKeyRef.current}-${activeRun?.id || 'new'}`}
            definition={definition}
            athletes={athletes}
            disabled={disabled || ending}
            busy={busy || ending}
            runType={activePreset.runType}
            operationalSessionId={operationalSessionId}
            phaseId={phaseId}
            preset={activePreset}
            participantIds={participantIds}
            skipReadySetup
            autoStart={false}
            resumeRun={activeRun || null}
            initialPatch={initialPatch}
            operationalMode
            hideFinishEarly
            onRunComplete={handleRunComplete}
            onLiveUpdate={() => void refresh()}
          />
        </LiveRunStage>
        <SessionRunTimeline
          runs={completedRuns}
          athletes={athletes}
          compact
          headingLabel="Completed attempts"
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

  if (moduleId === 'FLYING_LAP' && !loading) {
    return (
      <div className="operational-timing-workspace" data-testid="operational-timing-flying">
        <CButton color="link" size="sm" className="px-0 mb-2" onClick={onClose}>
          ← Back to Skills
        </CButton>
        <p className="small text-body-secondary">Preparing Flying Lap…</p>
      </div>
    )
  }

  return loading ? (
    <p className="small text-body-secondary">Loading attempts…</p>
  ) : null
}
