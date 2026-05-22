/** Default preset for quick start (matches backend). */
export const DEFAULT_SESSION_PRESET_ID = 'general_practice'

/** Matches backend SESSION_PRESET_REGISTRY_VERSION. */
export const PRESET_REGISTRY_VERSION = 1

export const DEFAULT_EXERCISES_BY_BLOCK_TYPE = Object.freeze({
  warmup: Object.freeze([
    { sequence: 1, exerciseName: 'Jog' },
    { sequence: 2, exerciseName: 'Dynamic Stretch' },
    { sequence: 3, exerciseName: 'Mobility' },
    { sequence: 4, exerciseName: 'Activation' },
  ]),
  conditioning: Object.freeze([
    { sequence: 1, exerciseName: 'Sprint laps' },
    { sequence: 2, exerciseName: 'Cone drills' },
    { sequence: 3, exerciseName: 'Core circuit' },
    { sequence: 4, exerciseName: 'Jump squats' },
  ]),
  cooldown: Object.freeze([
    { sequence: 1, exerciseName: 'Breathing' },
    { sequence: 2, exerciseName: 'Stretching' },
    { sequence: 3, exerciseName: 'Mobility' },
    { sequence: 4, exerciseName: 'Recovery walk' },
  ]),
  recovery: Object.freeze([
    { sequence: 1, exerciseName: 'Breathing' },
    { sequence: 2, exerciseName: 'Stretching' },
    { sequence: 3, exerciseName: 'Mobility' },
    { sequence: 4, exerciseName: 'Recovery walk' },
  ]),
})

export function defaultExercisesForBlockType(blockType) {
  const bt = blockType === 'race' ? 'race_simulation' : blockType
  return (DEFAULT_EXERCISES_BY_BLOCK_TYPE[bt] || []).map((ex, index) => ({
    sequence: ex.sequence ?? index + 1,
    exerciseName: ex.exerciseName,
    description: ex.description || '',
  }))
}

function normalizeExercises(exercises) {
  return (Array.isArray(exercises) ? exercises : []).map((ex, index) => ({
    sequence: Number(ex.sequence) || index + 1,
    exerciseName: String(ex.exerciseName || '').trim(),
    description: ex.description != null ? String(ex.description).trim() : '',
  }))
}

function exercisesChanged(a, b) {
  const left = normalizeExercises(a).filter((ex) => ex.exerciseName)
  const right = normalizeExercises(b).filter((ex) => ex.exerciseName)
  if (left.length !== right.length) return true
  return left.some((ex, index) => {
    const other = right[index]
    return ex.exerciseName !== other.exerciseName || ex.description !== other.description
  })
}

/**
 * v1 session presets — mirror of backend registry (five only).
 */
export const SESSION_PRESETS_CATALOG = [
  {
    id: 'general_practice',
    label: 'General Practice',
    description: 'Full practice flow — warmup through cooldown',
    phases: [
      { name: 'Warmup', blockType: 'warmup' },
      { name: 'Skills', blockType: 'technical' },
      { name: 'Conditioning', blockType: 'conditioning' },
      { name: 'Race', blockType: 'race_simulation' },
      { name: 'Cooldown', blockType: 'cooldown' },
    ],
  },
  {
    id: 'technical_work',
    label: 'Technical Work',
    description: 'Skill and edge focus',
    phases: [
      { name: 'Warmup', blockType: 'warmup' },
      { name: 'Technical work', blockType: 'technical' },
      { name: 'Cooldown', blockType: 'cooldown' },
    ],
  },
  {
    id: 'race_prep',
    label: 'Race Prep',
    description: 'Tactical and speed emphasis',
    phases: [
      { name: 'Warmup', blockType: 'warmup' },
      { name: 'Starts', blockType: 'technical' },
      { name: 'Race Simulation', blockType: 'race_simulation' },
      { name: 'Recovery', blockType: 'cooldown' },
    ],
  },
  {
    id: 'conditioning',
    label: 'Conditioning',
    description: 'Endurance emphasis',
    phases: [
      { name: 'Warmup', blockType: 'warmup' },
      { name: 'Conditioning', blockType: 'conditioning' },
      { name: 'Cooldown', blockType: 'cooldown' },
    ],
  },
  {
    id: 'beginner_session',
    label: 'Beginner Session',
    description: 'Readiness, basics, light close',
    phases: [
      { name: 'Warmup', blockType: 'warmup' },
      { name: 'Technical work', blockType: 'technical' },
      { name: 'Cooldown', blockType: 'cooldown' },
    ],
  },
]

export function getSessionPresetById(presetId) {
  const id = presetId || DEFAULT_SESSION_PRESET_ID
  return SESSION_PRESETS_CATALOG.find((p) => p.id === id) || SESSION_PRESETS_CATALOG[0]
}

export function previewPhasesFromPreset(presetPhases) {
  return (presetPhases || []).map((ph, index) => ({
    key: `preset-${index}-${ph.blockType}`,
    title: ph.name,
    blockType: ph.blockType,
    isCustom: false,
    baselineTitle: ph.name,
    exercises: defaultExercisesForBlockType(ph.blockType),
    baselineExercises: defaultExercisesForBlockType(ph.blockType),
  }))
}

/**
 * Hydrate preview rows from saved shallow overrides (recurring pattern edit).
 */
export function previewPhasesFromOverrides(phaseOverrides, presetId) {
  const preset = getSessionPresetById(presetId)
  if (!Array.isArray(phaseOverrides) || phaseOverrides.length === 0) {
    return previewPhasesFromPreset(preset.phases)
  }
  const presetByType = new Map(
    preset.phases.map((ph) => [
      ph.blockType === 'race' ? 'race_simulation' : ph.blockType,
      ph.name,
    ]),
  )
  return phaseOverrides.map((ov, index) => {
    const blockType = ov.blockType === 'race' ? 'race_simulation' : ov.blockType
    const baseline = presetByType.get(blockType) || ov.title
    return {
      key: `ov-${index}-${blockType}`,
      title: ov.title,
      blockType,
      isCustom: !!ov.isCustom,
      baselineTitle: baseline,
      copyObservationsFrom: ov.copyObservationsFrom,
      exercises: Array.isArray(ov.exercises)
        ? normalizeExercises(ov.exercises)
        : defaultExercisesForBlockType(blockType),
      baselineExercises: defaultExercisesForBlockType(blockType),
    }
  })
}

export function isPresetCustomized(presetId, previewPhases) {
  const preset = getSessionPresetById(presetId)
  const defaults = previewPhasesFromPreset(preset.phases)
  if (previewPhases.length !== defaults.length) return true
  return previewPhases.some((ph, i) => {
    const def = defaults[i]
    return (
      !def ||
      ph.isCustom ||
      ph.title !== def.title ||
      ph.blockType !== def.blockType ||
      exercisesChanged(ph.exercises, def.exercises)
    )
  })
}

export function presetDisplayLabel(presetId, customized) {
  const label = getSessionPresetById(presetId).label
  if (!customized) return label
  return `${label} · Customized`
}

export function buildPhaseOverridesPayload(previewPhases) {
  return previewPhases.map((ph) => {
    const blockType = ph.blockType === 'race' ? 'race_simulation' : ph.blockType
    const out = {
      title: String(ph.title || '').trim(),
      blockType,
    }
    if (ph.isCustom) out.isCustom = true
    if (ph.copyObservationsFrom) out.copyObservationsFrom = ph.copyObservationsFrom
    if (Array.isArray(ph.exercises)) {
      out.exercises = normalizeExercises(ph.exercises)
        .filter((ex) => ex.exerciseName)
        .map((ex, index) => ({
          sequence: index + 1,
          exerciseName: ex.exerciseName,
          ...(ex.description ? { description: ex.description } : {}),
        }))
    }
    return out
  })
}

/** API payload fragment for schedule drawers. */
export function buildSessionPresetPayload(presetId, previewPhases) {
  const customized = isPresetCustomized(presetId, previewPhases)
  return {
    sessionPresetId: presetId || DEFAULT_SESSION_PRESET_ID,
    phaseOverrides: customized ? buildPhaseOverridesPayload(previewPhases) : [],
    presetVersion: PRESET_REGISTRY_VERSION,
    isCustomized: customized,
  }
}
