import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentsDir = path.resolve(__dirname, '../components')
const liveComponentNames = [
  'ActiveAthleteWorkspace.jsx',
  'AthleteCardStrip.jsx',
  'AthleteIntelligenceTabs.jsx',
  'CoachLiveSessionView.jsx',
  'CoachLiveTimingSection.jsx',
  'FastCoachingPanel.jsx',
  'PhaseModeStrip.jsx',
  'SessionLiveHeader.jsx',
  'AthleteQuickActionsMenu.jsx',
  'ActiveAthleteWorkspace.jsx',
]

describe('live coaching UI must not say KPI', () => {
  it('live components contain no KPI token', () => {
    const forbidden = /\bKPIs?\b/
    for (const name of liveComponentNames) {
      const filePath = path.join(componentsDir, name)
      const src = fs.readFileSync(filePath, 'utf8')
      expect(src, `${name} should not contain KPI in user-facing copy`).not.toMatch(forbidden)
    }
  })
})
