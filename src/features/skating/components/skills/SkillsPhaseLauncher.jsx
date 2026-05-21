import React, { useEffect, useMemo, useState } from 'react'
import { CButton } from '@coreui/react'
import { skatingIntelligenceApi } from '../../api/skatingIntelligenceApi'
import {
  getCoachGroupLabel,
  getModuleDisplayName,
  getSkillModule,
  isAssessmentModule,
  isOperationalModule,
} from '../../constants/skillModules'
import ModulePickerSheet from '../../../modules/components/ModulePickerSheet'
import { readModulesFromConfig } from '../../../modules/phaseConfigModules'
import { appendModuleEntry, removeModuleEntry } from '../../../modules/phaseConfigModules'

const PRIMARY_RECOMMENDED_MODULE_IDS = new Set(['FLYING_LAP', 'LAP_TIMING'])

export default function SkillsPhaseLauncher({
  phaseConfigJson,
  disabled = false,
  busy = false,
  title = 'Skills',
  hint = 'Tap a tool to coach. Add or remove anytime.',
  emptyMessage = 'No skills on this phase yet. Add Coach Assessments or Skill Drills.',
  filterModule = null,
  onSelectModule,
  onSkillsChange,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [catalogByCode, setCatalogByCode] = useState({})

  const modules = useMemo(() => readModulesFromConfig(phaseConfigJson), [phaseConfigJson])
  const skills = useMemo(
    () => modules.map((m) => ({ skill_id: m.module_id, order: m.order })),
    [modules],
  )
  const selectedIds = useMemo(() => skills.map((s) => s.skill_id), [skills])
  const visibleSkills = useMemo(
    () =>
      filterModule
        ? skills.filter((entry) => filterModule(getSkillModule(entry.skill_id), entry))
        : skills,
    [filterModule, skills],
  )

  useEffect(() => {
    let cancelled = false
    skatingIntelligenceApi
      .getSkillCatalog({})
      .then((data) => {
        if (cancelled) return
        const list = data?.skills || data?.catalog || []
        const map = {}
        for (const s of list) {
          const code = String(s.platformCode || s.platform_code || '').trim()
          if (code) map[code] = s
        }
        setCatalogByCode(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleAdd = (moduleId) => {
    const next = appendModuleEntry(modules, moduleId)
    onSkillsChange?.(next.map((m) => ({ skill_id: m.module_id, order: m.order })))
  }

  const handleRemove = (skillId, e) => {
    e?.stopPropagation?.()
    if (!window.confirm('Remove this tool from the phase?')) return
    const next = removeModuleEntry(modules, skillId)
    onSkillsChange?.(next.map((m) => ({ skill_id: m.module_id, order: m.order })))
  }

  return (
    <div className="skills-phase-launcher" data-testid="skills-phase-launcher">
      <div className="skills-phase-launcher__header">
        <div>
          <h2 className="skills-phase-launcher__title">{title}</h2>
          <p className="skills-phase-launcher__hint small text-body-secondary mb-0">
            {hint}
          </p>
        </div>
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => setPickerOpen(true)}
        >
          + Add Module
        </CButton>
      </div>

      {!visibleSkills.length ? (
        <p className="small text-body-secondary py-3">{emptyMessage}</p>
      ) : (
        <div className="skills-module-grid" role="list">
          {visibleSkills.map((entry) => {
            const mod = getSkillModule(entry.skill_id)
            const label = getModuleDisplayName(entry.skill_id, catalogByCode)
            const group = getCoachGroupLabel(mod)
            const variant = isAssessmentModule(mod)
              ? 'assessment'
              : isOperationalModule(mod)
                ? 'drill'
                : 'neutral'
            const primary = PRIMARY_RECOMMENDED_MODULE_IDS.has(String(entry.skill_id))
            return (
              <button
                key={entry.skill_id}
                type="button"
                role="listitem"
                className={`skills-module-tile skills-module-tile--${variant}${
                  primary ? ' skills-module-tile--primary' : ''
                }`}
                disabled={disabled || busy}
                onClick={() => onSelectModule?.(entry.skill_id)}
                data-testid={`skills-module-tile-${entry.skill_id}`}
              >
                <span className="skills-module-tile__badge">
                  {primary ? 'Recommended drill' : group}
                </span>
                <span className="skills-module-tile__label">{label}</span>
                <span
                  className="skills-module-tile__remove"
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => handleRemove(entry.skill_id, e)}
                  aria-label={`Remove ${label}`}
                >
                  ×
                </span>
              </button>
            )
          })}
        </div>
      )}

      <ModulePickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedModuleIds={selectedIds}
        onAdd={handleAdd}
        title="Add tool"
      />
    </div>
  )
}
