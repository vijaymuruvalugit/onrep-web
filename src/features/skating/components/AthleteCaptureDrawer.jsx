import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
  CNav,
  CNavItem,
  CNavLink,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
  CBadge,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import { skatingChecklistApi } from '../api/skatingChecklistApi'
import { skatingIntelligenceApi } from '../api/skatingIntelligenceApi'
import { groupSkillsByCategory } from '../hooks/athleteIntelligenceData'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

const NOTE_TEMPLATES = [
  'Excellent improvement today',
  'Fatigue visible — lighten load next session',
  'Needs endurance work',
  'Confidence dipped — quieter cues next time',
  'Excellent discipline and focus',
]

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'skills', label: 'Skills' },
  { key: 'kpis', label: 'Progress' },
  { key: 'notes', label: 'Notes' },
  { key: 'history', label: 'History' },
]

function trendBadge(trend) {
  const t = String(trend || '').toLowerCase()
  if (t === 'up') return 'success'
  if (t === 'down') return 'danger'
  if (t === 'steady') return 'secondary'
  return 'dark'
}

/**
 * Coach-side athlete intelligence (tabs) + optional batch focus cue.
 */
export default function AthleteCaptureDrawer({
  visible,
  studentId,
  sessionId,
  studentName,
  focusText,
  onChangeFocus,
  onSaveFocus,
  saving,
  saveMessage,
  onClose,
}) {
  const [tab, setTab] = useState('today')
  const [skillsData, setSkillsData] = useState(null)
  const [skillsErr, setSkillsErr] = useState('')
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [kpiLoading, setKpiLoading] = useState(false)
  const [kpiData, setKpiData] = useState(null)
  const [kpiErr, setKpiErr] = useState('')
  const [histLoading, setHistLoading] = useState(false)
  const [histData, setHistData] = useState(null)
  const [skillTapSaving, setSkillTapSaving] = useState('')
  const [advancedKpiOpen, setAdvancedKpiOpen] = useState(false)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset drawer-local tab/data when switching athletes */
    setTab('today')
    setSkillsData(null)
    setKpiData(null)
    setHistData(null)
    setAdvancedKpiOpen(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [studentId])

  const loadSkills = useCallback(async () => {
    if (!studentId) return
    setSkillsErr('')
    setSkillsLoading(true)
    try {
      const data = await skatingIntelligenceApi.getSkillCatalog({ studentId })
      setSkillsData(data)
    } catch (e) {
      setSkillsErr(e?.response?.data?.error || e?.message || 'Failed to load skills')
    } finally {
      setSkillsLoading(false)
    }
  }, [studentId])

  const loadKpis = useCallback(async () => {
    if (!studentId) return
    setKpiErr('')
    setKpiLoading(true)
    try {
      const raw = await skatingIntelligenceApi.getStudentKpiSnapshots(studentId, {
        limit: advancedKpiOpen ? 90 : 30,
      })
      /** @type {Record<string, { code: string, snapshotDate: string, value: number|null }} */
      const latest = {}
      for (const row of raw.kpis || []) {
        const c = row.code
        if (!latest[c]) latest[c] = row
      }
      const primaryCodes = [
        'SESSION_BEST_LAP_MS',
        'SESSION_LAP_CONSISTENCY_SCORE',
        'ROLLING_ATTENDANCE_PCT',
        'TREND_SPEED_DELTA',
        'TREND_TECHNIQUE_DELTA',
      ]
      const keys = advancedKpiOpen
        ? Object.keys(latest).sort()
        : primaryCodes.filter((c) => latest[c])
      setKpiData({ latest, keys, codes: keys.map((k) => latest[k]).filter(Boolean) })
    } catch (e) {
      setKpiErr(e?.response?.data?.error || e?.message || 'Failed to load')
    } finally {
      setKpiLoading(false)
    }
  }, [studentId, advancedKpiOpen])

  const loadHistory = useCallback(async () => {
    if (!studentId) return
    setHistLoading(true)
    try {
      const data = await skatingIntelligenceApi.getTimeline(studentId)
      setHistData(data)
    } catch {
      setHistData(null)
    } finally {
      setHistLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (!visible || !studentId) return
    /* eslint-disable react-hooks/set-state-in-effect -- lazy-load the active tab when drawer opens or tab changes */
    if (tab === 'skills') void loadSkills()
    if (tab === 'kpis') void loadKpis()
    if (tab === 'history') void loadHistory()
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, studentId, tab, loadSkills, loadKpis, loadHistory])

  const skillsGrouped = useMemo(() => groupSkillsByCategory(skillsData), [skillsData])

  const postNote = async (text) => {
    if (!studentId || !text?.trim()) return
    await skatingChecklistApi.postAthleteNote({ studentId, note: text.trim() })
  }

  async function tapSkillLevel(skillId, level) {
    if (!studentId) return
    setSkillTapSaving(skillId + level)
    try {
      await skatingIntelligenceApi.patchStudentSkill(studentId, skillId, { currentLevel: level })
      await loadSkills()
    } catch (e) {
      setSkillsErr(e?.response?.data?.error || e?.message || 'Save failed')
    } finally {
      setSkillTapSaving('')
    }
  }

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} backdrop="static">
      <COffcanvasHeader>
        <COffcanvasTitle>{SESSION_OPS_COPY.captureDrawerTitle}</COffcanvasTitle>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Link className="btn btn-outline-secondary btn-sm" to="/coach/skating/intelligence">
            Setup
          </Link>
          <CButton type="button" color="light" size="sm" onClick={onClose}>
            Close
          </CButton>
        </div>
      </COffcanvasHeader>
      <COffcanvasBody className="d-flex flex-column gap-2">
        <div>
          <div className="small text-body-secondary mb-1">Athlete</div>
          <div className="fw-semibold">{studentName || '—'}</div>
          {studentId ? (
            <div className="small text-muted font-monospace">{studentId.slice(0, 8)}…</div>
          ) : null}
          {sessionId ? (
            <div className="small text-muted">Session locked for rapid capture in main column.</div>
          ) : null}
        </div>

        <CNav variant="underline" role="tablist" className="small flex-wrap">
          {TABS.map(({ key, label }) => (
            <CNavItem key={key}>
              <CNavLink
                active={tab === key}
                href="#"
                className={tab === key ? 'fw-semibold' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  setTab(key)
                }}
              >
                {label}
              </CNavLink>
            </CNavItem>
          ))}
        </CNav>

        {tab === 'today' && (
          <>
            <CAlert color="secondary" className="py-2 small mb-1">
              {SESSION_OPS_COPY.markPresentSoon}
            </CAlert>
            <div>
              <label className="form-label small text-body-secondary">
                {SESSION_OPS_COPY.focusPlaceholder}
              </label>
              <CFormInput
                value={focusText}
                onChange={(e) => onChangeFocus(e.target.value)}
                placeholder="Optional — taps matter more than typing."
              />
              <div className="d-flex gap-2 mt-2 align-items-center flex-wrap">
                <CButton
                  type="button"
                  color="primary"
                  size="sm"
                  disabled={saving}
                  onClick={onSaveFocus}
                >
                  {saving ? 'Saving…' : SESSION_OPS_COPY.focusSave}
                </CButton>
                {saveMessage ? <span className="small text-success">{saveMessage}</span> : null}
              </div>
            </div>
            <p className="small text-body-secondary mb-0">{SESSION_OPS_COPY.openInlineCapture}</p>
          </>
        )}

        {tab === 'skills' && (
          <div>
            {skillsErr ? <div className="small text-danger mb-2">{skillsErr}</div> : null}
            {skillsLoading ? <div className="small text-muted">Loading skills…</div> : null}
            {(skillsGrouped || []).map(([category, rows]) => (
              <div key={category} className="mb-3">
                <div className="small fw-semibold text-body-secondary mb-1">{category}</div>
                {rows.map((s) => (
                  <div key={s.id} className="border rounded px-2 py-2 mb-2">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <span className="small fw-semibold">
                        {(s.displayName || s.canonicalName).slice(0, 72)}
                      </span>
                      {s.custom ? <CBadge color="warning">Custom</CBadge> : null}
                      {s.focusPriority ? <CBadge color="primary">Focus</CBadge> : null}
                      <CBadge color={trendBadge(s.trendState)}>
                        {String(s.trendState || '?')}
                      </CBadge>
                    </div>
                    <div className="d-flex flex-wrap gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((lv) => (
                        <CButton
                          key={lv}
                          size="sm"
                          color={Number(s.currentLevel) === lv ? 'primary' : 'light'}
                          disabled={Boolean(skillTapSaving)}
                          className="px-2 py-1"
                          onClick={() => void tapSkillLevel(s.id, lv)}
                          title={`Set level ${lv}`}
                          aria-label={`skill ${lv}`}
                          style={{ minWidth: 36 }}
                        >
                          {lv}
                        </CButton>
                      ))}
                    </div>
                    <div className="small text-muted">
                      Target {s.targetLevel != null ? s.targetLevel : '—'} · Last{' '}
                      {formatDisplayDateDmy(s.lastObservedAt)}
                    </div>
                    {s.latestNote ? (
                      <div className="small fst-italic text-body-secondary mt-1">
                        {s.latestNote}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
            {!skillsLoading && !(skillsGrouped && skillsGrouped.length) ? (
              <div className="small text-muted">No skills configured for this academy yet.</div>
            ) : null}
          </div>
        )}

        {tab === 'kpis' && (
          <div>
            {kpiErr ? <div className="small text-danger mb-2">{kpiErr}</div> : null}
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <CButton
                size="sm"
                variant="outline"
                color="secondary"
                type="button"
                onClick={() => {
                  setAdvancedKpiOpen((v) => !v)
                  setTimeout(() => void loadKpis(), 0)
                }}
              >
                {advancedKpiOpen ? 'Less' : 'More'}
              </CButton>
              <CButton size="sm" color="light" type="button" onClick={() => void loadKpis()}>
                Refresh
              </CButton>
            </div>
            {kpiLoading ? <div className="small text-muted">Loading…</div> : null}
            {(kpiData?.keys || []).length ? (
              <div className="d-flex flex-column gap-2">
                {kpiData.keys.map((code) => {
                  const row = kpiData.latest[code]
                  if (!row) return null
                  let disp = row.value
                  if (row.code === 'SESSION_BEST_LAP_MS' && row.value != null) {
                    disp = `${(Number(row.value) / 1000).toFixed(2)}s`
                  }
                  if (row.code === 'SESSION_AVG_LAP_MS' && row.value != null) {
                    disp = `${(Number(row.value) / 1000).toFixed(2)}s`
                  }
                  return (
                    <div
                      key={code}
                      className="border rounded px-2 py-2 d-flex justify-content-between"
                    >
                      <span className="small fw-semibold text-capitalize">
                        {code.replace(/_/g, ' ').toLowerCase().slice(0, 24)}
                      </span>
                      <span className="small font-monospace">
                        {disp == null ? '—' : String(disp)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              !kpiLoading && (
                <div className="small text-muted">Snapshots appear after sessions end.</div>
              )
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="d-flex flex-column gap-2">
            <div className="small text-muted">Tap a template — optional, sparse notes only.</div>
            {NOTE_TEMPLATES.map((t) => (
              <CButton
                key={t}
                color="light"
                className="text-start small"
                type="button"
                onClick={() => void postNote(t)}
              >
                {t}
              </CButton>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div>
            {histLoading ? <div className="small text-muted">Loading…</div> : null}
            {(histData?.timeline || []).length ? (
              <ul className="list-unstyled small mb-0">
                {histData.timeline.map((it, idx) => (
                  <li key={idx} className="border-bottom py-2">
                    <div className="text-muted font-monospace" style={{ fontSize: '.7rem' }}>
                      {String(it.kind)} · {it.at ? new Date(it.at).toLocaleString() : '—'}
                    </div>
                    <div>{it.summary}</div>
                  </li>
                ))}
              </ul>
            ) : (
              !histLoading && <div className="small text-muted">No timeline rows yet.</div>
            )}
          </div>
        )}
      </COffcanvasBody>
    </COffcanvas>
  )
}
