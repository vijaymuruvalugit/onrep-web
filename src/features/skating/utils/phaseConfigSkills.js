/**
 * phase.config_json.skills helpers for Skills phase modules.
 */

import {
  DEFAULT_TECHNICAL_SKILLS,
  SKILL_MODULES_BY_ID,
} from '../constants/skillModules'

function normalizeSkillEntry(entry, index = 0) {
  if (!entry || typeof entry !== 'object') return null
  const skillId = String(entry.skill_id || entry.skillId || '').trim()
  if (!skillId || !SKILL_MODULES_BY_ID[skillId]) return null
  return {
    skill_id: skillId,
    order: Number.isFinite(Number(entry.order)) ? Number(entry.order) : index,
  }
}

export function sortSkillEntries(entries = []) {
  return [...entries]
    .map((e, i) => normalizeSkillEntry(e, i))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
}

export function readSkillsFromConfig(configJson) {
  const raw = configJson?.skills
  if (!Array.isArray(raw)) return []
  return sortSkillEntries(raw)
}

export function mergeSkillsIntoConfigJson(existingConfig = {}, skills = []) {
  const base =
    existingConfig != null && typeof existingConfig === 'object' ? { ...existingConfig } : {}
  const caps =
    base.capabilities != null && typeof base.capabilities === 'object'
      ? { ...base.capabilities }
      : {}
  const normalized = sortSkillEntries(
    skills.map((e, i) => normalizeSkillEntry(e, i)).filter(Boolean),
  )
  return { ...base, capabilities: caps, skills: normalized }
}

export function validateSkillIds(skillIds) {
  const unknown = skillIds.filter((id) => id && !SKILL_MODULES_BY_ID[id])
  return { valid: unknown.length === 0, unknown }
}

export function getDefaultTechnicalSkillsConfig() {
  return mergeSkillsIntoConfigJson({}, DEFAULT_TECHNICAL_SKILLS)
}

export function appendSkillEntry(entries, skillId) {
  const id = String(skillId || '').trim()
  if (!id || !SKILL_MODULES_BY_ID[id]) return sortSkillEntries(entries)
  const sorted = sortSkillEntries(entries)
  if (sorted.some((e) => e.skill_id === id)) return sorted
  return [...sorted, { skill_id: id, order: sorted.length }]
}

export function removeSkillEntry(entries, skillId) {
  const id = String(skillId || '').trim()
  return sortSkillEntries(entries)
    .filter((e) => e.skill_id !== id)
    .map((e, i) => ({ ...e, order: i }))
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
