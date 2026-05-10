import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCollapse,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
  CSpinner,
} from '@coreui/react'
import batchesApi from '../../batches/api/batchesApi'
import studentsApi from '../../students/api/studentsApi'
import { stripDemoSuffix } from '../../batches/utils/batchDisplayUtils'
import { SESSION_TYPE_OPTIONS } from '../constants/sessionTypes'
import { todayIsoLocal } from '../../batches/utils/batchWorkspaceOperations'

function CoachSelect({ coaches = [], value, onChange, disabled }) {
  return (
    <CFormSelect value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">Default (batch lead)</option>
      {coaches.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name || 'Coach'}
        </option>
      ))}
    </CFormSelect>
  )
}

/**
 * Full operational one-off session creation for a batch.
 */
export default function CreateOneTimeSessionDrawer({
  visible,
  onClose,
  batch,
  places = [],
  onCreated,
}) {
  const batchId = batch?.id || batch?._id
  const batchName = stripDemoSuffix(batch?.name || '') || 'Batch'
  const batchStudentIdSet = useMemo(() => {
    const raw = batch?.activeStudentIds ?? batch?.active_student_ids ?? batch?.studentIds ?? []
    return new Set((Array.isArray(raw) ? raw : []).map(String))
  }, [batch])

  const coachOptions = useMemo(() => {
    const raw = batch?.batchCoaches
    if (Array.isArray(raw) && raw.length)
      return raw.map((c) => ({ id: String(c.id), name: c.name || '' }))
    const lead = batch?.leadCoachUserId ?? batch?.lead_coach_user_id
    const leadName = batch?.leadCoachName ?? batch?.lead_coach_name
    if (lead) return [{ id: String(lead), name: leadName || 'Lead coach' }]
    return []
  }, [batch])

  const defaultPlaceId = batch?.defaultPlaceId ?? batch?.default_place_id ?? ''

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentDirectory, setStudentDirectory] = useState([])

  const [title, setTitle] = useState('')
  const [sessionDate, setSessionDate] = useState(() => todayIsoLocal())
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('19:30')
  const [coachId, setCoachId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [comments, setComments] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [visibilityEnabled, setVisibilityEnabled] = useState(true)
  const [attendanceEnabled, setAttendanceEnabled] = useState(true)

  /** Map studentId -> { guest } */
  const [roster, setRoster] = useState(() => new Map())

  const [addOpen, setAddOpen] = useState(false)
  const [addQuery, setAddQuery] = useState('')

  useEffect(() => {
    if (!visible || !batchId) return
    setPlaceId(defaultPlaceId ? String(defaultPlaceId) : '')
    const lead = batch?.leadCoachUserId ?? batch?.lead_coach_user_id
    setCoachId(lead ? String(lead) : '')
    setError(null)
    setAddOpen(false)
    setAddQuery('')
  }, [visible, batchId, batch, defaultPlaceId])

  useEffect(() => {
    if (!visible || !batchId) return
    const ids = batch?.activeStudentIds ?? batch?.active_student_ids ?? batch?.studentIds
    if (!Array.isArray(ids) || ids.length === 0) {
      setRoster(new Map())
      return
    }
    setRoster((prev) => {
      const next = new Map()
      for (const id of ids) {
        const sid = String(id)
        next.set(sid, { guest: prev.get(sid)?.guest === true })
      }
      return next
    })
  }, [visible, batchId, batch])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setStudentsLoading(true)
    studentsApi
      .listStudents()
      .then((data) => {
        if (!cancelled) setStudentDirectory(Array.isArray(data?.students) ? data.students : [])
      })
      .catch(() => {
        if (!cancelled) setStudentDirectory([])
      })
      .finally(() => {
        if (!cancelled) setStudentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [visible])

  const studentNameById = useMemo(() => {
    const m = new Map()
    for (const s of studentDirectory) {
      const id = String(s.id ?? s._id ?? '')
      if (id) m.set(id, s.full_name || s.fullName || 'Student')
    }
    return m
  }, [studentDirectory])

  const rosterList = useMemo(() => {
    return [...roster.entries()].map(([id, meta]) => ({
      id,
      name: studentNameById.get(id) || 'Student',
      guest: Boolean(meta?.guest),
    }))
  }, [roster, studentNameById])

  const removeStudent = (id) => {
    setRoster((prev) => {
      const next = new Map(prev)
      next.delete(String(id))
      return next
    })
  }

  const addStudent = (sid, forceGuest = false) => {
    const id = String(sid)
    const guest = forceGuest || !batchStudentIdSet.has(id)
    setRoster((prev) => {
      const next = new Map(prev)
      next.set(id, { guest })
      return next
    })
    setAddQuery('')
    setAddOpen(false)
  }

  const addCandidates = useMemo(() => {
    const q = addQuery.trim().toLowerCase()
    const selected = new Set(roster.keys())
    return studentDirectory
      .filter((s) => {
        const id = String(s.id ?? s._id ?? '')
        if (!id || selected.has(id)) return false
        const name = String(s.full_name || s.fullName || '').toLowerCase()
        return !q || name.includes(q)
      })
      .slice(0, 25)
  }, [studentDirectory, addQuery, roster])

  const handleSubmit = async () => {
    setError(null)
    if (!batchId) return
    if (!sessionDate || !startTime || !endTime) {
      setError('Date and times are required.')
      return
    }
    if (roster.size === 0) {
      setError('Select at least one student.')
      return
    }
    const studentIds = []
    const guestStudentIds = []
    for (const [id, meta] of roster.entries()) {
      if (meta?.guest) guestStudentIds.push(id)
      else studentIds.push(id)
    }
    setBusy(true)
    try {
      await batchesApi.createOneTimeSession({
        batchId,
        sessionTitle: title.trim() || undefined,
        sessionDate,
        startTime,
        endTime,
        coachId: coachId || undefined,
        placeId: placeId || undefined,
        studentIds,
        guestStudentIds,
        sessionComments: comments.trim() || undefined,
        sessionType: sessionType || undefined,
        visibilityEnabled,
        attendanceEnabled,
      })
      onCreated?.()
      onClose?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not create session.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} className="onrep-session-drawer">
      <COffcanvasHeader className="border-bottom border-light-subtle">
        <div>
          <COffcanvasTitle>Create one-off session</COffcanvasTitle>
          <div className="small text-body-secondary mt-1">
            Add a standalone training session for this batch.
          </div>
        </div>
      </COffcanvasHeader>
      <COffcanvasBody className="d-flex flex-column gap-4 pb-5">
        {error ? (
          <CAlert color="danger" className="py-2 mb-0">
            {error}
          </CAlert>
        ) : null}

        <section>
          <div className="onrep-type-label mb-2">Basics</div>
          <div className="mb-3">
            <CFormLabel className="small text-body-secondary mb-1">
              Session title <span className="fw-normal">(optional)</span>
            </CFormLabel>
            <CFormInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Defaults to “${batchName}” in lists if empty`}
            />
          </div>
          <div className="row g-2">
            <div className="col-12">
              <CFormLabel className="small mb-1">Date</CFormLabel>
              <CFormInput
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="col-6">
              <CFormLabel className="small mb-1">Start</CFormLabel>
              <CFormInput
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="col-6">
              <CFormLabel className="small mb-1">End</CFormLabel>
              <CFormInput
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="onrep-type-label mb-2">Operations</div>
          <div className="mb-3">
            <CFormLabel className="small mb-1">Coach</CFormLabel>
            <CoachSelect
              coaches={coachOptions}
              value={coachId}
              onChange={setCoachId}
              disabled={busy}
            />
          </div>
          <div>
            <CFormLabel className="small mb-1">Place</CFormLabel>
            <CFormSelect
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              disabled={busy}
            >
              <option value="">Default batch place</option>
              {places.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {stripDemoSuffix(p.name || '')}
                </option>
              ))}
            </CFormSelect>
          </div>
        </section>

        <section>
          <div className="onrep-type-label mb-2">Students</div>
          <p className="small text-body-secondary mb-2">
            Included students ({roster.size}). Defaults match this batch; add guests from the
            academy.
          </p>
          {studentsLoading ? (
            <CSpinner size="sm" />
          ) : (
            <div className="d-flex flex-wrap gap-2 mb-2">
              {rosterList.map(({ id, name, guest }) => (
                <CBadge
                  key={id}
                  color={guest ? 'info' : 'dark'}
                  className="rounded-pill py-2 px-3 fw-normal d-inline-flex align-items-center gap-2"
                >
                  <span className="text-truncate" style={{ maxWidth: 180 }}>
                    {name}
                  </span>
                  {guest ? <span className="small opacity-75">Guest</span> : null}
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-white text-decoration-none p-0 m-0 border-0 lh-1"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeStudent(id)}
                  >
                    ×
                  </button>
                </CBadge>
              ))}
              {!rosterList.length ? (
                <span className="small text-body-secondary">No students selected.</span>
              ) : null}
            </div>
          )}
          <div>
            <CButton
              color="link"
              className="px-0 text-decoration-none"
              onClick={() => setAddOpen((v) => !v)}
            >
              {addOpen ? 'Close search' : '+ Add students'}
            </CButton>
            <CCollapse visible={addOpen}>
              <div className="border border-light-subtle rounded-3 p-2 mt-2">
                <CFormInput
                  size="sm"
                  placeholder="Search academy students…"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                />
                <div className="mt-2 small" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {addCandidates.map((s) => {
                    const id = String(s.id ?? s._id)
                    const inBatch = batchStudentIdSet.has(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        className="w-100 text-start btn btn-sm btn-light mb-1 d-flex justify-content-between align-items-center"
                        onClick={() => addStudent(id, !inBatch)}
                      >
                        <span>{s.full_name || s.fullName}</span>
                        {!inBatch ? (
                          <span className="text-body-secondary smaller">Guest</span>
                        ) : null}
                      </button>
                    )
                  })}
                  {!addCandidates.length ? (
                    <div className="text-body-secondary py-2">No students match.</div>
                  ) : null}
                </div>
              </div>
            </CCollapse>
          </div>
        </section>

        <section>
          <div className="onrep-type-label mb-2">Notes</div>
          <CFormTextarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Optional operational notes."
          />
        </section>

        <section>
          <div className="onrep-type-label mb-2">Session type</div>
          <CFormSelect value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
            {SESSION_TYPE_OPTIONS.map((o) => (
              <option key={o.value || 'regular'} value={o.value}>
                {o.label}
              </option>
            ))}
          </CFormSelect>
        </section>

        <section>
          <div className="onrep-type-label mb-2">Visibility</div>
          <CFormCheck
            id="one-vis"
            label="Visible to parents / students"
            checked={visibilityEnabled}
            onChange={(e) => setVisibilityEnabled(e.target.checked)}
          />
          <CFormCheck
            id="one-att"
            className="mt-2"
            label="Allow attendance tracking"
            checked={attendanceEnabled}
            onChange={(e) => setAttendanceEnabled(e.target.checked)}
          />
        </section>

        <div className="mt-auto d-grid gap-2 pt-3 border-top border-light-subtle">
          <CButton color="primary" disabled={busy || !batchId} onClick={handleSubmit}>
            {busy ? 'Creating…' : 'Create session'}
          </CButton>
          <CButton color="secondary" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </CButton>
        </div>
      </COffcanvasBody>
    </COffcanvas>
  )
}
