import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import coachParentsReducer, { fetchCoachParentsOverview } from './coachParentsSlice'
import coachParentsApi from '../api/coachParentsApi'

vi.mock('../api/coachParentsApi', () => ({
  default: {
    getOverview: vi.fn(),
  },
}))

describe('coachParentsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchCoachParentsOverview fulfilled', async () => {
    coachParentsApi.getOverview.mockResolvedValue({
      parents: [{ id: 'par_1', type: 'linked', name: 'A', status: 'linked', linkedStudents: [] }],
    })
    const store = configureStore({ reducer: { coachParents: coachParentsReducer } })
    await store.dispatch(fetchCoachParentsOverview({ status: 'all' }))
    expect(store.getState().coachParents.parents).toHaveLength(1)
    expect(store.getState().coachParents.error).toBe(null)
  })

  it('fetchCoachParentsOverview rejected', async () => {
    coachParentsApi.getOverview.mockRejectedValue({ response: { status: 403, data: {} } })
    const store = configureStore({ reducer: { coachParents: coachParentsReducer } })
    await store.dispatch(fetchCoachParentsOverview())
    expect(store.getState().coachParents.parents).toEqual([])
    expect(store.getState().coachParents.error?.status).toBe(403)
  })
})
