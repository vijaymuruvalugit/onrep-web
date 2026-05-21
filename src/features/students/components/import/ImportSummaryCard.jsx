import React from 'react'
import { CCard, CCardBody, CCol, CRow } from '@coreui/react'

function Stat({ label, value, tone = 'body' }) {
  const colorClass =
    tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'success' ? 'text-success' : ''
  return (
    <CCol xs={6} md={3}>
      <div className={`fs-4 fw-bold ${colorClass}`}>{value}</div>
      <div className="small text-body-secondary">{label}</div>
    </CCol>
  )
}

const ImportSummaryCard = ({ summary, fileName, title = 'Import summary' }) => {
  if (!summary) return null

  return (
    <CCard className="mb-3 border-primary border-2">
      <CCardBody>
        <div className="fw-semibold mb-1">{title}</div>
        {fileName ? <div className="small text-body-secondary mb-3">{fileName}</div> : null}
        <CRow className="g-3">
          <Stat label="Rows uploaded" value={summary.total_rows ?? 0} />
          <Stat label="Ready to import" value={summary.ready_to_import ?? 0} tone="success" />
          <Stat label="Warnings" value={summary.warning_count ?? 0} tone="warning" />
          <Stat
            label="Errors"
            value={summary.rows_with_errors ?? summary.error_count ?? 0}
            tone="danger"
          />
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default ImportSummaryCard
