import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormSelect,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { superAdminApi } from '../api/superAdminApi'
import SuperAdminPageHeader from '../components/SuperAdminPageHeader'

export default function SuperAdminPresetsPage() {
  const [presetType, setPresetType] = useState('')
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPresets(await superAdminApi.listPresets(presetType || undefined))
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [presetType])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="System presets"
        subtitle="Curated platform defaults — session presets, observations, tags, exercise lists."
        actions={
          <CFormSelect value={presetType} onChange={(e) => setPresetType(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All types</option>
            <option value="session_preset">Session presets</option>
            <option value="observation">Observations</option>
            <option value="tag">Tags</option>
            <option value="exercise_list">Exercise lists</option>
          </CFormSelect>
        }
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CTable hover responsive size="sm" className="bg-white rounded shadow-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell>Key</CTableHeaderCell>
              <CTableHeaderCell>Name</CTableHeaderCell>
              <CTableHeaderCell>Order</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {presets.map((p) => (
              <CTableRow key={p.id}>
                <CTableDataCell>{p.preset_type}</CTableDataCell>
                <CTableDataCell>
                  <code>{p.key}</code>
                </CTableDataCell>
                <CTableDataCell>{p.name}</CTableDataCell>
                <CTableDataCell>{p.sort_order}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
      <p className="small text-body-secondary mt-3">
        Presets are opinionated and constrained. Edit via API for now; avoid giant preset ecosystems.
      </p>
    </div>
  )
}
