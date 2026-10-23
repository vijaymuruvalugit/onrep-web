import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import http from '../../../api/http'
import { selectActiveActivity } from '../../workspace/slices/workspaceSlice'
import { getWorkspaceDisplay } from '../../../core/activityWorkspace/activityDisplay'
import { getStudentDisplayName } from '../../students/utils/studentMappers'

/**
 * Minimal History entry for CORE-PILOT: authorised specialist results remain readable
 * under type=core and when tools are off (API does not require modules for GETs).
 */
export default function SpecialistHistoryPage() {
  const activeActivity = useSelector(selectActiveActivity)
  const { label } = getWorkspaceDisplay(activeActivity)
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [stories, setStories] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [storiesLoading, setStoriesLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    http
      .get('/students')
      .then(({ data }) => {
        if (cancelled) return
        const list = Array.isArray(data?.students) ? data.students : Array.isArray(data) ? data : []
        setStudents(
          [...list].sort((a, b) =>
            getStudentDisplayName(a).localeCompare(getStudentDisplayName(b), undefined, {
              sensitivity: 'base',
            }),
          ),
        )
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load students')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeActivity?.id])

  useEffect(() => {
    if (!selectedId) {
      setStories([])
      return
    }
    let cancelled = false
    setStoriesLoading(true)
    setError(null)
    http
      .get(`/performance/students/${encodeURIComponent(selectedId)}/session-stories`)
      .then(({ data }) => {
        if (cancelled) return
        const list = Array.isArray(data?.stories)
          ? data.stories
          : Array.isArray(data?.sessionStories)
            ? data.sessionStories
            : Array.isArray(data)
              ? data
              : []
        setStories(list)
      })
      .catch((e) => {
        if (!cancelled) {
          setStories([])
          setError(e?.response?.data?.error || e?.message || 'Failed to load history')
        }
      })
      .finally(() => {
        if (!cancelled) setStoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, activeActivity?.id])

  return (
    <CCard>
      <CCardHeader>
        <strong>History</strong>
        <div className="small text-body-secondary">
          Specialist results for {label || 'this workspace'} — readable even when Skating tools are
          off. Live floor create stays gated separately.
        </div>
      </CCardHeader>
      <CCardBody>
        {error ? <CAlert color="warning">{error}</CAlert> : null}
        {loading ? <CSpinner /> : null}
        {!loading ? (
          <div className="mb-3">
            <label className="form-label" htmlFor="history-student">
              Student
            </label>
            <select
              id="history-student"
              className="form-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {getStudentDisplayName(s)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {storiesLoading ? <CSpinner size="sm" /> : null}
        {!storiesLoading && selectedId ? (
          stories.length === 0 ? (
            <p className="text-body-secondary small mb-0">No session history for this student yet.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {stories.map((story, idx) => (
                <li key={story.id || story.sessionId || idx} className="border rounded p-2 mb-2">
                  <div className="fw-semibold">
                    {story.title || story.sessionTitle || story.date || 'Session'}
                  </div>
                  <div className="small text-body-secondary">
                    {story.summary || story.headline || story.note || JSON.stringify(story).slice(0, 160)}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
        <div className="mt-3 small">
          <Link to="/coach/skating">Open Live sessions</Link>
        </div>
      </CCardBody>
    </CCard>
  )
}
