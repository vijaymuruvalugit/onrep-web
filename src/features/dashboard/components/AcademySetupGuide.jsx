import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { hasAcademyAdminMembership } from '../../auth/utils/academyAdminAccess'
import academySetupStatusApi from '../api/academySetupStatusApi'
import AcademySetupGuideCard from './AcademySetupGuideCard'
import { buildAcademySetupGuideModel } from '../utils/academySetupGuide'
import {
  readAcademySetupGuideCollapsed,
  writeAcademySetupGuideCollapsed,
} from '../utils/academySetupGuideStorage'

function identityStorageKey(user) {
  return user?.identityId || user?.identity_id || user?.id || null
}

function AcademySetupGuideInner({ storageIdentity, academyId }) {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [collapsed, setCollapsed] = useState(() =>
    readAcademySetupGuideCollapsed(storageIdentity, academyId),
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await academySetupStatusApi.getSetupStatus()
      setPayload(data)
    } catch (e) {
      setError(e)
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch setup status on mount
    void load()
  }, [load])

  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void load()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const model = useMemo(() => (payload ? buildAcademySetupGuideModel(payload) : null), [payload])

  const onToggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      writeAcademySetupGuideCollapsed(storageIdentity, academyId, next)
      return next
    })
  }, [storageIdentity, academyId])

  return (
    <AcademySetupGuideCard
      model={model}
      loading={loading}
      error={error}
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
      onRetry={load}
    />
  )
}

/**
 * Dashboard launch-readiness guide. Loads independently of KPI cards so a failed
 * setup-status request never looks like an unconfigured academy.
 */
export default function AcademySetupGuide() {
  const user = useSelector((state) => state.auth.user)
  const academyId = user?.academy_id || user?.academyId || null
  const activeActivityId = useSelector((state) => state.workspace?.activeActivityId || null)
  const canSee = hasAcademyAdminMembership(user)
  const storageIdentity = identityStorageKey(user)

  if (!canSee) return null

  return (
    <AcademySetupGuideInner
      key={`${storageIdentity || 'anon'}:${academyId || 'none'}:${activeActivityId || 'none'}`}
      storageIdentity={storageIdentity}
      academyId={academyId}
    />
  )
}
