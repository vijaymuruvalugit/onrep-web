import React, { memo } from 'react'
import SessionLiveHeader from './SessionLiveHeader'
import PhaseModeStrip from './PhaseModeStrip'
import AthleteCardStrip from './AthleteCardStrip'
import ActiveAthleteWorkspace from './ActiveAthleteWorkspace'
import RaceTimingWorkspace from './RaceTimingWorkspace'
import CaptureModeToggle from './phaseCapture/CaptureModeToggle'
import PhaseAthleteCaptureList from './phaseCapture/PhaseAthleteCaptureList'
import PhaseAthleteDetailDrawer from './phaseCapture/PhaseAthleteDetailDrawer'
import { getLiveUiProfile, liveLabel } from '../constants/coachLiveLabels'
import LiveSessionSyncDot from './LiveSessionSyncDot'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import {
  sessionDisplayTitle,
  sessionTimeRangeLabel,
} from '../../../domain/operationalSessions/helpers/sessionDisplay'
import { inlineCaptureItemsForCard } from '../utils/phaseCaptureDisplay'

/**
 * Live coaching shell — stable mount; background session sync enriches via syncDomains props.
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
  elapsedLabel,
  sessionMode,
  isRaceMode,
  coachingCollapsed,
  onCoachingCollapsedChange,
  uiPaused,
  opsState,
  raceSectionProps,
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

  const inlineItems = usePhaseCapture
    ? inlineCaptureItemsForCard(captureItems, {
        captureMode: phaseCapture.captureMode,
        coachDefaults: phaseCapture.coachDefaults,
        activePhase,
      })
    : []
  const inlineIds = inlineItems.map((it) => it.id)

  const detailAthlete = phaseCapture?.detailAthleteId
    ? rosterForSession.find((r) => String(r.id) === String(phaseCapture.detailAthleteId))
    : null

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
          className="coach-live-nav-section coach-live-nav-section--athletes"
          aria-labelledby="coach-live-athletes-heading"
        >
          <h2 id="coach-live-athletes-heading" className="coach-live-nav-section__heading">
            Athletes
          </h2>
          <AthleteCardStrip
            rows={rosterForSession}
            lapStudentId={lapStudentId}
            observedStudentIds={observedStudentIds}
            participationByStudentId={participationByStudentId}
            athletePhaseLabelByStudentId={athletePhaseLabelByStudentId}
            onPickSkater={onPickSkater}
            onAddAthletesRequest={onAddAthletesRequest}
            suppressPhaseSubline
          />
        </section>
      </nav>

      <div className="coach-live-stack__coaching" data-testid="coach-live-coaching-area">
        {isRaceMode && uiProfile.showRaceTiming ? (
          <div className="coach-live-race-zone">
            <RaceTimingWorkspace
              athletes={raceSectionProps?.athletes || rosterForSession}
              leaderboard={syncDomains?.leaderboard}
              disabled={uiPaused || opsState === 'ended'}
              busy={raceSectionProps?.busy}
              heatNumber={raceSectionProps?.heatNumber}
              onFinishOrder={raceSectionProps?.onFinishOrder}
              onManualTime={raceSectionProps?.onManualTime}
            />
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
            {phaseCapture.captureMode === 'fast' ? (
              <p className="small text-body-secondary mb-2">
                Tap a tag when something stands out — no need to rate everyone.
              </p>
            ) : null}
            <PhaseAthleteCaptureList
              roster={rosterForSession}
              captureItems={captureItems}
              entries={phaseCapture.entries}
              captureMode={phaseCapture.captureMode}
              coachDefaults={phaseCapture.coachDefaults}
              activePhase={activePhase}
              disabled={uiPaused || opsState === 'ended' || phaseCapture.busy}
              reviewOnly={reviewOnly}
              onValueChange={phaseCapture.onEntryChange}
              onOpenDetail={phaseCapture.onOpenDetail}
            />
          </section>
        ) : null}

        {showCoachingWorkspace ? (
          !lapStudentId && !usePhaseCapture ? (
            <div className="coach-live-pick-athlete">
              <p className="coach-live-pick-athlete__text mb-0">
                {SESSION_OPS_COPY.selectAthletePrompt}
              </p>
            </div>
          ) : lapStudentId ? (
            <ActiveAthleteWorkspace
              {...workspaceProps}
              sessionMode={sessionMode}
              uiProfile={uiProfile}
              hideQuickCoaching={usePhaseCapture}
              timingSection={
                timingSection ? (
                  <details className="coach-live-time" open={uiProfile.timeExpanded}>
                    <summary className="coach-live-time__summary">{liveLabel('time')}</summary>
                    <div className="coach-live-time__body">{timingSection}</div>
                  </details>
                ) : null
              }
            />
          ) : usePhaseCapture ? (
            <p className="small text-body-secondary mb-2">
              Select an athlete above for timing and athlete details.
            </p>
          ) : null
        ) : null}

        {recentLapsSection}
      </div>

      {usePhaseCapture ? (
        <PhaseAthleteDetailDrawer
          visible={Boolean(phaseCapture.detailAthleteId)}
          athlete={detailAthlete}
          captureItems={captureItems}
          entries={phaseCapture.entries}
          inlineItemIds={inlineIds}
          disabled={uiPaused || opsState === 'ended'}
          onClose={() => phaseCapture.onOpenDetail?.(null)}
          onValueChange={phaseCapture.onEntryChange}
        />
      ) : null}
    </div>
  )
}

export default memo(CoachLiveSessionView)
