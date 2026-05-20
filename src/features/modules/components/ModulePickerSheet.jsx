import React, { useMemo } from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader } from '@coreui/react'
import { listModulesByPickerGroup } from '../moduleRegistry.js'

/**
 * Coach-facing module picker for strong operational capabilities only.
 */
export default function ModulePickerSheet({
  visible,
  onClose,
  selectedModuleIds = [],
  onAdd,
  title = 'Add module',
}) {
  const selectedSet = useMemo(() => new Set(selectedModuleIds.map(String)), [selectedModuleIds])
  const { drills, assessments } = useMemo(() => listModulesByPickerGroup(), [])

  const renderGroup = (heading, modules) => (
    <div className="mb-3" key={heading}>
      <div className="fw-semibold small text-body-secondary mb-2">{heading}</div>
      <div className="d-flex flex-wrap gap-2">
        {modules
          .filter((m) => !selectedSet.has(m.id))
          .map((m) => (
            <CButton
              key={m.id}
              color="light"
              className="skill-module-picker__chip"
              onClick={() => {
                onAdd?.(m.id)
                onClose?.()
              }}
              data-testid={`module-picker-${m.id}`}
            >
              {m.displayName || m.title}
            </CButton>
          ))}
      </div>
    </div>
  )

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>{title}</CModalHeader>
      <CModalBody className="skill-module-picker">
        {renderGroup('Operational Drills', drills)}
        {renderGroup('Coach Assessments', assessments)}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
