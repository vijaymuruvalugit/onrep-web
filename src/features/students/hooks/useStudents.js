import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearSelectedStudent,
  clearStudentsErrors,
  createStudent,
  fetchStudentById,
  fetchStudents,
  setStudentsFilters,
  setStudentsPage,
  updateStudent,
} from '../slices/studentsSlice'

export function useStudents() {
  const dispatch = useDispatch()
  const studentsState = useSelector((state) => state.students)
  const loadStudents = useCallback((params) => dispatch(fetchStudents(params)), [dispatch])
  const loadStudentById = useCallback(
    (studentId) => dispatch(fetchStudentById(studentId)),
    [dispatch],
  )
  const createStudentAction = useCallback((payload) => dispatch(createStudent(payload)), [dispatch])
  const updateStudentAction = useCallback(
    (studentId, payload) => dispatch(updateStudent({ studentId, payload })),
    [dispatch],
  )
  const setFiltersAction = useCallback(
    (filters) => dispatch(setStudentsFilters(filters)),
    [dispatch],
  )
  const setPageAction = useCallback((page) => dispatch(setStudentsPage(page)), [dispatch])
  const clearErrorsAction = useCallback(() => dispatch(clearStudentsErrors()), [dispatch])
  const clearSelectedAction = useCallback(() => dispatch(clearSelectedStudent()), [dispatch])

  return useMemo(
    () => ({
      ...studentsState,
      fetchStudents: loadStudents,
      fetchStudentById: loadStudentById,
      createStudent: createStudentAction,
      updateStudent: updateStudentAction,
      setFilters: setFiltersAction,
      setPage: setPageAction,
      clearErrors: clearErrorsAction,
      clearSelected: clearSelectedAction,
    }),
    [
      studentsState,
      loadStudents,
      loadStudentById,
      createStudentAction,
      updateStudentAction,
      setFiltersAction,
      setPageAction,
      clearErrorsAction,
      clearSelectedAction,
    ],
  )
}

export default useStudents
