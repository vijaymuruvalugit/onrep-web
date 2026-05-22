import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CNav,
  CNavItem,
  CNavLink,
  CSpinner,
  CTabContent,
  CTabPane,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import PlaceStatusBadge from '../components/PlaceStatusBadge'
import usePlaces from '../hooks/usePlaces'
import classesApi from '../../classes/api/classesApi'
import { deactivatePlace, reactivatePlace } from '../slices/placesSlice'
import { formatDaysOfWeekList, formatTimeRange } from '../utils/formatScheduleDays'
import { formatPlaceAddressSummary } from '../utils/placeMappers'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

export default function PlaceDetailPage() {
  const dispatch = useDispatch()
  const { placeId } = useParams()
  const {
    selectedPlace,
    detailLoading,
    detailError,
    statsByPlaceId,
    rowsByPlaceId,
    mutationLoading,
    mutationError,
    fetchPlaceById,
    fetchPlacesUsageStats,
    clearPlacesErrors,
  } = usePlaces()

  const [activeKey, setActiveKey] = useState(1)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)

  useEffect(() => {
    if (placeId) {
      clearPlacesErrors()
      fetchPlaceById(placeId)
      fetchPlacesUsageStats()
    }
  }, [placeId, fetchPlaceById, fetchPlacesUsageStats, clearPlacesErrors])

  useEffect(() => {
    if (activeKey !== 4 || !placeId) return
    /* eslint-disable react-hooks/set-state-in-effect -- loading flags for async classes tab */
    setSessionsLoading(true)
    setSessionsError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
    const today = new Date().toISOString().slice(0, 10)
    const pid = String(placeId)
    classesApi
      .listClasses({})
      .then((data) => {
        const list = data.sessions || []
        const filtered = list
          .filter((s) => {
            const sid = s.placeId ?? s.place_id
            const d = s.sessionDate ?? s.session_date ?? s.date
            return sid && String(sid) === pid && d && String(d) >= today
          })
          .sort((a, b) => {
            const da = a.sessionDate ?? a.session_date ?? ''
            const db = b.sessionDate ?? b.session_date ?? ''
            return String(da).localeCompare(String(db))
          })
          .slice(0, 40)
        setSessions(filtered)
      })
      .catch((e) => setSessionsError(e))
      .finally(() => setSessionsLoading(false))
  }, [activeKey, placeId])

  const stats = placeId ? statsByPlaceId[placeId] : null
  const rows = useMemo(
    () => (placeId ? rowsByPlaceId[placeId] || [] : []),
    [placeId, rowsByPlaceId],
  )

  const batchLinks = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const r of rows) {
      if (seen.has(r.batchId)) continue
      seen.add(r.batchId)
      out.push(r)
    }
    return out
  }, [rows])

  const handleToggleActive = async () => {
    if (!selectedPlace) return
    clearPlacesErrors()
    try {
      if (selectedPlace.isActive) {
        await dispatch(deactivatePlace(selectedPlace.id)).unwrap()
      } else {
        await dispatch(reactivatePlace(selectedPlace.id)).unwrap()
      }
      await fetchPlaceById(selectedPlace.id)
      fetchPlacesUsageStats()
    } catch {
      /* mutationError from slice */
    }
  }

  if (detailLoading && !selectedPlace) {
    return (
      <div className="text-center py-4">
        <CSpinner />
      </div>
    )
  }

  if (detailError || !selectedPlace) {
    return (
      <CAlert color="danger">
        {detailError?.message || 'Place not found.'}{' '}
        <CButton as={Link} to="/coach/places" size="sm" color="danger" variant="outline">
          Back to places
        </CButton>
      </CAlert>
    )
  }

  const scheduleHref = `/coach/schedule?placeId=${encodeURIComponent(selectedPlace.id)}`

  return (
    <>
      <CCard className="mb-2">
        <CCardHeader className="py-2">
          <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start">
            <div>
              <h5 className="mb-0">{selectedPlace.name}</h5>
              <div className="small text-body-secondary">
                {formatPlaceAddressSummary(selectedPlace) || 'No address on file'}
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
                <PlaceStatusBadge isActive={selectedPlace.isActive} />
                {stats ? (
                  <span className="small text-body-secondary">
                    {stats.scheduleCount} weekly schedule{stats.scheduleCount === 1 ? '' : 's'} ·{' '}
                    {stats.batchCount} batch{stats.batchCount === 1 ? '' : 'es'}
                  </span>
                ) : (
                  <span className="small text-body-secondary">Usage: —</span>
                )}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-1">
              <CButton
                as={Link}
                to={`/coach/places/${encodeURIComponent(selectedPlace.id)}/edit`}
                size="sm"
                color="primary"
                variant="outline"
              >
                Edit
              </CButton>
              <CButton as={Link} to={scheduleHref} size="sm" color="primary" variant="outline">
                Schedules
              </CButton>
              <CButton as={Link} to="/coach/batches" size="sm" color="secondary" variant="outline">
                Batches
              </CButton>
            </div>
          </div>
        </CCardHeader>
      </CCard>

      {mutationError ? <CAlert color="danger">{mutationError.message}</CAlert> : null}

      <CCard>
        <CCardBody className="p-0">
          <CNav variant="tabs" role="tablist" className="px-2 pt-2">
            <CNavItem>
              <CNavLink active={activeKey === 1} onClick={() => setActiveKey(1)} role="button">
                Overview
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeKey === 2} onClick={() => setActiveKey(2)} role="button">
                Schedules
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeKey === 3} onClick={() => setActiveKey(3)} role="button">
                Batches
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeKey === 4} onClick={() => setActiveKey(4)} role="button">
                Classes
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeKey === 5} onClick={() => setActiveKey(5)} role="button">
                Settings
              </CNavLink>
            </CNavItem>
          </CNav>
          <CTabContent className="p-2">
            <CTabPane visible={activeKey === 1}>
              <div className="small">
                {selectedPlace.notes ? (
                  <p className="mb-2">{selectedPlace.notes}</p>
                ) : (
                  <p className="text-body-secondary mb-2">No notes.</p>
                )}
                <div className="text-body-secondary">
                  Most day-to-day context for this venue appears on the Schedule and class lists.
                </div>
              </div>
            </CTabPane>
            <CTabPane visible={activeKey === 2}>
              {!rows.length ? (
                <CAlert color="light" className="mb-0 py-2">
                  No schedules assigned to this place.{' '}
                  <CButton as={Link} size="sm" color="primary" to={scheduleHref}>
                    Open schedule builder
                  </CButton>
                </CAlert>
              ) : (
                <CTable small responsive hover className="mb-0 align-middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Batch</CTableHeaderCell>
                      <CTableHeaderCell>Days</CTableHeaderCell>
                      <CTableHeaderCell>Time</CTableHeaderCell>
                      <CTableHeaderCell>Slot</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {rows.map(({ batchId, batchName, schedule }, idx) => (
                      <CTableRow key={`${batchId}-${schedule.id || idx}`}>
                        <CTableDataCell className="py-1">
                          <Link to={`/coach/batches/${encodeURIComponent(batchId)}`}>
                            {batchName}
                          </Link>
                        </CTableDataCell>
                        <CTableDataCell className="py-1">
                          {formatDaysOfWeekList(schedule.daysOfWeek)}
                        </CTableDataCell>
                        <CTableDataCell className="py-1">
                          {formatTimeRange(
                            schedule.startTime ?? schedule.start_time,
                            schedule.endTime ?? schedule.end_time,
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="py-1">
                          {schedule.slotName ?? schedule.slot_name ?? '—'}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CTabPane>
            <CTabPane visible={activeKey === 3}>
              {!batchLinks.length ? (
                <CAlert color="light" className="mb-0 py-2">
                  No batches use this place in an active weekly schedule yet.
                </CAlert>
              ) : (
                <ul className="list-unstyled mb-0 small">
                  {batchLinks.map((r) => (
                    <li key={r.batchId} className="py-1 border-bottom">
                      <Link to={`/coach/batches/${encodeURIComponent(r.batchId)}`}>
                        {r.batchName}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CTabPane>
            <CTabPane visible={activeKey === 4}>
              {sessionsLoading ? <CSpinner size="sm" /> : null}
              {sessionsError ? <CAlert color="warning">{sessionsError.message}</CAlert> : null}
              {!sessionsLoading && !sessions.length ? (
                <CAlert color="light" className="mb-0 py-2">
                  No upcoming sessions at this place in the next few weeks, or session data has no
                  place id. Generate classes from batch schedules if needed.
                </CAlert>
              ) : (
                <ul className="list-unstyled mb-0 small">
                  {sessions.map((s) => {
                    const sid = s.id || s.sessionId
                    const title = s.title || s.batchName || 'Class'
                    const date = s.sessionDate || s.session_date || s.date
                    return (
                      <li
                        key={sid}
                        className="py-1 border-bottom d-flex justify-content-between gap-2"
                      >
                        <span>
                          {formatDisplayDateDmy(date)} · {title}
                        </span>
                        <CBadge color="secondary">{s.startTime || s.start_time || ''}</CBadge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CTabPane>
            <CTabPane visible={activeKey === 5}>
              <div className="small d-flex flex-column gap-2">
                <div>
                  Inactive places stay linked to historical schedules. Use reactivate when the venue
                  is available again.
                </div>
                <div>
                  <CButton
                    size="sm"
                    color={selectedPlace.isActive ? 'warning' : 'success'}
                    onClick={handleToggleActive}
                    disabled={mutationLoading}
                  >
                    {selectedPlace.isActive ? 'Deactivate place' : 'Reactivate place'}
                  </CButton>
                </div>
                <CButton
                  as={Link}
                  size="sm"
                  color="secondary"
                  variant="outline"
                  to={`/coach/places/${encodeURIComponent(selectedPlace.id)}/edit`}
                >
                  Edit details
                </CButton>
              </div>
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>
    </>
  )
}
