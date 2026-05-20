/**
 * phase.config_json.modules helpers (canonical) with skills[] read compat.
 */

import { getModule, LEGACY_SKILL_TO_MODULE_ID, MODULES_BY_ID } from './moduleRegistry.js'

function normalizeModuleEntry(entry, index = 0) {
  if (!entry || typeof entry !== 'object') return null
  const rawId = String(entry.module_id || entry.moduleId || entry.skill_id || entry.skillId || '').trim()
  const moduleId = LEGACY_SKILL_TO_MODULE_ID[rawId] || rawId
  if (!MODULES_BY_ID[moduleId]) return null
  const order = Number(entry.order)
  const config =
    entry.config != null && typeof entry.config === 'object' && !Array.isArray(entry.config)
      ? entry.config
      : {}
  return {
    module_id: moduleId,
    enabled: entry.enabled !== false,
    order: Number.isFinite(order) ? order : index,
    config,
  }
}

export function sortModuleEntries(entries = []) {
  return [...entries]
    .map((e, i) => normalizeModuleEntry(e, i))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((m, i) => ({ ...m, order: i }))
}

export function readModulesFromConfig(configJson) {
  const raw = configJson?.modules
  if (Array.isArray(raw) && raw.length > 0) {
    return sortModuleEntries(raw)
  }
  const skills = configJson?.skills
  if (!Array.isArray(skills)) return []
  return sortModuleEntries(
    skills.map((s, i) => ({
      module_id: LEGACY_SKILL_TO_MODULE_ID[s?.skill_id || s?.skillId] || s?.skill_id,
      order: s?.order ?? i,
      enabled: true,
      config: {},
    })),
  )
}

/** Legacy skill entry shape for APIs still expecting skills[] */
export function modulesToSkillEntries(modules = []) {
  return sortModuleEntries(modules).map((m) => {
    const def = getModule(m.module_id)
    return {
      skill_id: def?.platformSkillId || def?.platformCode || m.module_id,
      order: m.order,
    }
  })
}

export function mergeModulesIntoConfigJson(existingConfig = {}, modules = []) {
  const base =
    existingConfig != null && typeof existingConfig === 'object' ? { ...existingConfig } : {}
  const normalized = sortModuleEntries(modules)
  const skills = modulesToSkillEntries(normalized)
  return { ...base, modules: normalized, skills }
}

export function appendModuleEntry(entries, moduleId) {
  const id = LEGACY_SKILL_TO_MODULE_ID[moduleId] || String(moduleId || '').trim()
  if (!MODULES_BY_ID[id]) return sortModuleEntries(entries)
  const sorted = sortModuleEntries(entries)
  if (sorted.some((e) => e.module_id === id)) return sorted
  const mod = getModule(id)
  const config = {}
  if (mod?.defaultTargetCount) config.laps = mod.defaultTargetCount
  return [...sorted, { module_id: id, enabled: true, order: sorted.length, config }]
}

export function removeModuleEntry(entries, moduleId) {
  const id = LEGACY_SKILL_TO_MODULE_ID[moduleId] || String(moduleId || '').trim()
  return sortModuleEntries(entries)
    .filter((e) => e.module_id !== id)
    .map((e, i) => ({ ...e, order: i }))
}

export function validateModuleIds(moduleIds) {
  const unknown = moduleIds.filter((id) => id && !MODULES_BY_ID[LEGACY_SKILL_TO_MODULE_ID[id] || id])
  return { valid: unknown.length === 0, unknown }
}
