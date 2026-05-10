import React, { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import PlaceStatusBadge from '../components/PlaceStatusBadge'
import PlacesListSkeleton from '../components/PlacesListSkeleton'
import usePlaces from '../hooks/usePlaces'
import { formatPlaceAddressSummary } from '../utils/placeMappers'
import { buildRowNavProps } from '../../../utils/rowNav'

export default function PlacesListPage() {
  const navigate = useNavigate()
  const {
    items,
    listLoading,
    listError,
    statsLoading,
    statsError,
    statsByPlaceId,
    filters,
    fetchPlaces,
    fetchPlacesUsageStats,
    setPlacesFilters,
  } = usePlaces()

  useEffect(() => {
    fetchPlaces({ status: filters.status, q: filters.q || undefined })
  }, [filters.status, filters.q, fetchPlaces])

  useEffect(() => {
    fetchPlacesUsageStats()
  }, [fetchPlacesUsageStats])

  const onSearchSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const q = String(fd.get('q') || '').trim()
    setPlacesFilters({ q })
  }

  const statsHint = useMemo(() => {
    if (statsLoading) return '…'
    if (statsError) return '—'
    return null
  }, [statsLoading, statsError])

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="py-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <strong>Places</strong>
            <div className="small text-body-secondary mb-0">
              Venues used in schedules and classes. Manage locations that batches meet at.
            </div>
          </div>
          <CButton as={Link} to="/coach/places/new" color="primary" size="sm">
            Add place
          </CButton>
        </CCardHeader>
        <CCardBody className="py-2">
          <CRow className="g-2 align-items-end mb-2">
            <CCol xs={12} md={4}>
              <form onSubmit={onSearchSubmit} className="d-flex gap-1">
                <CFormInput
                  size="sm"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search name or address"
                  aria-label="Search places"
                />
                <CButton type="submit" color="primary" size="sm" variant="outline">
                  Search
                </CButton>
              </form>
            </CCol>
            <CCol xs={6} md={3}>
              <CFormSelect
                size="sm"
                aria-label="Status"
                value={filters.status}
                onChange={(e) => setPlacesFilters({ status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </CFormSelect>
            </CCol>
            <CCol xs={6} md="auto" className="ms-md-auto">
              <CButton
                type="button"
                color="secondary"
                variant="ghost"
                size="sm"
                onClick={() => fetchPlacesUsageStats()}
                disabled={statsLoading}
              >
                Refresh usage
              </CButton>
            </CCol>
          </CRow>

          {listError ? (
            <CAlert color="danger" className="py-2 mb-2">
              {listError.message}
              <CButton
                className="ms-2"
                size="sm"
                color="danger"
                variant="outline"
                onClick={() => fetchPlaces()}
              >
                Retry
              </CButton>
            </CAlert>
          ) : null}
          {statsError ? (
            <CAlert color="warning" className="py-2 mb-2">
              Usage summary unavailable: {statsError.message}
            </CAlert>
          ) : null}

          {listLoading ? <PlacesListSkeleton /> : null}

          {!listLoading && !items.length ? (
            <CAlert color="light" className="mb-0 py-3">
              <div className="fw-semibold">No places yet.</div>
              <div className="small text-body-secondary mb-2">
                Add a venue so schedules can reference a real location.
              </div>
              <CButton as={Link} to="/coach/places/new" color="primary" size="sm">
                Add place
              </CButton>
            </CAlert>
          ) : null}

          {!listLoading && items.length ? (
            <>
              <div className="d-none d-md-block">
                <CTable hover responsive className="mb-0 align-middle small">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell scope="col">Place</CTableHeaderCell>
                      <CTableHeaderCell scope="col">Location</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="text-end">
                        Schedules
                      </CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="text-end">
                        Batches
                      </CTableHeaderCell>
                      <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {items.map((place) => {
                      const st = statsByPlaceId[place.id]
                      const sc = st?.scheduleCount ?? statsHint ?? 0
                      const bc = st?.batchCount ?? statsHint ?? 0
                      const detailPath = `/coach/places/${encodeURIComponent(place.id)}`
                      return (
                        <CTableRow key={place.id} {...buildRowNavProps(navigate, detailPath)}>
                          <CTableDataCell className="py-2">
                            <Link to={detailPath} className="fw-semibold text-decoration-none">
                              {place.name}
                            </Link>
                            {place.createdBy ? (
                              <div className="text-body-secondary" style={{ fontSize: '0.75rem' }}>
                                Added by coach
                              </div>
                            ) : null}
                          </CTableDataCell>
                          <CTableDataCell className="py-2 text-body-secondary">
                            {formatPlaceAddressSummary(place) || '—'}
                          </CTableDataCell>
                          <CTableDataCell className="py-2 text-end">{sc}</CTableDataCell>
                          <CTableDataCell className="py-2 text-end">{bc}</CTableDataCell>
                          <CTableDataCell className="py-2">
                            <PlaceStatusBadge isActive={place.isActive} />
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })}
                  </CTableBody>
                </CTable>
              </div>

              <div className="d-md-none">
                {items.map((place) => {
                  const st = statsByPlaceId[place.id]
                  const sc = st?.scheduleCount ?? statsHint ?? 0
                  const bc = st?.batchCount ?? statsHint ?? 0
                  return (
                    <CCard key={place.id} className="mb-2">
                      <CCardBody className="py-2">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <Link
                            to={`/coach/places/${encodeURIComponent(place.id)}`}
                            className="fw-semibold"
                          >
                            {place.name}
                          </Link>
                          <PlaceStatusBadge isActive={place.isActive} />
                        </div>
                        <div className="small text-body-secondary text-truncate">
                          {formatPlaceAddressSummary(place) || '—'}
                        </div>
                        <div className="small mt-1">
                          {sc} weekly schedule{sc === 1 ? '' : 's'} · {bc} batch
                          {bc === 1 ? '' : 'es'}
                        </div>
                      </CCardBody>
                    </CCard>
                  )
                })}
              </div>
            </>
          ) : null}

          {statsLoading ? (
            <div className="small text-body-secondary mt-1">
              <CSpinner size="sm" className="me-1" />
              Updating usage…
            </div>
          ) : null}
        </CCardBody>
      </CCard>
    </>
  )
}
