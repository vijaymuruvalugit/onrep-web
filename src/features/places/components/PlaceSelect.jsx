import React, { useMemo, useState } from 'react'
import { CButton, CFormSelect, CFormText } from '@coreui/react'
import AddPlaceQuickForm from './AddPlaceQuickForm'

/**
 * @param {object} props
 * @param {string} [props.value] place UUID
 * @param {(placeId: string | '') => void} props.onChange
 * @param {ReturnType<import('../utils/placeMappers').mapPlaceFromApi>[]} props.places active list
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {string} [props.className]
 * @param {(payload: { name: string, address?: string }) => Promise<{ id: string }|null|undefined>} [props.onQuickAddPlace]
 * @param {boolean} [props.quickAddSaving]
 * @param {string|null} [props.quickAddError]
 */
export default function PlaceSelect({
  value,
  onChange,
  places,
  disabled,
  loading,
  className,
  onQuickAddPlace,
  quickAddSaving = false,
  quickAddError = null,
}) {
  const activeList = useMemo(
    () => (Array.isArray(places) ? places.filter((p) => p.isActive) : []),
    [places],
  )
  const single = activeList.length === 1 ? activeList[0] : null
  const [showSelect, setShowSelect] = useState(() => activeList.length !== 1)
  const [showQuickAdd, setShowQuickAdd] = useState(() => activeList.length === 0 && Boolean(onQuickAddPlace))

  const matchesSingle = single && value === single.id

  const handleQuickAdd = async (payload) => {
    if (!onQuickAddPlace) return
    const created = await onQuickAddPlace(payload)
    if (created?.id) {
      onChange(String(created.id))
      setShowQuickAdd(false)
      setShowSelect(activeList.length !== 0)
    }
  }

  if (showQuickAdd && onQuickAddPlace) {
    return (
      <div className={className}>
        <CFormText className="mb-2">
          Add where this batch trains. You can fill in more details later under Places.
        </CFormText>
        <AddPlaceQuickForm
          onSubmit={handleQuickAdd}
          onCancel={activeList.length > 0 ? () => setShowQuickAdd(false) : undefined}
          saving={quickAddSaving}
          error={quickAddError}
        />
      </div>
    )
  }

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
      {activeList.length === 0 && !loading ? (
        <CFormText className="mt-2 mb-0">
          No venues yet.{' '}
          {onQuickAddPlace ? (
            <CButton
              type="button"
              color="link"
              className="p-0 align-baseline"
              onClick={() => setShowQuickAdd(true)}
            >
              Add a venue
            </CButton>
          ) : null}
        </CFormText>
      ) : onQuickAddPlace ? (
        <div className="mt-2">
          <CButton
            type="button"
            color="link"
            size="sm"
            className="p-0"
            onClick={() => setShowQuickAdd(true)}
          >
            + Add another venue
          </CButton>
        </div>
      ) : null}
    </div>
  )
}
