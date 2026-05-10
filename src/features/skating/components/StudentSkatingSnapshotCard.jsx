import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CButton, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import { skatingChecklistApi } from '../api/skatingChecklistApi'

function formatPb(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return null
  return `${(Number(ms) / 1000).toFixed(2)}s`
}

/**
 * One glance, one insight — avoids “mini dashboard” drift on the student profile.
 */
function pickPrimaryInsight(summary) {
  if (!summary) {
    return {
      line: 'Skating context will show up here after a few sessions on the ice.',
      tone: 'muted',
    }
  }
  const mom = summary?.coachValue?.momentum ?? summary?.coach_value?.momentum
  if (mom === 'slowing_pace') {
    return {
      line: 'Pace has softened in recent laps — worth a closer look next time you’re together.',
      tone: 'attention',
    }
  }
  if (mom === 'improving_pace') {
    return {
      line: 'Recent laps show a bit more snap — nice momentum building.',
      tone: 'positive',
    }
  }
  const note = summary?.notes?.snippet
  const noteStr = note != null ? String(note).trim() : ''
  if (noteStr) {
    return {
      line: `Latest note: “${noteStr.slice(0, 120)}${noteStr.length > 120 ? '…' : ''}”`,
      tone: 'muted',
    }
  }
  const pb = formatPb(summary?.laps?.bestLapMs ?? summary?.laps?.best_lap_ms)
  if (pb) {
    return {
      line: `Best recent lap around ${pb} — use ops when you want fresh splits.`,
      tone: 'muted',
    }
  }
  const tracked = summary?.progress?.tracked ?? 0
  return {
    line: `${tracked} skills on your radar here — you’ve got this from the rink.`,
    tone: 'muted',
  }
}

const StudentSkatingSnapshotCard = ({ studentId }) => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    setSummary(null)
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const data = await skatingChecklistApi.getCoachSummary(studentId)
        if (!cancelled) setSummary(data && typeof data === 'object' ? data : null)
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Could not load skating coach summary.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentId])

  const insight = useMemo(() => pickPrimaryInsight(summary), [summary])

  return (
    <CCard
      className={`mb-3${insight.tone === 'attention' ? ' border-warning border-opacity-50' : ''}`}
    >
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>Skating</span>
        <CButton
          color="primary"
          size="sm"
          variant="outline"
          as={Link}
          to={`/coach/skating`}
        >
          Open ops
        </CButton>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <CSpinner size="sm" />
        ) : err ? (
          <span className="text-danger small">{err}</span>
        ) : (
          <>
            <p className={`mb-0 small lh-base${insight.tone === 'positive' ? ' text-success-emphasis' : ''}`}>
              {insight.line}
            </p>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default StudentSkatingSnapshotCard
