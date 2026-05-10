import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import studentsApi from '../api/studentsApi'
import { normalizeStudentsListPayload } from '../utils/studentMappers'

const initialFilters = {
  search: '',
  status: '',
  activity: '',
  batch: '',
}

const initialState = {
  items: [],
  selectedStudent: null,
  listLoading: false,
  detailLoading: false,
  createLoading: false,
  updateLoading: false,
  listError: null,
  detailError: null,
  mutationError: null,
  filters: initialFilters,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    hasServerPagination: false,
  },
}

export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await studentsApi.listStudents(params)
      return normalizeStudentsListPayload(response)
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const fetchStudentById = createAsyncThunk(
  'students/fetchStudentById',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await studentsApi.getStudent(studentId)
      return response.student || null
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const createStudent = createAsyncThunk(
  'students/createStudent',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await studentsApi.createStudent(payload)
      return response.student || null
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

export const updateStudent = createAsyncThunk(
  'students/updateStudent',
  async ({ studentId, payload }, { rejectWithValue }) => {
    try {
      const response = await studentsApi.updateStudent(studentId, payload)
      return response.student || null
    } catch (error) {
      return rejectWithValue(normalizeApiError(error))
    }
  },
)

const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setStudentsFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      }
      state.pagination.page = 1
    },
    setStudentsPage(state, action) {
      state.pagination.page = action.payload
    },
    clearStudentsErrors(state) {
      state.listError = null
      state.detailError = null
      state.mutationError = null
    },
    clearSelectedStudent(state) {
      state.selectedStudent = null
      state.detailError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.listLoading = true
        state.listError = null
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.listLoading = false
        state.items = action.payload.students
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
          hasServerPagination: action.payload.hasServerPagination,
        }
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.listLoading = false
        state.listError = action.payload || { message: 'Unable to load students.' }
      })
      .addCase(fetchStudentById.pending, (state) => {
        state.detailLoading = true
        state.detailError = null
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.detailLoading = false
        state.selectedStudent = action.payload
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.detailLoading = false
        state.detailError = action.payload || { message: 'Unable to load student profile.' }
      })
      .addCase(createStudent.pending, (state) => {
        state.createLoading = true
        state.mutationError = null
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.createLoading = false
        if (action.payload) {
          state.items = [action.payload, ...state.items]
          state.pagination.total += 1
        }
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.createLoading = false
        state.mutationError = action.payload || { message: 'Unable to create student.' }
      })
      .addCase(updateStudent.pending, (state) => {
        state.updateLoading = true
        state.mutationError = null
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.updateLoading = false
        const updated = action.payload
        if (!updated) return
        state.items = state.items.map((item) => (item.id === updated.id ? updated : item))
        if (state.selectedStudent?.id === updated.id) {
          state.selectedStudent = updated
        }
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.updateLoading = false
        state.mutationError = action.payload || { message: 'Unable to update student.' }
      })
  },
})

export const { setStudentsFilters, setStudentsPage, clearStudentsErrors, clearSelectedStudent } =
  studentsSlice.actions

export default studentsSlice.reducer
