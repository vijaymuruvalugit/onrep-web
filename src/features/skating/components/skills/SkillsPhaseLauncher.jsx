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
import { appendSkillEntry, readSkillsFromConfig, removeSkillEntry } from '../../utils/phaseConfigSkills'
import SkillModulePickerModal from './SkillModulePickerModal'

export default function SkillsPhaseLauncher({
  phaseConfigJson,
  disabled = false,
  busy = false,
  onSelectModule,
  onSkillsChange,
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [catalogByCode, setCatalogByCode] = useState({})

  const skills = useMemo(() => readSkillsFromConfig(phaseConfigJson), [phaseConfigJson])
  const selectedIds = useMemo(() => skills.map((s) => s.skill_id), [skills])

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

  const handleAdd = (skillId) => {
    onSkillsChange?.(appendSkillEntry(skills, skillId))
  }

  const handleRemove = (skillId, e) => {
    e?.stopPropagation?.()
    if (!window.confirm('Remove this skill from the session phase?')) return
    onSkillsChange?.(removeSkillEntry(skills, skillId))
  }

  return (
    <div className="skills-phase-launcher" data-testid="skills-phase-launcher">
      <div className="skills-phase-launcher__header">
        <div>
          <h2 className="skills-phase-launcher__title">Skills</h2>
          <p className="skills-phase-launcher__hint small text-body-secondary mb-0">
            Tap a module to coach. Add or remove skills anytime.
          </p>
        </div>
        <CButton
          color="primary"
          size="sm"
          disabled={disabled || busy}
          onClick={() => setPickerOpen(true)}
        >
          + Add Skill
        </CButton>
      </div>

      {!skills.length ? (
        <p className="small text-body-secondary py-3">
          No skills on this phase yet. Add Coach Assessments or Skill Drills.
        </p>
      ) : (
        <div className="skills-module-grid" role="list">
          {skills.map((entry) => {
            const mod = getSkillModule(entry.skill_id)
            const label = getModuleDisplayName(entry.skill_id, catalogByCode)
            const group = getCoachGroupLabel(mod)
            const variant = isAssessmentModule(mod)
              ? 'assessment'
              : isOperationalModule(mod)
                ? 'drill'
                : 'neutral'
            return (
              <button
                key={entry.skill_id}
                type="button"
                role="listitem"
                className={`skills-module-tile skills-module-tile--${variant}`}
                disabled={disabled || busy}
                onClick={() => onSelectModule?.(entry.skill_id)}
                data-testid={`skills-module-tile-${entry.skill_id}`}
              >
                <span className="skills-module-tile__badge">{group}</span>
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

      <SkillModulePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedSkillIds={selectedIds}
        onAdd={handleAdd}
      />
    </div>
  )
}
