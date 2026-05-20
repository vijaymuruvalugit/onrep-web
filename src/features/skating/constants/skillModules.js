/**
 * Skill module registry for Skills phase launcher.
 * Internal categories: assessment | operational (engineering only).
 * Coach-facing: Coach Assessments | Skill Drills
 */

import {
  RACE_PRESETS,
  CUSTOM_PRESET,
  buildPresetSubtitle,
  buildPresetStartPatch,
  resolvePreset,
} from '../race/racePresets'

export const SKILL_MODULE_CATEGORIES = Object.freeze({
  ASSESSMENT: 'assessment',
  OPERATIONAL: 'operational',
})

const ASSESSMENT_SKILL_DEFS = [
  { skillId: 'SK_TECHNIQUE_EDGE_CONTROL', displayName: 'Edge control' },
  { skillId: 'SK_TECHNIQUE_BALANCE', displayName: 'Balance' },
  { skillId: 'SK_TECHNIQUE_CROSSOVERS', displayName: 'Crossovers' },
]

export const ASSESSMENT_SKILL_MODULES = Object.freeze(
  ASSESSMENT_SKILL_DEFS.map((d) => ({
    skillId: d.skillId,
    internalCategory: SKILL_MODULE_CATEGORIES.ASSESSMENT,
    coachGroup: 'Coach Assessments',
    platformCode: d.skillId,
    displayName: d.displayName,
  })),
)

export const OPERATIONAL_SKILL_MODULES = Object.freeze([
  {
    skillId: 'FLYING_LAP',
    internalCategory: SKILL_MODULE_CATEGORIES.OPERATIONAL,
    coachGroup: 'Skill Drills',
    runType: 'FLYING_LAP',
    defaultPresetId: 'FLYING_LAP',
    defaultTargetCount: 1,
    progressionMode: 'PER_PARTICIPANT',
    flowMode: 'TIMER',
    displayName: 'Flying Lap',
  },
  {
    skillId: 'LAP_TIMING',
    internalCategory: SKILL_MODULE_CATEGORIES.OPERATIONAL,
    coachGroup: 'Skill Drills',
    runType: 'ENDURANCE_LAPS',
    defaultPresetId: '5_LAP',
    defaultTargetCount: 5,
    progressionMode: 'PER_PARTICIPANT',
    flowMode: 'TIMER',
    displayName: 'Lap Timing',
  },
])

export const ALL_SKILL_MODULES = Object.freeze([
  ...ASSESSMENT_SKILL_MODULES,
  ...OPERATIONAL_SKILL_MODULES,
])

/** @type {Readonly<Record<string, object>>} */
export const SKILL_MODULES_BY_ID = Object.freeze(
  ALL_SKILL_MODULES.reduce((acc, m) => {
    acc[m.skillId] = m
    return acc
  }, {}),
)

export const PLATFORM_ASSESSMENT_SKILL_IDS = ASSESSMENT_SKILL_MODULES.map((m) => m.skillId)

export const DEFAULT_TECHNICAL_SKILLS = PLATFORM_ASSESSMENT_SKILL_IDS.map((skillId, order) => ({
  skill_id: skillId,
  order,
}))

export function getSkillModule(skillId) {
  return SKILL_MODULES_BY_ID[String(skillId)] || null
}

export function getCoachGroupLabel(module) {
  if (!module) return 'Skill'
  return module.coachGroup === 'Skill Drills' ? 'Skill Drills' : 'Coach Assessments'
}

export function isAssessmentModule(module) {
  return module?.internalCategory === SKILL_MODULE_CATEGORIES.ASSESSMENT
}

export function isOperationalModule(module) {
  return module?.internalCategory === SKILL_MODULE_CATEGORIES.OPERATIONAL
}

export function listModulesByCoachGroup() {
  return {
    assessment: [...ASSESSMENT_SKILL_MODULES],
    drills: [...OPERATIONAL_SKILL_MODULES],
  }
}

/** Lap-style presets for Lap Timing drill (ENDURANCE_LAPS, per-athlete). */
export function listLapTimingPresets() {
  const ids = ['2_LAP', '5_LAP', '10_LAP']
  return ids
    .map((id) => RACE_PRESETS.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => toLapTimingPreset(p))
}

export function listFlyingLapPreset() {
  const p = resolvePreset('FLYING_LAP')
  return p ? toLapTimingPreset(p) : null
}

/**
 * Map race presets to single-athlete endurance timing (not pack heat).
 * @param {object} preset
 */
export function toLapTimingPreset(preset) {
  if (!preset) return null
  const laps = preset.targetProgressCount ?? 5
  const useEndurance =
    preset.id === '10_LAP' ||
    preset.runType === 'ENDURANCE_LAPS' ||
    preset.id === 'FLYING_LAP'
  return {
    ...preset,
    runType: preset.id === 'FLYING_LAP' ? 'FLYING_LAP' : 'ENDURANCE_LAPS',
    progressionMode: 'PER_PARTICIPANT',
    flowMode: 'TIMER',
    requiresParticipantPick: false,
    requiresTeamSetup: false,
    targetProgressCount: laps,
    subtitle: buildPresetSubtitle({ ...preset, targetProgressCount: laps }),
  }
}

export function resolveModuleFromCatalog(skillId, catalogSkill) {
  if (!catalogSkill && !skillId) return null
  const platformCode =
    catalogSkill?.platformCode || catalogSkill?.platform_code || String(skillId || '')
  const mod = getSkillModule(platformCode) || getSkillModule(skillId)
  if (!mod) return null
  return {
    ...mod,
    catalogSkillId: catalogSkill?.id,
    displayName:
      catalogSkill?.displayName ||
      catalogSkill?.canonicalName ||
      mod.displayName ||
      platformCode,
  }
}

export function getModuleDisplayName(skillId, catalogByPlatformCode = {}) {
  const mod = getSkillModule(skillId)
  const catalog = catalogByPlatformCode[skillId] || catalogByPlatformCode[mod?.platformCode]
  if (catalog) {
    return catalog.displayName || catalog.canonicalName || mod?.displayName || skillId
  }
  return mod?.displayName || skillId
}

/**
 * @param {string} moduleId
 * @param {string} presetId
 * @param {object} opts
 */
export function buildOperationalStartPatch(moduleId, presetId, opts = {}) {
  const mod = getSkillModule(moduleId)
  if (!mod) return null
  const preset =
    moduleId === 'FLYING_LAP'
      ? listFlyingLapPreset()
      : toLapTimingPreset(resolvePreset(presetId) || resolvePreset(mod.defaultPresetId))
  if (!preset) return null
  const laps = opts.customLaps ?? preset.targetProgressCount ?? mod.defaultTargetCount ?? 5
  const participantIds = (opts.participantIds || []).map(String).filter(Boolean)
  const patch = buildPresetStartPatch(
    { ...preset, targetProgressCount: laps },
    {
      raceSequence: opts.raceSequence ?? 1,
      participantIds,
      customLaps: laps,
      customDistance: opts.customDistance,
    },
  )
  patch.race_meta = {
    ...patch.race_meta,
    skillModuleId: moduleId,
    status: 'active',
    attemptNumber: opts.attemptNumber,
  }
  return patch
}
