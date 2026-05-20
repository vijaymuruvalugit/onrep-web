/**
 * phase.config_json.skills helpers — delegates to modules[] as canonical store.
 */

import {
  appendModuleEntry,
  mergeModulesIntoConfigJson,
  modulesToSkillEntries,
  readModulesFromConfig,
  removeModuleEntry,
  sortModuleEntries,
} from '../../modules/phaseConfigModules'
import { MODULES_BY_ID } from '../../modules/moduleRegistry'

const SKILL_MODULES_BY_ID = MODULES_BY_ID

export function sortSkillEntries(entries = []) {
  return modulesToSkillEntries(sortModuleEntries(entries))
}

export function readSkillsFromConfig(configJson) {
  return modulesToSkillEntries(readModulesFromConfig(configJson))
}

export function mergeSkillsIntoConfigJson(existingConfig = {}, skills = []) {
  const modules = sortModuleEntries(
    skills.map((e, i) => ({
      module_id: e?.skill_id || e?.skillId,
      order: e?.order ?? i,
      enabled: true,
      config: {},
    })),
  )
  const base =
    existingConfig != null && typeof existingConfig === 'object' ? { ...existingConfig } : {}
  const caps =
    base.capabilities != null && typeof base.capabilities === 'object'
      ? { ...base.capabilities }
      : {}
  return { ...mergeModulesIntoConfigJson(base, modules), capabilities: caps }
}

export function validateSkillIds(skillIds) {
  const unknown = skillIds.filter((id) => id && !SKILL_MODULES_BY_ID[id])
  return { valid: unknown.length === 0, unknown }
}

export function getDefaultTechnicalSkillsConfig() {
  const modules = [
    { module_id: 'EDGE_CONTROL', order: 0 },
    { module_id: 'BALANCE', order: 1 },
    { module_id: 'CROSSOVERS', order: 2 },
  ]
  return mergeModulesIntoConfigJson({}, modules)
}

export function appendSkillEntry(entries, skillId) {
  const mods = appendModuleEntry(readModulesFromConfig({ skills: entries }), skillId)
  return modulesToSkillEntries(mods)
}

export function removeSkillEntry(entries, skillId) {
  const mods = removeModuleEntry(readModulesFromConfig({ skills: entries }), skillId)
  return modulesToSkillEntries(mods)
}

export function moveSkillEntry(entries, skillId, direction) {
  const sorted = sortSkillEntries(entries)
  const idx = sorted.findIndex((e) => e.skill_id === skillId)
  if (idx < 0) return sorted
  const j = idx + direction
  if (j < 0 || j >= sorted.length) return sorted
  const next = [...sorted]
  ;[next[idx], next[j]] = [next[j], next[idx]]
  return next.map((e, i) => ({ ...e, order: i }))
}
