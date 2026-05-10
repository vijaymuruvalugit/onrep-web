import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert } from '@coreui/react'
import StudentForm from '../components/StudentForm'
import { useStudents } from '../hooks/useStudents'
import { toStudentCreatePayload } from '../utils/studentPayloads'

const StudentCreatePage = () => {
  const navigate = useNavigate()
  const { createStudent, createLoading, mutationError, fetchStudents } = useStudents()

  const handleCreate = async (values) => {
    const payload = toStudentCreatePayload(values)

    let action = await createStudent(payload)
    // Older backends may reject batchIds in create; retry without batches so the student
    // still gets created and the coach can attach batches later from the detail page.
    if (action.meta.requestStatus === 'rejected' && payload.batchIds?.length) {
      const retryPayload = { ...payload }
      delete retryPayload.batchIds
      action = await createStudent(retryPayload)
    }

    if (action.meta.requestStatus === 'fulfilled') {
      await fetchStudents({})
      const newId = action.payload?.id
      navigate(newId ? `/coach/students/${newId}` : '/coach/students', { replace: true })
    }
  }

  return (
    <>
      {mutationError?.message ? <CAlert color="danger">{mutationError.message}</CAlert> : null}
      <StudentForm
        title="Add Student"
        subtitle="Create the student profile. You can invite one or more parents from the student page after saving."
        submitLabel="Add Student"
        saving={createLoading}
        error={mutationError}
        onSubmit={handleCreate}
      />
    </>
  )
}

export default StudentCreatePage
