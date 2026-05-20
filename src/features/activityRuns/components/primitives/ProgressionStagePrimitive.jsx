import React from 'react'
import StopwatchPrimitive from './StopwatchPrimitive'
import ProgressSetupPanel from '../progression/ProgressSetupPanel'
import ProgressResultsPanel from '../progression/ProgressResultsPanel'
import ProgressMetricsStrip from '../progression/ProgressMetricsStrip'
import CaptureProgressButton from '../progression/CaptureProgressButton'
import ParticipantProgressGrid from '../progression/ParticipantProgressGrid'

export default function ProgressionStagePrimitive({
  experience,
  state,
  targetCount,
  currentIndex,
  distanceLabel,
  metrics,
  progressEvents = [],
  showParticipantGrid = false,
  athletes = [],
  results = [],
  activeStudentId,
  disabled,
  busy,
  stopwatchRef,
  onTargetChange,
  onDistanceChange,
  onCapture,
  onSelectParticipant,
  onCaptureParticipant,
  onFinishProgress,
  hideFinishEarly = false,
  operationalMode = false,
  timerStartedAt = null,
}) {
  const dots = Array.from({ length: targetCount }, (_, i) => i < currentIndex)

  if (state === 'READY') {
    return (
      <ProgressSetupPanel
        experience={experience}
        targetCount={targetCount}
        distanceLabel={distanceLabel}
        disabled={disabled}
        onTargetChange={onTargetChange}
        onDistanceChange={onDistanceChange}
      />
    )
  }

  if (state === 'ACTIVE') {
    return (
      <>
        <p className="progression-stage__heading h4 fw-bold mb-1">
          {experience.progressionLabel}{' '}
          {targetCount > 0
            ? `${Math.min(currentIndex + 1, targetCount)} / ${targetCount}`
            : ''}
        </p>
        <div className="progression-stage__dots mb-2" aria-hidden>
          {dots.map((filled, i) => (
            <span
              key={i}
              className={`progression-stage__dot${filled ? ' progression-stage__dot--filled' : ''}`}
            />
          ))}
        </div>
        <StopwatchPrimitive
          ref={stopwatchRef}
          disabled={disabled}
          autoStart={!timerStartedAt}
          operationalMode={operationalMode}
          timerStartedAt={timerStartedAt}
          className="mb-3"
        />
        <ProgressMetricsStrip experience={experience} metrics={metrics} />
        <ProgressResultsPanel events={progressEvents} experience={experience} />
        {showParticipantGrid ? (
          <ParticipantProgressGrid
            athletes={athletes}
            results={results}
            activeStudentId={activeStudentId}
            disabled={disabled}
            onSelect={onSelectParticipant}
            onCaptureParticipant={onCaptureParticipant}
          />
        ) : (
          <CaptureProgressButton
            label={experience.captureProgressLabel}
            disabled={disabled}
            busy={busy}
            onCapture={onCapture}
          />
        )}
        {!hideFinishEarly ? (
          <button
            type="button"
            className="btn btn-link btn-sm text-white-50 mt-2 p-0"
            disabled={disabled}
            onClick={onFinishProgress}
          >
            Finish early →
          </button>
        ) : null}
      </>
    )
  }

  return null
}
