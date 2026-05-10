import React from 'react'
import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'

export default function BatchStudentsHeader({ onAddStudents }) {
  return (
    <div className="onrep-batch-students-header d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="h5 mb-1 fw-semibold">Students</h2>
        <p className="small text-body-secondary mb-0">
          Manage students assigned to this batch.
        </p>
      </div>
      <CButton color="primary" className="flex-shrink-0" onClick={onAddStudents}>
        <CIcon icon={cilPlus} className="me-2" />
        Add students
      </CButton>
    </div>
  )
}
