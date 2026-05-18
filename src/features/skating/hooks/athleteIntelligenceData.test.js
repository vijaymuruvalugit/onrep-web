import { describe, it, expect } from 'vitest'
import { mergeSkillCatalogList, groupSkillsByCategory } from './athleteIntelligenceData'

describe('athleteIntelligenceData', () => {
  it('mergeSkillCatalogList prefers non-empty skills array', () => {
    const a = { id: '1', category: 'Speed' }
    expect(mergeSkillCatalogList({ skills: [a] })).toEqual([a])
  })

  it('mergeSkillCatalogList falls back to platform+custom when skills is empty', () => {
    const p = { id: '1', category: 'Technique' }
    const c = { id: '2', category: 'Custom' }
    expect(mergeSkillCatalogList({ skills: [], platform: [p], custom: [c] })).toEqual([p, c])
  })

  it('groupSkillsByCategory groups merged list', () => {
    const grouped = groupSkillsByCategory({
      skills: [],
      platform: [{ id: '1', category: 'Speed', displayName: 'Sprint' }],
    })
    expect(grouped).toHaveLength(1)
    expect(grouped[0][0]).toBe('Speed')
  })
})
