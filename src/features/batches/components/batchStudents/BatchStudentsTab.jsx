import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CAlert, CSpinner } from '@coreui/react'
import { useBatches } from '../../hooks/useBatches'
import { useStudents } from '../../../students/hooks/useStudents'
import BatchStudentsHeader from './BatchStudentsHeader'
import BatchStudentsRoster from './BatchStudentsRoster'
import BatchStudentsEmptyState from './BatchStudentsEmptyState'
import AddStudentsModal from './AddStudentsModal'
import RemoveFromBatchConfirm from './RemoveFromBatchConfirm'
import './BatchStudentsTab.scss'

export default function BatchStudentsTab({
  batchId,
  batchTitle,
  selectedBatch,
  tabActive,
  detailLoading,
}) {
  const { items: students, fetchStudents, listLoading } = useStudents()
  const { assignBatchStudents, mutationLoading, fetchBatchById } = useBatches()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removeBusy, setRemoveBusy] = useState(false)

  useEffect(() => {
    if (!tabActive || !batchId) return
    void fetchStudents({ page: 1, pageSize: 500 })
  }, [tabActive, batchId, fetchStudents])

  const handleFetchForModal = useCallback(() => {
    return fetchStudents({ page: 1, pageSize: 500 })
  }, [fetchStudents])

  const memberStudentIds = useMemo(() => {
    const direct = selectedBatch?.studentIds ?? selectedBatch?.student_ids ?? []
    if (Array.isArray(direct) && direct.length > 0) {
      return new Set(direct.map(String))
    }
    return new Set(
      students
        .filter((s) =>
          Array.isArray(s.batchIds || s.batch_ids)
            ? (s.batchIds || s.batch_ids).some((id) => String(id) === String(batchId))
            : false,
        )
        .map((s) => String(s.id || s._id)),
    )
  }, [selectedBatch, students, batchId])

  const rosterStudents = useMemo(() => {
    return students
      .filter((s) => memberStudentIds.has(String(s.id || s._id)))
      .sort((a, b) =>
        String(a.full_name || a.name || '').localeCompare(String(b.full_name || b.name || ''), undefined, {
          sensitivity: 'base',
        }),
      )
  }, [students, memberStudentIds])

  const syncAfterMembershipChange = useCallback(async () => {
    await fetchBatchById(batchId)
    await fetchStudents({ page: 1, pageSize: 500 })
  }, [batchId, fetchBatchById, fetchStudents])

  const handleAddSelected = async (newIds) => {
    const merged = [...new Set([...memberStudentIds, ...newIds.map(String)])]
    await assignBatchStudents(batchId, merged)
    await syncAfterMembershipChange()
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    const sid = String(removeTarget.id || removeTarget._id)
    setRemoveBusy(true)
    try {
      const next = [...memberStudentIds].filter((id) => id !== sid)
      await assignBatchStudents(batchId, next)
      await syncAfterMembershipChange()
      setRemoveTarget(null)
    } finally {
      setRemoveBusy(false)
    }
  }

  const batchMissing = !detailLoading && !selectedBatch
  const showRosterSpinner =
    detailLoading ||
    (tabActive && listLoading && memberStudentIds.size > 0 && rosterStudents.length === 0)

  return (
    <div className="onrep-batch-students-tab onrep-content-column mx-auto w-100 px-0">
      <BatchStudentsHeader onAddStudents={() => setAddModalOpen(true)} />

      {batchMissing ? (
        <CAlert color="warning">Could not load this batch.</CAlert>
      ) : showRosterSpinner ? (
        <div className="py-5 text-center">
          <CSpinner />
        </div>
      ) : rosterStudents.length === 0 ? (
        <BatchStudentsEmptyState onAddStudents={() => setAddModalOpen(true)} />
      ) : (
        <BatchStudentsRoster
          students={rosterStudents}
          mutationLoading={mutationLoading}
          onRequestRemove={(student) => setRemoveTarget(student)}
        />
      )}

      <AddStudentsModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        batchTitle={batchTitle}
        memberStudentIds={memberStudentIds}
        students={students}
        studentsLoading={listLoading}
        onFetchStudents={handleFetchForModal}
        onAddSelected={handleAddSelected}
        adding={mutationLoading}
      />

      <RemoveFromBatchConfirm
        visible={Boolean(removeTarget)}
        student={removeTarget}
        onCancel={() => !removeBusy && setRemoveTarget(null)}
        onConfirm={() => void handleConfirmRemove()}
        confirming={removeBusy}
      />
    </div>
  )
}
