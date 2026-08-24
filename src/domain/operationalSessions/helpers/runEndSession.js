function lifecycleErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
  )
}

/**
 * Run a session lifecycle API call without treating local UI as updated on failure.
 * @param {(sessionId: string) => Promise<object|null>} action
 * @param {string} sessionId
 * @returns {Promise<{ ok: true, session: object|null } | { ok: false, error: unknown, message: string }>}
 */
export async function trySessionLifecycleAction(action, sessionId, fallbackMessage) {
  try {
    const session = await action(sessionId)
    return { ok: true, session }
  } catch (error) {
    return {
      ok: false,
      error,
      message: lifecycleErrorMessage(error, fallbackMessage || 'Request failed. Try again.'),
    }
  }
}

export async function tryEndSession(endSession, sessionId) {
  return trySessionLifecycleAction(endSession, sessionId, 'Could not end session. Try again.')
}

export async function tryStartSession(startSession, sessionId) {
  return trySessionLifecycleAction(startSession, sessionId, 'Could not start session. Try again.')
}
