import React, { useEffect, useMemo, useState } from 'react'
import { CButton, CFormInput, CNav, CNavItem, CNavLink, CBadge } from '@coreui/react'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import { skatingChecklistApi } from '../api/skatingChecklistApi'
import {
  INTELLIGENCE_TABS,
  liveLabel,
  readLastIntelligenceTab,
  writeLastIntelligenceTab,
} from '../constants/coachLiveLabels'
import useAthleteIntelligence from '../hooks/useAthleteIntelligence'

const NOTE_TEMPLATES = [
  'Great improvement today',
  'Fatigue — lighten load',
  'Needs endurance work',
  'Mind dipped — quieter cues',
  'Strong focus today',
]

function trendBadge(trend) {
  const t = String(trend || '').toLowerCase()
  if (t === 'up') return 'success'
  if (t === 'down') return 'danger'
  if (t === 'steady') return 'secondary'
  return 'dark'
}

function formatProgressValue(row) {
  if (!row || row.value == null) return '—'
  if (row.code === 'SESSION_BEST_LAP_MS' || row.code === 'SESSION_AVG_LAP_MS') {
    return `${(Number(row.value) / 1000).toFixed(2)}s`
  }
  return String(row.value)
}

function humanProgressLabel(code) {
  const c = String(code || '')
  if (c.includes('LAP')) return liveLabel('track')
  if (c.includes('ATTENDANCE')) return 'Attend'
  if (c.includes('SPEED')) return 'Speed'
  if (c.includes('TECHNIQUE')) return 'Skills'
  return c.replace(/_/g, ' ').split(/\s+/).slice(0, 2).join(' ')
}

/**
 * Inline intelligence tabs — Today | Skills | Progress | History (live surface).
 */
export default function AthleteIntelligenceTabs({
  studentId,
  sessionId,
  focusText,
  onChangeFocus,
  onSaveFocus,
  saving,
  saveMessage,
  tabKeys,
  className = '',
}) {
  const allowedTabs = useMemo(() => {
    const keys = tabKeys?.length ? tabKeys : INTELLIGENCE_TABS.map((t) => t.key)
    return INTELLIGENCE_TABS.filter((t) => keys.includes(t.key))
  }, [tabKeys])

  const [tab, setTab] = useState(() => readLastIntelligenceTab(sessionId))
  const [noteBusy, setNoteBusy] = useState('')
  const [noteMsg, setNoteMsg] = useState('')
  const [noteErr, setNoteErr] = useState('')

  const intel = useAthleteIntelligence(studentId, tab, { enabled: Boolean(studentId), prefetch: true })

  useEffect(() => {
    const initial = readLastIntelligenceTab(sessionId)
    const first = allowedTabs.some((t) => t.key === initial) ? initial : allowedTabs[0]?.key || 'today'
    setTab(first)
  }, [studentId, sessionId, allowedTabs])

  const selectTab = (key) => {
    setTab(key)
    writeLastIntelligenceTab(sessionId, key)
  }

  const postNote = async (text) => {
    if (!studentId || !text?.trim()) return
    const trimmed = text.trim().slice(0, 600)
    setNoteErr('')
    setNoteMsg('')
    setNoteBusy(trimmed)
    try {
      await skatingChecklistApi.postAthleteNote({ studentId, note: trimmed })
      setNoteMsg('Note saved')
      window.setTimeout(() => setNoteMsg(''), 2500)
    } catch (e) {
      setNoteErr(e?.response?.data?.error || e?.message || 'Could not save note')
    } finally {
      setNoteBusy('')
    }
  }

  if (!studentId) {
    return (
      <div className="athlete-intel-tabs athlete-intel-tabs--empty small text-body-secondary py-2">
        {SESSION_OPS_COPY.selectAthletePrompt}
      </div>
    )
  }

  return (
    <div
      className={`athlete-intel-tabs athlete-intel-tabs--live${className ? ` ${className}` : ''}`}
      data-testid="athlete-intelligence-tabs"
    >
      <CNav variant="underline" role="tablist" className="athlete-intel-tabs__nav flex-nowrap">
        {allowedTabs.map(({ key, label }) => (
          <CNavItem key={key}>
            <CNavLink
              active={tab === key}
              href="#"
              className={`athlete-intel-tabs__link${tab === key ? ' athlete-intel-tabs__link--active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                selectTab(key)
              }}
            >
              {label}
            </CNavLink>
          </CNavItem>
        ))}
      </CNav>

      <div className="athlete-intel-tabs__panel">
        {tab === 'today' && (
          <div className="athlete-intel-today">
            <label className="form-label small text-body-secondary mb-1">
              {SESSION_OPS_COPY.todayFocusInline}
            </label>
            <CFormInput
              size="sm"
              value={focusText}
              onChange={(e) => onChangeFocus(e.target.value)}
              placeholder={SESSION_OPS_COPY.focusPlaceholder}
            />
            <div className="d-flex gap-2 mt-2 align-items-center flex-wrap">
              <CButton type="button" color="primary" size="sm" disabled={saving} onClick={onSaveFocus}>
                {saving ? '…' : SESSION_OPS_COPY.focusSave}
              </CButton>
              {saveMessage ? <span className="small text-success">{saveMessage}</span> : null}
            </div>
            <div className="mt-3">
              <div className="small text-body-secondary mb-1">{liveLabel('note')}</div>
              {noteErr ? <div className="small text-danger mb-2">{noteErr}</div> : null}
              {noteMsg ? <div className="small text-success mb-2">{noteMsg}</div> : null}
              <div className="d-flex flex-column gap-1">
                {NOTE_TEMPLATES.map((t) => (
                  <CButton
                    key={t}
                    color="light"
                    className="text-start small py-2 athlete-intel-note-chip"
                    type="button"
                    disabled={Boolean(noteBusy)}
                    onClick={() => void postNote(t)}
                  >
                    {noteBusy === t ? 'Saving…' : t}
                  </CButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'skills' && (
          <div>
            {intel.skillsErr ? <div className="small text-danger mb-2">{intel.skillsErr}</div> : null}
            {intel.skillsLoading && !intel.skillsGrouped.length ? (
              <div className="small text-muted">Loading…</div>
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
                          disabled={Boolean(intel.skillTapSaving)}
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
        )}

        {tab === 'progress' && (
          <div>
            {intel.progressErr ? <div className="small text-danger mb-2">{intel.progressErr}</div> : null}
            <details className="mb-2 small athlete-intel-tabs__more">
              <summary className="user-select-none">More</summary>
              <div className="d-flex gap-2 mt-2 flex-wrap">
                <CButton
                  size="sm"
                  variant="outline"
                  color="secondary"
                  type="button"
                  onClick={() => {
                    intel.setShowAllProgress((v) => !v)
                    setTimeout(() => void intel.loadProgress(), 0)
                  }}
                >
                  {intel.showAllProgress ? 'Less' : 'All'}
                </CButton>
                <CButton size="sm" color="light" type="button" onClick={() => void intel.loadProgress()}>
                  Refresh
                </CButton>
              </div>
            </details>
            {intel.progressLoading ? <div className="small text-muted">Loading…</div> : null}
            {(intel.progressData?.keys || []).length ? (
              <div className="athlete-intel-progress-list">
                {intel.progressData.keys.map((code) => {
                  const row = intel.progressData.latest[code]
                  if (!row) return null
                  return (
                    <div key={code} className="athlete-intel-progress-row">
                      <span className="small">{humanProgressLabel(code)}</span>
                      <span className="small font-monospace">{formatProgressValue(row)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              !intel.progressLoading && <div className="small text-muted">After sessions end.</div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            {intel.histLoading ? <div className="small text-muted">Loading…</div> : null}
            {(intel.histData?.timeline || []).length ? (
              <ul className="list-unstyled small mb-0 athlete-intel-history">
                {intel.histData.timeline.map((it, idx) => (
                  <li key={idx} className="athlete-intel-history__item py-2">
                    <div className="text-muted" style={{ fontSize: '.7rem' }}>
                      {it.at ? new Date(it.at).toLocaleString() : '—'}
                    </div>
                    <div>{it.summary}</div>
                  </li>
                ))}
              </ul>
            ) : (
              !intel.histLoading && <div className="small text-muted">No history yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
