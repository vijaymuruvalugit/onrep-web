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

  it('sends activity header for nested batch recurring-pattern preview and bulk', () => {
    const preview =
      '/batches/2b7f87b1-6f07-4f99-a9f9-aa9c42a56c53/recurring-patterns/preview'
    const bulk = '/batches/2b7f87b1-6f07-4f99-a9f9-aa9c42a56c53/recurring-patterns/bulk'
    expect(requestSkipsActivityHeader(preview)).toBe(false)
    expect(requestRequiresActivityWorkspace(preview)).toBe(true)
    expect(requestSkipsActivityHeader(bulk)).toBe(false)
    expect(requestRequiresActivityWorkspace(bulk)).toBe(true)
    expect(requestSkipsActivityHeader('/batches')).toBe(true)
    expect(requestSkipsActivityHeader('/batches/2b7f87b1-6f07-4f99-a9f9-aa9c42a56c53')).toBe(
      true,
    )
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

  it('sends activity header for student operational nested routes', () => {
    const id = '2752ef07-4cd4-4159-b855-c76495efd8e5'
    for (const suffix of [
      'participation-summary',
      'attendance-percent',
      'observations',
      'coaching-priority',
      'follow-ups',
      'progress-cards',
    ]) {
      const path = `/students/${id}/${suffix}`
      expect(requestSkipsActivityHeader(path), path).toBe(false)
      expect(requestRequiresActivityWorkspace(path), path).toBe(true)
    }
    expect(requestSkipsActivityHeader(`/students/${id}`)).toBe(true)
    expect(requestSkipsActivityHeader(`/students/${id}/parents`)).toBe(true)
    expect(requestSkipsActivityHeader(`/students/${id}/login-status`)).toBe(true)
    expect(requestSkipsActivityHeader('/students')).toBe(true)
    expect(requestSkipsActivityHeader(`/parent/students/${id}/progress-cards`)).toBe(true)
    expect(requestRequiresActivityWorkspace(`/parent/students/${id}/progress-cards`)).toBe(false)
  })

  it('sends activity header for setup-status when available, without requiring a workspace', () => {
    expect(requestSkipsActivityHeader('/dashboard/setup-status')).toBe(false)
    expect(requestRequiresActivityWorkspace('/dashboard/setup-status')).toBe(false)
  })
})
