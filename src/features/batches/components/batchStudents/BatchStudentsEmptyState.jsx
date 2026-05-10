import React from 'react'
import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople } from '@coreui/icons'

export default function BatchStudentsEmptyState({ onAddStudents }) {
  return (
    <div className="onrep-batch-roster-empty text-center py-5 px-4">
      <div className="onrep-batch-roster-empty__icon mb-3 text-body-secondary" aria-hidden>
        <CIcon icon={cilPeople} size="3xl" />
      </div>
      <p className="fw-semibold mb-2">No students assigned yet.</p>
      <p className="small text-body-secondary mb-4 mx-auto onrep-batch-roster-empty__copy">
        Add students to begin tracking attendance, sessions, and progress for this batch.
      </p>
      <CButton color="primary" onClick={onAddStudents}>
        Add students
      </CButton>
    </div>
  )
}
