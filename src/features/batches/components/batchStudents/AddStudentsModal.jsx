import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import { getStudentParent } from '../../../students/utils/studentMappers'

export default function AddStudentsModal({
  visible,
  onClose,
  batchTitle,
  batchId,
  memberStudentIds,
  students,
  studentsLoading,
  onFetchStudents,
  onAddSelected,
  adding,
}) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  useEffect(() => {
    if (!visible) {
      setSearch('')
      setSelectedIds(new Set())
      return
    }
    void onFetchStudents()
  }, [visible, onFetchStudents])

  const available = useMemo(() => {
    const mem = memberStudentIds
    return students.filter((s) => {
      const id = String(s.id || s._id || '')
      return id && !mem.has(id)
    })
  }, [students, memberStudentIds])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available
    return available.filter((s) => {
      const name = String(s.full_name || s.name || '').toLowerCase()
      const parent = String(getStudentParent(s) || '').toLowerCase()
      return name.includes(q) || parent.includes(q)
    })
  }, [available, search])

  const toggle = (id) => {
    const sid = String(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  const toggleAllVisible = () => {
    const ids = filtered.map((s) => String(s.id || s._id))
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleAdd = async () => {
    if (selectedIds.size === 0) return
    try {
      await onAddSelected([...selectedIds])
      setSelectedIds(new Set())
      onClose()
    } catch {
      /* errors surfaced by global batch mutation alert */
    }
  }

  const title = batchTitle || 'This batch'

  return (
    <CModal alignment="center" size="lg" visible={visible} onClose={onClose} scrollable>
      <CModalHeader>
        <CModalTitle>Add students to {title}</CModalTitle>
      </CModalHeader>
      <CModalBody className="px-3 pb-4">
        <CFormLabel htmlFor="batch-add-students-search" className="fw-semibold">
          Search students
        </CFormLabel>
        <CFormInput
          id="batch-add-students-search"
          placeholder="Search by name or parent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
          autoComplete="off"
        />

        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <CFormLabel className="small text-body-secondary">Activity</CFormLabel>
            <CFormSelect disabled value="">
              <option value="">All (soon)</option>
            </CFormSelect>
          </div>
          <div className="col-md-4">
            <CFormLabel className="small text-body-secondary">Age group</CFormLabel>
            <CFormSelect disabled value="">
              <option value="">All (soon)</option>
            </CFormSelect>
          </div>
          <div className="col-md-4">
            <CFormLabel className="small text-body-secondary">Skill level</CFormLabel>
            <CFormSelect disabled value="">
              <option value="">All (soon)</option>
            </CFormSelect>
          </div>
        </div>
        <p className="small text-body-secondary mb-3">
          Filters will narrow this list in a future update. Search works today.
        </p>

        {studentsLoading ? (
          <div className="py-5 text-center">
            <CSpinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-4 text-center small text-body-secondary">
            {available.length === 0
              ? 'Everyone who can join this batch is already assigned.'
              : 'No students match your search.'}
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-body-secondary">
                {filtered.length} student{filtered.length === 1 ? '' : 's'} available
              </span>
              <CButton color="link" size="sm" className="p-0" onClick={toggleAllVisible}>
                {filtered.every((s) => selectedIds.has(String(s.id || s._id))) &&
                filtered.length > 0
                  ? 'Clear visible'
                  : 'Select visible'}
              </CButton>
            </div>
            <ul className="list-unstyled onrep-batch-add-modal-list mb-0">
              {filtered.map((student) => {
                const sid = String(student.id || student._id)
                const name = student.full_name || student.name
                const parent = getStudentParent(student)
                const parentLine = parent && parent !== '—' ? `Parent: ${parent}` : null
                return (
                  <li key={sid} className="onrep-batch-add-modal-row">
                    <CFormCheck
                      id={`add-student-${sid}`}
                      checked={selectedIds.has(sid)}
                      onChange={() => toggle(sid)}
                      label={
                        <span className="ms-2">
                          <span className="fw-semibold d-block">{name}</span>
                          {parentLine ? (
                            <span className="small text-body-secondary">{parentLine}</span>
                          ) : null}
                        </span>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={adding}>
          Cancel
        </CButton>
        <CButton
          color="primary"
          disabled={adding || selectedIds.size === 0 || studentsLoading}
          onClick={() => void handleAdd()}
        >
          {adding ? 'Adding…' : `Add selected students${selectedIds.size ? ` (${selectedIds.size})` : ''}`}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
