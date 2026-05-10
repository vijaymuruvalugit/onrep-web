/**
 * Run async tasks with max concurrency (no extra deps).
 * @template T,R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
export async function runWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const i = next
      next += 1
      results[i] = await fn(items[i], i)
    }
  }

  const n = Math.min(Math.max(1, limit), Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}
