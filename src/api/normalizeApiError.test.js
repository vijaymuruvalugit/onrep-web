import { describe, expect, it } from 'vitest'
import normalizeApiError from './normalizeApiError'
import { WORKSPACE_PICK_MESSAGE } from '../core/activityWorkspace/apiActivityContext'

describe('normalizeApiError', () => {
  it('replaces missing activity context copy with a coach-facing prompt', () => {
    const n = normalizeApiError({
      response: {
        status: 400,
        data: {
          code: 'ACTIVITY_CONTEXT_REQUIRED',
          error: 'Missing activity context (x-activity-id)',
        },
      },
    })
    expect(n.code).toBe('ACTIVITY_CONTEXT_REQUIRED')
    expect(n.message).toBe(WORKSPACE_PICK_MESSAGE)
    expect(n.message).not.toMatch(/x-activity-id/i)
  })

  it('replaces workspace gate errors', () => {
    const n = normalizeApiError({
      message: 'Choose an activity to continue.',
      code: 'WORKSPACE_REQUIRED',
      response: {
        status: 0,
        data: { error: 'Choose an activity to continue.', code: 'WORKSPACE_REQUIRED' },
      },
    })
    expect(n.message).toBe(WORKSPACE_PICK_MESSAGE)
  })
})
