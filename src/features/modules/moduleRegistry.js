/**
 * Frontend mirror of backend moduleRegistry.js (code-defined, not from API).
 * Modules stay intentionally scarce: frequent use + workflow + useful history.
 */

export const MODULE_PICKER_GROUPS = Object.freeze({
  OPERATIONAL_DRILLS: 'Operational Drills',
  COACH_ASSESSMENTS: 'Coach Assessments',
})

export const MODULE_INTERACTION_TYPES = Object.freeze({
  TIMING: 'timing',
  ASSESSMENT: 'assessment',
})

/** Maps legacy skill_id to canonical module_id */
export const LEGACY_SKILL_TO_MODULE_ID = Object.freeze({
  FLYING_LAP: 'FLYING_LAP',
  LAP_TIMING: 'LAP_TIMING',
  SK_TECHNIQUE_EDGE_CONTROL: 'EDGE_CONTROL',
  SK_TECHNIQUE_BALANCE: 'BALANCE',
  SK_TECHNIQUE_CROSSOVERS: 'CROSSOVERS',
})

const STRONG_MODULES = [
  {
    id: 'FLYING_LAP',
    title: 'Flying Lap',
    interaction_type: MODULE_INTERACTION_TYPES.TIMING,
    picker_group: MODULE_PICKER_GROUPS.OPERATIONAL_DRILLS,
    runType: 'FLYING_LAP',
    defaultPresetId: 'FLYING_LAP',
    defaultTargetCount: 1,
    displayName: 'Flying Lap',
  },
  {
    id: 'LAP_TIMING',
    title: 'Lap Timing',
    interaction_type: MODULE_INTERACTION_TYPES.TIMING,
    picker_group: MODULE_PICKER_GROUPS.OPERATIONAL_DRILLS,
    runType: 'ENDURANCE_LAPS',
    defaultPresetId: '5_LAP',
    defaultTargetCount: 5,
    displayName: 'Lap Timing',
  },
  {
    id: 'EDGE_CONTROL',
    title: 'Edge Control',
    interaction_type: MODULE_INTERACTION_TYPES.ASSESSMENT,
    picker_group: MODULE_PICKER_GROUPS.COACH_ASSESSMENTS,
    platformSkillId: 'SK_TECHNIQUE_EDGE_CONTROL',
    platformCode: 'SK_TECHNIQUE_EDGE_CONTROL',
    displayName: 'Edge control',
  },
  {
    id: 'BALANCE',
    title: 'Balance',
    interaction_type: MODULE_INTERACTION_TYPES.ASSESSMENT,
    picker_group: MODULE_PICKER_GROUPS.COACH_ASSESSMENTS,
    platformSkillId: 'SK_TECHNIQUE_BALANCE',
    platformCode: 'SK_TECHNIQUE_BALANCE',
    displayName: 'Balance',
  },
  {
    id: 'CROSSOVERS',
    title: 'Crossovers',
    interaction_type: MODULE_INTERACTION_TYPES.ASSESSMENT,
    picker_group: MODULE_PICKER_GROUPS.COACH_ASSESSMENTS,
    platformSkillId: 'SK_TECHNIQUE_CROSSOVERS',
    platformCode: 'SK_TECHNIQUE_CROSSOVERS',
    displayName: 'Crossovers',
  },
  {
    id: 'RACE_TIMING',
    title: 'Race Timing',
    interaction_type: MODULE_INTERACTION_TYPES.TIMING,
    picker_group: MODULE_PICKER_GROUPS.OPERATIONAL_DRILLS,
    runType: 'HEAT_RACE',
    displayName: 'Race Timing',
  },
]

export const MODULES_BY_ID = Object.freeze(
  STRONG_MODULES.reduce((acc, m) => {
    acc[m.id] = Object.freeze({ ...m, skillId: m.id })
    return acc
  }, {}),
)

export function getModule(moduleId) {
  const id = LEGACY_SKILL_TO_MODULE_ID[moduleId] || moduleId
  return MODULES_BY_ID[id] || null
}

export function isTimingModule(module) {
  return module?.interaction_type === MODULE_INTERACTION_TYPES.TIMING
}

export function isAssessmentModule(module) {
  return module?.interaction_type === MODULE_INTERACTION_TYPES.ASSESSMENT
}

export function listModulesByPickerGroup() {
  const drills = STRONG_MODULES.filter(
    (m) => m.picker_group === MODULE_PICKER_GROUPS.OPERATIONAL_DRILLS,
  )
  const assessments = STRONG_MODULES.filter(
    (m) => m.picker_group === MODULE_PICKER_GROUPS.COACH_ASSESSMENTS,
  )
  return { drills, assessments }
}

export function getModuleDisplayName(moduleId, catalogByCode = {}) {
  const mod = getModule(moduleId)
  if (!mod) return String(moduleId || 'Module')
  const code = mod.platformCode || mod.platformSkillId
  if (code && catalogByCode[code]?.name) return catalogByCode[code].name
  return mod.displayName || mod.title
}

/** Back-compat aliases for skillModules consumers */
export function getSkillModule(skillId) {
  return getModule(skillId)
}

export function isOperationalModule(module) {
  return isTimingModule(module)
}

export function getCoachGroupLabel(module) {
  if (!module) return 'Module'
  return module.picker_group || MODULE_PICKER_GROUPS.OPERATIONAL_DRILLS
}
