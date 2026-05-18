import { describe, it, expect } from 'vitest'
import { tagsForSessionMode } from './quickCoachingTagsByMode'

describe('quickCoachingTagsByMode', () => {
  it('returns practice tags by default', () => {
    const tags = tagsForSessionMode('practice')
    expect(tags.map((t) => t.key)).toEqual(['fatigue', 'distracted', 'focused'])
  })

  it('returns competition tags for competition mode', () => {
    const tags = tagsForSessionMode('competition')
    expect(tags.some((t) => t.key === 'false_start')).toBe(true)
  })
})
