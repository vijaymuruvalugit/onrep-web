import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearPlacesErrors,
  clearSelectedPlace,
  createPlace,
  deactivatePlace,
  fetchPlaceById,
  fetchPlaces,
  fetchPlacesUsageStats,
  reactivatePlace,
  setPlacesFilters,
  setSelectedPlace,
  updatePlace,
} from '../slices/placesSlice'

export default function usePlaces() {
  const dispatch = useDispatch()
  const placesState = useSelector((state) => state.places)

  const activePlaces = useMemo(
    () => placesState.items.filter((p) => p.isActive !== false),
    [placesState.items],
  )

  return {
    ...placesState,
    activePlaces,
    fetchPlaces: useCallback((params) => dispatch(fetchPlaces(params)), [dispatch]),
    fetchPlaceById: useCallback((id) => dispatch(fetchPlaceById(id)), [dispatch]),
    fetchPlacesUsageStats: useCallback(() => dispatch(fetchPlacesUsageStats()), [dispatch]),
    createPlace: useCallback((payload) => dispatch(createPlace(payload)), [dispatch]),
    updatePlace: useCallback(
      (placeId, payload) => dispatch(updatePlace({ placeId, payload })),
      [dispatch],
    ),
    deactivatePlace: useCallback((placeId) => dispatch(deactivatePlace(placeId)), [dispatch]),
    reactivatePlace: useCallback((placeId) => dispatch(reactivatePlace(placeId)), [dispatch]),
    setPlacesFilters: useCallback((payload) => dispatch(setPlacesFilters(payload)), [dispatch]),
    clearPlacesErrors: useCallback(() => dispatch(clearPlacesErrors()), [dispatch]),
    clearSelectedPlace: useCallback(() => dispatch(clearSelectedPlace()), [dispatch]),
    setSelectedPlace: useCallback((p) => dispatch(setSelectedPlace(p)), [dispatch]),
  }
}
