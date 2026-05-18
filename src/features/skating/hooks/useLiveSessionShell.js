import { useCallback, useEffect, useMemo, useState } from 'react'
import operationalSessionsApi from '../../../domain/operationalSessions/operationalSessionsApi'
import { sessionBlocksApi } from '../../../domain/sessionBlocks/sessionBlocksApi'
import { phaseAthletesApi } from '../../../domain/phaseAthletes/phaseAthletesApi'
import { buildSessionRoster } from './buildSessionRoster'

const SK_ACTIVE_BLOCK = 'onrep.skating.activeBlockBySession'

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

/**
 * Live coaching shell — session metadata, phases, athletes, interaction-owned selection.
 * Renders before background session sync domains complete.
 */
export function useLiveSessionShell({
  sessionId,
  selSession,
  skaters,
  syncDomains,
}) {
  const [canonicalSession, setCanonicalSession] = useState(null)
  const [shellLoading, setShellLoading] = useState(false)
  const [shellError, setShellError] = useState(null)

  const [sessionBlocks, setSessionBlocks] = useState([])
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [blocksBusy, setBlocksBusy] = useState(false)
  const [activeBlockId, setActiveBlockId] = useState('')
  const [phaseAthletesByPhaseId, setPhaseAthletesByPhaseId] = useState({})
  const [phaseAthletesLoading, setPhaseAthletesLoading] = useState(false)
  const [phaseAthletesBusy, setPhaseAthletesBusy] = useState(false)

  const loadBlocks = useCallback(async (sid, opts = {}) => {
    const silent = Boolean(opts.silent)
    if (!sid) {
      setSessionBlocks([])
      setActiveBlockId('')
      return
    }
    if (!silent) setBlocksLoading(true)
    try {
      const blocks = await sessionBlocksApi.listBlocks(sid)
      setSessionBlocks(blocks)
      const stored = readActiveBlockId(sid)
      const valid = blocks.some((b) => String(b.id) === stored)
      const firstId = blocks[0]?.id ? String(blocks[0].id) : ''
      const nextActive = valid ? stored : firstId
      setActiveBlockId(nextActive)
      if (nextActive) writeActiveBlockId(sid, nextActive)
    } catch {
      if (!silent) setSessionBlocks([])
    } finally {
      if (!silent) setBlocksLoading(false)
    }
  }, [])

  const loadPhaseAthletes = useCallback(async (sid, opts = {}) => {
    const silent = Boolean(opts.silent)
    if (!sid) {
      setPhaseAthletesByPhaseId({})
      return
    }
    if (!silent) setPhaseAthletesLoading(true)
    try {
      const phases = await phaseAthletesApi.listPhaseAthletes(sid)
      const map = {}
      for (const p of phases) {
        map[String(p.phaseId)] = Array.isArray(p.athletes) ? p.athletes : []
      }
      setPhaseAthletesByPhaseId(map)
    } catch {
      if (!silent) setPhaseAthletesByPhaseId({})
    } finally {
      if (!silent) setPhaseAthletesLoading(false)
    }
  }, [])

  const loadCanonicalSession = useCallback(async (sid, opts = {}) => {
    const silent = Boolean(opts.silent)
    if (!sid) {
      setCanonicalSession(null)
      return
    }
    if (!silent) setShellLoading(true)
    try {
      const row = await operationalSessionsApi.getSession(sid)
      setCanonicalSession(row)
      if (silent) setShellError(null)
    } catch (e) {
      setShellError(e?.message || 'Could not load session.')
      if (!silent) setCanonicalSession(null)
    } finally {
      if (!silent) setShellLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setCanonicalSession(null)
      setPhaseAthletesByPhaseId({})
      setSessionBlocks([])
      setActiveBlockId('')
      return
    }
    void loadCanonicalSession(sessionId)
    void loadBlocks(sessionId)
    void loadPhaseAthletes(sessionId)
  }, [sessionId, loadCanonicalSession, loadBlocks, loadPhaseAthletes])

  const refreshShell = useCallback(
    async (opts = {}) => {
      if (!sessionId) return
      await Promise.all([
        loadCanonicalSession(sessionId, opts),
        loadBlocks(sessionId, opts),
        loadPhaseAthletes(sessionId, opts),
      ])
    },
    [sessionId, loadCanonicalSession, loadBlocks, loadPhaseAthletes],
  )

  const handleSelectBlock = useCallback(
    (blockId) => {
      setActiveBlockId(blockId)
      if (sessionId) writeActiveBlockId(sessionId, blockId)
    },
    [sessionId],
  )

  const sessionMeta = useMemo(
    () => syncDomains?.sessionMeta || null,
    [syncDomains?.sessionMeta],
  )

  const shellSession = useMemo(
    () => ({
      id: sessionId,
      placeName:
        sessionMeta?.placeName ||
        canonicalSession?.placeName ||
        selSession?.placeName ||
        selSession?.title ||
        'Session',
      sessionMode:
        sessionMeta?.sessionMode ||
        canonicalSession?.sessionMode ||
        selSession?.sessionMode ||
        'practice',
      opsState: sessionMeta?.opsState,
    }),
    [sessionId, sessionMeta, canonicalSession, selSession],
  )

  const rosterForSession = useMemo(
    () => buildSessionRoster(skaters, syncDomains),
    [skaters, syncDomains],
  )

  const sortedSessionBlocks = useMemo(
    () =>
      [...sessionBlocks].sort(
        (a, b) => Number(a.sequenceNo ?? 0) - Number(b.sequenceNo ?? 0),
      ),
    [sessionBlocks],
  )

  const shellReady = Boolean(sessionId) && !shellLoading

  const applyPhaseAthleteMove = useCallback((athlete, fromPhaseId, toPhaseId) => {
    if (!athlete) return
    const sid = String(athlete.studentId)
    setPhaseAthletesByPhaseId((prev) => {
      const next = {}
      for (const [pid, list] of Object.entries(prev)) {
        next[pid] = (list || []).filter((a) => String(a.studentId) !== sid)
      }
      const dest = [...(next[String(toPhaseId)] || []), athlete]
      next[String(toPhaseId)] = dest
      return next
    })
  }, [])

  const patchPhaseAthleteLocal = useCallback((phaseId, athlete) => {
    if (!athlete) return
    const sid = String(athlete.studentId)
    setPhaseAthletesByPhaseId((prev) => {
      const list = prev[String(phaseId)] || []
      return {
        ...prev,
        [String(phaseId)]: list.map((a) => (String(a.studentId) === sid ? athlete : a)),
      }
    })
  }, [])

  return {
    shellSession,
    canonicalSession,
    shellLoading,
    shellError,
    shellReady,
    sessionBlocks,
    sortedSessionBlocks,
    blocksLoading,
    blocksBusy,
    setBlocksBusy,
    setSessionBlocks,
    activeBlockId,
    handleSelectBlock,
    phaseAthletesByPhaseId,
    phaseAthletesLoading,
    phaseAthletesBusy,
    setPhaseAthletesBusy,
    setPhaseAthletesByPhaseId,
    loadBlocks,
    loadPhaseAthletes,
    refreshShell,
    rosterForSession,
    applyPhaseAthleteMove,
    patchPhaseAthleteLocal,
    writeActiveBlockId: (blockId) => writeActiveBlockId(sessionId, blockId),
  }
}

export default useLiveSessionShell
