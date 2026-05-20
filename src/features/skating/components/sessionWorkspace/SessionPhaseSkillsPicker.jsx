import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import { skatingIntelligenceApi } from '../../api/skatingIntelligenceApi'
import {
  appendSkillEntry,
  mergeSkillsIntoConfigJson,
  moveSkillEntry,
  readSkillsFromConfig,
  removeSkillEntry,
} from '../../utils/phaseConfigSkills'
import { getCoachGroupLabel, getModuleDisplayName, getSkillModule } from '../../constants/skillModules'
import SkillModulePickerModal from '../skills/SkillModulePickerModal'

export default function SessionPhaseSkillsPicker({
  phase,
  disabled = false,
  onConfigChange,
}) {
  const [catalogByCode, setCatalogByCode] = useState({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  const skills = useMemo(() => readSkillsFromConfig(phase?.configJson), [phase?.configJson])
  const selectedIds = useMemo(() => skills.map((s) => s.skill_id), [skills])

  useEffect(() => {
    let cancelled = false
    setLoadingCatalog(true)
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
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const pushSkills = useCallback(
    (nextEntries) => {
      const merged = mergeSkillsIntoConfigJson(phase?.configJson || {}, nextEntries)
      onConfigChange?.(merged)
    },
    [phase?.configJson, onConfigChange],
  )

  const handleAdd = (skillId) => {
    pushSkills(appendSkillEntry(skills, skillId))
  }

  const handleRemove = (skillId) => {
    if (!window.confirm('Remove this skill from the phase?')) return
    pushSkills(removeSkillEntry(skills, skillId))
  }

  const handleMove = (skillId, direction) => {
    pushSkills(moveSkillEntry(skills, skillId, direction))
  }

  if (!phase) return null

  return (
    <div className="session-phase-skills-picker" data-testid="session-phase-skills-picker">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <p className="fw-semibold small mb-0">Skills for this phase</p>
        <CButton
          size="sm"
          color="primary"
          variant="outline"
          disabled={disabled}
          onClick={() => setPickerOpen(true)}
        >
          + Add skill
        </CButton>
      </div>
      {loadingCatalog ? <CSpinner size="sm" className="mb-2" /> : null}
      <ul className="list-group list-group-flush mb-0">
        {skills.map((entry, index) => {
          const mod = getSkillModule(entry.skill_id)
          const label = getModuleDisplayName(entry.skill_id, catalogByCode)
          const group = getCoachGroupLabel(mod)
          return (
            <li
              key={entry.skill_id}
              className="list-group-item d-flex flex-wrap align-items-center gap-2 px-0"
            >
              <span className="flex-grow-1">
                <span className="fw-semibold">{label}</span>
                <span className="small text-body-secondary ms-2">{group}</span>
              </span>
              <CButton
                size="sm"
                variant="outline"
                disabled={disabled || index === 0}
                onClick={() => handleMove(entry.skill_id, -1)}
                aria-label="Move up"
              >
                ↑
              </CButton>
              <CButton
                size="sm"
                variant="outline"
                disabled={disabled || index === skills.length - 1}
                onClick={() => handleMove(entry.skill_id, 1)}
                aria-label="Move down"
              >
                ↓
              </CButton>
              <CButton
                size="sm"
                color="danger"
                variant="outline"
                disabled={disabled}
                onClick={() => handleRemove(entry.skill_id)}
              >
                Remove
              </CButton>
            </li>
          )
        })}
      </ul>
      {!skills.length ? (
        <p className="small text-body-secondary mb-0">No skills configured yet.</p>
      ) : null}
      <SkillModulePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedSkillIds={selectedIds}
        onAdd={handleAdd}
        title="Add skill to phase"
      />
    </div>
  )
}
