import React, { useCallback, useState } from 'react'
import { CAlert } from '@coreui/react'
import AthleteSkillsPanel from './AthleteSkillsPanel'
import SkillsPhaseLauncher from './skills/SkillsPhaseLauncher'
import OperationalTimingWorkspace from './skills/OperationalTimingWorkspace'
import {
  getSkillModule,
  isAssessmentModule,
  isOperationalModule,
  getModuleDisplayName,
} from '../constants/skillModules'
import { sortSkillEntries } from '../utils/phaseConfigSkills'

/**
 * Skills phase router: launcher → assessment ratings or operational timing drill.
 */
export default function SkillsPhaseWorkspace({
  studentId,
  athleteName,
  disabled = false,
  busy = false,
  phaseConfigJson,
  phaseSkills = [],
  onSkillsChange,
  operationalSessionId,
  phaseId,
  athletes = [],
  activityRunEngineEnabled = false,
}) {
  const [activeModuleId, setActiveModuleId] = useState(null)

  const skillsList = phaseSkills?.length
    ? sortSkillEntries(phaseSkills)
    : sortSkillEntries(phaseConfigJson?.skills || [])

  const activeModule = activeModuleId ? getSkillModule(activeModuleId) : null

  const handleSelectModule = useCallback(
    (skillId) => {
      const mod = getSkillModule(skillId)
      if (!mod) return
      setActiveModuleId(skillId)
    },
    [],
  )

  const handleBack = useCallback(() => {
    setActiveModuleId(null)
  }, [])

  const handleSkillsChange = useCallback(
    (entries) => {
      onSkillsChange?.(entries)
      if (activeModuleId && !entries.some((e) => e.skill_id === activeModuleId)) {
        setActiveModuleId(null)
      }
    },
    [activeModuleId, onSkillsChange],
  )

  if (!activeModuleId) {
    return (
      <SkillsPhaseLauncher
        phaseConfigJson={{ skills: skillsList }}
        disabled={disabled}
        busy={busy}
        onSelectModule={handleSelectModule}
        onSkillsChange={handleSkillsChange}
      />
    )
  }

  if (isAssessmentModule(activeModule)) {
    const label = getModuleDisplayName(activeModuleId)
    return (
      <div className="skills-phase-detail" data-testid="skills-phase-assessment">
        <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={handleBack}>
          ← Back to Skills
        </button>
        <p className="skills-phase-detail__module-title fw-semibold mb-2">{label}</p>
        <AthleteSkillsPanel
          studentId={studentId}
          disabled={disabled}
          filterPlatformCode={activeModule.platformCode || activeModuleId}
        />
      </div>
    )
  }

  if (isOperationalModule(activeModule)) {
    if (!activityRunEngineEnabled) {
      return (
        <div className="skills-phase-detail">
          <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={handleBack}>
            ← Back to Skills
          </button>
          <CAlert color="warning" className="small">
            Skill drills require the activity run engine. Set{' '}
            <code>VITE_ACTIVITY_RUN_ENGINE=true</code> and reload.
          </CAlert>
        </div>
      )
    }

    if (activeModule.skillId === 'LAP_TIMING' && !studentId) {
      return (
        <div className="skills-phase-detail">
          <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={handleBack}>
            ← Back to Skills
          </button>
          <p className="fw-semibold mb-1">Lap Timing</p>
          <p className="small text-body-secondary mb-0">
            Select an athlete in the Students strip, then open Lap Timing again.
          </p>
        </div>
      )
    }

    return (
      <div className="skills-phase-detail" data-testid="skills-phase-operational">
        <OperationalTimingWorkspace
          moduleId={activeModule.skillId}
          studentId={studentId}
          athleteName={athleteName}
          athletes={athletes}
          operationalSessionId={operationalSessionId}
          phaseId={phaseId}
          disabled={disabled}
          busy={busy}
          onClose={handleBack}
        />
      </div>
    )
  }

  return (
    <div className="skills-phase-detail">
      <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={handleBack}>
        ← Back to Skills
      </button>
      <p className="small text-body-secondary">Unknown skill module.</p>
    </div>
  )
}
