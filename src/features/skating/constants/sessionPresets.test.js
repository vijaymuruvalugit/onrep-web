import { describe, it, expect } from 'vitest'
import {
  buildPhaseOverridesPayload,
  getSessionPresetById,
  previewPhasesFromPreset,
} from './sessionPresets'

describe('sessionPresets', () => {
  it('builds create payload with race mapped to race_simulation', () => {
    const preview = previewPhasesFromPreset(getSessionPresetById('race_prep').phases)
    const payload = buildPhaseOverridesPayload(preview)
    expect(payload.some((p) => p.blockType === 'race_simulation')).toBe(true)
  })

  it('marks custom phases in payload', () => {
    const payload = buildPhaseOverridesPayload([
      {
        title: 'Sprint Race',
        blockType: 'custom',
        isCustom: true,
        copyObservationsFrom: 'technical',
      },
    ])
    expect(payload[0].isCustom).toBe(true)
    expect(payload[0].title).toBe('Sprint Race')
  })
})
