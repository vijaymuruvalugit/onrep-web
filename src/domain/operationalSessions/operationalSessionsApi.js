import http from '../../api/http'

/** @param {string} dateYmd */
export async function getDayBoard(dateYmd) {
  const { data } = await http.get('/operational-sessions/day-board', {
    params: { date: dateYmd },
  })
  return { date: data?.date, sessions: Array.isArray(data?.sessions) ? data.sessions : [] }
}

/**
 * @param {string} fromYmd
 * @param {string} toYmd
 * @param {string|null} [batchId]
 */
export async function getBoardRange(fromYmd, toYmd, batchId = null) {
  const params = { from: fromYmd, to: toYmd }
  if (batchId) params.batchId = batchId
  const { data } = await http.get('/operational-sessions/board', { params })
  return {
    from: data?.from,
    to: data?.to,
    batchId: data?.batchId ?? null,
    operationalToday: data?.operationalToday ?? null,
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
  }
}

export async function getSession(sessionId) {
  const { data } = await http.get(`/operational-sessions/${encodeURIComponent(sessionId)}`)
  return data?.session ?? null
}

export async function startSession(sessionId) {
  const { data } = await http.post(`/operational-sessions/${encodeURIComponent(sessionId)}/start`)
  return data?.session ?? null
}

export async function pauseSession(sessionId) {
  const { data } = await http.post(`/operational-sessions/${encodeURIComponent(sessionId)}/pause`)
  return data?.session ?? null
}

export async function endSession(sessionId) {
  const { data } = await http.post(`/operational-sessions/${encodeURIComponent(sessionId)}/end`)
  return data?.session ?? null
}

export async function cancelSession(sessionId) {
  const { data } = await http.patch(`/operational-sessions/${encodeURIComponent(sessionId)}/state`, {
    state: 'cancelled',
  })
  return data?.session ?? null
}

export default {
  getDayBoard,
  getBoardRange,
  getSession,
  startSession,
  pauseSession,
  endSession,
  cancelSession,
}
