import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import studentParentsApi from '../api/studentParentsApi'

/**
 * Per-student parents view. Keyed by studentId so navigating between students
 * never mixes another student's parents into the cache.
 *
 * Shape:
 *   byStudent: {
 *     [studentId]: {
 *       linked: [{ id, userId, name, email, status, linkedAt }],
 *       invites: [{ id, name, email, status, code, expiresAt, createdAt }],
 *       loading: boolean,
 *       error: { message } | null,
 *     }
 *   },
 *   submit: { loading, error, lastInvite }   // create-invite
 *   actionId: string | null                    // current resend/revoke/unlink target
 *   actionError: { message } | null
 */

const emptyEntry = () => ({ linked: [], invites: [], loading: false, error: null })

const initialState = {
  byStudent: {},
  submit: { loading: false, error: null, lastInvite: null, success: false },
  actionId: null,
  actionError: null,
}

export const fetchStudentParents = createAsyncThunk(
  'studentParents/fetch',
  async (studentId, thunkApi) => {
    try {
      const data = await studentParentsApi.listParents(studentId)
      return { studentId, linked: data.linked || [], invites: data.invites || [] }
    } catch (error) {
      return thunkApi.rejectWithValue({ studentId, error: normalizeApiError(error) })
    }
  },
)

export const inviteStudentParent = createAsyncThunk(
  'studentParents/invite',
  async ({ studentId, email, name, expiresInDays, phoneNumber }, thunkApi) => {
    try {
      const data = await studentParentsApi.inviteParent(studentId, {
        email,
        name,
        expiresInDays,
        phoneNumber,
      })
      return { studentId, invite: data.invite || null }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const resendStudentParentInvite = createAsyncThunk(
  'studentParents/resendInvite',
  async ({ studentId, inviteId, expiresInDays }, thunkApi) => {
    try {
      const data = await studentParentsApi.resendInvite(inviteId, { expiresInDays })
      return { studentId, inviteId, invite: data.invite || null }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const revokeStudentParentInvite = createAsyncThunk(
  'studentParents/revokeInvite',
  async ({ studentId, inviteId }, thunkApi) => {
    try {
      await studentParentsApi.revokeInvite(inviteId)
      return { studentId, inviteId }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

export const unlinkStudentParent = createAsyncThunk(
  'studentParents/unlink',
  async ({ studentId, parentUserId }, thunkApi) => {
    try {
      await studentParentsApi.unlinkParent(studentId, parentUserId)
      return { studentId, parentUserId }
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error))
    }
  },
)

const ensureEntry = (state, studentId) => {
  if (!state.byStudent[studentId]) state.byStudent[studentId] = emptyEntry()
  return state.byStudent[studentId]
}

const studentParentsSlice = createSlice({
  name: 'studentParents',
  initialState,
  reducers: {
    clearStudentParentsSubmitState(state) {
      state.submit = { loading: false, error: null, lastInvite: null, success: false }
    },
    clearStudentParentsActionError(state) {
      state.actionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentParents.pending, (state, action) => {
        const entry = ensureEntry(state, action.meta.arg)
        entry.loading = true
        entry.error = null
        // Global mutation tracking must not survive a refetch — otherwise the Remove
        // button stays spinning if the user navigated away mid-request or the thunk
        // completed without matching fulfilled (race). Same for resend/revoke.
        state.actionId = null
        state.actionError = null
      })
      .addCase(fetchStudentParents.fulfilled, (state, action) => {
        const { studentId, linked, invites } = action.payload
        const entry = ensureEntry(state, studentId)
        entry.loading = false
        entry.error = null
        entry.linked = linked
        entry.invites = invites
      })
      .addCase(fetchStudentParents.rejected, (state, action) => {
        const studentId = action.payload?.studentId || action.meta.arg
        const entry = ensureEntry(state, studentId)
        entry.loading = false
        entry.error = action.payload?.error || { message: 'Unable to load parents.' }
      })

      .addCase(inviteStudentParent.pending, (state) => {
        state.submit.loading = true
        state.submit.error = null
        state.submit.success = false
        state.actionId = null
        state.actionError = null
      })
      .addCase(inviteStudentParent.fulfilled, (state, action) => {
        state.submit.loading = false
        state.submit.success = true
        state.submit.lastInvite = action.payload.invite
      })
      .addCase(inviteStudentParent.rejected, (state, action) => {
        state.submit.loading = false
        state.submit.error = action.payload || { message: 'Unable to send invite.' }
      })

      .addCase(resendStudentParentInvite.pending, (state, action) => {
        state.actionId = action.meta.arg.inviteId
        state.actionError = null
      })
      .addCase(resendStudentParentInvite.fulfilled, (state) => {
        state.actionId = null
      })
      .addCase(resendStudentParentInvite.rejected, (state, action) => {
        state.actionId = null
        state.actionError = action.payload || { message: 'Unable to resend invite.' }
      })

      .addCase(revokeStudentParentInvite.pending, (state, action) => {
        state.actionId = action.meta.arg.inviteId
        state.actionError = null
      })
      .addCase(revokeStudentParentInvite.fulfilled, (state, action) => {
        state.actionId = null
        const entry = state.byStudent[action.payload.studentId]
        if (entry) {
          entry.invites = entry.invites.map((inv) =>
            inv.id === action.payload.inviteId ? { ...inv, status: 'revoked', code: null } : inv,
          )
        }
      })
      .addCase(revokeStudentParentInvite.rejected, (state, action) => {
        state.actionId = null
        state.actionError = action.payload || { message: 'Unable to revoke invite.' }
      })

      .addCase(unlinkStudentParent.pending, (state, action) => {
        state.actionId = action.meta.arg.parentUserId
        state.actionError = null
      })
      .addCase(unlinkStudentParent.fulfilled, (state, action) => {
        state.actionId = null
        const entry = state.byStudent[action.payload.studentId]
        if (entry) {
          entry.linked = entry.linked.filter((p) => p.userId !== action.payload.parentUserId)
        }
      })
      .addCase(unlinkStudentParent.rejected, (state, action) => {
        state.actionId = null
        state.actionError = action.payload || { message: 'Unable to unlink parent.' }
      })
  },
})

export const { clearStudentParentsSubmitState, clearStudentParentsActionError } =
  studentParentsSlice.actions
export default studentParentsSlice.reducer
