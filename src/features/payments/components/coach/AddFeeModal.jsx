import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
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
import { useStudents } from '../../../students/hooks/useStudents'
import { lastDayOfMonth, monthStr } from '../../utils/formatDueShort'

const PERIOD_RE = /^\d{4}-\d{2}$/

/**
 * Inner stateful body for the modal. We extract it so it only mounts when
 * the modal is opened — that gives fresh defaults on every open without a
 * `setState`-in-effect reset (which React 19's strict effect rules forbid).
 */
const AddFeeForm = ({ submitting, onClose, onSubmit }) => {
  const today = useMemo(() => new Date(), [])
  const defaultPeriod = useMemo(() => monthStr(today), [today])
  const defaultDueDay = useMemo(
    () => String(lastDayOfMonth(today.getFullYear(), today.getMonth() + 1)),
    [today],
  )

  const { items, listLoading, listError, fetchStudents } = useStudents()

  const [studentId, setStudentId] = useState('')
  const [periodMonth, setPeriodMonth] = useState(defaultPeriod)
  const [dueDay, setDueDay] = useState(defaultDueDay)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!items.length && !listLoading) {
      fetchStudents({ pageSize: 200 })
    }
    // Run once on mount; the modal remounts on each open so this is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const studentOptions = useMemo(
    () =>
      [...items]
        .filter((s) => (s?.status || '').toLowerCase() !== 'inactive')
        .map((s) => ({ id: s.id, label: s.full_name || s.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [items],
  )

  const periodValid = PERIOD_RE.test(periodMonth)
  const dueDayNum = Number(dueDay)
  const dueDayValid = Number.isInteger(dueDayNum) && dueDayNum >= 1 && dueDayNum <= 31
  const studentValid = !!studentId
  const formValid = studentValid && periodValid && dueDayValid

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched(true)
    if (!formValid || submitting) return
    const [year, month] = periodMonth.split('-').map(Number)
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDayNum).padStart(2, '0')}`
    await onSubmit({ studentId, periodMonth, dueDate })
  }

  const placeholder = listLoading ? 'Loading students…' : 'Select a student'

  return (
    <CForm onSubmit={handleSubmit}>
      <CModalBody>
        <CRow className="g-3">
          <CCol xs={12}>
            <CFormLabel htmlFor="add-fee-student">Student</CFormLabel>
            <CFormSelect
              id="add-fee-student"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              disabled={listLoading || submitting}
              invalid={touched && !studentValid}
            >
              <option value="">{placeholder}</option>
              {studentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </CFormSelect>
            {!listLoading && studentOptions.length === 0 ? (
              <div className="small text-body-secondary mt-1">
                No active students yet. Add a student first, then create their fee here.
              </div>
            ) : null}
            {listError ? (
              <CAlert color="danger" className="mt-2 mb-0 py-2">
                {listError.message || 'Failed to load students.'}
              </CAlert>
            ) : null}
          </CCol>
          <CCol xs={12} sm={7}>
            <CFormLabel htmlFor="add-fee-period">Period (YYYY-MM)</CFormLabel>
            <CFormInput
              id="add-fee-period"
              value={periodMonth}
              onChange={(event) => setPeriodMonth(event.target.value)}
              placeholder="2026-05"
              invalid={touched && !periodValid}
              disabled={submitting}
            />
          </CCol>
          <CCol xs={12} sm={5}>
            <CFormLabel htmlFor="add-fee-day">Due day</CFormLabel>
            <CFormInput
              id="add-fee-day"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
              invalid={touched && !dueDayValid}
              disabled={submitting}
            />
          </CCol>
        </CRow>
        <p className="text-body-secondary small mb-0 mt-3">
          Fee amount is taken from the student&rsquo;s monthly fee. You can adjust the amount later
          from the fee row.
        </p>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </CButton>
        <CButton type="submit" color="primary" disabled={!formValid || submitting}>
          {submitting ? (
            <>
              <CSpinner size="sm" className="me-2" /> Creating…
            </>
          ) : (
            'Create fee'
          )}
        </CButton>
      </CModalFooter>
    </CForm>
  )
}

/**
 * Modal entry-point for creating a fee from the Payments page when no
 * student filter is active. Mirrors the inline create-fee form inside
 * `ObligationsTable`, but adds a student picker so coaches can pick any
 * student. Hits the same `POST /obligations` endpoint via the slice thunk.
 */
const AddFeeModal = ({ visible, submitting, onClose, onSubmit }) => (
  <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static">
    <CModalHeader>
      <CModalTitle>Add fee</CModalTitle>
    </CModalHeader>
    {visible ? <AddFeeForm submitting={submitting} onClose={onClose} onSubmit={onSubmit} /> : null}
  </CModal>
)

export default AddFeeModal
