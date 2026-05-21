import { describe, expect, it } from 'vitest'
import {
  buildSessionPresetPayload,
  isPresetCustomized,
  presetDisplayLabel,
  previewPhasesFromPreset,
} from './sessionPresets'
import { getSessionPresetById } from './sessionPresets'

describe('schedule sessionPresets', () => {
  it('presetDisplayLabel shows customized suffix', () => {
    const phases = previewPhasesFromPreset(getSessionPresetById('race_prep').phases)
    phases[0] = { ...phases[0], title: 'Extra warmup' }
    expect(presetDisplayLabel('race_prep', isPresetCustomized('race_prep', phases))).toBe(
      'Race Prep · Customized',
    )
  })

  it('buildSessionPresetPayload omits overrides when not customized', () => {
    const phases = previewPhasesFromPreset(getSessionPresetById('general_practice').phases)
    const payload = buildSessionPresetPayload('general_practice', phases)
    expect(payload.phaseOverrides).toEqual([])
    expect(payload.isCustomized).toBe(false)
  })

  it('buildSessionPresetPayload includes overrides when customized', () => {
    const phases = previewPhasesFromPreset(getSessionPresetById('general_practice').phases)
    phases.pop()
    const payload = buildSessionPresetPayload('general_practice', phases)
    expect(payload.isCustomized).toBe(true)
    expect(payload.phaseOverrides.length).toBeGreaterThan(0)
  })
})
