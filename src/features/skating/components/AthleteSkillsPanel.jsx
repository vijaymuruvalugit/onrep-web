import React from 'react'
import { CButton, CBadge } from '@coreui/react'
import useAthleteIntelligence from '../hooks/useAthleteIntelligence'

function trendBadge(trend) {
  const t = String(trend || '').toLowerCase()
  if (!t || t === 'unknown') return null
  if (t === 'up') return 'success'
  if (t === 'down') return 'danger'
  if (t === 'steady') return 'secondary'
  return null
}

function trendLabel(trend) {
  const t = String(trend || '').toLowerCase()
  if (t === 'up') return 'Improving'
  if (t === 'down') return 'Needs attention'
  if (t === 'steady') return 'Steady'
  return ''
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
      <div className="athlete-skills-empty">
        <div className="athlete-skills-empty__icon" aria-hidden="true">
          1-5
        </div>
        <div>
          <div className="fw-semibold">Choose a student</div>
          <p className="small text-body-secondary mb-0">
            Then tap a level for each skill. Changes save instantly.
          </p>
        </div>
      </div>
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
        <div key={category} className="athlete-intel-skill-group">
          <div className="athlete-intel-skill-group__heading">
            <span>{category}</span>
            <span>{skillRows.length} skills</span>
          </div>
          <div className="athlete-intel-skill-grid">
            {skillRows.map((s) => (
              <div key={s.id} className="athlete-intel-skill-row">
                <div className="athlete-intel-skill-row__top">
                  <div>
                    <div className="athlete-intel-skill-row__name">
                      {(s.displayName || s.canonicalName).slice(0, 72)}
                    </div>
                    <div className="athlete-intel-skill-row__meta">
                      Level {Number(s.currentLevel) || '-'} of 5
                    </div>
                  </div>
                  <div className="athlete-intel-skill-row__badges">
                    {s.focusPriority ? <CBadge color="info">Focus</CBadge> : null}
                    {trendBadge(s.trendState) ? (
                      <CBadge color={trendBadge(s.trendState)}>{trendLabel(s.trendState)}</CBadge>
                    ) : null}
                  </div>
                </div>
                <div
                  className="athlete-intel-skill-levels"
                  aria-label={`Rate ${s.displayName || s.canonicalName}`}
                >
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
                      aria-pressed={Number(s.currentLevel) === lv}
                    >
                      {lv}
                    </CButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
