import React, { useCallback, useState } from 'react'
import { CAlert } from '@coreui/react'
import RunTypeSelector from '../components/RunTypeSelector'
import SessionRunTimeline from '../components/SessionRunTimeline'
import LiveRunStage from '../components/LiveRunStage'
import { getActivityRunDefinition } from '../activityRunDefinitions'
import { getRunLaunchMeta } from '../utils/runLaunchMeta'
import { getFlowComponent } from '../runFlowRegistry'
import { useSessionRuns } from '../hooks/useSessionRuns'
import '../activity-runs.css'

export default function ActivityRunWorkspace({
  operationalSessionId,
  phaseId,
  athletes = [],
  activitySlug = 'skating',
  heatNumber,
  phaseTitle,
  disabled,
  busy,
  leaderboard,
  onRefresh,
}) {
  const [selectedRunType, setSelectedRunType] = useState(null)
  const { runs, loading, error, refresh, createRun } = useSessionRuns(
    operationalSessionId,
    phaseId,
  )

  const handleSaveRun = useCallback(
    async (runType, runPayload) => {
      await createRun(runType, runPayload)
      await refresh()
      onRefresh?.()
      setSelectedRunType(null)
    },
    [createRun, refresh, onRefresh],
  )

  const handleRunComplete = useCallback(async () => {
    await refresh()
    onRefresh?.()
    setSelectedRunType(null)
  }, [refresh, onRefresh])

  const definition = selectedRunType ? getActivityRunDefinition(selectedRunType) : null
  const launchMeta = selectedRunType ? getRunLaunchMeta(selectedRunType) : null
  const FlowComponent = definition ? getFlowComponent(definition.ui.mode) : null
  const isLive = Boolean(selectedRunType && FlowComponent)

  const liveSubtitle =
    heatNumber != null ? `Heat ${heatNumber} · ${athletes.length} athletes` : `${athletes.length} athletes`

  return (
    <div
      className={`activity-run-workspace${isLive ? ' activity-run-workspace--live' : ''}`}
      data-testid="activity-run-workspace"
    >
      {phaseTitle ? (
        <p className="activity-run-workspace__phase-context small mb-2">
          <span className="activity-run-workspace__phase-dot" aria-hidden />
          {phaseTitle}
        </p>
      ) : null}

      {isLive ? (
        <>
          <LiveRunStage
            title={`${launchMeta?.emoji || ''} ${definition?.label || ''}`.trim()}
            subtitle={liveSubtitle}
            live
            onEnd={() => setSelectedRunType(null)}
          >
            <FlowComponent
              definition={definition}
              athletes={athletes}
              disabled={disabled}
              busy={busy}
              heatNumber={heatNumber ?? 1}
              runType={selectedRunType}
              operationalSessionId={operationalSessionId}
              phaseId={phaseId}
              onSaveRun={handleSaveRun}
              onRunComplete={handleRunComplete}
            />
          </LiveRunStage>
          <RunTypeSelector
            activitySlug={activitySlug}
            disabled={disabled}
            compact
            activeType={selectedRunType}
            onSelect={setSelectedRunType}
          />
          <SessionRunTimeline runs={runs} compact />
        </>
      ) : (
        <>
          <div className="activity-run-workspace__idle-hero">
            <span className="activity-run-workspace__idle-pulse" aria-hidden />
            <p className="activity-run-workspace__idle-title">Ready to race</p>
            <p className="activity-run-workspace__idle-hint small mb-0">
              Pick a run type — timer and capture start immediately
            </p>
          </div>
          <RunTypeSelector
            activitySlug={activitySlug}
            disabled={disabled}
            onSelect={setSelectedRunType}
          />
          {loading ? <p className="small text-body-secondary mt-3 mb-0">Loading runs…</p> : null}
          <SessionRunTimeline runs={runs} />
        </>
      )}

      {error ? (
        <CAlert color="danger" className="small py-2 mt-2">
          {error}
        </CAlert>
      ) : null}

      {leaderboard?.entries?.length && !isLive ? (
        <div className="activity-run-workspace__leaderboard-hint small text-body-secondary mt-3">
          Session best times update as you save runs
        </div>
      ) : null}
    </div>
  )
}
