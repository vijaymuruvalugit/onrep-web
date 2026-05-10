/**
 * Bounded poller for parent-summary after a Razorpay link is opened.
 *
 * Phase 1 keeps it simple: a fixed interval with a hard maximum duration so we
 * never stay noisy after a parent abandons the checkout tab. The helper is a
 * plain object with `start` / `stop` so callers (e.g. `ParentPaymentHistoryPage`)
 * can guard against unmount / repeat clicks.
 */

const DEFAULT_INTERVAL_MS = 4_000
const DEFAULT_MAX_DURATION_MS = 120_000

export function createParentSummaryPoller({
  intervalMs = DEFAULT_INTERVAL_MS,
  maxDurationMs = DEFAULT_MAX_DURATION_MS,
} = {}) {
  let timerId = null
  let deadlineAt = 0

  function clearTimer() {
    if (timerId != null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  return {
    /**
     * @param {() => Promise<{ done: boolean }>} tick
     *   Caller fetches the summary and reports whether the watched obligation
     *   has cleared (`done: true`). Throwing aborts the poll.
     * @param {{ onTimeout?: () => void, onError?: (e: unknown) => void }} [callbacks]
     */
    start(tick, callbacks = {}) {
      this.stop()
      deadlineAt = Date.now() + maxDurationMs

      const run = async () => {
        timerId = null
        if (Date.now() > deadlineAt) {
          callbacks.onTimeout?.()
          return
        }
        try {
          const result = await tick()
          if (result?.done) {
            return
          }
        } catch (error) {
          callbacks.onError?.(error)
          return
        }
        timerId = setTimeout(run, intervalMs)
      }

      timerId = setTimeout(run, intervalMs)
    },

    stop() {
      clearTimer()
      deadlineAt = 0
    },

    get isRunning() {
      return timerId != null
    },
  }
}

export default createParentSummaryPoller
