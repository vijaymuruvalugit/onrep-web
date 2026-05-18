import React from 'react'
import { CSpinner } from '@coreui/react'
import SessionLiveHeader from './SessionLiveHeader'
import PhaseModeStrip from './PhaseModeStrip'
import AthleteCardStrip from './AthleteCardStrip'
import ActiveAthleteWorkspace from './ActiveAthleteWorkspace'
import RaceTimingWorkspace from './RaceTimingWorkspace'
import { getLiveUiProfile, livePhaseLabel } from '../constants/coachLiveLabels'

/**
 * Mobile-first vertical live coaching layout.
 */
export default function CoachLiveSessionView({
  bundle,
  bundleLoading,
  selSession,
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
  participationByStudentId,
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
}) {
  const uiProfile = getLiveUiProfile(
    sessionMode,
    isRaceMode,
    activeBlockMeta?.blockType || activeBlockMeta?.block_type,
  )

  const phaseLabel = activeBlockMeta
    ? livePhaseLabel(activeBlockMeta.blockType || activeBlockMeta.block_type, activeBlockTitle)
    : ''

  const athleteCount = rosterForSession?.length ?? 0
  const sessionTitle =
    bundle?.session?.placeName || selSession?.placeName || selSession?.title || 'Session'

  if (bundleLoading) {
    return <CSpinner />
  }

  if (!bundle) return null

  return (
    <div
      className={`coach-live-stack coach-live-stack--unified${isRaceMode ? ' coach-live-stack--race' : ''}${isRaceMode && coachingCollapsed ? ' coach-live-stack--timing-focus' : ''}`}
      data-testid="coach-live-session-view"
    >
      <div className="coach-live-stack__chrome">
        <div className="coach-live-stack__sticky-top">
        <SessionLiveHeader
          placeName={bundle?.session?.placeName || selSession?.placeName || ''}
          sessionTitle={sessionTitle}
          phaseLabel={phaseLabel}
          athleteCount={athleteCount}
          lifecycle={lifecycle}
          elapsedLabel={elapsedLabel}
          isRaceMode={isRaceMode}
          onRaceFocus={
            isRaceMode && coachingCollapsed
              ? () => onCoachingCollapsedChange?.(false)
              : isRaceMode
                ? () => onCoachingCollapsedChange?.(true)
                : undefined
          }
          {...sessionHeaderProps}
        />
        {blocksLoading ? (
          <CSpinner size="sm" className="my-2" />
        ) : (
          <PhaseModeStrip
            blocks={sortedSessionBlocks}
            activeBlockId={activeBlockId}
            onSelectBlock={onSelectBlock}
            athleteCountByPhaseId={athleteCountByPhaseId}
            busy={blocksBusy || blocksLoading}
          />
        )}
        </div>
        <div className="coach-live-stack__sticky-athletes">
        <AthleteCardStrip
          rows={rosterForSession}
          lapStudentId={lapStudentId}
          observedStudentIds={observedStudentIds}
          participationByStudentId={participationByStudentId}
          athletePhaseLabelByStudentId={athletePhaseLabelByStudentId}
          onPickSkater={onPickSkater}
          onAddAthletesRequest={onAddAthletesRequest}
        />
        </div>
      </div>

      <div className="coach-live-stack__scroll">
        {isRaceMode && uiProfile.showRaceTiming ? (
          <div className="coach-live-race-zone">
            <RaceTimingWorkspace
              athletes={raceSectionProps?.athletes || rosterForSession}
              leaderboard={bundle?.leaderboard}
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

        {(!isRaceMode || !coachingCollapsed) && (
          <ActiveAthleteWorkspace
            {...workspaceProps}
            sessionMode={sessionMode}
            uiProfile={uiProfile}
            timingSection={
              timingSection ? (
                <details className="coach-live-time" open={uiProfile.timeExpanded}>
                  <summary className="coach-live-time__summary">Time</summary>
                  <div className="coach-live-time__body">{timingSection}</div>
                </details>
              ) : null
            }
          />
        )}

        {recentLapsSection}
      </div>
    </div>
  )
}
