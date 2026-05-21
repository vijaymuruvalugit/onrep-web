/** Default preset for quick start (matches backend). */
export const DEFAULT_SESSION_PRESET_ID = 'general_practice'

/**
 * v1 session presets — mirror of backend registry (five only).
 * Fetched from API when available; used for offline preview fallback.
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

/**
 * @param {Array<{ name: string, blockType: string }>} presetPhases
 * @returns {Array<{ key: string, title: string, blockType: string, isCustom: boolean, baselineTitle: string }>}
 */
export function previewPhasesFromPreset(presetPhases) {
  return (presetPhases || []).map((ph, index) => ({
    key: `preset-${index}-${ph.blockType}`,
    title: ph.name,
    blockType: ph.blockType,
    isCustom: false,
    baselineTitle: ph.name,
  }))
}

/**
 * @param {Array<{ title: string, blockType: string, isCustom?: boolean, copyObservationsFrom?: string }>} previewPhases
 */
export function buildPhaseOverridesPayload(previewPhases) {
  return previewPhases.map((ph) => {
    const blockType = ph.blockType === 'race' ? 'race_simulation' : ph.blockType
    const out = {
      title: String(ph.title || '').trim(),
      blockType,
    }
    if (ph.isCustom) out.isCustom = true
    if (ph.copyObservationsFrom) out.copyObservationsFrom = ph.copyObservationsFrom
    return out
  })
}
