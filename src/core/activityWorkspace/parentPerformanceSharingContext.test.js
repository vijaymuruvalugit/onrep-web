import { describe, expect, it } from 'vitest'
import { requestRequiresActivityWorkspace, requestSkipsActivityHeader } from './apiActivityContext'

describe('apiActivityContext parent performance sharing', () => {
  it('sends x-activity-id for activity-settings', () => {
    expect(requestSkipsActivityHeader('/activity-settings/parent-performance-sharing')).toBe(false)
    expect(requestRequiresActivityWorkspace('/activity-settings/parent-performance-sharing')).toBe(
      true,
    )
  })
})
