import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import placesApi from '../../places/api/placesApi'
import { useAuth } from '../../auth/hooks/useAuth'
import { formatLocalYmd } from '../../dashboard/utils/calendarDate'
import { skatingOpsApi } from '../api/skatingOpsApi'
import { skatingChecklistApi } from '../api/skatingChecklistApi'
import { DEFAULT_RAPID_KPIS } from '../constants/rapidObservationKpis'
import { SESSION_OPS_COPY } from '../constants/sessionOpsCopy'
import AthleteCaptureDrawer from '../components/AthleteCaptureDrawer'
import AthletesInSessionPanel from '../components/AthletesInSessionPanel'
import QualitativeObservationStrip from '../components/QualitativeObservationStrip'
import SessionCommandHeader from '../components/SessionCommandHeader'
import StartSessionModal from '../components/StartSessionModal'
import { deriveSessionLifecycle, formatElapsedLiveLabel } from '../utils/sessionLifecycle'
import { computeSessionSummary } from '../utils/sessionTodaySummary'
import '../skating-ops.css'

const SK_LAST_PLACE = 'onrep.skating.lastPlaceId'
const SK_LAST_RINK = 'onrep.skating.lastRinkOrRoad'
const SK_LAP_DRAFT = 'onrep.skating.lapDraft'
const SK_ACTIVE_SESSION = 'onrep.skating.activeSessionId'
/** Operational continuity memory — last glance pattern for this session (not “assessment persistence”). */
const SK_OBS_TEMPLATE = 'onrep.skating.obsScoreTemplate'
/** Session-scoped active benchmark (`skating_skills`) for tagged laps + PB hints. */
const SK_ACTIVE_EFFORT = 'onrep.skating.activeEffort'

/** Coach “oops” window for last lap removal (operational rhythm). */
const UNDO_WINDOW_MS = 45_000
/** After full 5-KPI tap, commit quickly; partial sets wait longer (avoid assessment spam). */
const OBS_DEBOUNCE_FULL_MS = 420
const OBS_DEBOUNCE_PARTIAL_MS = 1100
/** Advance pause shortens slightly after a steady rhythm — resets when you “Stay” or switch session. */
const OBS_ADVANCE_PAUSE_BASE_MS = 860
const OBS_ADVANCE_PAUSE_MIN_MS = 520
const OBS_ADVANCE_PAUSE_STEP_MS = 72
const OBS_ADVANCE_PAUSE_MAX_STEPS = 6
/** “Back to previous skater” after advance (quiet undo, not a modal). */
const OBS_RETURN_WINDOW_MS = 14_000

function computeAdvancePauseMs(rhythmStep) {
  const n = Math.min(Math.max(0, rhythmStep), OBS_ADVANCE_PAUSE_MAX_STEPS)
  return Math.max(
    OBS_ADVANCE_PAUSE_MIN_MS,
    OBS_ADVANCE_PAUSE_BASE_MS - n * OBS_ADVANCE_PAUSE_STEP_MS,
  )
}

function opsBadgeColor(state) {
  if (state === 'active') return 'success'
  if (state === 'ended') return 'dark'
  if (state === 'upcoming') return 'secondary'
  return 'secondary'
}

function formatTime(isoOrDate) {
  if (!isoOrDate) return '—'
  try {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

function lapSecondsFromRow(row) {
  const ms = row?.lapMs != null ? row.lapMs : row?.lap_ms
  if (ms == null) return '—'
  return (Number(ms) / 1000).toFixed(2)
}

function raceLabelForLap(row, races) {
  if (!row?.raceId) return '—'
  const rc = (races || []).find((r) => String(r.id) === String(row.raceId))
  return rc?.label || rc?.groupName || 'Lane'
}

function raceLabelForId(raceId, races) {
  if (!raceId) return '—'
  const rc = (races || []).find((r) => String(r.id) === String(raceId))
  return rc?.label || rc?.groupName || 'Lane'
}

function formatBundleFreshness(msAgo) {
  if (msAgo < 2000) return 'just now'
  const sec = Math.floor(msAgo / 1000)
  if (sec < 60) return `${sec}s ago`
  const m = Math.floor(sec / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function formatClockShort(d) {
  try {
    const x = d instanceof Date ? d : new Date(d)
    if (Number.isNaN(x.getTime())) return ''
    return x.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function readObsTemplate(sessionId) {
  if (!sessionId) return null
  try {
    const raw = sessionStorage.getItem(SK_OBS_TEMPLATE)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (o?.sessionId !== sessionId || !o.scores || typeof o.scores !== 'object') return null
    return o.scores
  } catch {
    return null
  }
}

function writeObsTemplate(sessionId, scores) {
  if (!sessionId || !scores) return
  try {
    sessionStorage.setItem(SK_OBS_TEMPLATE, JSON.stringify({ sessionId, scores }))
  } catch {
    /* ignore */
  }
}

function readActiveEffort(sessionId, studentId) {
  if (!sessionId || !studentId) return { skillId: '', skillName: '' }
  try {
    const raw = sessionStorage.getItem(SK_ACTIVE_EFFORT)
    if (!raw) return { skillId: '', skillName: '' }
    const o = JSON.parse(raw)
    if (o?.sessionId !== sessionId) return { skillId: '', skillName: '' }
    if (o.studentId && String(o.studentId) !== String(studentId))
      return { skillId: '', skillName: '' }
    return {
      skillId: o.skillId ? String(o.skillId) : '',
      skillName: o.skillName ? String(o.skillName) : '',
    }
  } catch {
    return { skillId: '', skillName: '' }
  }
}

function writeActiveEffort(sessionId, studentId, skillId, skillName) {
  if (!sessionId) return
  try {
    if (!skillId) sessionStorage.removeItem(SK_ACTIVE_EFFORT)
    else
      sessionStorage.setItem(
        SK_ACTIVE_EFFORT,
        JSON.stringify({
          sessionId,
          studentId: studentId ? String(studentId) : null,
          skillId: String(skillId),
          skillName: skillName || '',
        }),
      )
  } catch {
    /* ignore */
  }
}

/** One operational line after a tagged lap — not a dashboard. */
function operationalEffortPhrase(lapMs, hints) {
  if (lapMs == null || !hints) return null
  const ms = Number(lapMs)
  if (!Number.isFinite(ms) || ms <= 0) return null
  const all = hints.bestMsAll != null ? Number(hints.bestMsAll) : null
  const today = hints.bestMsToday != null ? Number(hints.bestMsToday) : null
  const last = hints.lastMs != null ? Number(hints.lastMs) : null
  if (all != null && ms <= all) return 'Best for this effort (among tagged laps).'
  if (today != null && ms <= today * 1.02) return 'Right with today’s best for this effort.'
  if (last != null && ms < last - 1) return 'Quicker than their last tagged effort lap.'
  return null
}

function scoresPayload(obsScores) {
  const scores = {}
  for (const [k, v] of Object.entries(obsScores)) {
    const n = Number(v)
    if (n >= 1 && n <= 5) scores[k] = n
  }
  return scores
}

function isFullObservationSet(obsScores) {
  return DEFAULT_RAPID_KPIS.every(({ key }) => {
    const n = Number(obsScores[key])
    return n >= 1 && n <= 5
  })
}

/**
 * Single-route skating operational surface — lap-first UX, session continuity, stable bundle fields.
 */
const SkatingOpsPage = () => {
  const auth = useAuth()
  const currentUserId = auth?.user?.id || auth?.user?.sub || ''
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionParam = searchParams.get('session') || ''
  const focusFromUrl = searchParams.get('focus') === '1'

  const [dateYmd, setDateYmd] = useState(() => formatLocalYmd())
  const [snapshot, setSnapshot] = useState(null)
  const [snapLoading, setSnapLoading] = useState(false)
  const [snapError, setSnapError] = useState(null)

  const [bundle, setBundle] = useState(null)
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleError, setBundleError] = useState(null)

  const [places, setPlaces] = useState([])
  const [skaters, setSkaters] = useState([])

  const [focusMode, setFocusMode] = useState(focusFromUrl)
  const [uiPaused, setUiPaused] = useState(false)

  const [showStartLiveModal, setShowStartLiveModal] = useState(false)
  const [defaultPlaceForModal, setDefaultPlaceForModal] = useState('')
  const [defaultRinkForModal, setDefaultRinkForModal] = useState('Rink')
  const [showAddAthletesModal, setShowAddAthletesModal] = useState(false)
  const [addAthletesPick, setAddAthletesPick] = useState(() => new Set())
  const [addAthletesSaving, setAddAthletesSaving] = useState(false)

  const [lapStudentId, setLapStudentId] = useState('')
  const [lapSeconds, setLapSeconds] = useState('')
  const [lapRaceId, setLapRaceId] = useState('')
  const [duplicateWarn, setDuplicateWarn] = useState('')
  const [lapError, setLapError] = useState('')
  const [lastProgression, setLastProgression] = useState(null)
  const [skillsCatalog, setSkillsCatalog] = useState([])
  const [activeEffortSkillId, setActiveEffortSkillId] = useState('')
  const [activeEffortName, setActiveEffortName] = useState('')
  const [effortTopBand, setEffortTopBand] = useState('none')
  const [effortModerateBlurb, setEffortModerateBlurb] = useState('')
  const [lastEffortPhrase, setLastEffortPhrase] = useState(null)
  const [lapSubmitting, setLapSubmitting] = useState(false)
  const [rosterFilter, setRosterFilter] = useState('')
  /** While POST /laps is in flight — show pending row + block double-submit */
  const [pendingLapPreview, setPendingLapPreview] = useState(null)
  const [bundleFetchedAt, setBundleFetchedAt] = useState(null)
  const [bundleAgeTick, setBundleAgeTick] = useState(0)
  const [undoOffer, setUndoOffer] = useState(null)
  const [undoBusy, setUndoBusy] = useState(false)

  const [obsScores, setObsScores] = useState({})
  const [obsNotes, setObsNotes] = useState('')
  const [obsNotesOpen, setObsNotesOpen] = useState(false)
  const [obsSaving, setObsSaving] = useState(false)
  const [obsError, setObsError] = useState('')
  const [obsSyncedAt, setObsSyncedAt] = useState(null)
  const [obsPulse, setObsPulse] = useState(false)
  const [obsFlashKeys, setObsFlashKeys] = useState(() => new Set())
  const [lastObsLabel, setLastObsLabel] = useState('')
  const [sessionsPanelOpen, setSessionsPanelOpen] = useState(true)
  const [recentLapsExpanded, setRecentLapsExpanded] = useState(false)
  const [obsAdvancePending, setObsAdvancePending] = useState(null)
  const [obsReturnSkater, setObsReturnSkater] = useState(null)
  const [advanceTick, setAdvanceTick] = useState(0)
  const [reEntryWarmth, setReEntryWarmth] = useState(null)
  /** Client-only count for this browser session (bundle has no observation aggregate). */
  const [sessionObservationCount, setSessionObservationCount] = useState(0)
  const [observedStudentIds, setObservedStudentIds] = useState(() => new Set())
  const [timingPanelOpen, setTimingPanelOpen] = useState(true)

  const [captureDrawerStudentId, setCaptureDrawerStudentId] = useState(null)
  const [athleteFocusDraft, setAthleteFocusDraft] = useState('')
  const [athleteFocusSaving, setAthleteFocusSaving] = useState(false)
  const [athleteFocusSaveMsg, setAthleteFocusSaveMsg] = useState('')

  const athletePanelRef = useRef(null)
  const defaultRaceEnsureAttemptedRef = useRef(new Set())

  const lapSecondsRef = useRef(null)
  const forceDuplicateRef = useRef(false)
  const restoredRef = useRef(false)
  const manualEffortOverrideRef = useRef(false)
  const lastModerateBlurbKeyRef = useRef('')
  /** Skip auto-save when scores were hydrated from template / post-advance (not a new “notice”). */
  const obsAutoSaveSuppressedRef = useRef(true)
  /** Dedupe auto-save per athlete for identical payload. */
  const obsLastSentByStudentRef = useRef({})
  const obsSubmitLockRef = useRef(false)
  /** After save + auto-advance, allow debounced sync for next skater without an extra tap (repeat flow). */
  const obsChainAdvanceRef = useRef(false)
  const advanceTimerRef = useRef(null)
  /** Counts consecutive advance pauses in a flow — “Stay” or session change resets. */
  const advancePauseRhythmRef = useRef(0)
  const flowSnapRef = useRef({
    coachLive: false,
    sessionId: '',
    studentName: '',
    place: '',
  })

  const selectedSessionId = sessionParam || ''

  useEffect(() => {
    if (!captureDrawerStudentId || !bundle?.session) return
    const map = bundle.session.sessionAthleteFocusJson || {}
    const cell = map[captureDrawerStudentId]
    const t = cell && typeof cell === 'object' && cell.text != null ? String(cell.text) : ''
    setAthleteFocusDraft(t)
    setAthleteFocusSaveMsg('')
  }, [captureDrawerStudentId, bundle?.session, selectedSessionId])

  const clearPendingObsAdvance = useCallback(() => {
    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setObsAdvancePending(null)
  }, [])

  const cancelAdvanceAndStay = useCallback(() => {
    advancePauseRhythmRef.current = 0
    clearPendingObsAdvance()
  }, [clearPendingObsAdvance])

  const loadSnapshot = useCallback(async () => {
    setSnapLoading(true)
    setSnapError(null)
    try {
      const data = await skatingOpsApi.getOpsSnapshot(dateYmd)
      setSnapshot(data)
    } catch (e) {
      setSnapError(e?.message || 'Could not load training snapshot.')
      setSnapshot(null)
    } finally {
      setSnapLoading(false)
    }
  }, [dateYmd])

  const loadBundle = useCallback(async (sessionId) => {
    if (!sessionId) {
      setBundle(null)
      return
    }
    setBundleLoading(true)
    setBundleError(null)
    try {
      const b = await skatingOpsApi.getSessionBundle(sessionId, { recentLapLimit: 120 })
      setBundle(b)
      setBundleFetchedAt(Date.now())
      setLapRaceId((prev) => prev || b?.suggestedFocusRaceId || '')
    } catch (e) {
      setBundleError(e?.message || 'Could not load session bundle.')
      setBundle(null)
      setBundleFetchedAt(null)
    } finally {
      setBundleLoading(false)
    }
  }, [])

  useEffect(() => {
    restoredRef.current = false
  }, [dateYmd])

  useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  useEffect(() => {
    const id = setInterval(() => setBundleAgeTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!selectedSessionId) {
      setSkillsCatalog([])
      setActiveEffortSkillId('')
      setActiveEffortName('')
      manualEffortOverrideRef.current = false
      return
    }
    const { skillId, skillName } = readActiveEffort(selectedSessionId, lapStudentId)
    lastModerateBlurbKeyRef.current = ''
    manualEffortOverrideRef.current = Boolean(skillId)
    if (skillId) {
      setActiveEffortSkillId(skillId)
      setActiveEffortName(skillName)
    } else {
      setActiveEffortSkillId('')
      setActiveEffortName('')
    }
  }, [selectedSessionId, lapStudentId])

  useEffect(() => {
    if (!selectedSessionId) return
    let cancelled = false
    ;(async () => {
      try {
        const skills = await skatingChecklistApi.listSkills()
        if (!cancelled) setSkillsCatalog(Array.isArray(skills) ? skills : [])
      } catch {
        if (!cancelled) setSkillsCatalog([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId || !bundle) return undefined
    const t = window.setTimeout(async () => {
      try {
        const data = await skatingChecklistApi.getEffortSuggestions({
          studentId: lapStudentId || undefined,
          raceUuid: lapRaceId || undefined,
        })
        const band = data?.topBand || 'none'
        const topId = data?.topSkillId ? String(data.topSkillId) : ''
        const topName = data?.suggestions?.[0]?.name || ''
        setEffortTopBand(band)
        if (!manualEffortOverrideRef.current && topId) {
          setActiveEffortSkillId(topId)
          setActiveEffortName(topName)
          writeActiveEffort(selectedSessionId, lapStudentId, topId, topName)
        }
        const key = `${topId}|${band}`
        if (band === 'moderate' && lastModerateBlurbKeyRef.current !== key) {
          lastModerateBlurbKeyRef.current = key
          const line = topName ? `Laps save as: ${topName.slice(0, 42)}` : ''
          setEffortModerateBlurb(line)
          window.setTimeout(() => setEffortModerateBlurb(''), 9000)
        } else if (band !== 'moderate') {
          setEffortModerateBlurb('')
        }
      } catch {
        setEffortTopBand('none')
      }
    }, 320)
    return () => window.clearTimeout(t)
  }, [selectedSessionId, lapStudentId, lapRaceId, bundle])

  useEffect(() => {
    if (!undoOffer) return undefined
    const id = setInterval(() => {
      setUndoOffer((u) => (u && Date.now() >= u.until ? null : u))
    }, 400)
    return () => clearInterval(id)
  }, [undoOffer])

  useEffect(() => {
    setFocusMode(focusFromUrl)
  }, [focusFromUrl])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const pl = await placesApi.listPlaces({})
        const list = pl?.places || pl?.items || []
        if (!cancelled) setPlaces(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setPlaces([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await skatingOpsApi.listActiveSkaters()
        if (!cancelled) setSkaters(rows)
      } catch {
        if (!cancelled) setSkaters([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedSessionId])

  useEffect(() => {
    if (selectedSessionId) loadBundle(selectedSessionId)
    else setBundle(null)
  }, [selectedSessionId, loadBundle])

  /** Reconnect / tab return — refresh bundle + snapshot; quiet “you’re still here” when coaching. */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      if (selectedSessionId) loadBundle(selectedSessionId)
      loadSnapshot()
      const snap = flowSnapRef.current
      if (snap.coachLive && snap.sessionId && (snap.studentName || snap.place)) {
        const line = snap.studentName
          ? `${snap.place ? `${snap.place} — ` : ''}You’re back. Still here with ${snap.studentName}.`
          : `${snap.place || 'Session'} — pick up calmly when you’re ready.`
        setReEntryWarmth(line)
        window.setTimeout(() => setReEntryWarmth(null), 4200)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [selectedSessionId, loadBundle, loadSnapshot])

  /** Restore active session: URL wins; else last stored; else primary active for the day. */
  useEffect(() => {
    if (!snapshot || sessionParam || restoredRef.current) return
    const list = snapshot.sessions || []
    const ids = new Set(list.map((s) => String(s.id)))
    let pick = null
    try {
      const st = sessionStorage.getItem(SK_ACTIVE_SESSION)
      if (st && ids.has(st)) pick = st
    } catch {
      /* ignore */
    }
    if (
      !pick &&
      snapshot.primaryFocusSessionId &&
      ids.has(String(snapshot.primaryFocusSessionId))
    ) {
      pick = String(snapshot.primaryFocusSessionId)
    }
    if (pick) {
      restoredRef.current = true
      const next = new URLSearchParams(searchParams)
      next.set('session', pick)
      setSearchParams(next)
    }
  }, [snapshot, sessionParam, searchParams, setSearchParams])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SK_LAP_DRAFT)
      if (!raw || !selectedSessionId) return
      const d = JSON.parse(raw)
      if (d.sessionId === selectedSessionId) {
        if (d.studentId) setLapStudentId(d.studentId)
        if (d.lapSeconds != null) setLapSeconds(String(d.lapSeconds))
        if (d.raceId) setLapRaceId(d.raceId)
      }
    } catch {
      /* ignore */
    }
  }, [selectedSessionId])

  useEffect(() => {
    try {
      const lp = sessionStorage.getItem(SK_LAST_PLACE)
      if (lp) setDefaultPlaceForModal(lp)
      const lr = sessionStorage.getItem(SK_LAST_RINK)
      if (lr) setDefaultRinkForModal(lr)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!selectedSessionId) return
    try {
      sessionStorage.setItem(SK_ACTIVE_SESSION, selectedSessionId)
    } catch {
      /* ignore */
    }
  }, [selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId) return
    try {
      sessionStorage.setItem(
        SK_LAP_DRAFT,
        JSON.stringify({
          sessionId: selectedSessionId,
          studentId: lapStudentId,
          lapSeconds,
          raceId: lapRaceId,
        }),
      )
    } catch {
      /* ignore */
    }
  }, [selectedSessionId, lapStudentId, lapSeconds, lapRaceId])

  const selectSession = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('session', id)
    else next.delete('session')
    setSearchParams(next)
    setUiPaused(false)
    setLastProgression(null)
    setDuplicateWarn('')
    setLapError('')
    setRosterFilter('')
    setLapRaceId('')
    setUndoOffer(null)
    setPendingLapPreview(null)
    setLastEffortPhrase(null)
    setEffortModerateBlurb('')
    lastModerateBlurbKeyRef.current = ''
    setObsScores({})
    setObsNotes('')
    setObsNotesOpen(false)
    setObsError('')
    setObsSyncedAt(null)
    setLastObsLabel('')
    clearPendingObsAdvance()
    advancePauseRhythmRef.current = 0
    setObsReturnSkater(null)
    setReEntryWarmth(null)
    obsAutoSaveSuppressedRef.current = true
    obsLastSentByStudentRef.current = {}
    obsChainAdvanceRef.current = false
  }

  const toggleFocus = () => {
    const next = new URLSearchParams(searchParams)
    const nf = !focusMode
    setFocusMode(nf)
    if (nf) next.set('focus', '1')
    else next.delete('focus')
    setSearchParams(next)
  }

  const rosterForSession = useMemo(() => {
    const byId = new Map(skaters.map((s) => [String(s.id), s]))
    const seen = new Set()
    const orderedIds = []

    const pushId = (id) => {
      const s = String(id || '').trim()
      if (!s || seen.has(s)) return
      seen.add(s)
      orderedIds.push(s)
    }

    const resolved = bundle?.resolvedAthletes
    if (Array.isArray(resolved)) {
      for (const r of resolved) pushId(r.student_id)
    }
    const sessionIds =
      bundle?.session?.sessionSkaterIds || bundle?.session?.session_skater_ids || []
    for (const id of sessionIds) pushId(id)
    for (const g of bundle?.groups || []) {
      const gk = g.skaterIds || g.skater_ids || []
      for (const id of gk) pushId(id)
    }

    return orderedIds.map((id) => byId.get(id)).filter(Boolean)
  }, [bundle, skaters])

  const rosterWithSource = useMemo(() => {
    const src = new Map(
      (bundle?.resolvedAthletes || []).map((r) => [String(r.student_id), r.source]),
    )
    const sessionSet = new Set(
      (bundle?.session?.sessionSkaterIds || bundle?.session?.session_skater_ids || []).map(String),
    )
    return rosterForSession.map((r) => {
      const id = String(r.id)
      let source = src.get(id)
      if (!source && sessionSet.has(id)) source = 'manual_session_override'
      return { ...r, rosterSource: source || null }
    })
  }, [rosterForSession, bundle?.resolvedAthletes, bundle?.session])

  const rosterFiltered = useMemo(() => {
    const q = rosterFilter.trim().toLowerCase()
    if (!q) return rosterWithSource
    return rosterWithSource.filter((r) => (r.full_name || '').toLowerCase().includes(q))
  }, [rosterWithSource, rosterFilter])

  const inlineAthleteFocus = useMemo(() => {
    if (!lapStudentId || !bundle?.session) return null
    const map = bundle.session.sessionAthleteFocusJson
    const cell = map && typeof map === 'object' ? map[lapStudentId] : null
    const txt =
      cell && typeof cell === 'object' && cell.text != null ? String(cell.text).trim() : ''
    return { text: txt }
  }, [lapStudentId, bundle?.session])

  const bundleFreshnessLabel = useMemo(() => {
    if (!bundleFetchedAt) return null
    return formatBundleFreshness(Math.max(0, Date.now() - bundleFetchedAt))
  }, [bundleFetchedAt, bundleAgeTick])

  const hasObsScores = useMemo(
    () => Object.values(obsScores).some((v) => Number(v) >= 1 && Number(v) <= 5),
    [obsScores],
  )

  const focusLapInput = useCallback(() => {
    requestAnimationFrame(() => {
      const el = lapSecondsRef.current
      if (el && typeof el.focus === 'function') {
        el.focus()
        if (typeof el.select === 'function') el.select()
      }
    })
  }, [])

  const captureStudentName = useMemo(() => {
    if (!captureDrawerStudentId) return ''
    return skaters.find((s) => String(s.id) === String(captureDrawerStudentId))?.full_name || ''
  }, [captureDrawerStudentId, skaters])

  const openCaptureDrawer = useCallback(
    (studentId) => {
      setCaptureDrawerStudentId(studentId)
      setAthleteFocusSaveMsg('')
      clearPendingObsAdvance()
      setLapStudentId(studentId)
      focusLapInput()
    },
    [clearPendingObsAdvance, focusLapInput],
  )

  const closeCaptureDrawer = useCallback(() => {
    setCaptureDrawerStudentId(null)
    setAthleteFocusSaveMsg('')
  }, [])

  const saveAthleteFocus = useCallback(async () => {
    if (!selectedSessionId || !captureDrawerStudentId) return
    setAthleteFocusSaving(true)
    setAthleteFocusSaveMsg('')
    try {
      await skatingOpsApi.patchSession(selectedSessionId, {
        sessionAthleteFocusJson: {
          [captureDrawerStudentId]: {
            text: athleteFocusDraft.trim(),
            updated_at: new Date().toISOString(),
          },
        },
      })
      await loadBundle(selectedSessionId)
      setAthleteFocusSaveMsg(SESSION_OPS_COPY.focusSaved)
    } catch (e) {
      setAthleteFocusSaveMsg(e?.message || 'Save failed')
    } finally {
      setAthleteFocusSaving(false)
    }
  }, [selectedSessionId, captureDrawerStudentId, athleteFocusDraft, loadBundle])

  const ensureDefaultRace = async () => {
    if (!selectedSessionId || !bundle) return
    const resolvedIds = Array.isArray(bundle.resolvedAthletes)
      ? bundle.resolvedAthletes.map((r) => r.student_id)
      : []
    const ids =
      resolvedIds.length > 0
        ? resolvedIds
        : bundle.session?.sessionSkaterIds || bundle.session?.session_skater_ids || []
    await skatingOpsApi.mergeGroup(selectedSessionId, 'main', {
      name: 'Main',
      skaterIds: ids,
    })
    await skatingOpsApi.addRace(selectedSessionId, 'main', {})
    await loadBundle(selectedSessionId)
    await loadSnapshot()
  }

  const addTimingLane = async () => {
    if (!selectedSessionId) return
    setLapError('')
    try {
      await skatingOpsApi.addRace(selectedSessionId, 'main', {})
      await loadBundle(selectedSessionId)
      await loadSnapshot()
    } catch (err) {
      setLapError(err?.message || 'Could not add timing lane.')
    }
  }

  useEffect(() => {
    const races = bundle?.races
    if (!Array.isArray(races) || races.length !== 1) return
    setLapRaceId(String(races[0].id))
  }, [bundle?.races])

  useEffect(() => {
    if (!selectedSessionId || !bundle) return
    if (Array.isArray(bundle.races) && bundle.races.length > 0) return
    if (defaultRaceEnsureAttemptedRef.current.has(selectedSessionId)) return
    void (async () => {
      defaultRaceEnsureAttemptedRef.current.add(selectedSessionId)
      try {
        await ensureDefaultRace()
      } catch {
        defaultRaceEnsureAttemptedRef.current.delete(selectedSessionId)
      }
    })()
  }, [selectedSessionId, bundle])

  const submitLap = async (e) => {
    e?.preventDefault?.()
    if (!selectedSessionId || uiPaused || lapSubmitting) return
    const sec = Number(lapSeconds)
    if (!lapStudentId || Number.isNaN(sec) || sec <= 0) return

    const recent = bundle?.recentLaps || []
    const last = recent[0]
    const similar =
      last &&
      String(last.studentId ?? last.student_id) === String(lapStudentId) &&
      (last.lapMs != null || last.lap_ms != null) &&
      Math.abs(Number(last.lapMs ?? last.lap_ms) / 1000 - sec) < 0.05

    if (similar && !forceDuplicateRef.current) {
      setDuplicateWarn(
        'Very similar to the last lap for this skater — submit again to confirm, or adjust time.',
      )
      setLapError('')
      return
    }
    forceDuplicateRef.current = false
    setDuplicateWarn('')
    setLapSubmitting(true)
    setLapError('')
    const sk = rosterForSession.find((r) => String(r.id) === String(lapStudentId))
    setPendingLapPreview({
      studentName: sk?.full_name || 'Skater',
      lapMs: Math.round(sec * 1000),
      raceLabel: raceLabelForId(lapRaceId, bundle?.races),
    })
    try {
      const out = await skatingOpsApi.recordLap({
        skaterId: lapStudentId,
        lapTime: sec,
        trainingSessionId: selectedSessionId,
        raceUuid: lapRaceId || undefined,
        skillId: activeEffortSkillId || undefined,
      })
      setLastProgression(out?.progression ?? null)
      if (activeEffortSkillId) {
        try {
          const hints = await skatingChecklistApi.getEffortLapHints(lapStudentId, {
            skillId: activeEffortSkillId,
          })
          setLastEffortPhrase(operationalEffortPhrase(Math.round(sec * 1000), hints))
        } catch {
          setLastEffortPhrase(null)
        }
      } else {
        setLastEffortPhrase(null)
      }
      const lid = out?.lap?.id
      if (lid) {
        setUndoOffer({
          lapId: String(lid),
          until: Date.now() + UNDO_WINDOW_MS,
          label: `${sk?.full_name || 'Skater'} · ${sec.toFixed(2)}s`,
        })
      } else {
        setUndoOffer(null)
      }
      await loadBundle(selectedSessionId)
      await loadSnapshot()
      setLapSeconds('')
      const onFloor = Boolean(selectedSessionId && bundle?.session?.opsState === 'active')
      if (onFloor) {
        requestAnimationFrame(() => {
          athletePanelRef.current?.focus?.()
        })
      } else {
        focusLapInput()
      }
    } catch (err) {
      setLapError(
        err?.message || 'That lap didn’t stick — your time is still here. Try again in a moment.',
      )
    } finally {
      setLapSubmitting(false)
      setPendingLapPreview(null)
    }
  }

  const undoLastLap = async () => {
    if (!selectedSessionId || !undoOffer?.lapId || undoBusy) return
    setUndoBusy(true)
    setLapError('')
    try {
      await skatingOpsApi.deleteLap(undoOffer.lapId, selectedSessionId)
      setUndoOffer(null)
      setLastProgression(null)
      await loadBundle(selectedSessionId)
      await loadSnapshot()
    } catch (err) {
      setLapError(err?.message || 'Could not undo lap.')
    } finally {
      setUndoBusy(false)
    }
  }

  const undoSecondsLeft = useMemo(() => {
    if (!undoOffer) return 0
    return Math.max(0, Math.ceil((undoOffer.until - Date.now()) / 1000))
  }, [undoOffer, bundleAgeTick])

  const submitDuplicateAnyway = async () => {
    forceDuplicateRef.current = true
    await submitLap()
  }

  const endSession = async () => {
    if (!selectedSessionId) return
    clearPendingObsAdvance()
    advancePauseRhythmRef.current = 0
    setObsReturnSkater(null)
    await skatingOpsApi.patchSession(selectedSessionId, { endedAt: new Date().toISOString() })
    await loadBundle(selectedSessionId)
    await loadSnapshot()
  }

  const startSession = async () => {
    if (!selectedSessionId) return
    await skatingOpsApi.patchSession(selectedSessionId, { startedAt: new Date().toISOString() })
    await loadBundle(selectedSessionId)
    await loadSnapshot()
  }

  const sessions = snapshot?.sessions || []
  const selSession = sessions.find((s) => String(s.id) === String(selectedSessionId))
  const opsState = selSession?.opsState || bundle?.session?.opsState
  const coachLive = opsState === 'active' && Boolean(selectedSessionId)

  const lifecycle = useMemo(
    () => deriveSessionLifecycle({ opsState, uiPaused }),
    [opsState, uiPaused],
  )

  const nameByStudentId = useMemo(() => {
    const m = new Map()
    for (const s of skaters) m.set(String(s.id), s.full_name || String(s.id))
    return m
  }, [skaters])

  const todaySummary = useMemo(
    () => computeSessionSummary(bundle, rosterForSession.length, nameByStudentId),
    [bundle, rosterForSession.length, nameByStudentId],
  )

  const todaySummaryParts = useMemo(() => {
    const parts = []
    if (todaySummary.athleteCount) parts.push(`${todaySummary.athleteCount} athletes`)
    if (sessionObservationCount > 0)
      parts.push(
        `${sessionObservationCount} observation${sessionObservationCount === 1 ? '' : 's'}`,
      )
    if (todaySummary.lapCount != null && todaySummary.lapCount > 0)
      parts.push(`${todaySummary.lapCount} lap${todaySummary.lapCount === 1 ? '' : 's'}`)
    return parts
  }, [todaySummary, sessionObservationCount])

  const elapsedLabel = useMemo(() => {
    if (!selectedSessionId || !bundle) return null
    if (lifecycle.key !== 'active' && lifecycle.key !== 'paused') return null
    const started =
      selSession?.startedAt ??
      selSession?.started_at ??
      bundle.session?.startedAt ??
      bundle.session?.started_at
    const ended =
      selSession?.endedAt ??
      selSession?.ended_at ??
      bundle.session?.endedAt ??
      bundle.session?.ended_at
    if (!started) return null
    return formatElapsedLiveLabel(started, { endedAtIso: ended })
  }, [selectedSessionId, bundle, selSession, lifecycle.key, bundleAgeTick])

  const guidanceLine = useMemo(() => {
    if (!selectedSessionId || !bundle) return ''
    if (rosterForSession.length === 0) return SESSION_OPS_COPY.addAthletesToRecord
    if (!lapStudentId && coachLive) return SESSION_OPS_COPY.guidancePickAthlete
    if (coachLive && lapStudentId && !hasObsScores && !obsSyncedAt)
      return SESSION_OPS_COPY.guidanceNoObsYet
    return ''
  }, [
    selectedSessionId,
    bundle,
    rosterForSession.length,
    lapStudentId,
    coachLive,
    hasObsScores,
    obsSyncedAt,
  ])

  const bundlePeripheralFresh = useMemo(() => {
    if (!coachLive || bundleFetchedAt == null || bundleLoading) return false
    return Date.now() - bundleFetchedAt < 12_000
  }, [coachLive, bundleFetchedAt, bundleLoading, bundleAgeTick])

  useEffect(() => {
    if (coachLive && selectedSessionId) setSessionsPanelOpen(false)
    else setSessionsPanelOpen(true)
  }, [coachLive, selectedSessionId])

  useEffect(() => {
    if (coachLive) setTimingPanelOpen(false)
    else setTimingPanelOpen(true)
  }, [coachLive, selectedSessionId])

  useEffect(() => {
    setSessionObservationCount(0)
    setObservedStudentIds(new Set())
  }, [selectedSessionId])

  /** Pre-fill “same glance” scores when athlete or session changes; suppress auto-save until coach taps. */
  useEffect(() => {
    if (!selectedSessionId) {
      setObsScores({})
      obsAutoSaveSuppressedRef.current = true
      return
    }
    if (!lapStudentId) return
    const tmpl = readObsTemplate(selectedSessionId)
    if (obsChainAdvanceRef.current) {
      obsChainAdvanceRef.current = false
      obsAutoSaveSuppressedRef.current = false
    } else {
      obsAutoSaveSuppressedRef.current = true
    }
    setObsScores(tmpl && typeof tmpl === 'object' ? { ...tmpl } : {})
    setObsError('')
  }, [selectedSessionId, lapStudentId])

  const retryAfterLapFailure = async () => {
    setLapError('')
    if (selectedSessionId) await loadBundle(selectedSessionId)
  }

  const applyObsTap = useCallback((key, n) => {
    obsAutoSaveSuppressedRef.current = false
    setObsScores((prev) => ({ ...prev, [key]: n }))
  }, [])

  const executeObsAdvance = useCallback(
    (fromSid, fromName, toSid) => {
      setObsAdvancePending(null)
      obsChainAdvanceRef.current = true
      setObsReturnSkater({
        id: String(fromSid),
        name: fromName || 'Skater',
        until: Date.now() + OBS_RETURN_WINDOW_MS,
      })
      setLapStudentId(String(toSid))
      if (!coachLive) focusLapInput()
    },
    [focusLapInput, coachLive],
  )

  const submitObservation = useCallback(
    async ({ manual = false } = {}) => {
      if (!selectedSessionId || !lapStudentId || uiPaused || opsState === 'ended') return
      const scores = scoresPayload(obsScores)
      if (Object.keys(scores).length === 0) return
      const sidKey = String(lapStudentId)
      const dedupeSig = `${JSON.stringify(scores)}|${obsNotes.trim()}`
      if (obsLastSentByStudentRef.current[sidKey] === dedupeSig) return
      if (obsSubmitLockRef.current) return
      clearPendingObsAdvance()
      obsSubmitLockRef.current = true
      setObsSaving(true)
      setObsError('')
      try {
        const sk = rosterForSession.find((r) => String(r.id) === sidKey)
        await skatingOpsApi.postRapidObservation(selectedSessionId, {
          studentId: lapStudentId,
          scores,
          raceUuid: lapRaceId || undefined,
          notes: obsNotes.trim() || undefined,
        })
        obsLastSentByStudentRef.current[sidKey] = dedupeSig
        writeObsTemplate(selectedSessionId, scores)
        setObsSyncedAt(Date.now())
        setSessionObservationCount((c) => c + 1)
        setObservedStudentIds((prev) => new Set(prev).add(sidKey))
        setLastObsLabel(`${sk?.full_name || 'Skater'} · ${formatClockShort(new Date())}`)
        setObsPulse(true)
        window.setTimeout(() => setObsPulse(false), 700)
        setObsFlashKeys(new Set(Object.keys(scores)))
        window.setTimeout(() => setObsFlashKeys(new Set()), 450)
        obsAutoSaveSuppressedRef.current = true
        setObsScores({ ...scores })
        await loadBundle(selectedSessionId)
        if (rosterForSession.length >= 2) {
          const i = rosterForSession.findIndex((r) => String(r.id) === sidKey)
          const next = rosterForSession[(i >= 0 ? i + 1 : 0) % rosterForSession.length]
          const fromName = sk?.full_name || 'Skater'
          const targetId = String(next.id)
          const targetName = next.full_name || 'Skater'
          const pauseMs = computeAdvancePauseMs(advancePauseRhythmRef.current)
          advancePauseRhythmRef.current += 1
          const startAt = Date.now()
          const until = startAt + pauseMs
          setObsAdvancePending({
            fromId: sidKey,
            fromName,
            targetId,
            targetName,
            startAt,
            durationMs: pauseMs,
            until,
          })
          advanceTimerRef.current = window.setTimeout(() => {
            advanceTimerRef.current = null
            executeObsAdvance(sidKey, fromName, targetId)
          }, pauseMs)
        } else {
          if (!coachLive) focusLapInput()
        }
      } catch (e) {
        setObsError(
          e?.message ||
            (manual
              ? 'That didn’t go through — nothing lost. Try again when the signal feels steady.'
              : 'Still on your screen. We’ll sync when you’re ready — tap retry anytime.'),
        )
      } finally {
        obsSubmitLockRef.current = false
        setObsSaving(false)
      }
    },
    [
      selectedSessionId,
      lapStudentId,
      lapRaceId,
      uiPaused,
      opsState,
      obsScores,
      obsNotes,
      rosterForSession,
      loadBundle,
      focusLapInput,
      clearPendingObsAdvance,
      executeObsAdvance,
      coachLive,
    ],
  )

  useEffect(() => {
    if (!obsAdvancePending) return
    const id = window.setInterval(() => setAdvanceTick((t) => t + 1), 200)
    return () => window.clearInterval(id)
  }, [obsAdvancePending])

  useEffect(() => {
    if (!obsReturnSkater) return
    const id = window.setInterval(() => {
      setObsReturnSkater((r) => (r && Date.now() >= r.until ? null : r))
    }, 500)
    return () => window.clearInterval(id)
  }, [obsReturnSkater])

  useEffect(() => {
    if (obsAutoSaveSuppressedRef.current) return
    if (!selectedSessionId || !lapStudentId || uiPaused || opsState === 'ended') return
    const scores = scoresPayload(obsScores)
    if (Object.keys(scores).length === 0) return
    const full = isFullObservationSet(obsScores)
    const ms = full ? OBS_DEBOUNCE_FULL_MS : OBS_DEBOUNCE_PARTIAL_MS
    const id = window.setTimeout(() => {
      void submitObservation({ manual: false })
    }, ms)
    return () => window.clearTimeout(id)
  }, [obsScores, obsNotes, lapStudentId, selectedSessionId, uiPaused, opsState, submitObservation])

  const onFormKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submitLap(e)
      return
    }
    if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      const races = bundle?.races || []
      if (races.length < 2 || lapSubmitting || uiPaused || opsState === 'ended') return
      e.preventDefault()
      const idx = races.findIndex((r) => String(r.id) === String(lapRaceId))
      const cur = idx >= 0 ? idx : 0
      const next =
        e.key === 'ArrowDown' ? (cur + 1) % races.length : (cur - 1 + races.length) % races.length
      setLapRaceId(races[next].id)
      focusLapInput()
    }
  }

  flowSnapRef.current = {
    coachLive,
    sessionId: selectedSessionId,
    studentName: lapStudentId
      ? rosterForSession.find((r) => String(r.id) === String(lapStudentId))?.full_name || ''
      : '',
    place: bundle?.session?.placeName || selSession?.placeName || '',
  }

  const activeSkaterShort = lapStudentId
    ? rosterForSession.find((r) => String(r.id) === String(lapStudentId))?.full_name || ''
    : ''

  const goObsAdvanceNow = () => {
    const p = obsAdvancePending
    if (!p) return
    if (advanceTimerRef.current != null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setObsAdvancePending(null)
    executeObsAdvance(p.fromId, p.fromName, p.targetId)
  }

  const slimSessionBar = coachLive && selectedSessionId && !sessionsPanelOpen

  const retryObservation = () => {
    const k = String(lapStudentId)
    if (k) delete obsLastSentByStudentRef.current[k]
    obsAutoSaveSuppressedRef.current = false
    void submitObservation({ manual: true })
  }

  const openStartLiveModal = () => {
    try {
      const lp = sessionStorage.getItem(SK_LAST_PLACE) || ''
      setDefaultPlaceForModal(lp)
      const lr = sessionStorage.getItem(SK_LAST_RINK) || 'Rink'
      setDefaultRinkForModal(lr)
    } catch {
      /* ignore */
    }
    setShowStartLiveModal(true)
  }

  const onSessionStartedFromModal = (sid) => {
    void loadSnapshot()
    if (sid) selectSession(sid)
  }

  const saveAddAthletes = async () => {
    if (!selectedSessionId || !bundle?.session) return
    setAddAthletesSaving(true)
    try {
      const cur = new Set(
        (bundle.session.sessionSkaterIds || bundle.session.session_skater_ids || []).map(String),
      )
      for (const id of addAthletesPick) cur.add(String(id))
      await skatingOpsApi.patchSession(selectedSessionId, { sessionSkaterIds: Array.from(cur) })
      setShowAddAthletesModal(false)
      setAddAthletesPick(new Set())
      await loadBundle(selectedSessionId)
      await loadSnapshot()
    } catch (e) {
      setLapError(e?.message || 'Could not update athletes.')
    } finally {
      setAddAthletesSaving(false)
    }
  }

  const inner = (
    <>
      <CCard className="mb-3">
        {slimSessionBar ? (
          <CCardBody className="py-2 px-3 d-flex flex-wrap align-items-center gap-2 border-bottom-0">
            <span
              className="small text-body-secondary text-truncate flex-grow-1"
              style={{ maxWidth: '85%' }}
            >
              {selSession?.placeName || bundle?.session?.placeName || 'This session'} ·{' '}
              {formatTime(selSession?.startedAt ?? selSession?.started_at)}
            </span>
            <CButton
              color="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={() => setSessionsPanelOpen(true)}
            >
              {SESSION_OPS_COPY.switchSession}
            </CButton>
          </CCardBody>
        ) : null}
        {(!slimSessionBar || sessionsPanelOpen) && (
          <>
            <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <strong>{SESSION_OPS_COPY.pageTitle}</strong>
                <span className="text-body-secondary small ms-2">
                  {SESSION_OPS_COPY.pageSubtitle}
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <CFormLabel className="mb-0 small">{SESSION_OPS_COPY.dayLabel}</CFormLabel>
                <CFormInput
                  type="date"
                  value={dateYmd}
                  onChange={(e) => setDateYmd(e.target.value)}
                  className="w-auto"
                />
                <CButton
                  color="secondary"
                  size="sm"
                  variant="outline"
                  onClick={() => loadSnapshot()}
                >
                  {SESSION_OPS_COPY.refresh}
                </CButton>
                <CButton color="primary" size="sm" onClick={openStartLiveModal}>
                  {SESSION_OPS_COPY.newSessionCta}
                </CButton>
                <CButton as={Link} size="sm" color="light" variant="outline" to="/coach/attendance">
                  {SESSION_OPS_COPY.attendanceLink}
                </CButton>
                {coachLive && selectedSessionId ? (
                  <CButton
                    color="secondary"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSessionsPanelOpen(false)}
                  >
                    {SESSION_OPS_COPY.minimizeList}
                  </CButton>
                ) : null}
              </div>
            </CCardHeader>
            <CCardBody>
              {snapError ? <CAlert color="danger">{snapError}</CAlert> : null}
              {snapLoading ? (
                <CSpinner />
              ) : (
                <CTable hover responsive small>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>When</CTableHeaderCell>
                      <CTableHeaderCell>Place</CTableHeaderCell>
                      <CTableHeaderCell>State</CTableHeaderCell>
                      <CTableHeaderCell />
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {sessions.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={4} className="text-body-secondary">
                          No training sessions on this day.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      sessions.map((s) => (
                        <CTableRow
                          key={s.id}
                          className={
                            String(s.id) === String(selectedSessionId) ? 'table-active' : ''
                          }
                          style={{ cursor: 'pointer' }}
                          onClick={() => selectSession(s.id)}
                        >
                          <CTableDataCell>
                            {s.sessionDate ?? s.session_date} ·{' '}
                            {formatTime(s.startedAt ?? s.started_at)}{' '}
                            {(s.endedAt ?? s.ended_at)
                              ? `→ ${formatTime(s.endedAt ?? s.ended_at)}`
                              : ''}
                          </CTableDataCell>
                          <CTableDataCell>{(s.placeName ?? s.place_name) || '—'}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={opsBadgeColor(s.opsState)}>{s.opsState}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-end">
                            <CButton
                              size="sm"
                              color="primary"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                selectSession(s.id)
                              }}
                            >
                              Open
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </>
        )}
      </CCard>

      {selectedSessionId ? (
        <CCard className={`mb-3${opsState === 'active' ? ' coach-session-live' : ''}`}>
          <CCardHeader className="d-flex flex-wrap justify-content-end align-items-center gap-2">
            {!coachLive ? (
              <CButton size="sm" color={focusMode ? 'danger' : 'secondary'} onClick={toggleFocus}>
                {focusMode ? 'Exit focus' : 'Focus mode'}
              </CButton>
            ) : null}
          </CCardHeader>
          <CCardBody>
            {bundleError ? <CAlert color="danger">{bundleError}</CAlert> : null}
            <SessionCommandHeader
              placeName={bundle?.session?.placeName || selSession?.placeName || ''}
              lifecycle={{ badgeColor: lifecycle.badgeColor, label: lifecycle.label }}
              elapsedLabel={elapsedLabel || undefined}
              todaySummaryParts={todaySummaryParts}
              guidanceLine={guidanceLine}
              onPauseToggle={() => setUiPaused((p) => !p)}
              pauseLabel={uiPaused ? 'Resume' : 'Pause'}
              onEnd={() => void endSession()}
              onStart={() => void startSession()}
              onSwitchSession={coachLive ? () => setSessionsPanelOpen(true) : undefined}
              canStart={opsState === 'upcoming'}
              canPause={opsState === 'active'}
              canEnd={opsState === 'active' || opsState === 'upcoming'}
            />
            {!coachLive && bundle && bundleFreshnessLabel && !bundleLoading ? (
              <div className="small text-body-secondary mb-2">
                Bundle updated {bundleFreshnessLabel}
              </div>
            ) : null}
            {reEntryWarmth ? (
              <div className="small text-body-secondary skating-reentry-hint mb-2 px-1 py-1 rounded">
                {reEntryWarmth}
              </div>
            ) : null}
            {bundleLoading ? (
              <CSpinner />
            ) : bundle ? (
              <CRow className={`g-3${coachLive ? ' coach-live-layout' : ''}`}>
                <CCol xs={12}>
                  <div className="session-anchor-strip session-anchor-strip--quiet mb-3 px-1 py-1 text-body-secondary d-flex flex-wrap align-items-center gap-2">
                    <span className="flex-grow-1" style={{ minWidth: '12rem' }}>
                      {bundle.session?.placeName || '—'}
                      {bundle.session?.rinkOrRoad ? ` · ${bundle.session.rinkOrRoad}` : ''}
                      {activeSkaterShort ? (
                        <>
                          <span className="mx-1 opacity-50">·</span>
                          <span
                            className="text-body skating-attention-anchor skating-anchor-active"
                            title="Your attention is here"
                          >
                            {activeSkaterShort}
                          </span>
                        </>
                      ) : null}
                      <span className="mx-1 opacity-50">·</span>
                      <span className="text-body-secondary" title="Active effort tag for laps">
                        {activeEffortName ? activeEffortName.slice(0, 48) : 'Effort —'}
                      </span>
                    </span>
                    {coachLive ? (
                      <span
                        className={`skating-peripheral-dot${bundlePeripheralFresh ? ' skating-peripheral-dot--live' : ''}`}
                        title={
                          bundlePeripheralFresh
                            ? 'Session data feels current'
                            : 'Updating after your last change'
                        }
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  {effortModerateBlurb ? (
                    <div className="small text-body-secondary mb-2 px-1" aria-live="polite">
                      {effortModerateBlurb}
                    </div>
                  ) : null}
                  {effortTopBand === 'low' ? (
                    <div className="small text-body-secondary mb-2 px-1">
                      Close match between efforts — confirm the tag below.
                    </div>
                  ) : null}
                  {bundle.session?.sessionFocus ||
                  (Array.isArray(bundle.session?.objectivesJson) &&
                    bundle.session.objectivesJson.length) ? (
                    <div className="small mb-3 px-2 py-2 border rounded bg-body-tertiary">
                      {bundle.session?.sessionFocus ? (
                        <div className="mb-1">
                          <span className="text-body-secondary">Session focus · </span>
                          <span>{bundle.session.sessionFocus}</span>
                        </div>
                      ) : null}
                      {Array.isArray(bundle.session?.objectivesJson) &&
                      bundle.session.objectivesJson.length ? (
                        <ul className="mb-0 mt-1 ps-3">
                          {bundle.session.objectivesJson.slice(0, 8).map((o, i) => (
                            <li key={i} className="small">
                              {typeof o === 'string' ? o : o?.text || JSON.stringify(o)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </CCol>
                <CCol lg={4}>
                  <AthletesInSessionPanel
                    coachLive={coachLive}
                    rosterFiltered={rosterFiltered}
                    lapStudentId={lapStudentId}
                    observedStudentIds={observedStudentIds}
                    onPickSkater={(id) => {
                      clearPendingObsAdvance()
                      setLapStudentId(id)
                      if (!coachLive) focusLapInput()
                    }}
                    onOpenSideCapture={openCaptureDrawer}
                    rosterFilter={rosterFilter}
                    onRosterFilterChange={setRosterFilter}
                    onAddAthletesRequest={() => {
                      setAddAthletesPick(new Set())
                      setShowAddAthletesModal(true)
                    }}
                    listRef={athletePanelRef}
                  />
                  {inlineAthleteFocus ? (
                    <div className="small mt-2 px-1 py-2 border rounded bg-body-tertiary d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <span className="text-body-secondary" style={{ minWidth: 0 }}>
                        <span className="text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>
                          {SESSION_OPS_COPY.todayFocusInline}
                        </span>
                        <br />
                        <span className="text-body">
                          {inlineAthleteFocus.text || '— Not set — tap side panel to add.'}
                        </span>
                      </span>
                      <CButton
                        type="button"
                        size="sm"
                        color="secondary"
                        variant="outline"
                        onClick={() => openCaptureDrawer(lapStudentId)}
                      >
                        {SESSION_OPS_COPY.editFocusInPanel}
                      </CButton>
                    </div>
                  ) : null}
                </CCol>
                <CCol lg={8} className={coachLive ? 'operational-sticky-stack' : undefined}>
                  <section
                    className={`skating-obs-primary-panel border rounded p-3 mb-3 bg-body-tertiary${obsPulse ? ' skating-obs-block--pulse' : ''}`}
                  >
                    <div className="mb-3">
                      <h2 className="h5 fw-semibold mb-1 text-body">
                        {SESSION_OPS_COPY.quickObservationsTitle}
                      </h2>
                      <p className="small text-body-secondary mb-0">
                        {SESSION_OPS_COPY.quickObservationsSubtitle}
                      </p>
                    </div>
                    {!lapStudentId ? (
                      coachLive ? (
                        <CAlert color="light" className="py-3 small mb-3">
                          {SESSION_OPS_COPY.selectAthletePrompt}
                        </CAlert>
                      ) : (
                        <p className="small text-body-secondary mb-3">
                          {SESSION_OPS_COPY.selectAthletePrompt}
                        </p>
                      )
                    ) : (
                      <div className="small text-body-secondary mb-3 pb-2 border-bottom border-secondary-subtle">
                        <span className="text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>
                          {SESSION_OPS_COPY.recordingFor}
                        </span>
                        <div className="fw-semibold fs-6 text-body">
                          {rosterForSession.find((r) => String(r.id) === String(lapStudentId))
                            ?.full_name || 'Athlete'}
                        </div>
                        {observedStudentIds.has(String(lapStudentId)) ? (
                          <span className="text-success small mt-1 d-inline-block">
                            {SESSION_OPS_COPY.observationSavedThisSession}
                          </span>
                        ) : null}
                      </div>
                    )}
                    <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-2">
                      <span className="small fw-medium text-body-secondary">
                        {SESSION_OPS_COPY.quickNoticeTitle}
                      </span>
                      <span className="small text-body-secondary opacity-75" aria-live="polite">
                        {obsSaving ? (
                          <span className="skating-sync-pending">Syncing…</span>
                        ) : obsSyncedAt ? (
                          <span className="skating-sync-ok">
                            Settled · {formatClockShort(obsSyncedAt)}
                          </span>
                        ) : (
                          <span>
                            {coachLive
                              ? 'Tap when something stands out — you’re in charge of who’s next.'
                              : 'Tap a number when something stands out — it saves on its own.'}
                          </span>
                        )}
                      </span>
                    </div>
                    {obsAdvancePending ? (
                      <div className="small mb-2 skating-advance-pause skating-advance-pause--peripheral py-1">
                        {(() => {
                          const dur =
                            obsAdvancePending.durationMs ??
                            Math.max(1, obsAdvancePending.until - (obsAdvancePending.startAt ?? 0))
                          const start = obsAdvancePending.startAt ?? obsAdvancePending.until - dur
                          const pct = Math.min(100, ((Date.now() - start) / dur) * 100)
                          return (
                            <div
                              className="skating-advance-pause__track mb-1"
                              aria-hidden
                              style={{ '--skating-advance-pct': `${pct}%` }}
                            />
                          )
                        })()}
                        <span className="text-body-secondary skating-advance-pause__line">
                          <span className="d-none">{advanceTick}</span>→{' '}
                          {obsAdvancePending.targetName}
                          <span className="opacity-50 ms-1">
                            ({Math.max(0, Math.ceil((obsAdvancePending.until - Date.now()) / 1000))}
                            s)
                          </span>
                        </span>
                        <div className="mt-1 d-flex flex-wrap gap-2 align-items-center skating-advance-pause__actions">
                          <CButton
                            type="button"
                            color="link"
                            size="sm"
                            className="p-0 text-body-secondary"
                            onClick={cancelAdvanceAndStay}
                          >
                            Stay with {obsAdvancePending.fromName}
                          </CButton>
                          <span className="text-body-secondary opacity-50">·</span>
                          <CButton
                            type="button"
                            color="link"
                            size="sm"
                            className="p-0"
                            onClick={goObsAdvanceNow}
                          >
                            Go now
                          </CButton>
                        </div>
                      </div>
                    ) : null}
                    {obsReturnSkater && Date.now() < obsReturnSkater.until ? (
                      <div className="small mb-2">
                        <CButton
                          type="button"
                          color="link"
                          size="sm"
                          className="p-0"
                          onClick={() => {
                            setLapStudentId(obsReturnSkater.id)
                            setObsReturnSkater(null)
                            obsChainAdvanceRef.current = false
                            obsAutoSaveSuppressedRef.current = true
                          }}
                        >
                          Return to {obsReturnSkater.name}
                        </CButton>
                      </div>
                    ) : null}
                    {lastObsLabel ? (
                      <div className="small text-body-secondary mb-2 fst-italic opacity-90">
                        Last: {lastObsLabel}
                      </div>
                    ) : null}
                    {obsError ? (
                      <div className="small text-danger mb-2 d-flex flex-wrap align-items-center gap-2">
                        <span>{obsError}</span>
                        <CButton
                          type="button"
                          size="sm"
                          color="link"
                          className="p-0"
                          onClick={retryObservation}
                        >
                          Try again
                        </CButton>
                      </div>
                    ) : null}
                    <QualitativeObservationStrip
                      obsScores={obsScores}
                      obsFlashKeys={obsFlashKeys}
                      disabled={obsSaving || uiPaused || opsState === 'ended' || !lapStudentId}
                      onTap={applyObsTap}
                      comfortable={coachLive}
                    />
                    <details
                      className="small mt-2"
                      open={obsNotesOpen}
                      onToggle={(e) => setObsNotesOpen(e.target.open)}
                    >
                      <summary
                        className="text-body-secondary user-select-none"
                        style={{ cursor: 'pointer' }}
                      >
                        Add a short note (optional)
                      </summary>
                      <CFormInput
                        className="mt-2 mb-1"
                        placeholder="Only if it helps you remember"
                        value={obsNotes}
                        disabled={obsSaving || uiPaused || opsState === 'ended'}
                        onChange={(e) => {
                          obsAutoSaveSuppressedRef.current = false
                          setObsNotes(e.target.value)
                        }}
                        onFocus={() => {
                          obsAutoSaveSuppressedRef.current = false
                        }}
                      />
                    </details>
                    {!coachLive && hasObsScores ? (
                      <div className="mt-2">
                        <CButton
                          type="button"
                          color="link"
                          size="sm"
                          className="p-0"
                          disabled={obsSaving || uiPaused || opsState === 'ended' || !lapStudentId}
                          onClick={() => void submitObservation({ manual: true })}
                        >
                          Sync now
                        </CButton>
                      </div>
                    ) : null}
                  </section>

                  <details
                    className={`skating-timing-advanced border rounded mb-3${coachLive ? ' coach-recede coach-recede-latent' : ''}`}
                    open={timingPanelOpen}
                    onToggle={(e) => setTimingPanelOpen(e.target.open)}
                  >
                    <summary className="px-3 py-3 skating-timing-summary user-select-none">
                      <span className="fw-semibold text-body d-block">
                        {SESSION_OPS_COPY.timingSectionTitle}
                      </span>
                      <span className="small text-body-secondary d-block mt-1">
                        {SESSION_OPS_COPY.timingSectionHint}
                      </span>
                    </summary>
                    <div className="px-3 pb-3 pt-2 border-top">
                      {(bundle.races || []).length > 1 ? (
                        <div className={`mb-3${coachLive ? ' coach-recede coach-recede-latent' : ''}`}>
                          <div className="small text-body-secondary mb-1">
                            {SESSION_OPS_COPY.timingLaneColumn}
                            {coachLive ? (
                              <span className="opacity-50"> (multiple lanes)</span>
                            ) : null}
                          </div>
                          <CButtonGroup vertical role="group" className="w-100">
                            {(bundle.races || []).map((rc) => (
                              <CButton
                                key={rc.id}
                                color={String(lapRaceId) === String(rc.id) ? 'primary' : 'light'}
                                size="sm"
                                className="text-start"
                                disabled={lapSubmitting}
                                onClick={() => {
                                  setLapRaceId(rc.id)
                                  focusLapInput()
                                }}
                              >
                                {(rc.label || rc.groupName || 'Lane').slice(0, 48)}
                              </CButton>
                            ))}
                          </CButtonGroup>
                        </div>
                      ) : (bundle.races || []).length === 1 && coachLive ? (
                        <div className="mb-3">
                          <CButton
                            size="sm"
                            color="light"
                            variant="outline"
                            type="button"
                            onClick={() => void addTimingLane()}
                          >
                            {SESSION_OPS_COPY.addTimingLane}
                          </CButton>
                        </div>
                      ) : null}
                      <form
                        aria-busy={lapSubmitting ? 'true' : 'false'}
                        onSubmit={(e) => {
                          e.preventDefault()
                          submitLap(e)
                        }}
                        onKeyDown={onFormKeyDown}
                      >
                        <div className="fw-semibold small text-body-secondary mb-2">
                          {SESSION_OPS_COPY.lapEntryTitle}
                        </div>
                        {lapSubmitting ? (
                          <div className="small text-warning mb-1 d-flex align-items-center gap-2">
                            <CSpinner size="sm" />
                            Saving lap…
                          </div>
                        ) : null}
                        {!coachLive ? (
                          <div className="small text-body-secondary mb-2">
                            Pick an athlete on the left → seconds → Enter. ⌘/Ctrl+Enter saves. Alt+↑↓
                            switches timing lane when multiple exist.
                          </div>
                        ) : null}
                        <div className="small text-body-secondary mb-3">
                          {lapStudentId ? (
                            <>
                              <span className="text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>
                                {SESSION_OPS_COPY.recordingFor}
                              </span>{' '}
                              <strong>
                                {rosterForSession.find((r) => String(r.id) === String(lapStudentId))
                                  ?.full_name || 'Athlete'}
                              </strong>
                            </>
                          ) : (
                            SESSION_OPS_COPY.selectAthletePrompt
                          )}
                        </div>
                        {(bundle.races || []).length > 1 ? (
                          <CFormSelect
                            className={`mb-2${coachLive ? ' coach-recede coach-recede-latent' : ''}`}
                            aria-label="Timing lane for this lap"
                            value={lapRaceId}
                            disabled={lapSubmitting || uiPaused || opsState === 'ended'}
                            onChange={(e) => {
                              setLapRaceId(e.target.value)
                              focusLapInput()
                            }}
                          >
                            <option value="">Lane (optional)</option>
                            {(bundle.races || []).map((rc) => (
                              <option key={rc.id} value={rc.id}>
                                {(rc.label || rc.groupName || 'Lane').slice(0, 40)} ·{' '}
                                {rc.startedAtMs ? new Date(rc.startedAtMs).toLocaleTimeString() : ''}
                              </option>
                            ))}
                          </CFormSelect>
                        ) : null}
                        <CFormSelect
                          className={`mb-2${coachLive ? ' coach-recede coach-recede-latent' : ''}`}
                          aria-label="Effort tag for this lap"
                          title="Benchmark / effort — same control every session"
                          value={activeEffortSkillId}
                          disabled={lapSubmitting || uiPaused || opsState === 'ended'}
                          onChange={(e) => {
                            manualEffortOverrideRef.current = true
                            const id = e.target.value
                            const sk = id
                              ? skillsCatalog.find((r) => String(r.id) === String(id))
                              : null
                            setActiveEffortSkillId(id)
                            setActiveEffortName(sk?.name || '')
                            writeActiveEffort(selectedSessionId, lapStudentId, id, sk?.name || '')
                            focusLapInput()
                          }}
                        >
                          <option value="">Effort tag (optional)</option>
                          {skillsCatalog.map((s) => (
                            <option key={s.id} value={s.id}>
                              {(s.name || 'Effort').slice(0, 56)}
                            </option>
                          ))}
                        </CFormSelect>
                        <CFormInput
                          ref={lapSecondsRef}
                          name="lapSeconds"
                          className={`mb-2${coachLive ? ' coach-recede coach-recede-latent' : ''}`}
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="Seconds"
                          value={lapSeconds}
                          disabled={lapSubmitting || uiPaused || opsState === 'ended'}
                          onChange={(e) => setLapSeconds(e.target.value)}
                          autoComplete="off"
                        />
                        {duplicateWarn ? (
                          <CAlert color="warning" className="py-2">
                            {duplicateWarn}{' '}
                            <CButton
                              type="button"
                              size="sm"
                              color="warning"
                              onClick={submitDuplicateAnyway}
                            >
                              Submit anyway
                            </CButton>
                          </CAlert>
                        ) : null}
                        {lapError ? (
                          <CAlert
                            color="danger"
                            className="py-2 d-flex flex-wrap align-items-center gap-2 justify-content-between"
                          >
                            <span>{lapError}</span>
                            <CButton
                              type="button"
                              size="sm"
                              color="danger"
                              variant="outline"
                              onClick={retryAfterLapFailure}
                            >
                              Retry
                            </CButton>
                          </CAlert>
                        ) : null}
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={lapSubmitting || uiPaused || opsState === 'ended'}
                          >
                            {lapSubmitting ? <CSpinner size="sm" /> : SESSION_OPS_COPY.recordLapCta}
                          </CButton>
                          {!coachLive ? (
                            <CButton
                              type="button"
                              color="light"
                              disabled={lapSubmitting}
                              onClick={() => {
                                setLapSeconds('')
                                setDuplicateWarn('')
                                setLapError('')
                              }}
                            >
                              {SESSION_OPS_COPY.clearDraft}
                            </CButton>
                          ) : null}
                        </div>
                        {undoOffer && undoSecondsLeft > 0 ? (
                          <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                            <CButton
                              type="button"
                              size="sm"
                              color="warning"
                              variant="outline"
                              disabled={undoBusy || lapSubmitting}
                              onClick={undoLastLap}
                            >
                              {undoBusy ? (
                                <CSpinner size="sm" />
                              ) : (
                                `Undo last lap (${undoSecondsLeft}s)`
                              )}
                            </CButton>
                            <span className="small text-body-secondary">{undoOffer.label}</span>
                          </div>
                        ) : null}
                        {lastEffortPhrase ? (
                          <p className="small text-body-secondary mt-2 mb-0" aria-live="polite">
                            {lastEffortPhrase}
                          </p>
                        ) : null}
                      </form>
                    </div>
                  </details>
                  {lastProgression ? (
                    <CAlert
                      color="info"
                      className={`mt-3 py-2 small${coachLive ? ' border-0 bg-transparent px-0' : ''}`}
                    >
                      {lastProgression.applied ? (
                        <>
                          <span className="fw-medium">Logged — </span>
                          {lastProgression.skillName || lastProgression.skillId} →{' '}
                          {lastProgression.status}
                          {coachLive ? (
                            <span className="text-body-secondary"> · looks right for now.</span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          No auto skill bump ({lastProgression.reason || 'n/a'}) — that happens; you
                          can adjust later if needed.
                        </>
                      )}
                      {!coachLive ? (
                        <span className="d-block mt-1 text-body-secondary">
                          Fine-tune from checklist when you&apos;re off the ice.
                        </span>
                      ) : null}
                    </CAlert>
                  ) : null}
                </CCol>
              </CRow>
            ) : null}

            {bundle?.recentLaps?.length ? (
              <div className="mt-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                  <span className="fw-semibold">{SESSION_OPS_COPY.recentLapsTitle}</span>
                  {coachLive && bundle.recentLaps.length > 6 ? (
                    <CButton
                      color="link"
                      size="sm"
                      className="p-0"
                      onClick={() => setRecentLapsExpanded((v) => !v)}
                    >
                      {recentLapsExpanded ? 'Show fewer' : `Show all (${bundle.recentLapCount})`}
                    </CButton>
                  ) : (
                    <span className="small text-body-secondary">{bundle.recentLapCount} shown</span>
                  )}
                </div>
                <div className="table-responsive border rounded">
                  <CTable small responsive hover striped className="mb-0">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell className="text-nowrap">Time</CTableHeaderCell>
                        <CTableHeaderCell>Skater</CTableHeaderCell>
                        <CTableHeaderCell>{SESSION_OPS_COPY.timingLaneColumn}</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Lap (s)</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {pendingLapPreview && lapSubmitting ? (
                        <CTableRow color="warning">
                          <CTableDataCell className="text-nowrap small fst-italic">
                            <CSpinner size="sm" className="me-1 align-middle" />
                            Pending…
                          </CTableDataCell>
                          <CTableDataCell>{pendingLapPreview.studentName}</CTableDataCell>
                          <CTableDataCell className="small">
                            {pendingLapPreview.raceLabel}
                          </CTableDataCell>
                          <CTableDataCell className="text-end font-monospace">
                            {(pendingLapPreview.lapMs / 1000).toFixed(2)}
                          </CTableDataCell>
                        </CTableRow>
                      ) : null}
                      {(coachLive && !recentLapsExpanded
                        ? bundle.recentLaps.slice(0, 6)
                        : bundle.recentLaps
                      ).map((row) => (
                        <CTableRow key={row.id}>
                          <CTableDataCell className="text-nowrap">
                            {formatTime(row.recordedAt ?? row.recorded_at)}
                          </CTableDataCell>
                          <CTableDataCell>
                            {row.studentName ?? row.student_full_name ?? row.student_id}
                          </CTableDataCell>
                          <CTableDataCell className="small">
                            {raceLabelForLap(row, bundle.races)}
                          </CTableDataCell>
                          <CTableDataCell className="text-end font-monospace">
                            {lapSecondsFromRow(row)}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              </div>
            ) : null}
          </CCardBody>
        </CCard>
      ) : (
        <CAlert color="light" className="border">
          Select a training session above or create one.
        </CAlert>
      )}

      <AthleteCaptureDrawer
        visible={Boolean(captureDrawerStudentId)}
        studentName={captureStudentName}
        focusText={athleteFocusDraft}
        onChangeFocus={setAthleteFocusDraft}
        onSaveFocus={() => void saveAthleteFocus()}
        saving={athleteFocusSaving}
        saveMessage={athleteFocusSaveMsg}
        onClose={closeCaptureDrawer}
      />

      <StartSessionModal
        visible={showStartLiveModal}
        onClose={() => setShowStartLiveModal(false)}
        dateYmd={dateYmd}
        places={places}
        skaters={skaters}
        defaultPlaceId={defaultPlaceForModal}
        defaultRink={defaultRinkForModal}
        currentUserId={currentUserId}
        onSessionStarted={onSessionStartedFromModal}
      />

      <CModal
        visible={showAddAthletesModal}
        onClose={() => setShowAddAthletesModal(false)}
        alignment="center"
      >
        <CModalHeader>Add athletes to session</CModalHeader>
        <CModalBody>
          <p className="small text-body-secondary">
            Select athletes to add to this session roster.
          </p>
          <div className="d-flex flex-column gap-1" style={{ maxHeight: 280, overflow: 'auto' }}>
            {skaters.map((s) => (
              <CFormCheck
                key={s.id}
                id={`add-sk-${s.id}`}
                label={s.full_name}
                checked={addAthletesPick.has(String(s.id))}
                onChange={(e) => {
                  const next = new Set(addAthletesPick)
                  if (e.target.checked) next.add(String(s.id))
                  else next.delete(String(s.id))
                  setAddAthletesPick(next)
                }}
              />
            ))}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setShowAddAthletesModal(false)}
          >
            {SESSION_OPS_COPY.cancel}
          </CButton>
          <CButton
            color="primary"
            disabled={addAthletesSaving}
            onClick={() => void saveAddAthletes()}
          >
            {addAthletesSaving ? <CSpinner size="sm" /> : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )

  if (focusMode && selectedSessionId) {
    return (
      <div
        className="skating-focus-shell position-fixed top-0 start-0 w-100 h-100 bg-body"
        data-testid="skating-ops-focus-shell"
        style={{ zIndex: 1040, overflow: 'auto' }}
      >
        <div className="p-3 border-bottom bg-body d-flex justify-content-between align-items-center">
          <strong>Focus mode — lap entry</strong>
          <CButton color="danger" size="sm" variant="outline" onClick={toggleFocus}>
            Exit
          </CButton>
        </div>
        <div className="p-3">{inner}</div>
      </div>
    )
  }

  return (
    <div className="skating-ops-page px-1" data-testid="skating-ops-page">
      {inner}
    </div>
  )
}

export default SkatingOpsPage
