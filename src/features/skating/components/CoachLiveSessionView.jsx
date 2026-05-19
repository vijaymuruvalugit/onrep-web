import React, { memo } from 'react'
import SessionLiveHeader from './SessionLiveHeader'
import PhaseModeStrip from './PhaseModeStrip'
import AthleteCardStrip from './AthleteCardStrip'
import ActiveAthleteWorkspace from './ActiveAthleteWorkspace'
import RaceTimingWorkspace from './RaceTimingWorkspace'
import { ActivityRunWorkspace } from '../../activityRuns'
import CaptureModeToggle from './phaseCapture/CaptureModeToggle'
import AthleteSessionPanel from './sessionWorkspace/AthleteSessionPanel'
import { getLiveUiProfile, liveLabel } from '../constants/coachLiveLabels'
import LiveSessionSyncDot from './LiveSessionSyncDot'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import {
  sessionDisplayTitle,
  sessionTimeRangeLabel,
} from '../../../domain/operationalSessions/helpers/sessionDisplay'

/**
 * Live coaching shell — quick capture cards + deep athlete panel.
 */
function CoachLiveSessionView({
  shellSession,
  selSession,
  syncDomains,
  syncStatus,
  sortedSessionBlocks,
  activeBlockId,
  activeBlockMeta,
  activeBlockTitle,
  athleteCountByPhaseId,
  blocksBusy,
  blocksLoading,
  onSelectBlock,
  rosterForSession,
  lapStudentId,
  observedStudentIds,
  participationByStudentId = {},
  athletePhaseLabelByStudentId = {},
  onPickSkater,
  onAddAthletesRequest,
  lifecycle,
  sessionMode,
  isRaceMode,
  coachingCollapsed,
  onCoachingCollapsedChange,
  uiPaused,
  opsState,
  raceSectionProps,
  activityRunSectionProps,
  workspaceProps,
  timingSection,
  recentLapsSection,
  sessionHeaderProps,
  phaseCapture,
}) {
  const uiProfile = getLiveUiProfile(
    sessionMode,
    isRaceMode,
    activeBlockMeta?.blockType || activeBlockMeta?.block_type,
  )

  const sessionForHeader = selSession || shellSession || null
  const sessionTitle = sessionForHeader ? sessionDisplayTitle(sessionForHeader) : 'Session'
  const timeRangeLabel = sessionForHeader ? sessionTimeRangeLabel(sessionForHeader) : ''
  const activePhaseAthleteCount =
    activeBlockId != null ? athleteCountByPhaseId[String(activeBlockId)] ?? 0 : 0

  const showCoachingWorkspace = !isRaceMode || !coachingCollapsed
  const usePhaseCapture = Boolean(phaseCapture?.enabled && !isRaceMode)
  const activePhase =
    phaseCapture?.phases?.find((p) => String(p.id) === String(activeBlockId)) || activeBlockMeta
  const captureItems = activePhase?.captureItems || []
  const reviewOnly =
    activePhase?.runtimeStatus === 'completed' || activePhase?.runtimeStatus === 'skipped'

  const selectedAthlete = lapStudentId
    ? rosterForSession.find((r) => String(r.id) === String(lapStudentId))
    : null

  const handleSelectAthlete = (athleteId) => {
    onPickSkater?.(athleteId)
    phaseCapture?.onSelectAthlete?.(athleteId)
  }

  return (
    <div
      className={`coach-live-stack coach-live-stack--unified${isRaceMode ? ' coach-live-stack--race' : ''}${isRaceMode && coachingCollapsed ? ' coach-live-stack--timing-focus' : ''}`}
      data-testid="coach-live-session-view"
    >
      <header className="coach-live-stack__session-header">
        <SessionLiveHeader
          sessionTitle={sessionTitle}
          phaseLabel={activeBlockTitle}
          athleteCount={activePhaseAthleteCount}
          lifecycle={lifecycle}
          sessionMode={sessionMode}
          timeRangeLabel={timeRangeLabel}
          isRaceMode={isRaceMode}
          streamlined
          onRaceFocus={
            isRaceMode && coachingCollapsed
              ? () => onCoachingCollapsedChange?.(false)
              : isRaceMode
                ? () => onCoachingCollapsedChange?.(true)
                : undefined
          }
          {...sessionHeaderProps}
        />
        <div className="d-flex align-items-center gap-2">
          {usePhaseCapture ? (
            <CaptureModeToggle
              mode={phaseCapture.captureMode}
              disabled={uiPaused || opsState === 'ended'}
              onChange={phaseCapture.onCaptureModeChange}
            />
          ) : null}
          <LiveSessionSyncDot syncing={syncStatus?.syncing} className="coach-live-sync-dot--header" />
        </div>
      </header>

      <nav className="coach-live-stack__nav" aria-label="Session navigation">
        <section
          className="coach-live-nav-section coach-live-nav-section--phases"
          aria-labelledby="coach-live-phases-heading"
        >
          <h2 id="coach-live-phases-heading" className="coach-live-nav-section__heading">
            Phases
          </h2>
          <PhaseModeStrip
            layout="tiles"
            blocks={phaseCapture?.phases?.length ? phaseCapture.phases : sortedSessionBlocks}
            activeBlockId={activeBlockId}
            onSelectBlock={onSelectBlock}
            athleteCountByPhaseId={athleteCountByPhaseId}
            busy={blocksBusy || blocksLoading || phaseCapture?.busy}
            loading={blocksLoading && !sortedSessionBlocks?.length}
            onCompletePhase={phaseCapture?.onCompletePhase}
            onSkipPhase={phaseCapture?.onSkipPhase}
          />
        </section>

        <section
          className="coach-live-nav-section coach-live-nav-section--students"
          aria-labelledby="coach-live-students-heading"
        >
          <h2 id="coach-live-students-heading" className="coach-live-nav-section__heading">
            Students
          </h2>
          <AthleteCardStrip
            variant="tiles"
            rows={rosterForSession}
            lapStudentId={lapStudentId}
            observedStudentIds={observedStudentIds}
            participationByStudentId={participationByStudentId}
            athletePhaseLabelByStudentId={athletePhaseLabelByStudentId}
            onPickSkater={usePhaseCapture ? handleSelectAthlete : onPickSkater}
            onAddAthletesRequest={onAddAthletesRequest}
            suppressPhaseSubline
          />
        </section>
      </nav>

      <div className="coach-live-stack__coaching" data-testid="coach-live-coaching-area">
        {isRaceMode && uiProfile.showRaceTiming ? (
          <div className="coach-live-race-zone">
            {activityRunSectionProps?.enabled ? (
              <ActivityRunWorkspace
                operationalSessionId={activityRunSectionProps.operationalSessionId}
                phaseId={activityRunSectionProps.phaseId}
                athletes={activityRunSectionProps.athletes || rosterForSession}
                activitySlug={activityRunSectionProps.activitySlug || 'skating'}
                heatNumber={activityRunSectionProps.heatNumber}
                phaseTitle={activeBlockTitle}
                disabled={uiPaused || opsState === 'ended'}
                busy={activityRunSectionProps.busy}
                leaderboard={syncDomains?.leaderboard}
                onRefresh={activityRunSectionProps.onRefresh}
              />
            ) : (
              <RaceTimingWorkspace
                athletes={raceSectionProps?.athletes || rosterForSession}
                leaderboard={syncDomains?.leaderboard}
                disabled={uiPaused || opsState === 'ended'}
                busy={raceSectionProps?.busy}
                heatNumber={raceSectionProps?.heatNumber}
                onFinishOrder={raceSectionProps?.onFinishOrder}
                onManualTime={raceSectionProps?.onManualTime}
              />
            )}
            {!coachingCollapsed ? (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 mt-2"
                onClick={() => onCoachingCollapsedChange?.(true)}
              >
                Hide coach
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 mt-2"
                onClick={() => onCoachingCollapsedChange?.(false)}
              >
                Show coach
              </button>
            )}
          </div>
        ) : null}

        {showCoachingWorkspace && usePhaseCapture ? (
          <section className="coach-live-phase-capture mb-3" aria-label="Phase capture">
            {selectedAthlete ? (
              <AthleteSessionPanel
                athlete={selectedAthlete}
                captureItems={captureItems}
                entries={phaseCapture.entries}
                captureMode={phaseCapture.captureMode}
                activeTab={phaseCapture.athletePanelTab}
                onTabChange={phaseCapture.onPanelTabChange}
                disabled={uiPaused || opsState === 'ended' || phaseCapture.busy}
                reviewOnly={reviewOnly}
                participationStatus={participationByStudentId[String(lapStudentId)]}
                timingSection={
                  timingSection ? (
                    <details className="coach-live-time" open={uiProfile.timeExpanded}>
                      <summary className="coach-live-time__summary">{liveLabel('time')}</summary>
                      <div className="coach-live-time__body">{timingSection}</div>
                    </details>
                  ) : null
                }
                focusText={workspaceProps?.focusText}
                onChangeFocus={workspaceProps?.onChangeFocus}
                onSaveFocus={workspaceProps?.onSaveFocus}
                focusSaving={workspaceProps?.focusSaving}
                focusSaveMessage={workspaceProps?.focusSaveMessage}
                onValueChange={phaseCapture.onEntryChange}
              />
            ) : (
              <p className="small text-body-secondary mb-2 mt-2">
                Select a student above to record observations, timing, and notes.
              </p>
            )}
          </section>
        ) : null}

        {showCoachingWorkspace && !usePhaseCapture ? (
          !lapStudentId ? (
            <div className="coach-live-pick-athlete">
              <p className="coach-live-pick-athlete__text mb-0">
                {SESSION_OPS_COPY.selectAthletePrompt}
              </p>
            </div>
          ) : (
            <ActiveAthleteWorkspace
              {...workspaceProps}
              sessionMode={sessionMode}
              uiProfile={uiProfile}
              timingSection={
                timingSection ? (
                  <details className="coach-live-time" open={uiProfile.timeExpanded}>
                    <summary className="coach-live-time__summary">{liveLabel('time')}</summary>
                    <div className="coach-live-time__body">{timingSection}</div>
                  </details>
                ) : null
              }
            />
          )
        ) : null}

        {recentLapsSection}
      </div>
    </div>
  )
}

export default memo(CoachLiveSessionView)
