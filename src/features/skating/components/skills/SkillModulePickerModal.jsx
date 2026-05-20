import React, { useEffect, useMemo, useState } from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CSpinner } from '@coreui/react'
import { skatingIntelligenceApi } from '../../api/skatingIntelligenceApi'
import {
  ASSESSMENT_SKILL_MODULES,
  OPERATIONAL_SKILL_MODULES,
  resolveModuleFromCatalog,
} from '../../constants/skillModules'

function catalogPlatformCode(skill) {
  return String(skill.platformCode || skill.platform_code || skill.id || '').trim()
}

/**
 * Pick assessment (catalog) or operational drill modules.
 */
export default function SkillModulePickerModal({
  visible,
  onClose,
  selectedSkillIds = [],
  onAdd,
  title = 'Add skill',
}) {
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const selectedSet = useMemo(() => new Set(selectedSkillIds.map(String)), [selectedSkillIds])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setLoading(true)
    setErr('')
    skatingIntelligenceApi
      .getSkillCatalog({})
      .then((data) => {
        if (!cancelled) setCatalog(data?.skills || data?.catalog || [])
      })
      .catch((e) => {
        if (!cancelled) setErr(e?.response?.data?.error || e?.message || 'Could not load skills')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [visible])

  const assessmentOptions = useMemo(() => {
    const platformIds = new Set(ASSESSMENT_SKILL_MODULES.map((m) => m.skillId))
    const fromCatalog = (catalog || [])
      .map((s) => {
        const code = catalogPlatformCode(s)
        if (!platformIds.has(code)) return null
        return resolveModuleFromCatalog(code, s)
      })
      .filter(Boolean)
    if (fromCatalog.length) return fromCatalog
    return ASSESSMENT_SKILL_MODULES.map((m) => ({ ...m, displayName: m.displayName }))
  }, [catalog])

  const drillOptions = useMemo(
    () =>
      OPERATIONAL_SKILL_MODULES.filter((m) => !selectedSet.has(m.skillId)).map((m) => ({
        ...m,
        displayName: m.displayName,
      })),
    [selectedSet],
  )

  const handlePick = (skillId) => {
    const id = String(skillId)
    if (selectedSet.has(id)) return
    onAdd?.(id)
    onClose?.()
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>{title}</CModalHeader>
      <CModalBody>
        {err ? <p className="small text-danger">{err}</p> : null}
        {loading ? <CSpinner size="sm" /> : null}
        <section className="skill-module-picker__group" aria-label="Coach Assessments">
          <h3 className="skill-module-picker__heading">Coach Assessments</h3>
          <div className="skill-module-picker__list">
            {assessmentOptions.map((mod) => {
              const id = mod.skillId || mod.platformCode
              const taken = selectedSet.has(id)
              return (
                <button
                  key={id}
                  type="button"
                  className="skill-module-picker__item"
                  disabled={taken}
                  onClick={() => handlePick(id)}
                >
                  <span>{mod.displayName || id}</span>
                  {taken ? <span className="small text-body-secondary">Added</span> : null}
                </button>
              )
            })}
          </div>
        </section>
        <section className="skill-module-picker__group mt-3" aria-label="Skill Drills">
          <h3 className="skill-module-picker__heading">Skill Drills</h3>
          <div className="skill-module-picker__list">
            {drillOptions.map((mod) => (
              <button
                key={mod.skillId}
                type="button"
                className="skill-module-picker__item skill-module-picker__item--drill"
                onClick={() => handlePick(mod.skillId)}
              >
                <span>{mod.displayName}</span>
              </button>
            ))}
          </div>
        </section>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
