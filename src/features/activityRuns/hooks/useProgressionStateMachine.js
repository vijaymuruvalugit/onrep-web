import { useCallback, useState } from 'react'

export const RUN_STATES = {
  READY: 'READY',
  ACTIVE: 'ACTIVE',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
}

/**
 * @param {object} [opts]
 * @param {number} [opts.targetProgressCount]
 */
export function useProgressionStateMachine(opts = {}) {
  const [state, setState] = useState(RUN_STATES.READY)
  const [currentProgressIndex, setCurrentProgressIndex] = useState(0)

  const target = opts.targetProgressCount ?? 0

  const startRun = useCallback(() => {
    setState(RUN_STATES.ACTIVE)
    setCurrentProgressIndex(0)
  }, [])

  const recordCapture = useCallback(
    (nextIndex) => {
      const idx = nextIndex ?? currentProgressIndex + 1
      setCurrentProgressIndex(idx)
      if (target > 0 && idx >= target) {
        setState(RUN_STATES.REVIEW)
      }
    },
    [currentProgressIndex, target],
  )

  const finishProgress = useCallback(() => {
    setState(RUN_STATES.REVIEW)
  }, [])

  const completeRun = useCallback(() => {
    setState(RUN_STATES.COMPLETED)
  }, [])

  const resetRun = useCallback(() => {
    setState(RUN_STATES.READY)
    setCurrentProgressIndex(0)
  }, [])

  return {
    state,
    currentProgressIndex,
    startRun,
    recordCapture,
    finishProgress,
    completeRun,
    resetRun,
    isReady: state === RUN_STATES.READY,
    isActive: state === RUN_STATES.ACTIVE,
    isReview: state === RUN_STATES.REVIEW,
    isCompleted: state === RUN_STATES.COMPLETED,
  }
}

export default useProgressionStateMachine
