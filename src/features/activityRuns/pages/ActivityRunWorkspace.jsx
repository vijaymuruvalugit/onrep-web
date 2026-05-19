import React, { useCallback, useState } from 'react'
import { CAlert } from '@coreui/react'
import RunTypeSelector from '../components/RunTypeSelector'
import SessionRunTimeline from '../components/SessionRunTimeline'
import { getActivityRunDefinition } from '../activityRunDefinitions'
import { getFlowComponent } from '../runFlowRegistry'
import { useSessionRuns } from '../hooks/useSessionRuns'
import '../activity-runs.css'

export default function ActivityRunWorkspace({
  operationalSessionId,
  phaseId,
  athletes = [],
  activitySlug = 'skating',
  heatNumber,
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

  const definition = selectedRunType ? getActivityRunDefinition(selectedRunType) : null
  const FlowComponent = definition ? getFlowComponent(definition.ui.mode) : null

  return (
    <div className="activity-run-workspace" data-testid="activity-run-workspace">
      {!selectedRunType ? (
        <>
          <RunTypeSelector
            activitySlug={activitySlug}
            disabled={disabled}
            onSelect={setSelectedRunType}
          />
          <hr className="my-4" />
          <h3 className="h6 fw-semibold mb-2">Session runs</h3>
          {loading ? <p className="small text-body-secondary">Loading…</p> : null}
          <SessionRunTimeline runs={runs} />
        </>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 mb-2"
            onClick={() => setSelectedRunType(null)}
          >
            ← Back
          </button>
          <h2 className="h5 fw-semibold mb-3">{definition?.label}</h2>
          {FlowComponent ? (
            <FlowComponent
              definition={definition}
              athletes={athletes}
              disabled={disabled}
              busy={busy}
              heatNumber={heatNumber ?? 1}
              runType={selectedRunType}
              onSaveRun={handleSaveRun}
            />
          ) : null}
        </>
      )}
      {error ? (
        <CAlert color="danger" className="small py-2 mt-2">
          {error}
        </CAlert>
      ) : null}
      {leaderboard?.entries?.length ? (
        <div className="mt-4 small text-body-secondary">
          Leaderboard: {leaderboard.entries.length} entries
        </div>
      ) : null}
    </div>
  )
}
