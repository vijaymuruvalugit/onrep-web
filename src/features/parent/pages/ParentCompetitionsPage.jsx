import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'

import useParent from '../hooks/useParent'
import { formatShortDate } from '../utils/formatParentDate'

const ParentCompetitionsPage = () => {
  const { competitions, competitionsLoading, competitionsError, loadCompetitions } = useParent()

  useEffect(() => {
    loadCompetitions({ limit: 50, offset: 0 })
  }, [loadCompetitions])

  const retry = () => loadCompetitions({ limit: 50, offset: 0 })

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="mb-0">Competitions</h2>
          <p className="text-body-secondary small mb-0">Academy competitions and events.</p>
        </div>
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          onClick={retry}
          disabled={competitionsLoading}
        >
          <CIcon icon={cilReload} className="me-1" />
          Refresh
        </CButton>
      </div>

      {competitionsError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{competitionsError.message || 'Unable to load competitions.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {competitionsLoading && !competitions.length ? (
        <div className="text-center py-4">
          <CSpinner />
        </div>
      ) : null}

      {!competitionsLoading && !competitions.length && !competitionsError ? (
        <CAlert color="info">No competitions listed.</CAlert>
      ) : null}

      <CCard>
        <CCardHeader>Upcoming &amp; recent</CCardHeader>
        <CCardBody className="p-0 overflow-auto">
          <CTable hover responsive className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                <CTableHeaderCell scope="col">Category</CTableHeaderCell>
                <CTableHeaderCell scope="col">Dates</CTableHeaderCell>
                <CTableHeaderCell scope="col"> </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {competitions.map((c) => {
                const id = c.id
                const name = c.name || c.title || 'Competition'
                const cat = c.category || '—'
                const start = c.start_date || c.startDate
                const end = c.end_date || c.endDate
                return (
                  <CTableRow key={id}>
                    <CTableDataCell>{name}</CTableDataCell>
                    <CTableDataCell>{cat}</CTableDataCell>
                    <CTableDataCell>
                      {formatShortDate(start)}
                      {end && end !== start ? ` – ${formatShortDate(end)}` : ''}
                    </CTableDataCell>
                    <CTableDataCell>
                      {id ? (
                        <Link to={`/parent/competitions/${encodeURIComponent(id)}/leaderboard`}>
                          Leaderboard
                        </Link>
                      ) : null}
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentCompetitionsPage
