import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import coachInvitesReducer, {
  createCoachInvite,
  fetchCoachInvites,
  resendCoachInviteThunk,
  revokeCoachInviteThunk,
} from './coachInvitesSlice'
import coachInvitesApi from '../api/coachInvitesApi'

vi.mock('../api/coachInvitesApi', () => ({
  default: {
    listCoachInvites: vi.fn(),
    postCoachInvite: vi.fn(),
    revokeCoachInvite: vi.fn(),
    resendCoachInvite: vi.fn(),
  },
}))

describe('coachInvitesSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchCoachInvites fulfilled', async () => {
    coachInvitesApi.listCoachInvites.mockResolvedValue({
      invites: [{ userId: 'u1', email: 'a@b.co', status: 'pending' }],
    })
    const store = configureStore({ reducer: { coachInvites: coachInvitesReducer } })
    await store.dispatch(fetchCoachInvites())
    expect(store.getState().coachInvites.invites).toHaveLength(1)
    expect(store.getState().coachInvites.listError).toBe(null)
  })

  it('createCoachInvite rejected on 403', async () => {
    coachInvitesApi.postCoachInvite.mockRejectedValue({ response: { status: 403, data: {} } })
    const store = configureStore({ reducer: { coachInvites: coachInvitesReducer } })
    await store.dispatch(createCoachInvite({ email: 'x@y.co', name: 'X' }))
    expect(store.getState().coachInvites.submitSuccess).toBe(false)
    expect(store.getState().coachInvites.submitError?.status).toBe(403)
  })

  it('revokeCoachInviteThunk fulfilled', async () => {
    coachInvitesApi.revokeCoachInvite.mockResolvedValue({ ok: true })
    const store = configureStore({ reducer: { coachInvites: coachInvitesReducer } })
    await store.dispatch(revokeCoachInviteThunk('uuid-here'))
    expect(store.getState().coachInvites.revokeLoadingId).toBe(null)
  })

  it('resendCoachInviteThunk fulfilled', async () => {
    coachInvitesApi.resendCoachInvite.mockResolvedValue({ ok: true, resent: true })
    const store = configureStore({ reducer: { coachInvites: coachInvitesReducer } })
    await store.dispatch(resendCoachInviteThunk('uuid-here'))
    expect(store.getState().coachInvites.resendLoadingId).toBe(null)
    expect(store.getState().coachInvites.resendSuccess).toBe(true)
  })
})
