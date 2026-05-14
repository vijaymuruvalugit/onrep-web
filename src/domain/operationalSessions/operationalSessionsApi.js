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
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
  }
}

export default { getDayBoard, getBoardRange }
