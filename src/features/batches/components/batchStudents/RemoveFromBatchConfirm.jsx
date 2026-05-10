import React from 'react'
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { getStudentDisplayName } from '../../../students/utils/studentMappers'

export default function RemoveFromBatchConfirm({
  visible,
  student,
  onCancel,
  onConfirm,
  confirming,
}) {
  const name = student ? getStudentDisplayName(student) : ''

  return (
    <CModal alignment="center" visible={visible} onClose={onCancel}>
      <CModalHeader>
        <CModalTitle>Remove from batch</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p className="mb-2">
          Remove <strong>{name}</strong> from this batch?
        </p>
        <p className="small text-body-secondary mb-0">
          This will not delete the student account.
        </p>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onCancel} disabled={confirming}>
          Cancel
        </CButton>
        <CButton color="danger" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Removing…' : 'Remove from batch'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
