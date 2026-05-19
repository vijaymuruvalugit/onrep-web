import { livePhaseLabel } from '../constants/coachLiveLabels'

/** Canonical phase types coaches can add to a session. */
export const PHASE_TYPE_CATALOG = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'technical', label: 'Technical work' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'race', label: 'Race' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'custom', label: 'Custom' },
]

/**
 * Phase types not already on the session, labeled like the live rink UI (e.g. Fitness).
 * @param {Array<{ blockType?: string }>} visiblePhases
 */
export function addablePhaseTypeOptions(visiblePhases = []) {
  const usedTypes = new Set(
    visiblePhases.map((p) => String(p.blockType || p.block_type || '').toLowerCase()),
  )
  return PHASE_TYPE_CATALOG.filter((o) => !usedTypes.has(o.value)).map((o) => ({
    value: o.value,
    label: livePhaseLabel(o.value, o.label),
  }))
}
