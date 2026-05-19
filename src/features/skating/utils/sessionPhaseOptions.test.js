import { describe, expect, it } from 'vitest'
import { addablePhaseTypeOptions } from './sessionPhaseOptions'

describe('addablePhaseTypeOptions', () => {
  it('excludes block types already on the session and labels conditioning as Fitness', () => {
    const options = addablePhaseTypeOptions([
      { blockType: 'warmup' },
      { blockType: 'technical' },
      { blockType: 'race' },
      { blockType: 'cooldown' },
    ])
    const values = options.map((o) => o.value)
    expect(values).toContain('conditioning')
    expect(values).not.toContain('warmup')
    const fitness = options.find((o) => o.value === 'conditioning')
    expect(fitness?.label).toBe('Fitness')
  })
})
