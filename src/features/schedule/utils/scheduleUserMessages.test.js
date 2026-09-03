import { describe, expect, it } from 'vitest'
import { friendlyScheduleApiMessage } from './scheduleUserMessages'

describe('friendlyScheduleApiMessage', () => {
  it('never surfaces Postgres / SQL schema errors', () => {
    expect(friendlyScheduleApiMessage('column u_extra.academy_id does not exist')).toMatch(
      /try again|Refresh|Retry/i,
    )
    expect(friendlyScheduleApiMessage({ message: 'relation users does not exist' })).not.toMatch(
      /does not exist/i,
    )
    expect(
      friendlyScheduleApiMessage({
        response: { data: { error: 'column u_extra_m.user_id does not exist' } },
      }),
    ).not.toMatch(/column /i)
  })

  it('maps generic load failures without leaking backend copy', () => {
    expect(friendlyScheduleApiMessage('Failed to load schedules')).not.toBe('Failed to load schedules')
  })

  it('does not surface missing activity-header internals', () => {
    expect(friendlyScheduleApiMessage('Missing activity context (x-activity-id)')).not.toMatch(
      /x-activity-id/i,
    )
  })

  it('maps preview 500s to retry copy', () => {
    expect(friendlyScheduleApiMessage('Failed to preview schedule')).not.toBe(
      'Failed to preview schedule',
    )
  })
})
