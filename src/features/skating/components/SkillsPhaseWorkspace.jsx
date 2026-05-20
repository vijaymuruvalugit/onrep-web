import React from 'react'
import AthleteSkillsPanel from './AthleteSkillsPanel'
import { liveLabel } from '../constants/coachLiveLabels'

/**
 * Skills phase — skill level capture for the selected student.
 */
export default function SkillsPhaseWorkspace({ studentId, athleteName, disabled = false }) {
  return (
    <section className="skills-phase-workspace" data-testid="skills-phase-workspace">
      <header className="skills-phase-workspace__header mb-2">
        <div>
          <h3 className="h6 fw-semibold mb-0">{liveLabel('skills')}</h3>
          <p className="small text-body-secondary mb-0">
            Tap one number per skill. It saves right away.
          </p>
        </div>
        <p className="small text-body-secondary mb-0">
          {studentId ? athleteName || 'Selected student' : 'Select a student above'}
        </p>
      </header>
      <AthleteSkillsPanel studentId={studentId} disabled={disabled} />
    </section>
  )
}
