import { useCallback, useEffect, useMemo, useState } from 'react'
import { skatingIntelligenceApi } from '../api/skatingIntelligenceApi'
import { buildProgressSnapshot, groupSkillsByCategory } from './athleteIntelligenceData'

/**
 * DB-backed athlete intelligence loaders — shared by inline tabs and capture drawer.
 * @param {string|null|undefined} studentId
 * @param {string} activeTab — `today` | `skills` | `progress` | `history` | `kpis` | `notes`
 * @param {{ enabled?: boolean, prefetch?: boolean }} [options]
 */
export default function useAthleteIntelligence(studentId, activeTab, options = {}) {
  const { enabled = true, prefetch = true } = options
  const [skillsData, setSkillsData] = useState(null)
  const [skillsErr, setSkillsErr] = useState('')
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressData, setProgressData] = useState(null)
  const [progressErr, setProgressErr] = useState('')
  const [histLoading, setHistLoading] = useState(false)
  const [histData, setHistData] = useState(null)
  const [skillTapSaving, setSkillTapSaving] = useState('')
  const [showAllProgress, setShowAllProgress] = useState(false)

  const progressTab = activeTab === 'progress' || activeTab === 'kpis'

  const loadSkills = useCallback(async () => {
    if (!studentId) return
    setSkillsErr('')
    setSkillsLoading(true)
    try {
      const data = await skatingIntelligenceApi.getSkillCatalog({ studentId })
      setSkillsData(data)
    } catch (e) {
      setSkillsErr(e?.response?.data?.error || e?.message || 'Failed to load skills')
      setSkillsData(null)
    } finally {
      setSkillsLoading(false)
    }
  }, [studentId])

  const loadProgress = useCallback(async () => {
    if (!studentId) return
    setProgressErr('')
    setProgressLoading(true)
    try {
      const raw = await skatingIntelligenceApi.getStudentKpiSnapshots(studentId, {
        limit: showAllProgress ? 90 : 30,
      })
      setProgressData(buildProgressSnapshot(raw, { showAll: showAllProgress }))
    } catch (e) {
      setProgressErr(e?.response?.data?.error || e?.message || 'Failed to load')
      setProgressData(null)
    } finally {
      setProgressLoading(false)
    }
  }, [studentId, showAllProgress])

  const loadHistory = useCallback(async () => {
    if (!studentId) return
    setHistLoading(true)
    try {
      const data = await skatingIntelligenceApi.getTimeline(studentId)
      setHistData(data)
    } catch {
      setHistData(null)
    } finally {
      setHistLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    setSkillsData(null)
    setProgressData(null)
    setHistData(null)
    setSkillsErr('')
    setProgressErr('')
    setShowAllProgress(false)
  }, [studentId])

  useEffect(() => {
    if (!enabled || !studentId || !prefetch) return
    void loadSkills()
  }, [enabled, studentId, prefetch, loadSkills])

  useEffect(() => {
    if (!enabled || !studentId) return
    if (activeTab === 'skills') void loadSkills()
    if (progressTab) void loadProgress()
    if (activeTab === 'history') void loadHistory()
  }, [enabled, studentId, activeTab, progressTab, loadSkills, loadProgress, loadHistory])

  const skillsGrouped = useMemo(() => groupSkillsByCategory(skillsData), [skillsData])

  const tapSkillLevel = useCallback(
    async (skillId, level) => {
      if (!studentId) return
      setSkillTapSaving(skillId + level)
      try {
        await skatingIntelligenceApi.patchStudentSkill(studentId, skillId, { currentLevel: level })
        await loadSkills()
      } catch (e) {
        setSkillsErr(e?.response?.data?.error || e?.message || 'Save failed')
      } finally {
        setSkillTapSaving('')
      }
    },
    [studentId, loadSkills],
  )

  return {
    skillsData,
    skillsGrouped,
    skillsErr,
    skillsLoading,
    loadSkills,
    progressLoading,
    progressData,
    progressErr,
    loadProgress,
    showAllProgress,
    setShowAllProgress,
    histLoading,
    histData,
    loadHistory,
    skillTapSaving,
    tapSkillLevel,
  }
}
