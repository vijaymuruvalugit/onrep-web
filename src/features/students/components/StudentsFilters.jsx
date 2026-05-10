import React from 'react'
import {
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMagnifyingGlass, cilReload } from '@coreui/icons'

const StudentsFilters = ({
  filters,
  onChange,
  onReset,
  disabled = false,
  activityOptions = [],
  statusOptions = ['active', 'pending', 'inactive', 'overdue'],
}) => {
  return (
    <CRow className="g-2 mb-3">
      <CCol md={5}>
        <CInputGroup>
          <CInputGroupText>
            <CIcon icon={cilMagnifyingGlass} />
          </CInputGroupText>
          <CFormInput
            placeholder="Search by student or parent name"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            disabled={disabled}
          />
        </CInputGroup>
      </CCol>
      <CCol md={3}>
        <CFormSelect
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
          disabled={disabled}
        >
          <option value="">All status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status[0].toUpperCase() + status.slice(1)}
            </option>
          ))}
        </CFormSelect>
      </CCol>
      <CCol md={3}>
        <CFormSelect
          value={filters.activity}
          onChange={(event) => onChange({ activity: event.target.value })}
          disabled={disabled}
        >
          <option value="">All batches/activities</option>
          {activityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </CFormSelect>
      </CCol>
      <CCol md={1} className="d-grid">
        <CButton color="light" variant="outline" onClick={onReset} disabled={disabled}>
          <CIcon icon={cilReload} />
        </CButton>
      </CCol>
    </CRow>
  )
}

export default StudentsFilters
