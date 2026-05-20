import { describe, expect, it } from 'vitest'
import {
  appendSkillEntry,
  mergeSkillsIntoConfigJson,
  readSkillsFromConfig,
  removeSkillEntry,
  sortSkillEntries,
  validateSkillIds,
} from './phaseConfigSkills'

describe('phaseConfigSkills', () => {
  it('sorts and normalizes skill entries', () => {
    const sorted = sortSkillEntries([
      { skill_id: 'FLYING_LAP', order: 2 },
      { skill_id: 'SK_TECHNIQUE_BALANCE', order: 0 },
      { skill_id: 'INVALID', order: 1 },
    ])
    expect(sorted).toEqual([
      { skill_id: 'SK_TECHNIQUE_BALANCE', order: 0 },
      { skill_id: 'FLYING_LAP', order: 2 },
    ])
  })

  it('merges skills into config_json preserving capabilities', () => {
    const merged = mergeSkillsIntoConfigJson(
      { capabilities: { supportsCounters: true }, presetId: 'technical' },
      [{ skill_id: 'LAP_TIMING', order: 0 }],
    )
    expect(merged.capabilities.supportsCounters).toBe(true)
    expect(merged.presetId).toBe('technical')
    expect(merged.skills).toEqual([{ skill_id: 'LAP_TIMING', order: 0 }])
  })

  it('reads skills from phase config', () => {
    const skills = readSkillsFromConfig({
      skills: [{ skillId: 'SK_TECHNIQUE_EDGE_CONTROL', order: 1 }],
    })
    expect(skills[0].skill_id).toBe('SK_TECHNIQUE_EDGE_CONTROL')
  })

  it('appends and removes without duplicates', () => {
    let entries = [{ skill_id: 'SK_TECHNIQUE_BALANCE', order: 0 }]
    entries = appendSkillEntry(entries, 'FLYING_LAP')
    entries = appendSkillEntry(entries, 'FLYING_LAP')
    expect(entries).toHaveLength(2)
    entries = removeSkillEntry(entries, 'SK_TECHNIQUE_BALANCE')
    expect(entries).toEqual([{ skill_id: 'FLYING_LAP', order: 0 }])
  })

  it('validates known skill ids', () => {
    expect(validateSkillIds(['FLYING_LAP', 'NOPE']).valid).toBe(false)
    expect(validateSkillIds(['LAP_TIMING']).valid).toBe(true)
  })
})
