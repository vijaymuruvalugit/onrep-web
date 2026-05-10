import React, { useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import { formatInr } from '../../utils/formatInr'
import { paymentConfidenceLabel } from '../../utils/paymentConfidence'

/**
 * Coach-side queue of pending parent reports — confirm to apply to balance,
 * reject if incorrect. Mirrors the RN `pendingHeader` block.
 */
const PendingReportsPanel = ({
  reports,
  loading,
  error,
  confirmBusyById,
  rejectBusyById,
  onConfirm,
  onReject,
}) => {
  const [previewSrc, setPreviewSrc] = useState(null)

  if (!loading && reports.length === 0 && !error) {
    return null
  }

  return (
    <CCard className="mb-3">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>
          Pending parent reports
          {reports.length ? (
            <CBadge color="warning" className="ms-2">
              {reports.length}
            </CBadge>
          ) : null}
        </span>
        {loading ? <CSpinner size="sm" /> : null}
      </CCardHeader>
      <CCardBody>
        {error ? (
          <CAlert color="danger" className="mb-3 py-2">
            {error.message || 'Unable to load reports.'}
          </CAlert>
        ) : null}

        {!loading && reports.length === 0 ? (
          <p className="text-body-secondary mb-0">No pending reports.</p>
        ) : null}

        <div className="d-flex flex-column gap-3">
          {reports.map((report) => {
            const confidence = paymentConfidenceLabel(report)
            const transactionId = report.transaction_id
            const confirming = !!confirmBusyById?.[transactionId]
            const rejecting = !!rejectBusyById?.[transactionId]
            const busy = confirming || rejecting
            return (
              <div key={transactionId} className="border rounded-3 p-3">
                <CRow className="g-2 align-items-start">
                  <CCol md={8}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <strong>{report.student_name || report.student_id}</strong>
                      <CBadge color={confidence.color}>{confidence.label}</CBadge>
                    </div>
                    <div className="text-body-secondary small mb-1">
                      {report.period_month} · ₹{formatInr(report.amount)} · {report.method || '—'}
                    </div>
                    {report.payment_ref ? (
                      <div className="text-body-secondary small">
                        Ref: <span className="fw-semibold">{report.payment_ref}</span>
                      </div>
                    ) : null}
                    {report.reference ? (
                      <div className="text-body-secondary small">
                        UTR: <span className="fw-semibold">{report.reference}</span>
                      </div>
                    ) : null}
                    {report.recorded_at ? (
                      <div className="text-body-secondary small">
                        Reported {new Date(report.recorded_at).toLocaleString()}
                      </div>
                    ) : null}
                  </CCol>
                  <CCol md={4}>
                    {report.screenshot_url ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0"
                        onClick={() => setPreviewSrc(report.screenshot_url)}
                      >
                        <img
                          src={report.screenshot_url}
                          alt="Payment screenshot"
                          className="img-thumbnail"
                          style={{ maxHeight: '120px', objectFit: 'cover' }}
                        />
                      </button>
                    ) : (
                      <div className="text-body-secondary small">No screenshot</div>
                    )}
                  </CCol>
                </CRow>
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <CButton
                    color="success"
                    size="sm"
                    onClick={() => onConfirm(transactionId)}
                    disabled={busy}
                  >
                    {confirming ? (
                      <>
                        <CSpinner size="sm" className="me-2" /> Confirming…
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </CButton>
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(transactionId)}
                    disabled={busy}
                  >
                    {rejecting ? (
                      <>
                        <CSpinner size="sm" className="me-2" /> Rejecting…
                      </>
                    ) : (
                      'Reject'
                    )}
                  </CButton>
                </div>
              </div>
            )
          })}
        </div>
      </CCardBody>

      {previewSrc ? (
        <button
          type="button"
          className="position-fixed top-0 start-0 w-100 h-100 border-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1080 }}
          onClick={() => setPreviewSrc(null)}
          aria-label="Close screenshot preview"
        >
          <img
            src={previewSrc}
            alt="Screenshot preview"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          />
        </button>
      ) : null}
    </CCard>
  )
}

export default PendingReportsPanel
