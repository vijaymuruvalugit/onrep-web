import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import attendanceReducer, { saveAttendance } from './attendanceSlice'
import attendanceApi from '../api/attendanceApi'

vi.mock('../api/attendanceApi', () => ({
  default: {
    markBulkAttendance: vi.fn(),
    getClassRoster: vi.fn(),
  },
}))

describe('attendanceSlice saveAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fulfilled clears saving and sets success', async () => {
    attendanceApi.markBulkAttendance.mockResolvedValue({ ok: true })
    attendanceApi.getClassRoster.mockResolvedValue({
      students: [{ id: 's1', attendanceStatus: 'present' }],
      attendanceEligible: true,
    })
    const store = configureStore({ reducer: { attendance: attendanceReducer } })
    await store.dispatch(
      saveAttendance({
        classId: 'c1',
        marks: [{ studentId: 's1', status: 'present', notes: '' }],
      }),
    )
    const s = store.getState().attendance
    expect(s.saving).toBe(false)
    expect(s.saveSuccess).toBe(true)
    expect(s.saveError).toBe(null)
  })

  it('rejected stores error payload', async () => {
    attendanceApi.markBulkAttendance.mockRejectedValue({
      response: { status: 400, data: { error: 'bad' } },
    })
    const store = configureStore({ reducer: { attendance: attendanceReducer } })
    await store.dispatch(
      saveAttendance({
        classId: 'c1',
        marks: [{ studentId: 's1', status: 'present', notes: '' }],
      }),
    )
    const s = store.getState().attendance
    expect(s.saving).toBe(false)
    expect(s.saveSuccess).toBe(false)
    expect(s.saveError).toMatchObject({ status: 400 })
  })
})
