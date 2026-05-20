import { describe, expect, it } from 'vitest'
import {
  buildOperationalStartPatch,
  getCoachGroupLabel,
  getSkillModule,
  isAssessmentModule,
  isOperationalModule,
  listLapTimingPresets,
  toLapTimingPreset,
} from './skillModules'

describe('skillModules', () => {
  it('resolves assessment and operational modules', () => {
    const edge = getSkillModule('SK_TECHNIQUE_EDGE_CONTROL')
    expect(isAssessmentModule(edge)).toBe(true)
    expect(getCoachGroupLabel(edge)).toBe('Coach Assessments')
    const flying = getSkillModule('FLYING_LAP')
    expect(isOperationalModule(flying)).toBe(true)
    expect(getCoachGroupLabel(flying)).toBe('Skill Drills')
  })

  it('maps lap presets to per-participant endurance', () => {
    const presets = listLapTimingPresets()
    expect(presets.map((p) => p.id)).toEqual(['2_LAP', '5_LAP', '10_LAP'])
    const two = toLapTimingPreset(presets[0])
    expect(two.runType).toBe('ENDURANCE_LAPS')
    expect(two.progressionMode).toBe('PER_PARTICIPANT')
  })

  it('builds operational patch with skillModuleId', () => {
    const patch = buildOperationalStartPatch('FLYING_LAP', 'FLYING_LAP', {
      participantIds: ['student-1'],
    })
    expect(patch.race_meta.skillModuleId).toBe('FLYING_LAP')
    expect(patch.results).toHaveLength(1)
  })
})
