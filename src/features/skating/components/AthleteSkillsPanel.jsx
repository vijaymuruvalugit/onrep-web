import React from 'react'
import { CButton, CBadge } from '@coreui/react'
import useAthleteIntelligence from '../hooks/useAthleteIntelligence'

function trendBadge(trend) {
  const t = String(trend || '').toLowerCase()
  if (t === 'up') return 'success'
  if (t === 'down') return 'danger'
  if (t === 'steady') return 'secondary'
  return 'dark'
}

/**
 * Per-athlete skill levels (1–5) — used on the Skills phase surface.
 */
export default function AthleteSkillsPanel({ studentId, disabled = false, className = '' }) {
  const intel = useAthleteIntelligence(studentId, 'skills', {
    enabled: Boolean(studentId),
    prefetch: true,
  })

  if (!studentId) {
    return (
      <p className="small text-body-secondary mb-0">
        Select a student above to rate skills.
      </p>
    )
  }

  return (
    <div
      className={`athlete-skills-panel${className ? ` ${className}` : ''}`}
      data-testid="athlete-skills-panel"
    >
      {intel.skillsErr ? <div className="small text-danger mb-2">{intel.skillsErr}</div> : null}
      {intel.skillsLoading && !intel.skillsGrouped.length ? (
        <div className="small text-muted">Loading skills…</div>
      ) : null}
      {(intel.skillsGrouped || []).map(([category, skillRows]) => (
        <div key={category} className="athlete-intel-skill-group mb-3">
          <div className="small fw-semibold text-body-secondary mb-1">{category}</div>
          {skillRows.map((s) => (
            <div key={s.id} className="athlete-intel-skill-row mb-2">
              <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                <span className="small fw-semibold">
                  {(s.displayName || s.canonicalName).slice(0, 72)}
                </span>
                {s.focusPriority ? <CBadge color="primary">Focus</CBadge> : null}
                <CBadge color={trendBadge(s.trendState)}>{String(s.trendState || '?')}</CBadge>
              </div>
              <div className="d-flex flex-wrap gap-1 athlete-intel-skill-levels">
                {[1, 2, 3, 4, 5].map((lv) => (
                  <CButton
                    key={lv}
                    size="sm"
                    color={Number(s.currentLevel) === lv ? 'primary' : 'light'}
                    disabled={disabled || Boolean(intel.skillTapSaving)}
                    className={`fast-coaching-chip fast-coaching-score-chip${
                      Number(s.currentLevel) === lv ? ' fast-coaching-score-chip--active' : ''
                    }`}
                    onClick={() => void intel.tapSkillLevel(s.id, lv)}
                  >
                    {lv}
                  </CButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
      {!intel.skillsLoading && !(intel.skillsGrouped && intel.skillsGrouped.length) ? (
        <div className="small text-muted">
          {intel.skillsErr ? null : 'No skills configured for this activity.'}
        </div>
      ) : null}
    </div>
  )
}
