import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PlaceForm from '../components/PlaceForm'
import { createPlace } from '../slices/placesSlice'

export default function PlaceCreatePage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  return (
    <PlaceForm
      title="Add place"
      subtitle="Operational venue for schedules and classes."
      submitLabel="Create place"
      saving={saving}
      error={error}
      onSubmit={async (payload) => {
        setError(null)
        setSaving(true)
        try {
          const place = await dispatch(createPlace(payload)).unwrap()
          if (place?.id) {
            navigate(`/coach/places/${encodeURIComponent(place.id)}`, { replace: true })
          }
        } catch (e) {
          setError(e)
        } finally {
          setSaving(false)
        }
      }}
    />
  )
}
