import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CSpinner } from '@coreui/react'
import PlaceForm from '../components/PlaceForm'
import { fetchPlaceById, updatePlace } from '../slices/placesSlice'

export default function PlaceEditPage() {
  const { placeId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const selectedPlace = useSelector((s) => s.places.selectedPlace)
  const detailLoading = useSelector((s) => s.places.detailLoading)
  const detailError = useSelector((s) => s.places.detailError)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (placeId) dispatch(fetchPlaceById(placeId))
  }, [dispatch, placeId])

  return (
    <>
      {detailLoading ? (
        <div className="text-center py-4">
          <CSpinner />
        </div>
      ) : null}
      {detailError ? <CAlert color="danger">{detailError.message}</CAlert> : null}
      {!detailLoading && selectedPlace && String(selectedPlace.id) === String(placeId) ? (
        <PlaceForm
          title="Edit place"
          subtitle={selectedPlace.name}
          submitLabel="Save changes"
          initialValues={selectedPlace}
          saving={saving}
          error={error}
          onSubmit={async (payload) => {
            setError(null)
            setSaving(true)
            try {
              await dispatch(updatePlace({ placeId, payload })).unwrap()
              navigate(`/coach/places/${encodeURIComponent(placeId)}`, { replace: true })
            } catch (e) {
              setError(e)
            } finally {
              setSaving(false)
            }
          }}
        />
      ) : null}
    </>
  )
}
