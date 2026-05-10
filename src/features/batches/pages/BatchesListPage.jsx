import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAlert,
  CBadge,
  CButton,
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
import subActivitiesApi from '../api/subActivitiesApi'
import { bootstrapWorkspace, setActiveWorkspace } from '../../workspace/slices/workspaceSlice'
import { useCoachLikeRole } from '../../workspace/hooks/useCoachLikeRole'
import './BatchesListPage.scss'

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
    clearErrors,
  } = useBatches()

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [feeInr, setFeeInr] = useState('')
  const [subActivitiesRows, setSubActivitiesRows] = useState([])
  const [subActivitiesLoading, setSubActivitiesLoading] = useState(false)
  const [selectedSubActivityId, setSelectedSubActivityId] = useState('')

  const todayIso = todayIsoLocal()

  const workspaceBootstrapping =
    coachLike && (!bootstrapComplete || workspaceStatus === 'idle' || workspaceStatus === 'loading')
  const workspaceFailed = bootstrapComplete && workspaceStatus === 'failed'

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
          const { subActivities } = await subActivitiesApi.list({ activeOnly: true })
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
        navigate(`/coach/batches/${encodeURIComponent(id)}`)
      }
    } catch {
      // mutationError set in slice
    }
  }

  return (
    <CCard className="onrep-batches-shell border-0 shadow-none bg-transparent">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-0 pb-0 px-0 pt-1 bg-transparent">
        <strong>Batches</strong>
        <CButton
          color="primary"
          type="button"
          onClick={openAddModal}
          disabled={!activeActivityId}
          title={!activeActivityId ? 'Choose where you’re working in the header first' : undefined}
        >
          Add batch
        </CButton>
      </CCardHeader>
      <CCardBody className="px-0 pt-3">
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
          <CRow className="g-3 onrep-batch-grid">
            {displayItems.map((batch) => {
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
              const needsAttention =
                ac > 0 && upcomingN === 0 && !todaySnap && !nextSnap

              const formatSnap = (snap) =>
                formatOperationalSessionRange(
                  snap.sessionDate ?? snap.session_date,
                  snap.startTime ?? snap.start_time,
                  snap.endTime ?? snap.end_time,
                  todayIso,
                )

              const batchNameOnly = stripDemoSuffix(batch.name || 'Untitled batch')
              const subActivityLabel = batch.subActivityName
                ? stripDemoSuffix(batch.subActivityName)
                : null

              return (
                <CCol key={id || batch.name} xs={12} md={6} xl={4}>
                  <CCard className="h-100 border-0 onrep-surface-b shadow-none onrep-batch-list-card">
                    <CCardBody className="d-flex flex-column gap-1 py-3 px-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                        <Link
                          to={`${base}?tab=schedule`}
                          className="onrep-batch-list-card__title text-decoration-none text-body text-break"
                        >
                          {batchNameOnly}
                        </Link>
                        <div className="d-flex gap-1 flex-wrap justify-content-end">
                          {batch.isActive === false ? (
                            <CBadge color="secondary" className="fw-normal">
                              Inactive
                            </CBadge>
                          ) : null}
                          {students === 0 ? (
                            <CBadge color="warning" className="fw-normal">
                              Empty batch
                            </CBadge>
                          ) : null}
                          {needSchedule ? (
                            <CBadge color="info" className="fw-normal">
                              Needs schedule
                            </CBadge>
                          ) : null}
                          {needCoach ? (
                            <CBadge color="warning" className="fw-normal">
                              Coach missing
                            </CBadge>
                          ) : null}
                          {needsAttention ? (
                            <CBadge color="danger" className="fw-normal">
                              Needs attention
                            </CBadge>
                          ) : null}
                        </div>
                      </div>

                      <div className="onrep-batch-list-card__meta text-body-secondary">
                        {subActivityLabel ? (
                          <>
                            <span className="onrep-batch-list-card__stream">{subActivityLabel}</span>
                            <span className="onrep-batch-list-card__meta-sep"> · </span>
                          </>
                        ) : null}
                        {students === 1 ? '1 student' : `${students} students`}
                        {placeLabel ? (
                          <>
                            {' · '}
                            {placeLabel}
                          </>
                        ) : null}
                      </div>

                      <div className="onrep-batch-list-card__schedule">
                        {needSchedule ? (
                          <>
                            <span className="text-body-secondary">No schedule added yet.</span>{' '}
                            <Link to={scheduleHref} className="text-primary text-decoration-none">
                              Add schedule
                            </Link>
                          </>
                        ) : (
                          <span>{summary || '—'}</span>
                        )}
                      </div>

                      <div className="onrep-batch-list-card__next text-body-secondary">
                        {todaySnap ? (
                          <>
                            <div className="onrep-batch-list-card__next-row">
                              <span className="onrep-batch-list-card__next-label">Today</span>
                              <span className="onrep-batch-list-card__next-when text-body">
                                {formatSnap(todaySnap)}
                              </span>
                            </div>
                            {(todaySnap.placeName || todaySnap.place_name) ? (
                              <div className="onrep-batch-list-card__next-place text-body-secondary">
                                {stripDemoSuffix(
                                  todaySnap.placeName || todaySnap.place_name || '',
                                )}
                              </div>
                            ) : null}
                          </>
                        ) : nextSnap ? (
                          <>
                            <div className="onrep-batch-list-card__next-row">
                              <span className="onrep-batch-list-card__next-label">Next</span>
                              <span className="onrep-batch-list-card__next-when text-body">
                                {formatSnap(nextSnap)}
                              </span>
                            </div>
                            {(nextSnap.placeName || nextSnap.place_name) ? (
                              <div className="onrep-batch-list-card__next-place text-body-secondary">
                                {stripDemoSuffix(
                                  nextSnap.placeName || nextSnap.place_name || '',
                                )}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="small">No upcoming session.</span>
                        )}
                      </div>

                      <div className="onrep-batch-list-card__coach">
                        {needCoach ? (
                          <>
                            <span className="text-body-secondary">Coach not assigned.</span>{' '}
                            <Link
                              to={`${base}?tab=settings`}
                              className="text-primary text-decoration-none"
                            >
                              Assign coach
                            </Link>
                          </>
                        ) : (
                          <span>
                            Coach:{' '}
                            <span className="text-body">
                              {coachLabel || todaySnap?.coachName || nextSnap?.coachName || '—'}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="onrep-batch-list-card__actions d-flex flex-wrap gap-2 pt-1 mt-auto">
                        <Link
                          to={`${base}?tab=schedule`}
                          className="small text-primary text-decoration-none"
                        >
                          Open batch
                        </Link>
                        <Link to={scheduleHref} className="small text-primary text-decoration-none">
                          Open full schedule
                        </Link>
                        {needCoach ? (
                          <Link
                            to={`${base}?tab=settings`}
                            className="small text-primary text-decoration-none"
                          >
                            Assign coach
                          </Link>
                        ) : null}
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              )
            })}
          </CRow>
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
              <CFormLabel htmlFor="batch-sub-activity">Stream / track</CFormLabel>
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
              Stream: <strong>{subActivitiesRows[0]?.name}</strong>
            </p>
          ) : activeActivityId ? (
            <CAlert color="danger" className="mb-3">
              No tracks set up for this practice yet. Ask an owner to add them, or try refreshing.
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
    </CCard>
  )
}

export default BatchesListPage
