import { describe, expect, it } from 'vitest'
import {
  normalizeApiPath,
  requestRequiresActivityWorkspace,
  requestSkipsActivityHeader,
} from './apiActivityContext'

describe('apiActivityContext', () => {
  it('normalizes absolute URLs', () => {
    expect(normalizeApiPath('https://x.test/api/v1/batch-schedules/abc')).toBe(
      '/batch-schedules/abc',
    )
  })

  it('skips activity header for auth and activities', () => {
    expect(requestSkipsActivityHeader('/auth/me')).toBe(true)
    expect(requestSkipsActivityHeader('/activities')).toBe(true)
  })

  it('requires workspace for operational paths', () => {
    expect(requestRequiresActivityWorkspace('/batch-schedules/b1')).toBe(true)
    expect(requestRequiresActivityWorkspace('/sessions')).toBe(true)
    expect(requestRequiresActivityWorkspace('/dashboard/today')).toBe(true)
    expect(requestRequiresActivityWorkspace('/operational-sessions/day-board')).toBe(true)
    expect(requestRequiresActivityWorkspace('/recurring-patterns/x')).toBe(true)
  })

  it('does not require workspace for students list', () => {
    expect(requestRequiresActivityWorkspace('/students')).toBe(false)
  })

  it('skips activity header for student import', () => {
    expect(requestSkipsActivityHeader('/student-import/preview')).toBe(true)
    expect(requestRequiresActivityWorkspace('/student-import/execute')).toBe(false)
  })

  it('skips activity header for Google place lookup', () => {
    expect(requestSkipsActivityHeader('/places/autocomplete')).toBe(true)
    expect(requestSkipsActivityHeader('/places/details')).toBe(true)
    expect(requestRequiresActivityWorkspace('/places/autocomplete')).toBe(false)
    expect(requestRequiresActivityWorkspace('/places/details')).toBe(false)
  })

  it('sends activity header for student participation summary', () => {
    expect(
      requestSkipsActivityHeader('/students/2752ef07-4cd4-4159-b855-c76495efd8e5/participation-summary'),
    ).toBe(false)
    expect(
      requestRequiresActivityWorkspace(
        '/students/2752ef07-4cd4-4159-b855-c76495efd8e5/participation-summary',
      ),
    ).toBe(true)
    expect(
      requestSkipsActivityHeader('/students/2752ef07-4cd4-4159-b855-c76495efd8e5/attendance-percent'),
    ).toBe(false)
  })
})
