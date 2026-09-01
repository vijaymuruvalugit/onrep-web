import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import studentParentsReducer, {
  fetchStudentParents,
  inviteStudentParent,
  resendStudentParentInvite,
  revokeStudentParentInvite,
  unlinkStudentParent,
} from './studentParentsSlice'
import studentParentsApi from '../api/studentParentsApi'

vi.mock('../api/studentParentsApi', () => ({
  default: {
    listParents: vi.fn(),
    inviteParent: vi.fn(),
    resendInvite: vi.fn(),
    revokeInvite: vi.fn(),
    unlinkParent: vi.fn(),
  },
}))

const STUDENT_ID = 'stu_1'

const newStore = () => configureStore({ reducer: { studentParents: studentParentsReducer } })

describe('studentParentsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchStudentParents pending clears stale actionId (stuck Remove spinner)', async () => {
    studentParentsApi.listParents.mockResolvedValue({ linked: [], invites: [] })
    const store = configureStore({
      reducer: { studentParents: studentParentsReducer },
      preloadedState: {
        studentParents: {
          byStudent: {},
          submit: { loading: false, error: null, lastInvite: null, success: false },
          actionId: '00000000-0000-4000-8000-000000009999',
          actionError: { message: 'prior error' },
        },
      },
    })
    const promise = store.dispatch(fetchStudentParents(STUDENT_ID))
    expect(store.getState().studentParents.actionId).toBe(null)
    expect(store.getState().studentParents.actionError).toBe(null)
    await promise
  })

  it('fetchStudentParents fulfilled stores per-student linked + invites', async () => {
    studentParentsApi.listParents.mockResolvedValue({
      linked: [{ userId: 'u1', name: 'Mom', email: 'mom@example.com', status: 'approved' }],
      invites: [
        { id: 'inv_1', name: 'Dad', email: 'dad@example.com', status: 'pending', code: 'AB12' },
      ],
    })
    const store = newStore()
    await store.dispatch(fetchStudentParents(STUDENT_ID))
    const entry = store.getState().studentParents.byStudent[STUDENT_ID]
    expect(entry.loading).toBe(false)
    expect(entry.error).toBe(null)
    expect(entry.linked).toHaveLength(1)
    expect(entry.invites).toHaveLength(1)
  })

  it('fetchStudentParents rejected stores normalized error', async () => {
    studentParentsApi.listParents.mockRejectedValue({
      response: { status: 500, data: { message: 'boom' } },
    })
    const store = newStore()
    await store.dispatch(fetchStudentParents(STUDENT_ID))
    const entry = store.getState().studentParents.byStudent[STUDENT_ID]
    expect(entry.loading).toBe(false)
    expect(entry.error?.status).toBe(500)
    expect(entry.error?.message).toBe('boom')
  })

  it('inviteStudentParent fulfilled flips success flag', async () => {
    studentParentsApi.inviteParent.mockResolvedValue({ invite: { id: 'inv_2' } })
    const store = newStore()
    await store.dispatch(
      inviteStudentParent({ studentId: STUDENT_ID, email: 'p@example.com', name: 'P' }),
    )
    const submit = store.getState().studentParents.submit
    expect(submit.loading).toBe(false)
    expect(submit.success).toBe(true)
    expect(submit.error).toBe(null)
    expect(submit.lastInvite).toEqual({ id: 'inv_2' })
  })

  it('inviteStudentParent rejected captures error', async () => {
    studentParentsApi.inviteParent.mockRejectedValue({
      response: { status: 409, data: { error: 'INVITE_ALREADY_PENDING' } },
    })
    const store = newStore()
    await store.dispatch(inviteStudentParent({ studentId: STUDENT_ID, email: 'dup@example.com' }))
    const submit = store.getState().studentParents.submit
    expect(submit.success).toBe(false)
    expect(submit.error?.status).toBe(409)
  })

  it('revokeStudentParentInvite marks the invite revoked in cache', async () => {
    studentParentsApi.listParents.mockResolvedValue({
      linked: [],
      invites: [{ id: 'inv_X', name: null, email: 'x@example.com', status: 'pending', code: 'C' }],
    })
    studentParentsApi.revokeInvite.mockResolvedValue({ ok: true })
    const store = newStore()
    await store.dispatch(fetchStudentParents(STUDENT_ID))
    await store.dispatch(revokeStudentParentInvite({ studentId: STUDENT_ID, inviteId: 'inv_X' }))
    const entry = store.getState().studentParents.byStudent[STUDENT_ID]
    expect(entry.invites[0].status).toBe('revoked')
    expect(entry.invites[0].code).toBe(null)
  })

  it('unlinkStudentParent removes the user from the linked list', async () => {
    studentParentsApi.listParents.mockResolvedValue({
      linked: [
        {
          userId: 'u1',
          guardianIdentityId: 'id-1',
          identityId: 'id-1',
          name: 'Mom',
          email: 'mom@example.com',
          status: 'approved',
        },
        {
          userId: 'u2',
          guardianIdentityId: 'id-2',
          identityId: 'id-2',
          name: 'Dad',
          email: 'dad@example.com',
          status: 'approved',
        },
      ],
      invites: [],
    })
    studentParentsApi.unlinkParent.mockResolvedValue({ ok: true })
    const store = newStore()
    await store.dispatch(fetchStudentParents(STUDENT_ID))
    await store.dispatch(unlinkStudentParent({ studentId: STUDENT_ID, guardianIdentityId: 'id-1' }))
    const entry = store.getState().studentParents.byStudent[STUDENT_ID]
    expect(entry.linked.map((p) => p.guardianIdentityId)).toEqual(['id-2'])
  })

  it('resendStudentParentInvite tracks actionId during request', async () => {
    studentParentsApi.resendInvite.mockResolvedValue({ invite: { id: 'inv_R' } })
    const store = newStore()
    await store.dispatch(resendStudentParentInvite({ studentId: STUDENT_ID, inviteId: 'inv_R' }))
    expect(store.getState().studentParents.actionId).toBe(null)
    expect(store.getState().studentParents.actionError).toBe(null)
  })
})
