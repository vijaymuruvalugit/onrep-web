/**
 * Transitional batch rules (pre–batches.activity_id): a batch is shown in the active workspace
 * only if it has at least one schedule row for that activity (via GET /batch-schedules/:batchId,
 * which is activity-scoped on the server). See Activities migration plan Phase 2C.
 */

export async function filterBatchesWithSchedulesInWorkspace(listBatches, listSchedulesForBatch) {
  const items = Array.isArray(listBatches) ? listBatches : []
  if (items.length === 0) return []

  const results = await Promise.all(
    items.map(async (batch) => {
      const id = batch.id || batch._id
      if (!id) return { batch, include: false }
      try {
        const rows = await listSchedulesForBatch(id)
        const n = Array.isArray(rows) ? rows.length : 0
        return { batch, include: n > 0 }
      } catch {
        return { batch, include: false }
      }
    }),
  )

  return results.filter((r) => r.include).map((r) => r.batch)
}
