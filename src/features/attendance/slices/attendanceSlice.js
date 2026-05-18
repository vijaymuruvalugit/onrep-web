import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import attendanceApi from '../api/attendanceApi'

const initialState = {
  roster: [],
  draftMarks: {},
  session: null,
  attendanceEligible: true,
  attendanceEligibilityError: null,
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
      return response
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

function rosterPayloadToState(payload) {
  const students = payload?.students || payload?.roster || []
  const draftMarks = students.reduce((acc, student) => {
    const studentId = student.id || student.studentId || student._id
    const raw = student.attendanceStatus
    const status = raw === 'present' ? 'present' : raw === 'absent' ? 'absent' : null
    acc[studentId] = {
      studentId,
      status,
      notes: student.attendanceNotes || '',
    }
    return acc
  }, {})
  return {
    students,
    draftMarks,
    session: payload?.session ?? null,
    attendanceEligible: payload?.attendanceEligible !== false,
    attendanceEligibilityError: payload?.attendanceEligibilityError ?? null,
  }
}

export const saveAttendance = createAsyncThunk(
  'attendance/saveAttendance',
  async ({ classId, marks }, thunkApi) => {
    try {
      const draftMarks = thunkApi.getState().attendance.draftMarks
      const finalMarks = marks ?? Object.values(draftMarks)
      await attendanceApi.markBulkAttendance(classId, finalMarks)
      const refreshed = await attendanceApi.getClassRoster(classId)
      return rosterPayloadToState(refreshed)
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
        const next = rosterPayloadToState(action.payload)
        state.roster = next.students
        state.session = next.session
        state.attendanceEligible = next.attendanceEligible
        state.attendanceEligibilityError = next.attendanceEligibilityError
        state.draftMarks = next.draftMarks
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
      .addCase(saveAttendance.fulfilled, (state, action) => {
        state.saving = false
        state.saveSuccess = true
        if (action.payload) {
          state.roster = action.payload.students
          state.session = action.payload.session
          state.attendanceEligible = action.payload.attendanceEligible
          state.attendanceEligibilityError = action.payload.attendanceEligibilityError
          state.draftMarks = action.payload.draftMarks
        }
      })
      .addCase(saveAttendance.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload || { message: 'Unable to save attendance.' }
      })
  },
})

export const { setAttendanceMark, resetAttendanceState } = attendanceSlice.actions

export default attendanceSlice.reducer
