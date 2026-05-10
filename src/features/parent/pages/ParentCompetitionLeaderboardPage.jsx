import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
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

const ParentCompetitionLeaderboardPage = () => {
  const { competitionId } = useParams()
  const { leaderboard, leaderboardLoading, leaderboardError, loadLeaderboard, resetLeaderboard } =
    useParent()

  useEffect(() => {
    if (!competitionId) return undefined
    loadLeaderboard(competitionId, { limit: 100, offset: 0 })
    return () => resetLeaderboard()
  }, [competitionId, loadLeaderboard, resetLeaderboard])

  const retry = () => {
    if (competitionId) loadLeaderboard(competitionId, { limit: 100, offset: 0 })
  }

  return (
    <>
      <p className="small mb-2">
        <Link to="/parent/competitions">← Competitions</Link>
      </p>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="mb-0">Leaderboard</h2>
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          onClick={retry}
          disabled={leaderboardLoading}
        >
          <CIcon icon={cilReload} className="me-1" />
          Refresh
        </CButton>
      </div>

      {leaderboardError ? (
        <CAlert
          color="danger"
          className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center"
        >
          <span>{leaderboardError.message || 'Unable to load leaderboard.'}</span>
          <CButton color="danger" variant="outline" size="sm" onClick={retry}>
            Retry
          </CButton>
        </CAlert>
      ) : null}

      {leaderboardLoading ? (
        <div className="text-center py-4">
          <CSpinner />
        </div>
      ) : null}

      <CCard>
        <CCardHeader>Results</CCardHeader>
        <CCardBody className="p-0 overflow-auto">
          <CTable hover responsive className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">Rank</CTableHeaderCell>
                <CTableHeaderCell scope="col">Athlete</CTableHeaderCell>
                <CTableHeaderCell scope="col">Score</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {(Array.isArray(leaderboard) ? leaderboard : []).map((row) => (
                <CTableRow key={row.id || `${row.student_id}-${row.rank}`}>
                  <CTableDataCell>{row.rank ?? row.rank_ ?? '—'}</CTableDataCell>
                  <CTableDataCell>{row.student_name || row.studentName || '—'}</CTableDataCell>
                  <CTableDataCell>{row.score ?? '—'}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ParentCompetitionLeaderboardPage
