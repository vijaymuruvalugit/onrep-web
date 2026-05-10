import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import parentReducer, { fetchParentDashboard, fetchParentFees } from './parentSlice'
import parentApi from '../api/parentApi'

vi.mock('../api/parentApi', () => ({
  default: {
    getDashboard: vi.fn(),
    getFees: vi.fn(),
  },
}))

describe('parentSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchParentDashboard fulfilled stores payload', async () => {
    parentApi.getDashboard.mockResolvedValue({
      sessions: [{ id: '1', title: 'A' }],
      attendance: [],
      notifications: [],
      results: [],
    })
    const store = configureStore({ reducer: { parent: parentReducer } })
    await store.dispatch(fetchParentDashboard())
    const s = store.getState().parent
    expect(s.dashboardLoading).toBe(false)
    expect(s.dashboard?.sessions?.length).toBe(1)
    expect(s.dashboardError).toBe(null)
  })

  it('fetchParentDashboard rejected stores normalized error shape', async () => {
    parentApi.getDashboard.mockRejectedValue({
      response: { status: 500, data: { error: 'Failed' } },
    })
    const store = configureStore({ reducer: { parent: parentReducer } })
    await store.dispatch(fetchParentDashboard())
    const s = store.getState().parent
    expect(s.dashboardLoading).toBe(false)
    expect(s.dashboard).toBe(null)
    expect(s.dashboardError).toMatchObject({ status: 500 })
  })

  it('fetchParentFees fulfilled stores fees array', async () => {
    parentApi.getFees.mockResolvedValue({
      fees: [{ id: 'f1', status: 'PAID', studentName: 'Sam' }],
    })
    const store = configureStore({ reducer: { parent: parentReducer } })
    await store.dispatch(fetchParentFees())
    expect(store.getState().parent.fees).toHaveLength(1)
    expect(store.getState().parent.feesError).toBe(null)
  })
})
