import React from 'react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import { liveLabel, livePhaseLabel } from '../constants/coachLiveLabels'
import FastCoachingPanel from './FastCoachingPanel'
import AthleteIntelligenceTabs from './AthleteIntelligenceTabs'
import AthleteQuickActionsMenu from './AthleteQuickActionsMenu'

const STATUS_LINE = {
  resting: 'Resting',
  injured: 'Injured',
  skipped: 'Skipped',
  active: '',
}

/**
 * Selected athlete IS the workspace — capture + inline tabs, no drawer.
 */
export default function ActiveAthleteWorkspace({
  lapStudentId,
  athleteName,
  activeBlockMeta,
  phaseContext,
  observedStudentIds,
  sessionMode,
  uiProfile,
  coachingQueue,
  coachingDisabled,
  obsScores,
  obsFlashKeys,
  obsError,
  onRetryObservation,
  onFormalTap,
  formalDisabled,
  formalSaving,
  onQuickScore,
  obsAdvancePending,
  advanceTick,
  onCancelAdvance,
  onGoAdvanceNow,
  obsReturnSkater,
  onReturnSkater,
  lastObsLabel,
  timingSection,
  sessionId,
  focusText,
  onChangeFocus,
  onSaveFocus,
  focusSaving,
  focusSaveMessage,
  phaseAthlete,
  isRacePhase,
  otherPhases,
  phaseBusy,
  onMoveAthlete,
  onSetLane,
  onSetHeat,
  onSetStatus,
}) {
  const phaseLabel = activeBlockMeta
    ? livePhaseLabel(activeBlockMeta.blockType, activeBlockMeta.title)
    : ''
  const status = phaseAthlete?.participationStatus || 'active'
  const statusPart = STATUS_LINE[status] || ''
  const coachingState = status === 'active' ? 'Active' : statusPart || 'Active'
  const contextLine = [phaseLabel, coachingState].filter(Boolean).join(' · ')

  return (
    <section className="active-athlete-workspace" data-testid="active-athlete-workspace">
      {!lapStudentId ? (
        <div className="active-athlete-workspace__empty small text-body-secondary py-5 text-center">
          {SESSION_OPS_COPY.selectAthletePrompt}
        </div>
      ) : (
        <>
          <header className="active-athlete-workspace__header">
            <div className="active-athlete-workspace__header-row">
              <div className="active-athlete-workspace__identity">
                <h2 className="active-athlete-workspace__name mb-0">
                  {athleteName || 'Athlete'}
                </h2>
                {contextLine ? (
                  <p className="active-athlete-workspace__context mb-0">{contextLine}</p>
                ) : null}
                {observedStudentIds?.has?.(String(lapStudentId)) ? (
                  <span className="small text-success">{SESSION_OPS_COPY.observationSavedThisSession}</span>
                ) : null}
              </div>
              <AthleteQuickActionsMenu
                studentId={lapStudentId}
                disabled={coachingDisabled}
                busy={phaseBusy}
                isRacePhase={isRacePhase}
                otherPhases={otherPhases}
                currentLane={phaseAthlete?.lane}
                currentHeat={phaseAthlete?.heatNumber}
                onMoveAthlete={onMoveAthlete}
                onSetStatus={onSetStatus}
                onSetLane={onSetLane}
                onSetHeat={onSetHeat}
              />
            </div>
          </header>

          <div className="active-athlete-workspace__capture">
            {obsAdvancePending ? (
              <div className="small mb-2 skating-advance-pause py-1">
                {(() => {
                  const dur =
                    obsAdvancePending.durationMs ??
                    Math.max(1, obsAdvancePending.until - (obsAdvancePending.startAt ?? 0))
                  const start = obsAdvancePending.startAt ?? obsAdvancePending.until - dur
                  const pct = Math.min(100, ((Date.now() - start) / dur) * 100)
                  return (
                    <div
                      className="skating-advance-pause__track mb-1"
                      aria-hidden
                      style={{ '--skating-advance-pct': `${pct}%` }}
                    />
                  )
                })()}
                <span className="text-body-secondary">
                  <span className="d-none">{advanceTick}</span>→ {obsAdvancePending.targetName}
                  <span className="opacity-50 ms-1">
                    ({Math.max(0, Math.ceil((obsAdvancePending.until - Date.now()) / 1000))}s)
                  </span>
                </span>
                <div className="mt-1 d-flex gap-2">
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={onCancelAdvance}>
                    Stay
                  </button>
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={onGoAdvanceNow}>
                    Go now
                  </button>
                </div>
              </div>
            ) : null}
            {obsReturnSkater && Date.now() < obsReturnSkater.until ? (
              <div className="small mb-2">
                <button type="button" className="btn btn-link btn-sm p-0" onClick={onReturnSkater}>
                  Return to {obsReturnSkater.name}
                </button>
              </div>
            ) : null}
            {lastObsLabel ? (
              <div className="small text-body-secondary mb-2 opacity-90">Last: {lastObsLabel}</div>
            ) : null}
            {obsError ? (
              <div className="small text-danger mb-2 d-flex gap-2 align-items-center">
                <span>{obsError}</span>
                <button type="button" className="btn btn-link btn-sm p-0" onClick={onRetryObservation}>
                  Retry
                </button>
              </div>
            ) : null}

            {(uiProfile?.showQuickScores !== false || uiProfile?.showFormalScoreGrid) && (
              <>
                <h3 className="active-athlete-workspace__coach-heading h6 text-body-secondary mb-2">
                  {liveLabel('coachNow')}
                </h3>
                <FastCoachingPanel
                  sessionMode={sessionMode}
                  draft={coachingQueue.draft}
                  syncState={coachingQueue.syncState}
                  syncError={coachingQueue.syncError || obsError}
                  disabled={coachingDisabled}
                  comfortable
                  liveMode
                  uiProfile={uiProfile}
                  onQuickScore={onQuickScore}
                  onToggleTag={coachingQueue.toggleTag}
                  onMarker={coachingQueue.addMarker}
                  onNotesChange={coachingQueue.setNotes}
                  onManualSync={() => void coachingQueue.flushNow()}
                  obsScores={obsScores}
                  obsFlashKeys={obsFlashKeys}
                  onFormalTap={onFormalTap}
                  formalDisabled={formalDisabled}
                  formalSaving={formalSaving}
                />
              </>
            )}

            {timingSection}
          </div>

          {uiProfile?.showIntelligenceTabs !== false ? (
            <AthleteIntelligenceTabs
              className={uiProfile?.deEmphasizeIntelligence ? 'athlete-intel-tabs--recede' : ''}
              studentId={lapStudentId}
              sessionId={sessionId}
              studentName={athleteName}
              focusText={focusText}
              onChangeFocus={onChangeFocus}
              onSaveFocus={onSaveFocus}
              saving={focusSaving}
              saveMessage={focusSaveMessage}
              tabKeys={uiProfile?.intelligenceTabKeys}
            />
          ) : null}
        </>
      )}
    </section>
  )
}
