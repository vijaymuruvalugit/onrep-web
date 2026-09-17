import { describe, expect, it } from 'vitest'
import {
  PARENT_PERFORMANCE_SHARING_LABEL,
  PARENT_PERFORMANCE_SHARING_TOGGLE,
  PARENT_PERFORMANCE_SHARING_HELPER,
  PARENT_PERFORMANCE_SHARING_ENABLE_CONFIRM,
  PARENT_PERFORMANCE_SHARING_DISABLE_CONFIRM,
} from './parentPerformanceSharingCopy'

describe('parentPerformanceSharingCopy', () => {
  it('defaults to explicit-only wording', () => {
    expect(PARENT_PERFORMANCE_SHARING_LABEL).toBe('Parent performance sharing')
    expect(PARENT_PERFORMANCE_SHARING_TOGGLE).toMatch(/publish performance updates to parents/i)
    expect(PARENT_PERFORMANCE_SHARING_HELPER).toMatch(/Schedule, attendance, fees and receipts/)
    expect(PARENT_PERFORMANCE_SHARING_ENABLE_CONFIRM).toMatch(/will not automatically share/)
    expect(PARENT_PERFORMANCE_SHARING_DISABLE_CONFIRM).toMatch(/explicitly published/)
  })
})
