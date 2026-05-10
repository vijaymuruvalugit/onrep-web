import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  assignBatchStudents,
  clearBatchErrors,
  createBatch,
  fetchBatchById,
  fetchBatches,
  fetchBatchSchedules,
  fetchBatchUpcomingClasses,
  saveBatchSettings,
} from '../slices/batchesSlice'

export function useBatches() {
  const dispatch = useDispatch()
  const state = useSelector((rootState) => rootState.batches)

  const api = useMemo(
    () => ({
      fetchBatches: (params) => dispatch(fetchBatches(params)),
      fetchBatchById: (batchId) => dispatch(fetchBatchById(batchId)),
      fetchBatchSchedules: (batchId) => dispatch(fetchBatchSchedules(batchId)),
      fetchBatchUpcomingClasses: (params) => dispatch(fetchBatchUpcomingClasses(params)),
      saveBatchSettings: (batchId, payload) => dispatch(saveBatchSettings({ batchId, payload })),
      assignBatchStudents: (batchId, studentIds) =>
        dispatch(assignBatchStudents({ batchId, studentIds })),
      createBatch: (payload) => dispatch(createBatch(payload)),
      clearErrors: () => dispatch(clearBatchErrors()),
    }),
    [dispatch],
  )

  return useCallback(() => ({ ...state, ...api }), [state, api])()
}

export default useBatches
