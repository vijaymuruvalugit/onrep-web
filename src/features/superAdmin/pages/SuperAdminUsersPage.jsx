import React, { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CFormInput,
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

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUsers(
        await superAdminApi.searchUsers({
          q: q || undefined,
          role: role || undefined,
        }),
      )
    } catch (e) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }, [q, role])

  useEffect(() => {
    load()
  }, [load])

  const toggleActive = async (u) => {
    if (u.is_active) await superAdminApi.deactivateUser(u.id)
    else await superAdminApi.reactivateUser(u.id)
    setMessage(`${u.email} ${u.is_active ? 'deactivated' : 'reactivated'}`)
    load()
  }

  const resetInvite = async (u) => {
    const out = await superAdminApi.resetInvite(u.id)
    setMessage(`Invite reset for ${u.email}. Token: ${out?.invite_token?.slice(0, 8)}…`)
  }

  return (
    <div className="p-4">
      <SuperAdminPageHeader
        title="Users"
        subtitle="Search coaches, parents, students, and academy admins — access troubleshooting only."
        actions={
          <>
            <CFormInput
              placeholder="Email or name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            <CFormSelect value={role} onChange={(e) => setRole(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">All roles</option>
              <option value="academy_owner">Owner</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
              <option value="parent">Parent</option>
              <option value="member">Student</option>
            </CFormSelect>
            <CButton color="primary" size="sm" onClick={load}>
              Search
            </CButton>
          </>
        }
      />
      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {message ? <CAlert color="info">{message}</CAlert> : null}
      {loading ? (
        <CSpinner size="sm" />
      ) : (
        <CTable hover responsive size="sm" className="bg-white rounded shadow-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Name</CTableHeaderCell>
              <CTableHeaderCell>Email</CTableHeaderCell>
              <CTableHeaderCell>Role</CTableHeaderCell>
              <CTableHeaderCell>Academy</CTableHeaderCell>
              <CTableHeaderCell>Active</CTableHeaderCell>
              <CTableHeaderCell />
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {users.map((u) => (
              <CTableRow key={u.id}>
                <CTableDataCell>{u.name}</CTableDataCell>
                <CTableDataCell>{u.email}</CTableDataCell>
                <CTableDataCell>{u.role}</CTableDataCell>
                <CTableDataCell>{u.academy_name || '—'}</CTableDataCell>
                <CTableDataCell>{u.is_active ? 'Yes' : 'No'}</CTableDataCell>
                <CTableDataCell className="text-nowrap">
                  <CButton size="sm" color="link" onClick={() => toggleActive(u)}>
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </CButton>
                  {u.invited ? (
                    <CButton size="sm" color="link" onClick={() => resetInvite(u)}>
                      Reset invite
                    </CButton>
                  ) : null}
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </div>
  )
}
