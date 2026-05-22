import React, { memo, useMemo } from 'react'
import SessionLiveHeader from './SessionLiveHeader'
import PhaseModeStrip from './PhaseModeStrip'
import AthleteCardStrip from './AthleteCardStrip'
import RaceTimingWorkspace from './RaceTimingWorkspace'
import SkatingRaceWorkspace from './SkatingRaceWorkspace'
import SkillsPhaseWorkspace from './SkillsPhaseWorkspace'
import PhaseInteractionRenderer from './PhaseInteractionRenderer'
import { resolveInteractionMode } from '../utils/phaseInteractionMode'
import { getLiveUiProfile, liveLabel, isSkillsPhaseBlock } from '../constants/coachLiveLabels'
import LiveSessionSyncDot from './LiveSessionSyncDot'
import {
  sessionDisplayTitle,
  sessionOperationalContextLine,
  sessionTimeRangeLabel,
} from '../../../domain/operationalSessions/helpers/sessionDisplay'

function rosterFromPhaseAthletes(phaseAthletes = [], rosterForSession = []) {
  const nameById = new Map(
    rosterForSession.map((r) => [String(r.id), r.full_name || r.fullName || '']),
  )
  return phaseAthletes.map((a) => {
    const id = String(a.studentId || a.id)
    return {
      id,
      full_name: a.fullName || a.full_name || nameById.get(id) || 'Athlete',
    }
  })
}

/**
 * Live coaching shell — phases, students, phase-specific workspace.
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
  blocksBusy,
  blocksLoading,
  onSelectBlock,
  rosterForSession,
  lapStudentId,
  observedStudentIds,
  onPickSkater,
  onAddAthletesRequest,
  lifecycle,
  sessionMode,
  isRaceMode,
  uiPaused,
  opsState,
  raceSectionProps,
  activityRunSectionProps,
  timingSection,
  recentLapsSection,
  sessionHeaderProps,
  phaseCapture,
  activePhaseAthletes = [],
  onParticipationStatusChange,
  onExerciseToggle,
  onSessionObservationChange,
}) {
  const uiProfile = getLiveUiProfile(
    sessionMode,
    isRaceMode,
    activeBlockMeta?.blockType || activeBlockMeta?.block_type,
  )

  const sessionForHeader = selSession || shellSession || null
  const sessionTitle = sessionForHeader ? sessionDisplayTitle(sessionForHeader) : 'Session'
  const contextLine = sessionForHeader ? sessionOperationalContextLine(sessionForHeader) : null
  const timeRangeLabel = sessionForHeader ? sessionTimeRangeLabel(sessionForHeader) : ''
  const usePhaseCapture = Boolean(phaseCapture?.enabled && !isRaceMode)
  const isSkillsPhase = isSkillsPhaseBlock(activeBlockMeta)
  const activePhase =
    phaseCapture?.phases?.find((p) => String(p.id) === String(activeBlockId)) || activeBlockMeta
  const interactionMode = activePhase ? resolveInteractionMode(activePhase) : 'observation'
  const showAthleteStrip = usePhaseCapture && !isRaceMode && interactionMode !== 'timing'
  const reviewOnly =
    activePhase?.runtimeStatus === 'completed' || activePhase?.runtimeStatus === 'skipped'

  const phaseRoster = useMemo(
    () => rosterFromPhaseAthletes(rosterForSession, rosterForSession),
    [rosterForSession],
  )

  const participationByStudentId = useMemo(() => {
    const out = {}
    for (const athlete of activePhaseAthletes || []) {
      const sid = String(athlete.studentId || athlete.id || '')
      if (sid) out[sid] = athlete.participationStatus || 'active'
    }
    return out
  }, [activePhaseAthletes])

  const selectedAthlete = lapStudentId
    ? rosterForSession.find((r) => String(r.id) === String(lapStudentId)) ||
      phaseRoster.find((r) => String(r.id) === String(lapStudentId))
    : null

  const handleSelectAthlete = (athleteId) => {
    onPickSkater?.(athleteId)
    phaseCapture?.onSelectAthlete?.(athleteId)
  }

  const showTiming =
    Boolean(timingSection) && !isSkillsPhase && !isRaceMode && uiProfile.timeExpanded
  const hasPhaseFooter = Boolean(phaseCapture?.onCompletePhase || phaseCapture?.onSkipPhase)

  return (
    <div
      className={`coach-live-stack coach-live-stack--unified${isRaceMode ? ' coach-live-stack--race' : ''}`}
      data-testid="coach-live-session-view"
    >
      <header className="coach-live-stack__session-header">
        <SessionLiveHeader
          sessionTitle={sessionTitle}
          contextLine={contextLine}
          phaseLabel={activeBlockTitle}
          athleteCount={rosterForSession.length}
          lifecycle={lifecycle}
          sessionMode={sessionMode}
          timeRangeLabel={timeRangeLabel}
          isRaceMode={isRaceMode}
          streamlined
          {...sessionHeaderProps}
        />
        <div className="d-flex align-items-center gap-2">
          <LiveSessionSyncDot
            syncing={syncStatus?.syncing}
            className="coach-live-sync-dot--header"
          />
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
            busy={blocksBusy || blocksLoading || phaseCapture?.busy}
            loading={blocksLoading && !sortedSessionBlocks?.length}
            onCompletePhase={phaseCapture?.onCompletePhase}
            onSkipPhase={phaseCapture?.onSkipPhase}
            hideInlineActions={hasPhaseFooter}
          />
        </section>

        {showAthleteStrip ? (
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
              onPickSkater={usePhaseCapture ? handleSelectAthlete : onPickSkater}
              onAddAthletesRequest={onAddAthletesRequest}
              suppressPhaseSubline
            />
          </section>
        ) : null}
      </nav>

      <div
        className={`coach-live-stack__coaching${
          isRaceMode ? ' coach-live-stack__coaching--race' : ''
        }${hasPhaseFooter ? ' coach-live-stack__coaching--with-footer' : ''}`}
        data-testid="coach-live-coaching-area"
      >
        {isRaceMode && uiProfile.showRaceTiming ? (
          <div className="coach-live-race-zone">
            {activityRunSectionProps?.enabled ? (
              <SkatingRaceWorkspace
                operationalSessionId={activityRunSectionProps.operationalSessionId}
                phaseId={activityRunSectionProps.phaseId}
                athletes={activityRunSectionProps.athletes || rosterForSession}
                heatNumber={activityRunSectionProps.heatNumber}
                phaseTitle={null}
                disabled={uiPaused || opsState === 'ended'}
                busy={activityRunSectionProps.busy}
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
          </div>
        ) : null}

        {usePhaseCapture && activePhase ? (
          <PhaseInteractionRenderer
            activePhase={activePhase}
            phaseRoster={phaseRoster}
            participationByStudentId={participationByStudentId}
            phaseCapture={{
              ...phaseCapture,
              onSelectAthlete: handleSelectAthlete,
            }}
            lapStudentId={lapStudentId}
            disabled={uiPaused || opsState === 'ended' || phaseCapture.busy}
            reviewOnly={reviewOnly}
            isRaceMode={isRaceMode}
            skillsWorkspace={
              isSkillsPhase ? (
                <SkillsPhaseWorkspace
                  studentId={lapStudentId}
                  athleteName={selectedAthlete?.full_name || selectedAthlete?.fullName}
                  disabled={uiPaused || opsState === 'ended' || phaseCapture.busy}
                  busy={phaseCapture.busy}
                  phaseConfigJson={activePhase?.configJson}
                  phaseSkills={phaseCapture.skillsForActivePhase}
                  onSkillsChange={phaseCapture.onUpdatePhaseSkills}
                  operationalSessionId={phaseCapture.operationalSessionId}
                  phaseId={activeBlockId}
                  athletes={rosterForSession}
                  activityRunEngineEnabled={phaseCapture.activityRunEngineEnabled}
                />
              ) : null
            }
            onParticipationStatusChange={onParticipationStatusChange}
            onExerciseToggle={onExerciseToggle}
            onSessionObservationChange={onSessionObservationChange}
          />
        ) : null}

        {showTiming ? (
          <details className="coach-live-time mb-3" open>
            <summary className="coach-live-time__summary">{liveLabel('time')}</summary>
            <div className="coach-live-time__body">{timingSection}</div>
          </details>
        ) : null}

        {recentLapsSection}
      </div>

      {hasPhaseFooter ? (
        <footer
          className="coach-live-phase-footer"
          role="toolbar"
          aria-label="Phase actions"
          data-testid="coach-live-phase-footer"
        >
          {phaseCapture?.onSkipPhase ? (
            <button
              type="button"
              className="btn btn-link coach-live-phase-footer__skip"
              disabled={
                blocksBusy ||
                blocksLoading ||
                phaseCapture?.busy ||
                uiPaused ||
                opsState === 'ended'
              }
              onClick={() => phaseCapture.onSkipPhase(activeBlockId)}
            >
              Skip
            </button>
          ) : (
            <span />
          )}
          {phaseCapture?.onCompletePhase ? (
            <button
              type="button"
              className="btn btn-primary coach-live-phase-footer__complete"
              disabled={
                blocksBusy ||
                blocksLoading ||
                phaseCapture?.busy ||
                uiPaused ||
                opsState === 'ended'
              }
              onClick={() => phaseCapture.onCompletePhase(activeBlockId)}
            >
              Complete phase
            </button>
          ) : null}
        </footer>
      ) : null}
    </div>
  )
}

export default memo(CoachLiveSessionView)
