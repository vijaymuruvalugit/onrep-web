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
import AthleteSkillsPanel from './AthleteSkillsPanel'

const NOTE_TEMPLATES = [
  'Great improvement today',
  'Fatigue — lighten load',
  'Needs endurance work',
  'Mind dipped — quieter cues',
  'Strong focus today',
]

function WorkspaceFold({ summary, children }) {
  return (
    <details className="coach-workspace-fold">
      <summary className="coach-workspace-fold__summary">{summary}</summary>
      <div className="coach-workspace-fold__body">{children}</div>
    </details>
  )
}

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
  stackedAdvanced = false,
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
    if (stackedAdvanced) return
    const initial = readLastIntelligenceTab(sessionId)
    const first = allowedTabs.some((t) => t.key === initial) ? initial : allowedTabs[0]?.key || 'today'
    setTab(first)
  }, [studentId, sessionId, allowedTabs, stackedAdvanced])

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

  const todayPanel = (
    <div className="athlete-intel-today">
      <div className="athlete-intel-today-focus">
        <label className="form-label small text-body-secondary mb-1">
          {SESSION_OPS_COPY.todayFocusInline}
        </label>
        <CFormInput
          size="sm"
          value={focusText}
          onChange={(e) => onChangeFocus(e.target.value)}
          placeholder={SESSION_OPS_COPY.focusPlaceholder}
        />
        <div className="d-flex gap-2 mt-1 align-items-center flex-wrap">
          <CButton type="button" color="primary" size="sm" disabled={saving} onClick={onSaveFocus}>
            {saving ? '…' : SESSION_OPS_COPY.focusSave}
          </CButton>
          {saveMessage ? <span className="small text-success">{saveMessage}</span> : null}
        </div>
      </div>
    </div>
  )

  const notesPanel = (
    <div>
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
  )

  const skillsPanel = <AthleteSkillsPanel studentId={studentId} />

  const progressPanel = (
    <div>
      {intel.progressErr ? <div className="small text-danger mb-2">{intel.progressErr}</div> : null}
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
  )

  const historyPanel = (
    <div>
      {intel.histLoading ? <div className="small text-muted">Loading…</div> : null}
      {(intel.histData?.timeline || []).length ? (
        <ul className="list-unstyled small mb-0 athlete-intel-history">
          {intel.histData.timeline.map((it, idx) => (
            <li key={idx} className="athlete-intel-history__item py-1">
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
  )

  if (!studentId) {
    return (
      <div className="athlete-intel-tabs athlete-intel-tabs--empty small text-body-secondary py-2">
        {SESSION_OPS_COPY.selectAthletePrompt}
      </div>
    )
  }

  if (stackedAdvanced) {
    const showSkills = allowedTabs.some((t) => t.key === 'skills')
    const showProgress = allowedTabs.some((t) => t.key === 'progress')
    const showHistory = allowedTabs.some((t) => t.key === 'history')
    const showToday = allowedTabs.some((t) => t.key === 'today')

    return (
      <div
        className={`athlete-intel-tabs athlete-intel-tabs--live athlete-intel-tabs--stacked${
          className ? ` ${className}` : ''
        }`}
        data-testid="athlete-intelligence-tabs"
      >
        {showToday ? todayPanel : null}
        {showToday ? (
          <WorkspaceFold summary={liveLabel('notes')}>{notesPanel}</WorkspaceFold>
        ) : null}
        {showProgress ? (
          <WorkspaceFold summary={liveLabel('progress')}>{progressPanel}</WorkspaceFold>
        ) : null}
        {showHistory ? (
          <WorkspaceFold summary="History">{historyPanel}</WorkspaceFold>
        ) : null}
        {showSkills ? (
          <WorkspaceFold summary={liveLabel('skills')}>{skillsPanel}</WorkspaceFold>
        ) : null}
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
            {todayPanel}
            <div className="mt-3">
              <div className="small text-body-secondary mb-1">{liveLabel('note')}</div>
              {notesPanel}
            </div>
          </div>
        )}

        {tab === 'skills' && skillsPanel}
        {tab === 'progress' && progressPanel}
        {tab === 'history' && historyPanel}
      </div>
    </div>
  )
}
