import React, { useState } from 'react'
import {
  CButton,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { BLOCK_TYPE_OPTIONS } from '../../../domain/sessionBlocks/sessionBlocksApi'

/**
 * @param {{
 *   visible: boolean,
 *   onClose: () => void,
 *   onSubmit: (payload: { title: string, blockType: string }) => void | Promise<void>,
 *   busy?: boolean,
 * }} props
 */
export default function SessionBlockAddModal({ visible, onClose, onSubmit, busy = false }) {
  const [title, setTitle] = useState('')
  const [blockType, setBlockType] = useState('technical')

  const handleClose = () => {
    setTitle('')
    setBlockType('technical')
    onClose()
  }

  const handleSubmit = async () => {
    await onSubmit({
      title: title.trim() || 'New phase',
      blockType,
    })
    setTitle('')
    setBlockType('technical')
  }

  return (
    <CModal visible={visible} onClose={handleClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Add coaching phase</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CFormLabel className="small">Title</CFormLabel>
        <CFormInput
          className="mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sprint drills"
        />
        <CFormLabel className="small">Type</CFormLabel>
        <CFormSelect value={blockType} onChange={(e) => setBlockType(e.target.value)}>
          {BLOCK_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </CFormSelect>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={handleClose} disabled={busy}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={() => void handleSubmit()} disabled={busy}>
          Add
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
