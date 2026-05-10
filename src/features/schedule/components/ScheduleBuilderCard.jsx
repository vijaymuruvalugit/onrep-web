import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CRow,
} from '@coreui/react'
import PlaceSelect from '../../places/components/PlaceSelect'
import { uiDayLabelsToApi, UI_DAY_LABELS_ORDERED } from '../utils/daysOfWeek'

const ScheduleBuilderCard = ({
  batchId,
  places = [],
  placeId,
  onPlaceIdChange,
  onSave,
  saving,
  mutationError,
}) => {
  const [days, setDays] = useState(['Mon', 'Wed', 'Fri'])
  const [startTime, setStartTime] = useState('05:15')
  const [endTime, setEndTime] = useState('06:30')

  const toggleDay = (day) => {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )
  }

  const handleSubmit = () => {
    if (!batchId || !days.length) return
    const daysOfWeek = uiDayLabelsToApi(days)
    if (!daysOfWeek.length) return
    onSave({
      batchId,
      daysOfWeek,
      startTime,
      endTime,
      slotName: 'Weekly schedule',
      placeId: placeId || undefined,
    })
  }

  return (
    <CCard className="border-secondary-subtle shadow-none">
      <CCardHeader className="py-2 bg-body-secondary bg-opacity-10">
        <span className="small fw-semibold text-body-secondary">Pattern builder</span>
      </CCardHeader>
      <CCardBody className="py-3">
        {mutationError ? <CAlert color="danger">{mutationError.message}</CAlert> : null}
        <CFormLabel className="small mb-1">Days</CFormLabel>
        <CRow className="mb-2 g-1">
          {UI_DAY_LABELS_ORDERED.map((day) => (
            <CCol key={day} xs={6} sm={4} md={3} lg={2}>
              <CFormCheck
                id={`day-${day}`}
                label={day}
                checked={days.includes(day)}
                onChange={() => toggleDay(day)}
                className="mb-0"
              />
            </CCol>
          ))}
        </CRow>

        <CRow className="g-2">
          <CCol md={4}>
            <CFormLabel className="small mb-1">Start time</CFormLabel>
            <CFormInput
              size="sm"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </CCol>
          <CCol md={4}>
            <CFormLabel className="small mb-1">End time</CFormLabel>
            <CFormInput
              size="sm"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </CCol>
          <CCol md={4}>
            <CFormLabel className="small mb-1">Place</CFormLabel>
            <PlaceSelect
              places={places}
              value={placeId}
              onChange={onPlaceIdChange}
              disabled={saving}
            />
          </CCol>
        </CRow>

        <div className="mt-2 d-flex justify-content-end">
          <CButton
            color="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !days.length}
          >
            {saving ? 'Saving…' : 'Save schedule'}
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ScheduleBuilderCard
