/** Hidden interaction modes — resolved from phase config with block-type fallback. */

export const INTERACTION_MODES = Object.freeze([
  'observation',
  'exercise_list',
  'recovery',
  'timing',
])

const DEFAULT_BY_BLOCK_TYPE = Object.freeze({
  warmup: 'exercise_list',
  technical: 'observation',
  conditioning: 'exercise_list',
  cooldown: 'recovery',
  recovery: 'recovery',
  race: 'timing',
  race_simulation: 'timing',
  assessment: 'observation',
  custom: 'observation',
})

export const MAX_EXERCISES_BY_BLOCK_TYPE = Object.freeze({
  warmup: 4,
  conditioning: 6,
  cooldown: 4,
  recovery: 4,
})

/**
 * @param {object} phase
 */
export function resolveInteractionMode(phase) {
  const cfg = phase?.configJson || phase?.config_json || {}
  const fromConfig = cfg.interactionMode || phase?.interactionMode
  if (fromConfig && INTERACTION_MODES.includes(String(fromConfig))) {
    return String(fromConfig)
  }
  const bt = String(phase?.blockType || phase?.block_type || '').toLowerCase()
  return DEFAULT_BY_BLOCK_TYPE[bt] || 'observation'
}

/**
 * @param {object} phase
 */
export function maxExercisesForPhase(phase) {
  const mode = resolveInteractionMode(phase)
  if (mode !== 'exercise_list' && mode !== 'recovery') return 0
  const bt = String(phase?.blockType || phase?.block_type || '').toLowerCase()
  return MAX_EXERCISES_BY_BLOCK_TYPE[bt] ?? 4
}

/**
 * @param {object} phase
 */
export function phaseSupportsActivityEditing(phase) {
  const mode = resolveInteractionMode(phase)
  return mode === 'exercise_list' || mode === 'recovery'
}

/**
 * Calm guided modes use spacious layout (not dense athlete cards).
 * @param {string} mode
 */
export function isCalmInteractionMode(mode) {
  return mode === 'exercise_list' || mode === 'recovery' || mode === 'timing'
}
