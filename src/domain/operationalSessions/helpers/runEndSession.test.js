import { describe, expect, it, vi } from 'vitest'
import { tryEndSession, tryStartSession, trySessionLifecycleAction } from './runEndSession'

describe('trySessionLifecycleAction', () => {
  it('returns completed session on success', async () => {
    const session = { id: 's1', state: 'completed' }
    const endSession = vi.fn().mockResolvedValue(session)
    const result = await tryEndSession(endSession, 's1')
    expect(result).toEqual({ ok: true, session })
    expect(endSession).toHaveBeenCalledWith('s1')
  })

  it('does not throw on failure and does not report success', async () => {
    const err = Object.assign(new Error('network down'), {
      response: { status: 500, data: { error: 'Failed to end session' } },
    })
    const endSession = vi.fn().mockRejectedValue(err)
    const result = await tryEndSession(endSession, 's1')
    expect(result.ok).toBe(false)
    expect(result.session).toBeUndefined()
    expect(result.message).toBe('Failed to end session')
    expect(result.error).toBe(err)
  })

  it('keeps start failures retryable without a success payload', async () => {
    const startSession = vi.fn().mockRejectedValue(new Error('timeout'))
    const result = await tryStartSession(startSession, 's1')
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/timeout|Could not start session/)
  })

  it('uses fallback copy when the error has no message', async () => {
    const result = await trySessionLifecycleAction(
      async () => {
        throw { response: { status: 503 } }
      },
      's1',
      'Could not end session. Try again.',
    )
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Could not end session. Try again.')
  })
})
