import { describe, it, expect } from 'vitest'
import {
  isCalmInteractionMode,
  maxExercisesForPhase,
  phaseSupportsActivityEditing,
  resolveInteractionMode,
} from './phaseInteractionMode'

describe('phaseInteractionMode', () => {
  it('resolves from configJson.interactionMode', () => {
    expect(
      resolveInteractionMode({
        blockType: 'warmup',
        configJson: { interactionMode: 'exercise_list' },
      }),
    ).toBe('exercise_list')
  })

  it('falls back to block type defaults', () => {
    expect(resolveInteractionMode({ blockType: 'cooldown', configJson: {} })).toBe('recovery')
    expect(resolveInteractionMode({ blockType: 'technical' })).toBe('observation')
    expect(resolveInteractionMode({ blockType: 'race_simulation' })).toBe('timing')
  })

  it('identifies activity editing phases', () => {
    expect(
      phaseSupportsActivityEditing({
        blockType: 'warmup',
        configJson: { interactionMode: 'exercise_list' },
      }),
    ).toBe(true)
    expect(
      phaseSupportsActivityEditing({
        blockType: 'technical',
        configJson: { interactionMode: 'observation' },
      }),
    ).toBe(false)
  })

  it('enforces max exercise counts', () => {
    expect(maxExercisesForPhase({ blockType: 'conditioning' })).toBe(6)
    expect(maxExercisesForPhase({ blockType: 'warmup' })).toBe(4)
  })

  it('marks calm modes', () => {
    expect(isCalmInteractionMode('recovery')).toBe(true)
    expect(isCalmInteractionMode('observation')).toBe(false)
  })
})
