import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import attendanceApi from '../api/attendanceApi'

const initialState = {
  roster: [],
  draftMarks: {},
  loadingRoster: false,
  saving: false,
  rosterError: null,
  saveError: null,
  saveSuccess: false,
}

export const fetchAttendanceRoster = createAsyncThunk(
  'attendance/fetchAttendanceRoster',
  async (classId, thunkApi) => {
    try {
      const response = await attendanceApi.getClassRoster(classId)
      return response.students || response.roster || []
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const saveAttendance = createAsyncThunk(
  'attendance/saveAttendance',
  async ({ classId, marks }, thunkApi) => {
    try {
      const draftMarks = thunkApi.getState().attendance.draftMarks
      const finalMarks = marks ?? Object.values(draftMarks)
      await attendanceApi.markBulkAttendance(classId, finalMarks)
      return finalMarks
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setAttendanceMark(state, action) {
      const { studentId, status, notes } = action.payload
      state.draftMarks[studentId] = {
        studentId,
        status,
        notes: notes || '',
      }
      state.saveSuccess = false
    },
    resetAttendanceState(state) {
      state.saveError = null
      state.saveSuccess = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceRoster.pending, (state) => {
        state.loadingRoster = true
        state.rosterError = null
      })
      .addCase(fetchAttendanceRoster.fulfilled, (state, action) => {
        state.loadingRoster = false
        state.roster = action.payload
        state.draftMarks = action.payload.reduce((acc, student) => {
          const studentId = student.id || student.studentId || student._id
          acc[studentId] = {
            studentId,
            status: student.attendanceStatus || 'present',
            notes: student.attendanceNotes || '',
          }
          return acc
        }, {})
      })
      .addCase(fetchAttendanceRoster.rejected, (state, action) => {
        state.loadingRoster = false
        state.rosterError = action.payload || { message: 'Unable to load roster.' }
      })
      .addCase(saveAttendance.pending, (state) => {
        state.saving = true
        state.saveError = null
        state.saveSuccess = false
      })
      .addCase(saveAttendance.fulfilled, (state) => {
        state.saving = false
        state.saveSuccess = true
      })
      .addCase(saveAttendance.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload || { message: 'Unable to save attendance.' }
      })
  },
})

export const { setAttendanceMark, resetAttendanceState } = attendanceSlice.actions

export default attendanceSlice.reducer
