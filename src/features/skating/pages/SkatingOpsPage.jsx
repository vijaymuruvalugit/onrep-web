import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormCheck,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
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
import CoachLiveSessionView from '../components/CoachLiveSessionView'
import CoachLiveRecentLaps from '../components/CoachLiveRecentLaps'
import { useLiveSessionRefresh } from '../hooks/useLiveSessionRefresh'
import { useLiveSessionShell } from '../hooks/useLiveSessionShell'
import { useLiveSessionLifecycle } from '../hooks/useLiveSessionLifecycle'
import { useSyncDomainPrimitives } from '../hooks/syncDomainSelectors'
import { athleteFocusFromMeta, buildRosterWithSource } from '../hooks/buildSessionRoster'
import SkatingOpsSessionWorkspace from './SkatingOpsSessionWorkspace'
import { livePhaseLabel } from '../constants/coachLiveLabels'
import CoachLiveTimingSection from '../components/CoachLiveTimingSection'
import RaceTimingWorkspace, { isRacePhaseBlock } from '../components/RaceTimingWorkspace'
import { useCoachingDraftQueue } from '../hooks/useCoachingDraftQueue'
import StartSessionModal from '../components/StartSessionModal'
import { deriveSessionLifecycle, formatElapsedLiveLabel } from '../utils/sessionLifecycle'
import { bumpSkatingOpsMetric } from '../utils/skatingOpsInternalMetrics'
import { computeSessionSummary } from '../utils/sessionTodaySummary'
import operationalSessionsApi from '../../../domain/operationalSessions/operationalSessionsApi'
import { operationalStateToLegacyOpsState } from '../../../domain/operationalSessions/helpers/stateLabels'
import { isOperationalSessionCancelled } from '../../../domain/operationalSessions/helpers/sessionActions'
import { devLogEmptyDayBoard } from '../../../domain/operationalSessions/helpers/devDayBoardLog'
import { sortDayBoardSessions } from '../../../domain/operationalSessions/helpers/sortDayBoardSessions'
import SkatingOpsDayBoard from '../../../domain/operationalSessions/components/SkatingOpsDayBoard'
import SkatingOpsWorkspaceChrome from '../components/SkatingOpsWorkspaceChrome'
import ActiveSessionWorkspaceShell from '../components/ActiveSessionWorkspaceShell'
import SessionBlockAddModal from '../components/SessionBlockAddModal'
import { sessionBlocksApi } from '../../../domain/sessionBlocks/sessionBlocksApi'
import { phaseAthletesApi } from '../../../domain/phaseAthletes/phaseAthletesApi'
import { selectActiveActivity } from '../../workspace/slices/workspaceSlice'
import '../skating-ops.css'

function activeActivityHasSkatingCapability(activity) {
  if (!activity) return false
  const caps = activity.capabilities
  if (caps && typeof caps === 'object' && caps.skatingRoutes) return true
  return String(activity.type || '').toLowerCase() === 'skating'
}

const SK_LAST_PLACE = 'onrep.skating.lastPlaceId'
const SK_LAST_RINK = 'onrep.skating.lastRinkOrRoad'
const SK_LAP_DRAFT = 'onrep.skating.lapDraft'
const SK_ACTIVE_SESSION = 'onrep.skating.activeSessionId'
/** Operational continuity memory — last glance pattern for this session (not “assessment persistence”). */
const SK_OBS_TEMPLATE = 'onrep.skating.obsScoreTemplate'
/** Session-scoped active benchmark (`skating_skills`) for tagged laps + PB hints. */
const SK_ACTIVE_EFFORT = 'onrep.skating.activeEffort'
/**
 * Phase 2: which coaching phase is active — client-local until session-level persistence ships.
 * Conceptually belongs to the live session (assistants, TV, mobile will share later).
 */
const SK_ACTIVE_BLOCK = 'onrep.skating.activeBlockBySession'

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

function readActiveBlockId(sessionId) {
  if (!sessionId) return ''
  try {
    const raw = sessionStorage.getItem(SK_ACTIVE_BLOCK)
    if (!raw) return ''
    const o = JSON.parse(raw)
    if (o?.sessionId !== sessionId) return ''
    return o.blockId ? String(o.blockId) : ''
  } catch {
    return ''
  }
}

function writeActiveBlockId(sessionId, blockId) {
  if (!sessionId) return
  try {
    if (!blockId) sessionStorage.removeItem(SK_ACTIVE_BLOCK)
    else
      sessionStorage.setItem(
        SK_ACTIVE_BLOCK,
        JSON.stringify({ sessionId, blockId: String(blockId) }),
      )
  } catch {
    /* ignore */
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
  const activeActivity = useSelector(selectActiveActivity)
  const activeActivityId = useSelector((s) => s.workspace.activeActivityId)
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionParam = searchParams.get('session') || ''
  const focusFromUrl = searchParams.get('focus') === '1'

  const [dateYmd, setDateYmd] = useState(() => formatLocalYmd())
  const [dayBoard, setDayBoard] = useState(null)
  const [snapLoading, setSnapLoading] = useState(false)
  const [snapError, setSnapError] = useState(null)
  const [cardActionBusyId, setCardActionBusyId] = useState(null)

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
  const athleteFocusHydrateKeyRef = useRef('')
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
  const [recentLapsExpanded, setRecentLapsExpanded] = useState(false)
  const [obsAdvancePending, setObsAdvancePending] = useState(null)
  const [obsReturnSkater, setObsReturnSkater] = useState(null)
  const [advanceTick, setAdvanceTick] = useState(0)
  const [reEntryWarmth, setReEntryWarmth] = useState(null)
  /** Client-only count for this browser session (bundle has no observation aggregate). */
  const [sessionObservationCount, setSessionObservationCount] = useState(0)
  const [observedStudentIds, setObservedStudentIds] = useState(() => new Set())
  const [timingPanelOpen, setTimingPanelOpen] = useState(true)
  const [raceBusy, setRaceBusy] = useState(false)
  const [coachingCollapsed, setCoachingCollapsed] = useState(false)
  const [focusedQuickCategory, setFocusedQuickCategory] = useState('effort')

  const [captureDrawerStudentId, setCaptureDrawerStudentId] = useState(null)
  const [athleteFocusDraft, setAthleteFocusDraft] = useState('')
  const [athleteFocusSaving, setAthleteFocusSaving] = useState(false)
  const [athleteFocusSaveMsg, setAthleteFocusSaveMsg] = useState('')

  const [showAddBlockModal, setShowAddBlockModal] = useState(false)

  const athletePanelRef = useRef(null)
  const defaultRaceEnsureAttemptedRef = useRef(new Set())

  const lapSecondsRef = useRef(null)
  const forceDuplicateRef = useRef(false)
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

  const liveRefresh = useLiveSessionRefresh(selectedSessionId)
  const {
    syncDomains,
    syncError: syncDomainError,
    setSyncError: setSyncDomainError,
    syncing: syncDomainsSyncing,
    lastSyncedAt: syncFetchedAt,
    syncAgeTick,
    refreshAllSyncDomains,
    refreshLapsSyncDomain,
    refreshCoachingEventsSyncDomain,
    refreshLeaderboardSyncDomain,
    refreshRaceResultsSyncDomain,
    patchSessionMeta,
    appendRecentLap,
    removeRecentLap,
  } = liveRefresh

  const sessions = useMemo(
    () => sortDayBoardSessions(dayBoard?.sessions || []),
    [dayBoard?.sessions],
  )
  const selSession = sessions.find((s) => String(s.id) === String(selectedSessionId))

  const liveShell = useLiveSessionShell({
    sessionId: selectedSessionId,
    selSession,
    skaters,
    syncDomains,
  })

  const {
    sortedSessionBlocks,
    activeBlockId,
    blocksLoading,
    blocksBusy,
    setBlocksBusy,
    setSessionBlocks,
    phaseAthletesByPhaseId,
    phaseAthletesBusy,
    setPhaseAthletesBusy,
    setPhaseAthletesByPhaseId,
    loadPhaseAthletes,
    rosterForSession,
    applyPhaseAthleteMove,
    patchPhaseAthleteLocal,
    refreshShell,
    handleSelectBlock: shellSelectBlock,
    writeActiveBlockId: shellWriteActiveBlockId,
    shellSession,
    shellError,
  } = liveShell

  const syncPrimitives = useSyncDomainPrimitives(syncDomains)

  /**
   * @deprecated Temporary read-only bridge — remove in bundle-removal phase (see COACH_OS_SPEC).
   * Prefer syncDomains / syncPrimitives; never assign wholesale.
   */
  const bundle = useMemo(() => {
    if (!syncDomains?.sessionMeta) return null
    return {
      session: syncDomains.sessionMeta,
      recentLaps: syncDomains.recentLaps,
      recentLapCount: syncDomains.recentLapCount,
      totalLapCount: syncDomains.totalLapCount,
      races: syncDomains.races,
      groups: syncDomains.groups,
      resolvedAthletes: syncDomains.resolvedAthletes,
      leaderboard: syncDomains.leaderboard,
      recentCoachingEvents: syncDomains.coachingEvents,
      suggestedFocusRaceId: syncDomains.suggestedFocusRaceId,
    }
  }, [syncDomains])

  const bundleError = syncDomainError
  const bundleLoading = false
  const bundleFetchedAt = syncFetchedAt
  const bundleAgeTick = syncAgeTick
  const setBundleError = setSyncDomainError

  useEffect(() => {
    if (!captureDrawerStudentId || !syncDomains?.sessionMeta) return
    const map = syncDomains.sessionMeta.sessionAthleteFocusJson || {}
    const cell = map[captureDrawerStudentId]
    const t = cell && typeof cell === 'object' && cell.text != null ? String(cell.text) : ''
    setAthleteFocusDraft(t)
    setAthleteFocusSaveMsg('')
  }, [captureDrawerStudentId, selectedSessionId])

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

  const loadDayBoard = useCallback(
    async (opts = {}) => {
      const silent = Boolean(opts.silent)
      if (!silent) {
        setSnapLoading(true)
        setSnapError(null)
      }
      try {
        const data = await operationalSessionsApi.getDayBoard(dateYmd)
        devLogEmptyDayBoard(dateYmd, data?.sessions)
        setDayBoard(data)
        if (silent) setSnapError(null)
      } catch (e) {
        const msg = e?.message || 'Could not load sessions for this day.'
        setSnapError(msg)
        if (!silent) setDayBoard(null)
      } finally {
        if (!silent) setSnapLoading(false)
      }
    },
    [dateYmd],
  )

  const loadBundle = useCallback(
    async (sessionId, opts = {}) => {
      if (!sessionId) return null
      const result = await refreshAllSyncDomains({
        silent: Boolean(opts.silent),
        blockId: opts.blockId,
        recentLapLimit: 120,
      })
      if (result?.extracted?.suggestedFocusRaceId) {
        setLapRaceId((prev) => prev || result.extracted.suggestedFocusRaceId || '')
      }
      return result
    },
    [refreshAllSyncDomains],
  )

  const onTabVisibleReEntry = useCallback(() => {
    const snap = flowSnapRef.current
    if (snap.coachLive && snap.sessionId && (snap.studentName || snap.place)) {
      const line = snap.studentName
        ? `${snap.place ? `${snap.place} — ` : ''}You’re back. Still here with ${snap.studentName}.`
        : `${snap.place || 'Session'} — pick up calmly when you’re ready.`
      setReEntryWarmth(line)
      window.setTimeout(() => setReEntryWarmth(null), 4200)
    }
  }, [])

  useLiveSessionLifecycle({
    sessionId: selectedSessionId,
    refreshAllSyncDomains,
    refreshShell,
    loadDayBoard,
    onTabVisible: onTabVisibleReEntry,
  })

  useEffect(() => {
    loadDayBoard()
  }, [loadDayBoard])

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
    if (!selectedSessionId) return undefined
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
  }, [selectedSessionId, lapStudentId, lapRaceId])

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
    athleteFocusHydrateKeyRef.current = ''
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

  const rosterWithSource = useMemo(
    () => buildRosterWithSource(rosterForSession, syncDomains),
    [rosterForSession, syncDomains],
  )

  const rosterFiltered = useMemo(() => {
    const q = rosterFilter.trim().toLowerCase()
    if (!q) return rosterWithSource
    return rosterWithSource.filter((r) => (r.full_name || '').toLowerCase().includes(q))
  }, [rosterWithSource, rosterFilter])

  const inlineAthleteFocus = useMemo(
    () => athleteFocusFromMeta(syncPrimitives.sessionMeta, lapStudentId),
    [syncPrimitives.sessionMeta, lapStudentId],
  )

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
    const focusTargetId = captureDrawerStudentId || lapStudentId
    if (!selectedSessionId || !focusTargetId) return
    setAthleteFocusSaving(true)
    setAthleteFocusSaveMsg('')
    try {
      const patch = {
        [focusTargetId]: {
          text: athleteFocusDraft.trim(),
          updated_at: new Date().toISOString(),
        },
      }
      await skatingOpsApi.patchSession(selectedSessionId, {
        sessionAthleteFocusJson: patch,
      })
      const prevMap = syncDomains?.sessionMeta?.sessionAthleteFocusJson || {}
      patchSessionMeta({
        sessionAthleteFocusJson: { ...prevMap, ...patch },
      })
      athleteFocusHydrateKeyRef.current = `${selectedSessionId}:${focusTargetId}`
      setAthleteFocusSaveMsg(SESSION_OPS_COPY.focusSaved)
    } catch (e) {
      setAthleteFocusSaveMsg(e?.message || 'Save failed')
    } finally {
      setAthleteFocusSaving(false)
    }
  }, [
    selectedSessionId,
    captureDrawerStudentId,
    lapStudentId,
    athleteFocusDraft,
    syncDomains?.sessionMeta,
    patchSessionMeta,
  ])

  const ensureDefaultRace = async () => {
    if (!selectedSessionId || !syncPrimitives.hasSessionMeta) return
    const resolvedIds = syncPrimitives.resolvedAthletes.map((r) => r.student_id ?? r.studentId)
    const ids =
      resolvedIds.length > 0
        ? resolvedIds
        : syncPrimitives.sessionSkaterIds
    await skatingOpsApi.mergeGroup(selectedSessionId, 'main', {
      name: 'Main',
      skaterIds: ids,
    })
    await skatingOpsApi.addRace(selectedSessionId, 'main', {})
    await loadBundle(selectedSessionId)
    await loadDayBoard()
  }

  const addTimingLane = async () => {
    if (!selectedSessionId) return
    setLapError('')
    try {
      await skatingOpsApi.addRace(selectedSessionId, 'main', {})
      bumpSkatingOpsMetric('timingLaneCreated')
      await loadBundle(selectedSessionId)
      await loadDayBoard()
    } catch (err) {
      setLapError(err?.message || 'Could not add timing lane.')
    }
  }

  useEffect(() => {
    const races = syncPrimitives.races
    if (races.length !== 1) return
    setLapRaceId(String(races[0].id))
  }, [syncPrimitives.races])

  /**
   * §3 coach-first plan: silent server bootstrap only — creates default `main` group + one race
   * so laps can attach `race_id` when needed. No multi-lane **UI** until `races.length > 1`
   * (coach must use “Add timing lane” for an additional lane).
   */
  useEffect(() => {
    if (!selectedSessionId || !syncPrimitives.hasSessionMeta) return
    if (syncPrimitives.racesCount > 0) return
    if (defaultRaceEnsureAttemptedRef.current.has(selectedSessionId)) return
    void (async () => {
      defaultRaceEnsureAttemptedRef.current.add(selectedSessionId)
      try {
        await ensureDefaultRace()
      } catch {
        defaultRaceEnsureAttemptedRef.current.delete(selectedSessionId)
      }
    })()
  }, [selectedSessionId, syncPrimitives.hasSessionMeta, syncPrimitives.racesCount])

  const submitLap = async (e) => {
    e?.preventDefault?.()
    if (!selectedSessionId || uiPaused || lapSubmitting) return
    const sec = Number(lapSeconds)
    if (!lapStudentId || Number.isNaN(sec) || sec <= 0) return

    const recent = syncPrimitives.recentLaps
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
      raceLabel: raceLabelForId(lapRaceId, syncPrimitives.races),
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
      await refreshLapsSyncDomain({ silent: true })
      await loadDayBoard()
      setLapSeconds('')
      bumpSkatingOpsMetric('lapSaveSuccess')
      requestAnimationFrame(() => {
        if (flowSnapRef.current.coachLive) {
          athletePanelRef.current?.focus?.()
        } else {
          focusLapInput()
        }
      })
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
      await refreshLapsSyncDomain({ silent: true })
      await loadDayBoard()
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
    if (!selectedSessionId || isOperationalSessionCancelled(selSession)) return
    clearPendingObsAdvance()
    advancePauseRhythmRef.current = 0
    setObsReturnSkater(null)
    await operationalSessionsApi.endSession(selectedSessionId)
    bumpSkatingOpsMetric('sessionEnded')
    await loadBundle(selectedSessionId)
    await loadDayBoard()
  }

  const startSession = async () => {
    if (!selectedSessionId || isOperationalSessionCancelled(selSession)) return
    await operationalSessionsApi.startSession(selectedSessionId)
    bumpSkatingOpsMetric('sessionStartedOnIce')
    await loadBundle(selectedSessionId)
    await loadDayBoard()
  }

  const dayBoardEmptyVariant = useMemo(() => {
    if (!activeActivityId) return 'no_workspace'
    if (!activeActivityHasSkatingCapability(activeActivity)) return 'wrong_capability'
    return 'default'
  }, [activeActivityId, activeActivity])

  const workspaceDisplayName = useMemo(() => {
    if (!activeActivity) return null
    return activeActivity.label || activeActivity.name || null
  }, [activeActivity])

  const sessionCancelled = isOperationalSessionCancelled(selSession)
  const legacyOpsFromCanonical = selSession?.state
    ? operationalStateToLegacyOpsState(selSession.state)
    : null
  const opsState = sessionCancelled
    ? 'ended'
    : syncPrimitives.sessionOpsState || legacyOpsFromCanonical || 'upcoming'
  /** Session workspace uses unified vertical live coaching (not legacy 3-column). */
  const unifiedLiveCoaching = Boolean(selectedSessionId) && !sessionCancelled
  const coachSessionActive =
    unifiedLiveCoaching &&
    (syncPrimitives.sessionOpsState === 'active' ||
      ['active', 'paused'].includes(String(selSession?.state || '').toLowerCase()))
  const coachLive = unifiedLiveCoaching

  useEffect(() => {
    if (!coachLive || !lapStudentId) return
    const hydrateKey = `${selectedSessionId}:${lapStudentId}`
    if (athleteFocusHydrateKeyRef.current === hydrateKey) return
    athleteFocusHydrateKeyRef.current = hydrateKey
    const focus = athleteFocusFromMeta(syncDomains?.sessionMeta, lapStudentId)
    setAthleteFocusDraft(focus?.text || '')
    setAthleteFocusSaveMsg('')
  }, [coachLive, lapStudentId, selectedSessionId])

  const lifecycle = useMemo(
    () =>
      deriveSessionLifecycle({
        opsState,
        uiPaused,
        operationalState: selSession?.state,
      }),
    [opsState, uiPaused, selSession?.state],
  )

  const nameByStudentId = useMemo(() => {
    const m = new Map()
    for (const s of skaters) m.set(String(s.id), s.full_name || String(s.id))
    return m
  }, [skaters])

  const todaySummary = useMemo(
    () => computeSessionSummary(syncDomains, rosterForSession.length, nameByStudentId),
    [syncDomains, rosterForSession.length, nameByStudentId],
  )

  /** §3: lane column / labels only when coach has multiple timing lanes (explicit second+ lane). */
  const showTimingLaneColumnInLapsTable = syncPrimitives.racesCount > 1

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
    if (!selectedSessionId) return null
    if (lifecycle.key !== 'active' && lifecycle.key !== 'paused') return null
    const started =
      selSession?.actualStartAt ||
      selSession?.startedAt ||
      selSession?.started_at ||
      syncPrimitives.sessionStartedAt
    const ended =
      selSession?.actualEndAt ||
      selSession?.endedAt ||
      selSession?.ended_at ||
      syncPrimitives.sessionEndedAt
    if (!started) return null
    return formatElapsedLiveLabel(started, { endedAtIso: ended })
  }, [
    selectedSessionId,
    selSession,
    syncPrimitives.sessionStartedAt,
    syncPrimitives.sessionEndedAt,
    lifecycle.key,
    bundleAgeTick,
  ])

  const guidanceLine = useMemo(() => {
    if (!selectedSessionId) return ''
    if (rosterForSession.length === 0) return SESSION_OPS_COPY.addAthletesToRecord
    if (!lapStudentId && coachLive) return SESSION_OPS_COPY.guidancePickAthlete
    if (coachLive && lapStudentId && !hasObsScores && !obsSyncedAt)
      return SESSION_OPS_COPY.guidanceNoObsYet
    return ''
  }, [
    selectedSessionId,
    rosterForSession.length,
    lapStudentId,
    coachLive,
    hasObsScores,
    obsSyncedAt,
  ])

  const guidanceActions = useMemo(() => {
    const actions = []
    if (!selectedSessionId) return actions
    if (rosterForSession.length === 0 && (opsState === 'active' || opsState === 'upcoming')) {
      actions.push({
        key: 'add-athletes',
        label: SESSION_OPS_COPY.emptyRosterCta,
        variant: 'outline',
        color: 'primary',
        onClick: () => {
          setAddAthletesPick(new Set())
          setShowAddAthletesModal(true)
        },
      })
    }
    return actions
  }, [selectedSessionId, rosterForSession.length, opsState])

  const bundlePeripheralFresh = useMemo(() => {
    if (!coachSessionActive || bundleFetchedAt == null || bundleLoading) return false
    return Date.now() - bundleFetchedAt < 12_000
  }, [coachSessionActive, bundleFetchedAt, bundleLoading, bundleAgeTick])

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

  const sessionModeForCoach =
    syncPrimitives.sessionMode || selSession?.sessionMode || 'practice'

  const coachingDisabled =
    !lapStudentId || obsSaving || uiPaused || opsState === 'ended' || !selectedSessionId

  const runPostCaptureSuccess = useCallback(
    (sidKey, sk) => {
      setSessionObservationCount((c) => c + 1)
      setObservedStudentIds((prev) => new Set(prev).add(sidKey))
      setLastObsLabel(`${sk?.full_name || 'Skater'} · ${formatClockShort(new Date())}`)
      setObsPulse(true)
      window.setTimeout(() => setObsPulse(false), 700)
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
      } else if (!coachLive) {
        focusLapInput()
      }
    },
    [rosterForSession, executeObsAdvance, focusLapInput, coachLive],
  )

  const coachingQueue = useCoachingDraftQueue({
    sessionId: selectedSessionId,
    studentId: lapStudentId,
    sessionMode: sessionModeForCoach,
    blockId: activeBlockId,
    disabled: coachingDisabled,
    onFlushSuccess: async (payload) => {
      if (!selectedSessionId || !lapStudentId) return
      const scoreCount = Object.keys(payload?.scores || {}).length
      const hasNotes = Boolean(payload?.notes && String(payload.notes).trim())
      const isMarkerTap =
        payload?.captureMode === 'marker' ||
        payload?.eventType === 'marker' ||
        (scoreCount === 0 &&
          !hasNotes &&
          (payload?.markers?.length || 0) > 0 &&
          (payload?.tags?.length || 0) === 0)

      bumpSkatingOpsMetric('observationSaveSuccess')
      setObsSyncedAt(Date.now())

      // Good / Watch / Best must not reload session or wipe on-screen draft.
      if (isMarkerTap) return

      const sidKey = String(lapStudentId)
      const sk = rosterForSession.find((r) => String(r.id) === sidKey)
      await refreshCoachingEventsSyncDomain()
      if (scoreCount > 0) {
        runPostCaptureSuccess(sidKey, sk)
      }
    },
    onFlushError: (e) => {
      setObsError(e?.message || 'Could not sync coaching capture')
    },
  })

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
        bumpSkatingOpsMetric('observationSaveSuccess')
        obsLastSentByStudentRef.current[sidKey] = dedupeSig
        writeObsTemplate(selectedSessionId, scores)
        setObsSyncedAt(Date.now())
        setObsFlashKeys(new Set(Object.keys(scores)))
        window.setTimeout(() => setObsFlashKeys(new Set()), 450)
        obsAutoSaveSuppressedRef.current = true
        setObsScores({ ...scores })
        await refreshCoachingEventsSyncDomain()
        runPostCaptureSuccess(sidKey, sk)
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
      activeBlockId,
      runPostCaptureSuccess,
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
      const races = syncPrimitives.races
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
    place: syncPrimitives.placeName || selSession?.placeName || '',
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

  const retryObservation = () => {
    const k = String(lapStudentId)
    if (k) delete obsLastSentByStudentRef.current[k]
    obsAutoSaveSuppressedRef.current = false
    void submitObservation({ manual: true })
  }

  const activeBlockTitle = useMemo(() => {
    const b = sortedSessionBlocks.find((x) => String(x.id) === String(activeBlockId))
    return b?.title || ''
  }, [sortedSessionBlocks, activeBlockId])

  const activeBlockMeta = useMemo(
    () => sortedSessionBlocks.find((x) => String(x.id) === String(activeBlockId)),
    [sortedSessionBlocks, activeBlockId],
  )

  const sessionMode =
    syncPrimitives.sessionMode || selSession?.sessionMode || liveShell.shellSession?.sessionMode || 'practice'
  const isRaceMode = isRacePhaseBlock(activeBlockMeta)

  const activePhaseAthletes = useMemo(() => {
    if (!activeBlockId) return []
    return phaseAthletesByPhaseId[String(activeBlockId)] || []
  }, [phaseAthletesByPhaseId, activeBlockId])

  const athleteCountByPhaseId = useMemo(() => {
    const counts = {}
    for (const [pid, list] of Object.entries(phaseAthletesByPhaseId)) {
      counts[pid] = list?.length ?? 0
    }
    return counts
  }, [phaseAthletesByPhaseId])

  const studentPhasePlacementMap = useMemo(() => {
    const m = new Map()
    for (const phase of sortedSessionBlocks) {
      const pid = String(phase.id)
      const athletes = phaseAthletesByPhaseId[pid] || []
      for (const a of athletes) {
        m.set(String(a.studentId), {
          phaseId: pid,
          phaseTitle: phase.title || 'Phase',
          status: a.participationStatus,
        })
      }
    }
    return m
  }, [phaseAthletesByPhaseId, sortedSessionBlocks])

  const phaseHintByStudentId = useMemo(() => {
    const hints = {}
    const active = String(activeBlockId)
    for (const [sid, info] of studentPhasePlacementMap) {
      if (info.phaseId !== active) {
        hints[sid] = info.phaseTitle
      } else if (info.status && info.status !== 'active') {
        hints[sid] = info.status
      }
    }
    return hints
  }, [studentPhasePlacementMap, activeBlockId])

  const participationByStudentId = useMemo(() => {
    const m = {}
    for (const list of Object.values(phaseAthletesByPhaseId)) {
      for (const a of list || []) {
        m[String(a.studentId)] = {
          status: a.participationStatus || 'active',
          lane: a.lane,
          heatNumber: a.heatNumber,
        }
      }
    }
    return m
  }, [phaseAthletesByPhaseId])

  const activePhaseAthleteForLap = useMemo(() => {
    if (!lapStudentId) return null
    return (
      activePhaseAthletes.find((a) => String(a.studentId) === String(lapStudentId)) || null
    )
  }, [activePhaseAthletes, lapStudentId])

  const phaseContextForWorkspace = useMemo(() => {
    if (activePhaseAthleteForLap?.lane != null) return `Lane ${activePhaseAthleteForLap.lane}`
    return ''
  }, [activePhaseAthleteForLap])

  const athletePhaseLabelByStudentId = useMemo(() => {
    const m = {}
    for (const phase of sortedSessionBlocks) {
      const lbl = livePhaseLabel(phase.blockType, phase.title)
      for (const a of phaseAthletesByPhaseId[String(phase.id)] || []) {
        m[String(a.studentId)] = lbl
      }
    }
    return m
  }, [sortedSessionBlocks, phaseAthletesByPhaseId])

  const handleMovePhaseAthlete = useCallback(
    async (studentId, toPhaseId) => {
      if (!activeBlockId || !selectedSessionId) return
      setPhaseAthletesBusy(true)
      try {
        const result = await phaseAthletesApi.moveToPhase(
          activeBlockId,
          studentId,
          toPhaseId,
        )
        if (result?.athlete) {
          applyPhaseAthleteMove(
            result.athlete,
            result.fromPhaseId || activeBlockId,
            result.toPhaseId || toPhaseId,
          )
        } else {
          await loadPhaseAthletes(selectedSessionId, { silent: true })
        }
      } catch (e) {
        setBundleError(e?.message || 'Could not move athlete to phase.')
        await loadPhaseAthletes(selectedSessionId, { silent: true })
      } finally {
        setPhaseAthletesBusy(false)
      }
    },
    [activeBlockId, selectedSessionId, applyPhaseAthleteMove, loadPhaseAthletes],
  )

  const handleSetPhaseLane = useCallback(
    async (studentId, lane) => {
      if (!activeBlockId) return
      setPhaseAthletesBusy(true)
      try {
        const athlete = await phaseAthletesApi.setLane(activeBlockId, studentId, lane)
        if (athlete) patchPhaseAthleteLocal(activeBlockId, athlete)
      } finally {
        setPhaseAthletesBusy(false)
      }
    },
    [activeBlockId, patchPhaseAthleteLocal],
  )

  const handleSetPhaseHeat = useCallback(
    async (studentId, heatNumber) => {
      if (!activeBlockId) return
      setPhaseAthletesBusy(true)
      try {
        const athlete = await phaseAthletesApi.setHeatNumber(
          activeBlockId,
          studentId,
          heatNumber,
        )
        if (athlete) patchPhaseAthleteLocal(activeBlockId, athlete)
      } finally {
        setPhaseAthletesBusy(false)
      }
    },
    [activeBlockId, patchPhaseAthleteLocal],
  )

  const handleSetPhaseStatus = useCallback(
    async (studentId, participationStatus) => {
      if (!activeBlockId) return
      setPhaseAthletesBusy(true)
      try {
        const athlete = await phaseAthletesApi.setParticipationStatus(
          activeBlockId,
          studentId,
          participationStatus,
        )
        if (athlete) patchPhaseAthleteLocal(activeBlockId, athlete)
      } finally {
        setPhaseAthletesBusy(false)
      }
    },
    [activeBlockId, patchPhaseAthleteLocal],
  )

  const handleSelectBlock = useCallback(
    (blockId) => {
      void coachingQueue.flushNow()
      shellSelectBlock(blockId)
    },
    [coachingQueue, shellSelectBlock],
  )

  const handleReorderBlocks = useCallback(
    async (orderedIds) => {
      if (!selectedSessionId) return
      setBlocksBusy(true)
      try {
        const reordered = await sessionBlocksApi.reorderBlocks(selectedSessionId, orderedIds)
        setSessionBlocks(reordered)
      } finally {
        setBlocksBusy(false)
      }
    },
    [selectedSessionId],
  )

  const handleMoveBlock = useCallback(
    (id, direction) => {
      const sorted = [...sortedSessionBlocks]
      const idx = sorted.findIndex((b) => String(b.id) === String(id))
      if (idx < 0) return
      const swap = direction === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= sorted.length) return
      ;[sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]]
      void handleReorderBlocks(sorted.map((b) => b.id))
    },
    [sortedSessionBlocks, handleReorderBlocks],
  )

  const handleRenameBlock = useCallback(
    async (blockId, title, blockType) => {
      setBlocksBusy(true)
      try {
        const body = { title }
        if (blockType) body.blockType = blockType
        const updated = await sessionBlocksApi.patchBlock(blockId, body)
        if (updated) {
          setSessionBlocks((prev) =>
            prev.map((b) => (String(b.id) === String(blockId) ? updated : b)),
          )
        }
      } finally {
        setBlocksBusy(false)
      }
    },
    [],
  )

  const handleDeleteBlock = useCallback(
    async (blockId) => {
      if (!selectedSessionId) return
      setBlocksBusy(true)
      try {
        const result = await sessionBlocksApi.deleteBlock(blockId)
        if (result.reset && result.block) {
          setSessionBlocks([result.block])
          const rid = String(result.block.id)
          shellSelectBlock(rid)
        } else {
          const blocks = await sessionBlocksApi.listBlocks(selectedSessionId)
          setSessionBlocks(blocks)
          const stored = readActiveBlockId(selectedSessionId)
          const valid =
            stored &&
            stored !== String(blockId) &&
            blocks.some((b) => String(b.id) === stored)
          const first = blocks[0]?.id ? String(blocks[0].id) : ''
          const next = valid ? stored : first
          if (next) shellSelectBlock(next)
        }
        await loadPhaseAthletes(selectedSessionId, { silent: true })
      } finally {
        setBlocksBusy(false)
      }
    },
    [selectedSessionId, loadPhaseAthletes, shellSelectBlock, setSessionBlocks, setBlocksBusy],
  )

  const handleAddBlock = useCallback(
    async ({ title, blockType }) => {
      if (!selectedSessionId) return
      setBlocksBusy(true)
      try {
        const created = await sessionBlocksApi.createBlock(selectedSessionId, {
          title,
          blockType,
        })
        if (created) {
          setSessionBlocks((prev) => [...prev, created])
          handleSelectBlock(String(created.id))
        }
        setShowAddBlockModal(false)
      } finally {
        setBlocksBusy(false)
      }
    },
    [selectedSessionId, handleSelectBlock],
  )

  const handleRaceFinishOrder = useCallback(
    async (studentIds) => {
      if (!selectedSessionId) return
      setRaceBusy(true)
      try {
        await skatingOpsApi.postRaceFinishOrder(selectedSessionId, {
          studentIds,
          blockId: activeBlockId || undefined,
          heatNumber: activePhaseAthletes[0]?.heatNumber ?? undefined,
        })
      await refreshLeaderboardSyncDomain()
      await refreshRaceResultsSyncDomain()
    } finally {
      setRaceBusy(false)
    }
  },
    [
      selectedSessionId,
      activeBlockId,
      activePhaseAthletes,
      refreshLeaderboardSyncDomain,
      refreshRaceResultsSyncDomain,
    ],
  )

  const handleRaceManualTime = useCallback(
    async (studentId, seconds) => {
      if (!selectedSessionId) return
      setRaceBusy(true)
      try {
        await skatingOpsApi.postRaceResult(selectedSessionId, {
          studentId,
          seconds,
          blockId: activeBlockId || undefined,
          heatNumber: activePhaseAthletes[0]?.heatNumber ?? undefined,
        })
        await refreshLeaderboardSyncDomain()
        await refreshRaceResultsSyncDomain()
      } finally {
        setRaceBusy(false)
      }
    },
    [
      selectedSessionId,
      activeBlockId,
      activePhaseAthletes,
      refreshLeaderboardSyncDomain,
      refreshRaceResultsSyncDomain,
    ],
  )

  useEffect(() => {
    if (!selectedSessionId || !activeBlockId) return
    void refreshAllSyncDomains({ silent: true, blockId: activeBlockId })
  }, [activeBlockId, selectedSessionId, refreshAllSyncDomains])

  useEffect(() => {
    if (!syncDomains?.coachingEvents?.length) return
    setObservedStudentIds((prev) => {
      const next = new Set(prev)
      for (const ev of syncDomains.coachingEvents) {
        if (ev.studentId) next.add(String(ev.studentId))
      }
      return next
    })
  }, [syncDomains?.coachingEvents])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.matches?.('input, textarea, select')) return
      if (!lapStudentId || !rosterForSession.length) return
      const idx = rosterForSession.findIndex((r) => String(r.id) === String(lapStudentId))
      if (e.key === 'ArrowDown' && idx >= 0) {
        e.preventDefault()
        const next = rosterForSession[(idx + 1) % rosterForSession.length]
        setLapStudentId(String(next.id))
      } else if (e.key === 'ArrowUp' && idx >= 0) {
        e.preventDefault()
        const next = rosterForSession[(idx - 1 + rosterForSession.length) % rosterForSession.length]
        setLapStudentId(String(next.id))
      } else if (e.key >= '1' && e.key <= '5') {
        coachingQueue.setQuickScore(focusedQuickCategory, Number(e.key))
      } else if (e.key === 'p') {
        coachingQueue.addMarker('positive')
      } else if (e.key === 'c') {
        coachingQueue.addMarker('concern')
      } else if (e.key === 'h') {
        coachingQueue.addMarker('highlight')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lapStudentId, rosterForSession, focusedQuickCategory, coachingQueue])

  const blockListProps = {
    blocks: sortedSessionBlocks,
    activeBlockId,
    onSelectBlock: handleSelectBlock,
    onRename: handleRenameBlock,
    onDelete: handleDeleteBlock,
    onMoveUp: (id) => handleMoveBlock(id, 'up'),
    onMoveDown: (id) => handleMoveBlock(id, 'down'),
    onAddRequest: () => setShowAddBlockModal(true),
    busy: blocksBusy || blocksLoading,
    athleteCountByPhaseId,
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
    void loadDayBoard()
    if (sid) selectSession(sid)
  }

  const exitWorkspace = () => selectSession(null)

  const handleCardPrimary = async (session, action) => {
    const id = String(session?.id || '')
    if (!id) return
    if (action === 'cancel') {
      if (!window.confirm('Cancel this session?')) return
      setCardActionBusyId(id)
      try {
        await operationalSessionsApi.cancelSession(id)
        await loadDayBoard()
        if (String(selectedSessionId) === id) exitWorkspace()
      } catch (e) {
        setSnapError(e?.message || 'Could not cancel session.')
      } finally {
        setCardActionBusyId(null)
      }
      return
    }
    if (action === 'start' || action === 'resume') {
      if (isOperationalSessionCancelled(session)) {
        setSnapError('This session has been cancelled.')
        return
      }
      setCardActionBusyId(id)
      try {
        await operationalSessionsApi.startSession(id)
        selectSession(id)
        await loadDayBoard()
        await loadBundle(id)
      } catch (e) {
        setSnapError(e?.message || 'Could not start session.')
      } finally {
        setCardActionBusyId(null)
      }
      return
    }
    selectSession(id)
    await loadBundle(id)
  }

  const saveAddAthletes = async () => {
    if (!selectedSessionId || !syncPrimitives.hasSessionMeta) return
    setAddAthletesSaving(true)
    try {
      const cur = new Set(syncPrimitives.sessionSkaterIds.map(String))
      for (const id of addAthletesPick) cur.add(String(id))
      await skatingOpsApi.patchSession(selectedSessionId, { sessionSkaterIds: Array.from(cur) })
      setShowAddAthletesModal(false)
      setAddAthletesPick(new Set())
      bumpSkatingOpsMetric('athleteAddedToSession')
      await loadBundle(selectedSessionId)
      await loadDayBoard()
    } catch (e) {
      setLapError(e?.message || 'Could not update athletes.')
    } finally {
      setAddAthletesSaving(false)
    }
  }

  const inner = (
    <>
      {!selectedSessionId ? (
        <SkatingOpsDayBoard
          dateYmd={dateYmd}
          onDateChange={setDateYmd}
          sessions={sessions}
          loading={snapLoading}
          error={snapError}
          cardActionBusyId={cardActionBusyId}
          emptyVariant={dayBoardEmptyVariant}
          workspaceName={workspaceDisplayName}
          onRefresh={() => loadDayBoard()}
          onAdHoc={openStartLiveModal}
          onCardPrimary={(s, a) => void handleCardPrimary(s, a)}
          onSelectSession={(id) => {
            const row = sessions.find((x) => String(x.id) === String(id))
            if (row) void handleCardPrimary(row, 'view')
          }}
        />
      ) : (
        <>
          <SkatingOpsWorkspaceChrome session={selSession ?? null} onBack={exitWorkspace} />
          <ActiveSessionWorkspaceShell>
        <CCard className={`mb-3${opsState === 'active' ? ' coach-session-live' : ''}`}>
          <CCardBody>
            {bundleError ? <CAlert color="danger">{bundleError}</CAlert> : null}
            {reEntryWarmth ? (
              <div className="small text-body-secondary skating-reentry-hint mb-2 px-1 py-1 rounded">
                {reEntryWarmth}
              </div>
            ) : null}
            {unifiedLiveCoaching && selSession ? (
              <CoachLiveSessionView
                shellSession={liveShell.shellSession}
                syncDomains={syncDomains}
                syncStatus={{ syncing: syncDomainsSyncing, error: syncDomainError }}
                selSession={selSession}
                sortedSessionBlocks={sortedSessionBlocks}
                activeBlockId={activeBlockId}
                activeBlockMeta={activeBlockMeta}
                activeBlockTitle={activeBlockTitle}
                athleteCountByPhaseId={athleteCountByPhaseId}
                blocksBusy={blocksBusy}
                blocksLoading={blocksLoading}
                onSelectBlock={handleSelectBlock}
                rosterForSession={rosterForSession}
                lapStudentId={lapStudentId}
                observedStudentIds={observedStudentIds}
                participationByStudentId={participationByStudentId}
                athletePhaseLabelByStudentId={athletePhaseLabelByStudentId}
                onPickSkater={(id) => {
                  clearPendingObsAdvance()
                  setLapStudentId(id)
                }}
                onAddAthletesRequest={() => {
                  setAddAthletesPick(new Set())
                  setShowAddAthletesModal(true)
                }}
                lifecycle={{ badgeColor: lifecycle.badgeColor, label: lifecycle.label }}
                elapsedLabel={elapsedLabel || undefined}
                sessionMode={sessionMode}
                isRaceMode={isRaceMode}
                coachingCollapsed={coachingCollapsed}
                onCoachingCollapsedChange={setCoachingCollapsed}
                uiPaused={uiPaused}
                opsState={opsState}
                raceSectionProps={{
                  athletes: activePhaseAthletes.length ? activePhaseAthletes : rosterForSession,
                  busy: raceBusy,
                  heatNumber: activePhaseAthletes[0]?.heatNumber,
                  onFinishOrder: handleRaceFinishOrder,
                  onManualTime: handleRaceManualTime,
                }}
                sessionHeaderProps={{
                  onPauseToggle: () => setUiPaused((p) => !p),
                  pauseLabel: uiPaused ? 'Resume' : 'Pause',
                  onEnd: () => void endSession(),
                  onStart: () => void startSession(),
                  onSwitchSession: () => exitWorkspace(),
                  canStart: !sessionCancelled && opsState === 'upcoming',
                  canPause: !sessionCancelled && opsState === 'active',
                  canEnd:
                    !sessionCancelled && (opsState === 'active' || opsState === 'upcoming'),
                }}
                timingSection={
                  <CoachLiveTimingSection
                    races={syncDomains?.races || []}
                    lapStudentId={lapStudentId}
                    rosterForSession={rosterForSession}
                    lapRaceId={lapRaceId}
                    setLapRaceId={setLapRaceId}
                    lapSeconds={lapSeconds}
                    setLapSeconds={setLapSeconds}
                    lapSecondsRef={lapSecondsRef}
                    lapSubmitting={lapSubmitting}
                    lapError={lapError}
                    duplicateWarn={duplicateWarn}
                    uiPaused={uiPaused}
                    opsState={opsState}
                    activeEffortSkillId={activeEffortSkillId}
                    setActiveEffortSkillId={setActiveEffortSkillId}
                    setActiveEffortName={setActiveEffortName}
                    skillsCatalog={skillsCatalog}
                    selectedSessionId={selectedSessionId}
                    writeActiveEffort={writeActiveEffort}
                    focusLapInput={focusLapInput}
                    submitLap={submitLap}
                    submitDuplicateAnyway={submitDuplicateAnyway}
                    retryAfterLapFailure={retryAfterLapFailure}
                    onFormKeyDown={onFormKeyDown}
                    addTimingLane={addTimingLane}
                    undoOffer={undoOffer}
                    undoSecondsLeft={undoSecondsLeft}
                    undoBusy={undoBusy}
                    undoLastLap={undoLastLap}
                    lastEffortPhrase={lastEffortPhrase}
                  />
                }
                workspaceProps={{
                  lapStudentId,
                  athleteName:
                    rosterForSession.find((r) => String(r.id) === String(lapStudentId))
                      ?.full_name || '',
                  activeBlockMeta,
                  phaseContext: phaseContextForWorkspace,
                  observedStudentIds,
                  coachingQueue,
                  coachingDisabled,
                  obsScores,
                  obsFlashKeys,
                  obsError,
                  onRetryObservation: retryObservation,
                  onFormalTap: applyObsTap,
                  formalDisabled:
                    obsSaving || uiPaused || opsState === 'ended' || !lapStudentId,
                  formalSaving: obsSaving,
                  onQuickScore: (key, n) => {
                    setFocusedQuickCategory(key)
                    coachingQueue.setQuickScore(key, n)
                  },
                  obsAdvancePending,
                  advanceTick,
                  onCancelAdvance: cancelAdvanceAndStay,
                  onGoAdvanceNow: goObsAdvanceNow,
                  obsReturnSkater,
                  onReturnSkater: () => {
                    setLapStudentId(obsReturnSkater.id)
                    setObsReturnSkater(null)
                    obsChainAdvanceRef.current = false
                    obsAutoSaveSuppressedRef.current = true
                  },
                  lastObsLabel,
                  sessionId: selectedSessionId,
                  focusText: athleteFocusDraft,
                  onChangeFocus: setAthleteFocusDraft,
                  onSaveFocus: () => void saveAthleteFocus(),
                  focusSaving: athleteFocusSaving,
                  focusSaveMessage: athleteFocusSaveMsg,
                  phaseAthlete: activePhaseAthleteForLap,
                  isRacePhase: isRaceMode,
                  otherPhases: sortedSessionBlocks
                    .filter((b) => String(b.id) !== String(activeBlockId))
                    .map((b) => ({ id: b.id, title: b.title || 'Phase' })),
                  phaseBusy: phaseAthletesBusy,
                  onMoveAthlete: handleMovePhaseAthlete,
                  onSetLane: handleSetPhaseLane,
                  onSetHeat: handleSetPhaseHeat,
                  onSetStatus: handleSetPhaseStatus,
                }}
                recentLapsSection={
                  <CoachLiveRecentLaps
                    recentLaps={syncDomains?.recentLaps}
                    recentLapCount={syncDomains?.recentLapCount}
                    races={syncDomains?.races}
                    showTimingLaneColumn={showTimingLaneColumnInLapsTable}
                    expanded={recentLapsExpanded}
                    onToggleExpanded={() => setRecentLapsExpanded((v) => !v)}
                    syncing={syncDomainsSyncing}
                  />
                }
              />
            ) : null}
          </CCardBody>
        </CCard>
          </ActiveSessionWorkspaceShell>
        </>
      )}

      {!coachLive ? (
        <AthleteCaptureDrawer
          visible={Boolean(captureDrawerStudentId)}
          studentId={captureDrawerStudentId}
          sessionId={selectedSessionId || null}
          studentName={captureStudentName}
          focusText={athleteFocusDraft}
          onChangeFocus={setAthleteFocusDraft}
          onSaveFocus={() => void saveAthleteFocus()}
          saving={athleteFocusSaving}
          saveMessage={athleteFocusSaveMsg}
          onClose={closeCaptureDrawer}
        />
      ) : null}

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

      <SessionBlockAddModal
        visible={showAddBlockModal}
        onClose={() => setShowAddBlockModal(false)}
        onSubmit={handleAddBlock}
        busy={blocksBusy}
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
    <div
      className={`skating-ops-page px-1${coachLive ? ' skating-ops--coach-live' : ''}${isRaceMode ? ' skating-ops--race-mode' : ''}`}
      data-testid="skating-ops-page"
    >
      {inner}
    </div>
  )
}

export default SkatingOpsPage
