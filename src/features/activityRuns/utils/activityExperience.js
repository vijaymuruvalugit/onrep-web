import { formatDurationMs } from './formatDuration'

/**
 * Sport-facing labels from definition (engine terms never shown).
 * @param {object} definition
 * @param {{ current?: number, target?: number }} [progress]
 */
export function resolveActivityExperience(definition, progress = {}) {
  const label = definition?.progressionLabel || 'Lap'
  const plural = definition?.progressionPluralLabel || `${label}s`
  const current = progress.current ?? 0
  const target = progress.target ?? definition?.progressionConfig?.defaultCount ?? 0

  const progressHeading =
    target > 0 ? `${label} ${Math.min(current + 1, target)} / ${target}` : label

  return {
    progressionLabel: label,
    progressionPluralLabel: plural,
    captureProgressLabel: definition?.captureProgressLabel || `Capture ${label}`,
    startActionLabel: definition?.startActionLabel || 'Start',
    completeActionLabel: definition?.completeActionLabel || 'Finish',
    progressHeading,
    formatSplitMs: (ms) => (ms != null ? formatDurationMs(ms) : '—'),
    bestSplitLabel: `Best ${label}`,
    currentSplitLabel: `Last ${label}`,
  }
}

export default resolveActivityExperience
