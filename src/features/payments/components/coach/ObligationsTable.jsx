import React, { useMemo } from 'react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormCheck,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import StatusBadge from '../StatusBadge'
import { formatInr } from '../../utils/formatInr'
import { formatDueShort } from '../../utils/formatDueShort'
import { coachObligationBadges } from '../../utils/coachObligationBadges'

const ObligationsTable = ({
  obligations,
  loading,
  error,
  studentId,
  studentName,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onRecordPayment,
  onRemind,
  onBulkClick,
  remindBusyById,
  bulkLoading,
  onRefresh,
  refreshDisabled,
}) => {
  const allSelectableIds = useMemo(
    () => obligations.filter((ob) => ob.payment_status !== 'PAID').map((ob) => ob.id),
    [obligations],
  )
  const allSelected =
    allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedIds.includes(id))

  const selectedCount = selectedIds.length

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>
          {studentId ? `Fees for ${studentName || 'student'}` : 'All fees'}
          {loading ? <CSpinner size="sm" className="ms-2" /> : null}
        </span>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          {typeof onRefresh === 'function' ? (
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshDisabled}
            >
              <CIcon icon={cilReload} className="me-1" /> Refresh
            </CButton>
          ) : null}
          {selectedCount > 0 ? (
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={bulkLoading}
            >
              Clear ({selectedCount})
            </CButton>
          ) : null}
          <CButton
            color="dark"
            size="sm"
            onClick={onBulkClick}
            disabled={selectedCount === 0 || bulkLoading}
          >
            {bulkLoading ? (
              <>
                <CSpinner size="sm" className="me-2" /> Working…
              </>
            ) : (
              `Mark ${selectedCount || ''} as paid`
            )}
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        {error ? (
          <CAlert color="danger" className="py-2">
            {error.message || 'Unable to load fees.'}
          </CAlert>
        ) : null}

        <div className="table-responsive">
          <CTable hover className="align-top mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: 36 }}>
                  <CFormCheck
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={() => onSelectAll(allSelectableIds, !allSelected)}
                    disabled={allSelectableIds.length === 0}
                  />
                </CTableHeaderCell>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>Period</CTableHeaderCell>
                <CTableHeaderCell>Due</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Payment details</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {obligations.length === 0 && !loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center text-body-secondary py-4">
                    {studentId
                      ? 'No fees for this student yet. Fees appear automatically when the student is active and has a batch or student fee set.'
                      : 'No fees yet. They are created automatically for active students with a batch or student fee configured.'}
                  </CTableDataCell>
                </CTableRow>
              ) : null}

              {obligations.map((ob) => {
                const remaining = Math.max(
                  0,
                  (Number(ob.amount_due) || 0) - (Number(ob.amount_paid) || 0),
                )
                const isPaid = ob.payment_status === 'PAID'
                const checkboxId = `select-${ob.id}`
                const remindBusy = !!remindBusyById?.[ob.id]
                return (
                  <CTableRow key={ob.id}>
                    <CTableDataCell>
                      <CFormCheck
                        id={checkboxId}
                        aria-label={`Select fee ${ob.id}`}
                        checked={selectedIds.includes(ob.id)}
                        onChange={() => onToggleSelect(ob.id)}
                        disabled={isPaid}
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold">{ob.student_name || ob.student_id}</div>
                    </CTableDataCell>
                    <CTableDataCell>{ob.period_month || '—'}</CTableDataCell>
                    <CTableDataCell>{formatDueShort(ob.due_date)}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <div className="fw-semibold">₹{formatInr(ob.amount_due)}</div>
                      <div className="text-body-secondary small">
                        Paid ₹{formatInr(ob.amount_paid)} · Remaining ₹{formatInr(remaining)}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <StatusBadge status={ob.payment_status} dueDate={ob.due_date} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex flex-wrap gap-1 align-items-center">
                        {coachObligationBadges(ob).map((b) => (
                          <CBadge key={b.key} color={b.color}>
                            {b.text}
                          </CBadge>
                        ))}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      {!isPaid ? (
                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                          <CButton
                            size="sm"
                            color="secondary"
                            variant="outline"
                            onClick={() => onRemind(ob.id)}
                            disabled={remindBusy}
                          >
                            {remindBusy ? (
                              <>
                                <CSpinner size="sm" className="me-2" /> Sending…
                              </>
                            ) : (
                              'Remind'
                            )}
                          </CButton>
                          <CButton size="sm" color="primary" onClick={() => onRecordPayment(ob)}>
                            Record payment
                          </CButton>
                        </div>
                      ) : (
                        <span className="text-body-secondary small">Paid</span>
                      )}
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

export default ObligationsTable
