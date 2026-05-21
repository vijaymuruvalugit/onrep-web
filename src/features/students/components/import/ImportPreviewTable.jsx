import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CBadge } from '@coreui/react'

function rowStatus(row) {
  if (row.ready_to_import) return { label: 'Ready', color: 'success' }
  const hasError = (row.issues || []).some((i) => i.severity === 'error')
  if (hasError) return { label: 'Error', color: 'danger' }
  return { label: 'Review', color: 'warning' }
}

const ImportPreviewTable = ({ rows, loading }) => {
  return (
    <CCard>
      <CCardHeader>
        <strong>Preview</strong>
        <span className="small text-body-secondary ms-2">Read-only — fix your file and re-upload if needed</span>
      </CCardHeader>
      <CCardBody className="p-0">
        <div className="table-responsive" style={{ maxHeight: '420px' }}>
          <CTable hover small className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Row</CTableHeaderCell>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>DOB</CTableHeaderCell>
                <CTableHeaderCell>Parent</CTableHeaderCell>
                <CTableHeaderCell>Batch</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-4 text-body-secondary">
                    Validating…
                  </CTableDataCell>
                </CTableRow>
              ) : null}
              {!loading &&
                (rows || []).map((row) => {
                  const st = rowStatus(row)
                  const firstIssue = (row.issues || []).find((i) => i.severity === 'error') || row.issues?.[0]
                  return (
                    <CTableRow key={row.source_row_number}>
                      <CTableDataCell>{row.source_row_number}</CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-semibold">{row.full_name || '—'}</div>
                        <div className="small text-body-secondary">{row.gender || ''}</div>
                      </CTableDataCell>
                      <CTableDataCell>{row.date_of_birth || '—'}</CTableDataCell>
                      <CTableDataCell>
                        <div>{row.parent_name || '—'}</div>
                        <div className="small text-body-secondary">{row.parent_phone || ''}</div>
                      </CTableDataCell>
                      <CTableDataCell>{row.batch_name || '—'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={st.color}>{st.label}</CBadge>
                        {firstIssue ? (
                          <div className="small text-body-secondary mt-1" title={firstIssue.message}>
                            {firstIssue.message}
                          </div>
                        ) : null}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
            </CTableBody>
          </CTable>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ImportPreviewTable
