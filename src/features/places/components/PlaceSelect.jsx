import React, { useMemo, useState } from 'react'
import { CButton, CFormSelect, CFormText } from '@coreui/react'

/**
 * @param {object} props
 * @param {string} [props.value] place UUID
 * @param {(placeId: string | '') => void} props.onChange
 * @param {ReturnType<import('../utils/placeMappers').mapPlaceFromApi>[]} props.places active list
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {string} [props.className]
 */
export default function PlaceSelect({ value, onChange, places, disabled, loading, className }) {
  const activeList = useMemo(
    () => (Array.isArray(places) ? places.filter((p) => p.isActive) : []),
    [places],
  )
  const single = activeList.length === 1 ? activeList[0] : null
  const [showSelect, setShowSelect] = useState(() => activeList.length !== 1)

  const matchesSingle = single && value === single.id

  if (single && !showSelect && matchesSingle) {
    return (
      <div className={className}>
        <div className="d-flex align-items-center flex-wrap gap-2 py-1">
          <span className="small text-body-secondary">Location</span>
          <span className="fw-semibold">{single.name}</span>
          <CButton
            type="button"
            color="link"
            size="sm"
            className="p-0"
            onClick={() => setShowSelect(true)}
          >
            Change
          </CButton>
          <CButton
            type="button"
            color="link"
            size="sm"
            className="p-0 text-body-secondary"
            onClick={() => onChange('')}
          >
            Clear
          </CButton>
        </div>
        <CFormText className="mb-0">
          Using your primary venue. Change if this class runs elsewhere.
        </CFormText>
      </div>
    )
  }

  return (
    <div className={className}>
      {single ? (
        <div className="mb-1">
          <CButton
            type="button"
            variant="ghost"
            size="sm"
            className="p-0"
            onClick={() => {
              setShowSelect(false)
              onChange(single.id)
            }}
          >
            Use {single.name}
          </CButton>
        </div>
      ) : null}
      <CFormSelect
        aria-label="Select place"
        disabled={disabled || loading}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || '')}
      >
        <option value="">
          {loading && !activeList.length ? 'Loading places…' : 'No place selected'}
        </option>
        {activeList.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </CFormSelect>
    </div>
  )
}
