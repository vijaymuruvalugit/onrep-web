import { describe, expect, it } from 'vitest'
import { getModule, listModulesByPickerGroup, MODULES_BY_ID } from './moduleRegistry'
import { appendModuleEntry, readModulesFromConfig } from './phaseConfigModules'

describe('moduleRegistry', () => {
  it('lists operational and assessment modules', () => {
    expect(MODULES_BY_ID.FLYING_LAP).toBeTruthy()
    expect(MODULES_BY_ID.EDGE_CONTROL).toBeTruthy()
    const { drills, assessments } = listModulesByPickerGroup()
    expect(drills.length).toBeGreaterThan(0)
    expect(assessments.length).toBeGreaterThan(0)
  })

  it('keeps borderline utilities out of the initial module catalog', () => {
    expect(MODULES_BY_ID.ENDURANCE_TIMING).toBeUndefined()
    expect(MODULES_BY_ID.EFFORT_RATING).toBeUndefined()
    expect(MODULES_BY_ID.RECOVERY_RATING).toBeUndefined()
  })

  it('reads modules from legacy skills config', () => {
    const mods = readModulesFromConfig({
      skills: [{ skill_id: 'FLYING_LAP', order: 0 }],
    })
    expect(mods[0].module_id).toBe('FLYING_LAP')
  })

  it('appends module without duplicate', () => {
    const next = appendModuleEntry([], 'LAP_TIMING')
    const again = appendModuleEntry(next, 'LAP_TIMING')
    expect(again).toHaveLength(1)
    expect(getModule('LAP_TIMING')?.title).toBe('Lap Timing')
  })
})
