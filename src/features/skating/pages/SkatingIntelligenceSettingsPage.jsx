import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { batchesApi } from '../../batches/api/batchesApi'
import { skatingIntelligenceApi } from '../api/skatingIntelligenceApi'

export default function SkatingIntelligenceSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [settings, setSettings] = useState(null)
  const [batches, setBatches] = useState([])
  const [catalog, setCatalog] = useState([])
  const [batchId, setBatchId] = useState('')
  const [batchSkillPick, setBatchSkillPick] = useState(new Set())
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('Custom')
  const [savingFocus, setSavingFocus] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    setLoading(true)
    try {
      const [s, bl, cat] = await Promise.all([
        skatingIntelligenceApi.getAcademySettings(),
        batchesApi.listBatches({ limit: 200 }),
        skatingIntelligenceApi.getSkillCatalog({}),
      ])
      setSettings(s)
      setBatches(bl.batches || [])
      setCatalog(cat.catalog || cat.skills || [])
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const primaryKpiCodes = useMemo(
    () =>
      new Set([
        'SESSION_BEST_LAP_MS',
        'SESSION_LAP_CONSISTENCY_SCORE',
        'ROLLING_ATTENDANCE_PCT',
        'TREND_SPEED_DELTA',
        'TREND_TECHNIQUE_DELTA',
      ]),
    [],
  )

  async function saveSkillRow(row, patch) {
    setErr('')
    try {
      const next = await skatingIntelligenceApi.patchAcademySettings({
        skills: [
          {
            skillDefinitionId: row.skillDefinitionId,
            ...patch,
          },
        ],
      })
      setSettings(next)
      setMsg('Saved skill settings')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Save failed')
    }
  }

  async function saveKpiRow(row, patch) {
    setErr('')
    try {
      const next = await skatingIntelligenceApi.patchAcademySettings({
        kpis: [{ kpiId: row.kpiId, ...patch }],
      })
      setSettings(next)
      setMsg('Saved KPI settings')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Save failed')
    }
  }

  async function addCustomSkill() {
    setErr('')
    const name = customName.trim()
    if (!name) return
    try {
      await skatingIntelligenceApi.createCustomSkill({
        name,
        category: customCategory.trim() || 'Custom',
      })
      setCustomName('')
      setMsg('Custom skill added')
      setTimeout(() => setMsg(''), 2000)
      await load()
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to add skill')
    }
  }

  async function saveBatchFocus() {
    if (!batchId) return
    setSavingFocus(true)
    setErr('')
    try {
      await skatingIntelligenceApi.putBatchFocus(batchId, { skillIds: Array.from(batchSkillPick) })
      setMsg('Batch focus saved')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Failed batch focus')
    } finally {
      setSavingFocus(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 d-flex align-items-center gap-2">
        <CSpinner size="sm" /> <span>Loading intelligence settings…</span>
      </div>
    )
  }

  return (
    <CRow className="p-3">
      <CCol lg={10}>
        <h2 className="h4 mb-3">Skating intelligence settings</h2>
        <p className="small text-body-secondary">
          Defaults work out of the box. Use this page for optional visibility, targets, custom skills, and batch
          focus.
        </p>
        {err ? <CAlert color="danger">{err}</CAlert> : null}
        {msg ? <CAlert color="success" className="py-2">{msg}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader>Skill configuration</CCardHeader>
          <CCardBody className="p-0">
            <CTable responsive hover className="mb-0 small align-middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Skill</CTableHeaderCell>
                  <CTableHeaderCell>Category</CTableHeaderCell>
                  <CTableHeaderCell>Order</CTableHeaderCell>
                  <CTableHeaderCell>Target 1–5</CTableHeaderCell>
                  <CTableHeaderCell>Hidden</CTableHeaderCell>
                  <CTableHeaderCell />
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {(settings?.skills || []).map((s) => (
                  <CTableRow key={s.skillDefinitionId}>
                    <CTableDataCell>
                      <div className="fw-semibold">{s.canonicalName}</div>
                      {s.custom ? <span className="badge bg-warning text-dark ms-1">Custom</span> : null}
                    </CTableDataCell>
                    <CTableDataCell>{s.category}</CTableDataCell>
                    <CTableDataCell style={{ maxWidth: 88 }}>
                      <CFormInput
                        type="number"
                        size="sm"
                        defaultValue={s.displayOrder}
                        onBlur={(e) => {
                          const n = Number(e.target.value)
                          if (Number.isFinite(n)) void saveSkillRow(s, { displayOrder: n })
                        }}
                      />
                    </CTableDataCell>
                    <CTableDataCell style={{ maxWidth: 100 }}>
                      <CFormSelect
                        size="sm"
                        value={s.targetLevel ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          void saveSkillRow(s, { targetLevel: v === '' ? null : Number(v) })
                        }}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </CFormSelect>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormCheck
                        checked={!!s.hidden}
                        onChange={(e) => void saveSkillRow(s, { hidden: e.target.checked })}
                      />
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButton size="sm" color="light" type="button" onClick={() => void load()}>
                        Refresh
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>Custom skills</CCardHeader>
          <CCardBody>
            <CRow className="g-2 align-items-end">
              <CCol md={4}>
                <label className="form-label small">Name</label>
                <CFormInput value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Relay transition" />
              </CCol>
              <CCol md={3}>
                <label className="form-label small">Category</label>
                <CFormInput value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
              </CCol>
              <CCol md={2}>
                <CButton color="primary" type="button" onClick={() => void addCustomSkill()}>
                  Add
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>KPI visibility & targets</CCardHeader>
          <CCardBody className="p-0">
            <CTable responsive hover className="mb-0 small">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>KPI</CTableHeaderCell>
                  <CTableHeaderCell>Default</CTableHeaderCell>
                  <CTableHeaderCell>Hidden</CTableHeaderCell>
                  <CTableHeaderCell>Target</CTableHeaderCell>
                  <CTableHeaderCell>Warning</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {(settings?.kpis || [])
                  .slice()
                  .sort((a, b) => {
                    const ap = primaryKpiCodes.has(a.code) ? 0 : 1
                    const bp = primaryKpiCodes.has(b.code) ? 0 : 1
                    if (ap !== bp) return ap - bp
                    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
                  })
                  .map((k) => (
                    <CTableRow key={k.kpiId}>
                      <CTableDataCell>
                        <div className="fw-semibold">{k.name}</div>
                        <div className="text-muted font-monospace" style={{ fontSize: '.7rem' }}>
                          {k.code}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{primaryKpiCodes.has(k.code) ? 'Primary' : 'Advanced'}</CTableDataCell>
                      <CTableDataCell>
                        <CFormCheck
                          checked={!!k.hidden}
                          onChange={(e) => void saveKpiRow(k, { hidden: e.target.checked })}
                        />
                      </CTableDataCell>
                      <CTableDataCell style={{ maxWidth: 110 }}>
                        <CFormInput
                          size="sm"
                          defaultValue={k.targetValue ?? ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            if (v === '') {
                              void saveKpiRow(k, { targetValue: null })
                              return
                            }
                            const n = Number(v)
                            if (!Number.isFinite(n)) return
                            void saveKpiRow(k, { targetValue: n })
                          }}
                        />
                      </CTableDataCell>
                      <CTableDataCell style={{ maxWidth: 110 }}>
                        <CFormInput
                          size="sm"
                          defaultValue={k.warningThreshold ?? ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            if (v === '') {
                              void saveKpiRow(k, { warningThreshold: null })
                              return
                            }
                            const n = Number(v)
                            if (!Number.isFinite(n)) return
                            void saveKpiRow(k, { warningThreshold: n })
                          }}
                        />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>Batch development focus</CCardHeader>
          <CCardBody>
            <div className="small text-muted mb-2">
              Pick a batch, then select platform skills to highlight for that cohort.
            </div>
            <CRow className="g-2 mb-3">
              <CCol md={5}>
                <CFormSelect value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                  <option value="">Select batch…</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {(b.name || 'Batch').slice(0, 48)}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CButton type="button" color="primary" disabled={savingFocus || !batchId} onClick={() => void saveBatchFocus()}>
                  {savingFocus ? 'Saving…' : 'Save focus'}
                </CButton>
              </CCol>
            </CRow>
            <div className="border rounded p-2" style={{ maxHeight: 220, overflow: 'auto' }}>
              {catalog
                .filter((s) => !s.custom)
                .map((s) => (
                  <CFormCheck
                    key={s.id}
                    id={`bf-${s.id}`}
                    label={`${s.category} · ${s.displayName || s.canonicalName}`}
                    checked={batchSkillPick.has(String(s.id))}
                    onChange={(e) => {
                      const next = new Set(batchSkillPick)
                      if (e.target.checked) next.add(String(s.id))
                      else next.delete(String(s.id))
                      setBatchSkillPick(next)
                    }}
                    className="mb-1"
                  />
                ))}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
