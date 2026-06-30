import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import CIcon from '@coreui/icons-react'
import { cilGrid, cilList } from '@coreui/icons'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import { useBatches } from '../hooks/useBatches'
import {
  batchNeedsCoach,
  batchNeedsSchedule,
  getBatchStudentCount,
} from '../utils/batchPresentation'
import { formatOperationalSessionRange } from '../../classes/utils/sessionDisplay'
import { todayIsoLocal } from '../utils/batchWorkspaceOperations'
import { stripDemoSuffix } from '../utils/batchDisplayUtils'
import { academySubActivitiesApi } from '../../../api/academySubActivitiesApi'
import { bootstrapWorkspace, setActiveWorkspace } from '../../workspace/slices/workspaceSlice'
import { useCoachLikeRole } from '../../workspace/hooks/useCoachLikeRole'
import './BatchesListPage.scss'

const BATCHES_VIEW_STORAGE_KEY = 'onrep-batches-view'

function buildBatchRowModel(batch, todayIso) {
  const id = batch.id || batch._id
  const base = `/coach/batches/${encodeURIComponent(id)}`
  const scheduleHref = `/coach/schedule?batchId=${encodeURIComponent(id)}`
  const students = getBatchStudentCount(batch)
  const needSchedule = batchNeedsSchedule(batch)
  const needCoach = batchNeedsCoach(batch)
  const summary = batch.weeklySummary
  const coachLabel = batch.coachName ?? batch.coach_name
  const rawPlace = batch.location || batch.placeName
  const placeLabel = rawPlace ? stripDemoSuffix(rawPlace) : ''
  const todaySnap = batch.todaySessionSnapshot
  const nextSnap = batch.nextSessionSnapshot
  const ac = Number(batch.activeScheduleCount ?? 0)
  const upcomingN = Number(batch.upcomingSessionsCount ?? 0)
  const needsAttention = ac > 0 && upcomingN === 0 && !todaySnap && !nextSnap

  const formatSnap = (snap) =>
    formatOperationalSessionRange(
      snap.sessionDate ?? snap.session_date,
      snap.startTime ?? snap.start_time,
      snap.endTime ?? snap.end_time,
      todayIso,
    )

  const batchNameOnly = stripDemoSuffix(batch.name || 'Untitled batch')
  const subActivityLabel = batch.subActivityName ? stripDemoSuffix(batch.subActivityName) : null

  let nextSessionDisplay = { variant: 'none' }
  if (todaySnap) {
    nextSessionDisplay = {
      variant: 'today',
      when: formatSnap(todaySnap),
      place: stripDemoSuffix(todaySnap.placeName || todaySnap.place_name || ''),
    }
  } else if (nextSnap) {
    nextSessionDisplay = {
      variant: 'next',
      when: formatSnap(nextSnap),
      place: stripDemoSuffix(nextSnap.placeName || nextSnap.place_name || ''),
    }
  }

  const coachDisplay =
    coachLabel || todaySnap?.coachName || nextSnap?.coachName || null

  return {
    id,
    base,
    scheduleHref,
    batchNameOnly,
    subActivityLabel,
    students,
    placeLabel,
    summary,
    needSchedule,
    needCoach,
    needsAttention,
    isInactive: batch.isActive === false,
    emptyBatch: students === 0,
    nextSessionDisplay,
    coachDisplay,
  }
}

/** Soft inline hints (replaces a dedicated Status column in list view). */
function BatchAttentionHints({ m }) {
  const items = []
  if (m.isInactive) items.push({ key: 'inactive', label: 'Inactive', tone: 'muted' })
  if (m.emptyBatch) items.push({ key: 'empty', label: 'No students yet', tone: 'warn' })
  if (m.needSchedule) items.push({ key: 'sched', label: 'Needs schedule', tone: 'info' })
  if (m.needCoach) items.push({ key: 'coach', label: 'Coach not assigned', tone: 'warn' })
  if (m.needsAttention) items.push({ key: 'attn', label: 'Sessions need review', tone: 'risk' })
  if (!items.length) return null
  return (
    <div className="onrep-batch-hints" role="status" aria-label="Batch setup notes">
      {items.map((it) => (
        <span key={it.key} className={`onrep-batch-hint onrep-batch-hint--${it.tone}`}>
          {it.label}
        </span>
      ))}
    </div>
  )
}

function stopCardNavigate(e) {
  e.stopPropagation()
}

function BatchTileCard({ m, onDelete }) {
  const navigate = useNavigate()
  const d = m.nextSessionDisplay
  const openBatch = () => navigate(`${m.base}?tab=schedule`)

  return (
    <CCard
      className="h-100 border onrep-batch-tile onrep-batch-tile--clickable onrep-surface-b shadow-sm"
      role="button"
      tabIndex={0}
      aria-label={`Open batch ${m.batchNameOnly}`}
      onClick={openBatch}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openBatch()
        }
      }}
    >
      <CCardBody className="d-flex flex-column onrep-batch-tile__body">
        <div className="onrep-batch-tile__header">
          <div className="onrep-batch-tile__title-block min-w-0">
            <span className="onrep-batch-tile__title text-body">{m.batchNameOnly}</span>
            <BatchAttentionHints m={m} />
          </div>
        </div>

        <p className="onrep-batch-tile__meta">
          {m.subActivityLabel ? (
            <>
              <span className="onrep-batch-tile__stream">{m.subActivityLabel}</span>
              <span className="onrep-batch-tile__dot">·</span>
            </>
          ) : null}
          <span>{m.students === 1 ? '1 student' : `${m.students} students`}</span>
          {m.placeLabel ? (
            <>
              <span className="onrep-batch-tile__dot">·</span>
              <span>{m.placeLabel}</span>
            </>
          ) : null}
        </p>

        <div className="onrep-batch-tile__block">
          <div className="onrep-batch-tile__label">Weekly pattern</div>
          <div className="onrep-batch-tile__value">
            {m.needSchedule ? (
              <>
                <span className="text-body-secondary">Not set.</span>{' '}
                <Link
                  to={m.scheduleHref}
                  className="text-primary text-decoration-none onrep-batch-tile__nested-link"
                  onClick={stopCardNavigate}
                >
                  Add schedule
                </Link>
              </>
            ) : (
              <span>{m.summary || '—'}</span>
            )}
          </div>
        </div>

        <div className="onrep-batch-tile__block">
          <div className="onrep-batch-tile__label">
            {d.variant === 'today' ? 'Today' : 'Next session'}
          </div>
          <div className="onrep-batch-tile__value">
            {d.variant === 'today' || d.variant === 'next' ? (
              <>
                <div className="onrep-batch-tile__when">{d.when}</div>
                {d.place ? (
                  <div className="onrep-batch-tile__place text-body-secondary">{d.place}</div>
                ) : null}
              </>
            ) : (
              <span className="text-body-secondary">No upcoming session.</span>
            )}
          </div>
        </div>

        <div className="onrep-batch-tile__block onrep-batch-tile__block--last">
          <div className="onrep-batch-tile__label">Coach</div>
          <div className="onrep-batch-tile__value">
            {m.needCoach ? (
              <>
                <span className="text-body-secondary">Not assigned.</span>{' '}
                <Link
                  to={`${m.base}?tab=settings`}
                  className="text-primary text-decoration-none onrep-batch-tile__nested-link"
                  onClick={stopCardNavigate}
                >
                  Assign
                </Link>
              </>
            ) : (
              <span>{m.coachDisplay || '—'}</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-top d-flex justify-content-end" onClick={stopCardNavigate}>
          <CButton
            size="sm"
            color="danger"
            variant="ghost"
            onClick={() => onDelete(m.id, m.batchNameOnly)}
          >
            Delete
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}

function BatchListRow({ m, onDelete }) {
  const d = m.nextSessionDisplay
  const attention =
    m.isInactive || m.emptyBatch || m.needSchedule || m.needCoach || m.needsAttention

  return (
    <div
      className={[
        'onrep-batch-list-row border-bottom',
        attention ? 'onrep-batch-list-row--attention' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="onrep-batch-list-row__batch">
        <Link
          to={`${m.base}?tab=schedule`}
          className="onrep-batch-list-row__title text-decoration-none text-body fw-semibold"
        >
          {m.batchNameOnly}
        </Link>
        <BatchAttentionHints m={m} />
      </div>

      <div className="onrep-batch-list-row__detail">
        <span className="onrep-batch-list-row__mobile-label d-lg-none">Details</span>
        <div className="text-body-secondary small">
          {m.subActivityLabel ? (
            <>
              <span className="text-body">{m.subActivityLabel}</span>
              <span className="mx-1">·</span>
            </>
          ) : null}
          {m.students === 1 ? '1 student' : `${m.students} students`}
          {m.placeLabel ? (
            <>
              <span className="mx-1">·</span>
              {m.placeLabel}
            </>
          ) : null}
        </div>
      </div>

      <div className="onrep-batch-list-row__schedule">
        <span className="onrep-batch-list-row__mobile-label d-lg-none">Weekly pattern</span>
        {m.needSchedule ? (
          <>
            <span className="text-body-secondary small">Not set.</span>{' '}
            <Link to={m.scheduleHref} className="small text-primary text-decoration-none">
              Add schedule
            </Link>
          </>
        ) : (
          <span className="small">{m.summary || '—'}</span>
        )}
      </div>

      <div
        className={[
          'onrep-batch-list-row__next',
          d.variant === 'today' ? 'onrep-batch-list-row__next--today' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="onrep-batch-list-row__mobile-label d-lg-none">Next</span>
        {d.variant === 'today' || d.variant === 'next' ? (
          <div>
            <div className="small fw-semibold">{d.when}</div>
            {d.place ? (
              <div className="small text-body-secondary">{d.place}</div>
            ) : null}
          </div>
        ) : (
          <span className="small text-body-secondary">None scheduled</span>
        )}
      </div>

      <div className="onrep-batch-list-row__coach">
        <span className="onrep-batch-list-row__mobile-label d-lg-none">Coach</span>
        {m.needCoach ? (
          <Link to={`${m.base}?tab=settings`} className="small text-primary text-decoration-none">
            Assign coach
          </Link>
        ) : (
          <span className="small">{m.coachDisplay || '—'}</span>
        )}
      </div>

      <div className="onrep-batch-list-row__links">
        <span className="onrep-batch-list-row__mobile-label d-lg-none">Actions</span>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Link to={`${m.base}?tab=schedule`} className="small text-primary text-decoration-none">
            Open
          </Link>
          <Link to={m.scheduleHref} className="small text-primary text-decoration-none">
            Schedule
          </Link>
          <CButton
            size="sm"
            color="danger"
            variant="ghost"
            className="p-0 small"
            onClick={() => onDelete(m.id, m.batchNameOnly)}
          >
            Delete
          </CButton>
        </div>
      </div>
    </div>
  )
}

const BatchesListPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const coachLike = useCoachLikeRole(user)
  const {
    bootstrapComplete,
    status: workspaceStatus,
    activities,
    error: workspaceError,
  } = useSelector((state) => state.workspace)
  const activeActivityId = useSelector((state) => state.workspace.activeActivityId)
  const {
    items,
    listLoading,
    listError,
    mutationLoading,
    mutationError,
    fetchBatches,
    createBatch,
    deleteBatch,
    clearErrors,
  } = useBatches()

  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [newName, setNewName] = useState('')
  const [feeInr, setFeeInr] = useState('')
  const [subActivitiesRows, setSubActivitiesRows] = useState([])
  const [subActivitiesLoading, setSubActivitiesLoading] = useState(false)
  const [selectedSubActivityId, setSelectedSubActivityId] = useState('')
  const [viewMode, setViewMode] = useState(() => {
    try {
      const v = localStorage.getItem(BATCHES_VIEW_STORAGE_KEY)
      if (v === 'list' || v === 'tiles') return v
    } catch {
      /* ignore */
    }
    return 'tiles'
  })

  const todayIso = todayIsoLocal()

  const workspaceBootstrapping =
    coachLike && (!bootstrapComplete || workspaceStatus === 'idle' || workspaceStatus === 'loading')
  const workspaceFailed = bootstrapComplete && workspaceStatus === 'failed'

  useEffect(() => {
    try {
      localStorage.setItem(BATCHES_VIEW_STORAGE_KEY, viewMode)
    } catch {
      /* ignore */
    }
  }, [viewMode])

  useEffect(() => {
    if (!coachLike) {
      fetchBatches()
      return
    }
    if (!bootstrapComplete) return
    fetchBatches()
  }, [coachLike, bootstrapComplete, fetchBatches])

  useEffect(() => {
    if (!bootstrapComplete || workspaceStatus !== 'succeeded') return
    if (activities.length === 1 && !activeActivityId) {
      dispatch(setActiveWorkspace(activities[0].id))
    }
  }, [bootstrapComplete, workspaceStatus, activities, activeActivityId, dispatch])

  useEffect(() => {
    let cancelled = false
    if (!addOpen || !activeActivityId) {
      return () => {
        cancelled = true
      }
    }
    queueMicrotask(() => {
      if (cancelled) return
      setSubActivitiesLoading(true)
      ;(async () => {
        try {
          const subActivities = await academySubActivitiesApi.list({ activeOnly: true })
          if (cancelled) return
          setSubActivitiesRows(subActivities)
          if (subActivities.length === 1) {
            setSelectedSubActivityId(String(subActivities[0].id))
          } else {
            setSelectedSubActivityId('')
          }
        } catch {
          if (!cancelled) {
            setSubActivitiesRows([])
            setSelectedSubActivityId('')
          }
        } finally {
          if (!cancelled) setSubActivitiesLoading(false)
        }
      })()
    })
    return () => {
      cancelled = true
    }
  }, [addOpen, activeActivityId])

  const displayItems = useMemo(() => {
    if (!activeActivityId) return []
    if (!items?.length) return []
    return items.filter((b) => String(b.activityWorkspaceId || '') === String(activeActivityId))
  }, [activeActivityId, items])

  const rowModels = useMemo(
    () => displayItems.map((b) => buildBatchRowModel(b, todayIso)),
    [displayItems, todayIso],
  )

  const openAddModal = () => {
    clearErrors()
    setNewName('')
    setFeeInr('')
    setSelectedSubActivityId('')
    setSubActivitiesRows([])
    setAddOpen(true)
  }

  const handleCreateBatch = async () => {
    const name = newName.trim()
    if (!name) return
    if (!activeActivityId) return
    const sid = selectedSubActivityId.trim()
    if (!sid) return
    try {
      const payload = { name, subActivityId: sid }
      if (feeInr !== '') {
        const n = Number(feeInr)
        if (Number.isFinite(n) && n >= 0) payload.feeInr = Math.round(n)
      }
      const batch = await createBatch(payload).unwrap()
      setAddOpen(false)
      const id = batch?.id || batch?._id
      if (id) {
        navigate(`/coach/batches/${encodeURIComponent(id)}?tab=settings`)
      }
    } catch {
      // mutationError set in slice
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteBatch(deleteTarget.id).unwrap()
      setDeleteTarget(null)
    } catch {
      // mutationError set in slice
    }
  }

  return (
    <CCard className="onrep-batches-shell border-0 shadow-none bg-transparent">
      <CCardHeader className="onrep-batches-toolbar border-0 pb-0 px-0 pt-1 bg-transparent">
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
          <strong className="onrep-batches-toolbar__title fs-5">Batches</strong>
          <div className="d-flex flex-wrap align-items-center gap-2 justify-content-md-end">
            <CButtonGroup role="group" aria-label="Batches layout" className="onrep-batches-view-toggle">
              <CButton
                type="button"
                color="secondary"
                variant="outline"
                size="sm"
                active={viewMode === 'tiles'}
                onClick={() => setViewMode('tiles')}
                title="Tiled cards"
              >
                <CIcon icon={cilGrid} size="sm" className="me-1" aria-hidden />
                Tiles
              </CButton>
              <CButton
                type="button"
                color="secondary"
                variant="outline"
                size="sm"
                active={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                title="List"
              >
                <CIcon icon={cilList} size="sm" className="me-1" aria-hidden />
                List
              </CButton>
            </CButtonGroup>
            <CButton
              color="primary"
              type="button"
              onClick={openAddModal}
              disabled={!activeActivityId}
              title={!activeActivityId ? 'Choose where you’re working in the header first' : undefined}
            >
              Add batch
            </CButton>
          </div>
        </div>
      </CCardHeader>
      <CCardBody className="px-0 pt-4">
        {workspaceBootstrapping ? (
          <div className="text-center py-5 text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading workspace…</div>
          </div>
        ) : null}

        {!workspaceBootstrapping && workspaceFailed ? (
          <CAlert
            color="danger"
            className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2"
          >
            <span>{workspaceError?.message || 'Could not load your practices.'}</span>
            <CButton
              size="sm"
              color="danger"
              variant="outline"
              className="align-self-sm-center"
              onClick={() => dispatch(bootstrapWorkspace())}
            >
              Retry
            </CButton>
          </CAlert>
        ) : null}

        {!workspaceBootstrapping && !workspaceFailed && listError ? (
          <CAlert color="danger" className="d-flex justify-content-between align-items-center">
            <span>{listError.message}</span>
            <CButton size="sm" color="danger" variant="outline" onClick={() => fetchBatches()}>
              Retry
            </CButton>
          </CAlert>
        ) : null}

        {!workspaceBootstrapping && !workspaceFailed && listLoading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" />
          </div>
        ) : null}

        {!workspaceBootstrapping &&
        !workspaceFailed &&
        !listLoading &&
        !listError &&
        !displayItems.length ? (
          <CAlert color="info">
            {activeActivityId
              ? 'No groups here yet. Add one when you’re ready.'
              : 'Choose your practice in the header (or wait for it to load), then your groups will appear here.'}
          </CAlert>
        ) : null}

        {!workspaceBootstrapping && !workspaceFailed && !listLoading && displayItems.length ? (
          viewMode === 'tiles' ? (
            <CRow className="g-4 onrep-batch-grid">
              {rowModels.map((m) => (
                <CCol key={m.id} xs={12} md={6} xl={4}>
                  <BatchTileCard m={m} onDelete={(id, name) => setDeleteTarget({ id, name })} />
                </CCol>
              ))}
            </CRow>
          ) : (
            <div className="onrep-batch-list-table border rounded-3 overflow-hidden bg-body">
              <div className="onrep-batch-list-head d-none d-lg-grid text-body-secondary small fw-semibold text-uppercase">
                <span>Batch</span>
                <span>Details</span>
                <span>Weekly pattern</span>
                <span>Next session</span>
                <span>Coach</span>
                <span className="text-end">Actions</span>
              </div>
              <div className="onrep-batch-list-body">
                {rowModels.map((m) => (
                  <BatchListRow key={m.id} m={m} onDelete={(id, name) => setDeleteTarget({ id, name })} />
                ))}
              </div>
            </div>
          )
        ) : null}
      </CCardBody>

      <CModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        alignment="center"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Add batch</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {mutationError ? (
            <CAlert color="danger" className="mb-3">
              {mutationError.message}
            </CAlert>
          ) : null}
          {!activeActivityId ? (
            <CAlert color="warning" className="mb-3">
              Choose where you’re working in the header before creating a batch.
            </CAlert>
          ) : null}
          {subActivitiesLoading ? (
            <div className="text-center py-3 mb-3">
              <CSpinner color="primary" size="sm" />
            </div>
          ) : subActivitiesRows.length > 1 ? (
            <div className="mb-3">
              <CFormLabel htmlFor="batch-sub-activity">Specialization</CFormLabel>
              <CFormSelect
                id="batch-sub-activity"
                value={selectedSubActivityId}
                onChange={(e) => setSelectedSubActivityId(e.target.value)}
              >
                <option value="">Select…</option>
                {subActivitiesRows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayIcon ? `${s.displayIcon} ` : ''}
                    {s.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
          ) : subActivitiesRows.length === 1 ? (
            <p className="small text-body-secondary mb-3">
              Specialization: <strong>{subActivitiesRows[0]?.name}</strong>
            </p>
          ) : activeActivityId ? (
            <CAlert color="danger" className="mb-3">
              No specializations set up for this practice yet. Ask an owner to add them, or try refreshing.
            </CAlert>
          ) : null}
          <div className="mb-3">
            <CFormLabel htmlFor="batch-name">Batch name</CFormLabel>
            <CFormInput
              id="batch-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Morning Squad"
              autoComplete="off"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateBatch()
                }
              }}
            />
          </div>
          <div className="mb-0">
            <CFormLabel htmlFor="batch-fee">Default fee (INR, optional)</CFormLabel>
            <CFormInput
              id="batch-fee"
              type="number"
              min={0}
              step={1}
              value={feeInr}
              onChange={(e) => setFeeInr(e.target.value)}
              placeholder="Leave blank if not set"
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setAddOpen(false)}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            disabled={
              mutationLoading ||
              !newName.trim() ||
              !activeActivityId ||
              subActivitiesLoading ||
              !selectedSubActivityId.trim() ||
              subActivitiesRows.length === 0
            }
            onClick={handleCreateBatch}
          >
            {mutationLoading ? (
              <>
                <CSpinner size="sm" className="me-2" /> Creating…
              </>
            ) : (
              'Create batch'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Delete batch</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {mutationError ? (
            <CAlert color="danger" className="mb-3">
              {mutationError.message}
            </CAlert>
          ) : null}
          <p>
            Delete <strong>{deleteTarget?.name}</strong>? This will remove the batch, its coach assignments, and student enrolments. Sessions and payments are not affected.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </CButton>
          <CButton color="danger" disabled={mutationLoading} onClick={handleDeleteConfirm}>
            {mutationLoading ? <><CSpinner size="sm" className="me-2" />Deleting…</> : 'Delete batch'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default BatchesListPage
