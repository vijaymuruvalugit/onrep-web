import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert } from '@coreui/react'
import StudentForm from '../components/StudentForm'
import { useStudents } from '../hooks/useStudents'
import { fromStudentToFormValues, toStudentUpdatePayload } from '../utils/studentPayloads'

const StudentEditPage = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const {
    selectedStudent,
    detailLoading,
    detailError,
    updateLoading,
    mutationError,
    fetchStudentById,
    updateStudent,
    fetchStudents,
  } = useStudents()

  useEffect(() => {
    fetchStudentById(studentId)
  }, [fetchStudentById, studentId])

  const handleUpdate = async (values) => {
    const payload = toStudentUpdatePayload(values)

    let action = await updateStudent(studentId, payload)
    if (action.meta.requestStatus === 'rejected' && payload.batchIds?.length) {
      const retryPayload = { ...payload }
      delete retryPayload.batchIds
      action = await updateStudent(studentId, retryPayload)
    }

    if (action.meta.requestStatus === 'fulfilled') {
      await fetchStudents({})
      navigate(`/coach/students/${studentId}`, { replace: true })
    }
  }

  if (detailLoading && !selectedStudent)
    return <CAlert color="info">Loading student profile...</CAlert>
  if (detailError)
    return <CAlert color="danger">{detailError.message || 'Unable to load student.'}</CAlert>
  if (!selectedStudent) return <CAlert color="warning">Student not found.</CAlert>

  return (
    <StudentForm
      title="Edit Student"
      subtitle="Update profile, parent details, and enrollment state."
      submitLabel="Save Changes"
      initialValues={fromStudentToFormValues(selectedStudent)}
      saving={updateLoading}
      error={mutationError}
      onSubmit={handleUpdate}
    />
  )
}

export default StudentEditPage
