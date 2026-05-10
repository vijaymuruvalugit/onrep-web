import { normalizeScheduleRowForUi } from './placeMappers'

/**
 * Build usage counts and schedule rows per place from batch schedules.
 * @param {Record<string, unknown[]>} schedulesByBatchId
 * @param {Record<string, { name?: string }>} batchMetaById batchId -> { name }
 */
export function buildUsageMaps(schedulesByBatchId, batchMetaById = {}) {
  /** @type {Record<string, { scheduleRows: number, batchIds: Set<string> }>} */
  const acc = {}
  /** @type {Record<string, Array<{ batchId: string, batchName: string, schedule: ReturnType<normalizeScheduleRowForUi> }>>} */
  const rowsByPlace = {}

  for (const [batchId, rows] of Object.entries(schedulesByBatchId || {})) {
    const list = Array.isArray(rows) ? rows : []
    const batchName = batchMetaById[batchId]?.name || 'Batch'
    for (const raw of list) {
      const row = normalizeScheduleRowForUi(raw)
      const pid = row.placeId
      if (!pid) continue
      if (!acc[pid]) acc[pid] = { scheduleRows: 0, batchIds: new Set() }
      acc[pid].scheduleRows += 1
      acc[pid].batchIds.add(String(batchId))
      if (!rowsByPlace[pid]) rowsByPlace[pid] = []
      rowsByPlace[pid].push({
        batchId: String(batchId),
        batchName,
        schedule: row,
      })
    }
  }

  /** @type {Record<string, { scheduleCount: number, batchCount: number, batchIds: string[] }>} */
  const statsByPlaceId = {}
  for (const [pid, v] of Object.entries(acc)) {
    statsByPlaceId[pid] = {
      scheduleCount: v.scheduleRows,
      batchCount: v.batchIds.size,
      batchIds: [...v.batchIds],
    }
  }

  return { statsByPlaceId, rowsByPlaceId: rowsByPlace }
}
