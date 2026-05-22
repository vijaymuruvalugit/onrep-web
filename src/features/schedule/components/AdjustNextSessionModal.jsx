import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react'
import { formatDisplayDateDmy } from '../../dashboard/utils/calendarDate'

/**
 * Lightweight modal for the per-pattern "Adjust next session time" action.
 * Lives next to a pattern card; reads from the upcoming session row and
 * delegates the PATCH to the parent.
 */
export default function AdjustNextSessionModal({
  visible,
  session, // { id, sessionDate, startTime, endTime }
  onClose,
  onSave, // ({ sessionId, startTime, endTime }) => Promise<void>
  busy,
  error,
}) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (!visible) return
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate fields from the targeted session when modal opens */
    setStartTime(session?.startTime || '')
    setEndTime(session?.endTime || '')
    setLocalError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, session])

  const handleSave = async () => {
    if (!startTime) {
      setLocalError('Start time is required.')
      return
    }
    if (endTime && endTime <= startTime) {
      setLocalError('End time must be after start time.')
      return
    }
    setLocalError(null)
    await onSave({ sessionId: session?.id, startTime, endTime })
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Adjust next session time</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {localError || error ? (
          <CAlert color="danger" className="py-2">
            {localError || error}
          </CAlert>
        ) : null}
        <p className="small text-body-secondary">
          Changes only the next session on this pattern. The recurring schedule itself isn't
          touched.
        </p>
        {session?.sessionDate ? (
          <p className="small mb-3">
            Next session is on <strong>{formatDisplayDateDmy(session.sessionDate)}</strong>.
          </p>
        ) : null}
        <CRow className="g-2">
          <CCol xs={6}>
            <CFormLabel className="small mb-1">New start</CFormLabel>
            <CFormInput
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </CCol>
          <CCol xs={6}>
            <CFormLabel className="small mb-1">New end</CFormLabel>
            <CFormInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleSave} disabled={busy || !session?.id}>
          {busy ? 'Saving…' : 'Apply new times'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
