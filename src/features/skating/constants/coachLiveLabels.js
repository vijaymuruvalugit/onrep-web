/** Live coaching UI vocabulary — never expose KPI/management jargon on the floor. */

export const LIVE_WORDS_MAX = 2

export const LIVE_UI_FORBIDDEN = Object.freeze([
  'KPI',
  'KPIs',
  'metrics',
  'observations',
  'intelligence',
  'configuration',
  'benchmark',
  'operational',
])

export const INTELLIGENCE_TAB_KEYS = Object.freeze(['today', 'skills', 'progress', 'history'])

export const INTELLIGENCE_TABS = Object.freeze([
  { key: 'today', label: 'Today' },
  { key: 'skills', label: 'Skills' },
  { key: 'progress', label: 'Progress' },
  { key: 'history', label: 'History' },
])

/** ≤2 words — live phase strip (admin BLOCK_TYPE_LABELS stay formal). */
export const BLOCK_TYPE_LIVE_LABELS = Object.freeze({
  warmup: 'Warmup',
  technical: 'Skills',
  conditioning: 'Fitness',
  race_simulation: 'Mock race',
  race: 'Race',
  assessment: 'Score',
  recovery: 'Recover',
  cooldown: 'Cooldown',
})

const LIVE_LABELS = Object.freeze({
  coachNow: 'Coach',
  athletes: 'Athletes',
  pickAthlete: 'Pick athlete',
  time: 'Lap time',
  quickTags: 'Quick tags',
  note: 'Note',
  notes: 'Notes',
  score: 'Score',
  assessment: 'Assessment',
  track: 'Track',
  progress: 'Progress',
  skills: 'Skills',
  saved: 'Saved',
  syncing: 'Syncing',
  good: 'Good',
  watch: 'Watch',
  best: 'Best',
  race: 'Race',
  start: 'Start',
  end: 'End',
  inPhase: 'In phase',
  tapScore: 'Tap score',
  signalSaved: 'Saved',
})

/**
 * @param {string} text
 * @param {{ strict?: boolean }} [opts]
 */
export function assertLiveLabel(text, opts = {}) {
  const t = String(text || '').trim()
  if (!t) return t
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length > LIVE_WORDS_MAX && opts.strict !== false) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[coachLiveLabels] label exceeds ${LIVE_WORDS_MAX} words: "${t}"`)
    }
  }
  for (const bad of LIVE_UI_FORBIDDEN) {
    if (new RegExp(`\\b${bad}\\b`, 'i').test(t)) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[coachLiveLabels] forbidden live term in label: "${t}"`)
      }
    }
  }
  return t
}

/**
 * @param {keyof typeof LIVE_LABELS} key
 * @param {'simple'|'advanced'} [_variant]
 */
export function liveLabel(key, _variant = 'simple') {
  const v = LIVE_LABELS[key]
  return assertLiveLabel(v ?? key)
}

/**
 * @param {string} blockType
 * @param {string} [fallbackTitle]
 */
export function isSkillsPhaseBlock(block) {
  const bt = String(block?.blockType || block?.block_type || '').toLowerCase()
  return bt === 'technical'
}

export function livePhaseLabel(blockType, fallbackTitle) {
  const bt = String(blockType || '').toLowerCase()
  const fromType = BLOCK_TYPE_LIVE_LABELS[bt]
  if (fromType) return assertLiveLabel(fromType)
  const title = String(fallbackTitle || 'Phase').trim()
  const words = title.split(/\s+/).slice(0, LIVE_WORDS_MAX)
  return assertLiveLabel(words.join(' '))
}

const SK_LAST_INTEL_TAB = 'onrep.skating.lastIntelTabBySession'

/**
 * @param {string} sessionId
 * @returns {string}
 */
export function readLastIntelligenceTab(sessionId) {
  if (!sessionId) return 'today'
  try {
    const raw = sessionStorage.getItem(SK_LAST_INTEL_TAB)
    const map = raw ? JSON.parse(raw) : {}
    const t = map[String(sessionId)]
    return INTELLIGENCE_TAB_KEYS.includes(t) ? t : 'today'
  } catch {
    return 'today'
  }
}

/**
 * @param {string} sessionId
 * @param {string} tab
 */
export function writeLastIntelligenceTab(sessionId, tab) {
  if (!sessionId || !INTELLIGENCE_TAB_KEYS.includes(tab)) return
  try {
    const raw = sessionStorage.getItem(SK_LAST_INTEL_TAB)
    const map = raw ? JSON.parse(raw) : {}
    map[String(sessionId)] = tab
    sessionStorage.setItem(SK_LAST_INTEL_TAB, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/**
 * Same data model, different coaching surfaces.
 * @param {string} sessionMode
 * @param {boolean} isRaceMode
 * @param {string} [blockType]
 */
export function getLiveUiProfile(sessionMode, isRaceMode, blockType = '') {
  const mode = String(sessionMode || 'practice').toLowerCase()
  const bt = String(blockType || '').toLowerCase()

  if (isRaceMode || bt === 'race' || bt === 'race_simulation' || mode === 'competition') {
    return {
      showQuickScores: false,
      showFormalScoreGrid: false,
      showRaceTiming: true,
      showModeTags: false,
      showIntelligenceTabs: true,
      timeExpanded: true,
      formalScoreExpanded: false,
      emphasizeRecover: false,
      intelligenceTabKeys: ['today', 'skills', 'progress', 'history'],
      deEmphasizeIntelligence: true,
    }
  }

  if (mode === 'assessment' || bt === 'assessment') {
    return {
      showQuickScores: true,
      showFormalScoreGrid: true,
      showRaceTiming: false,
      showModeTags: false,
      showIntelligenceTabs: true,
      timeExpanded: false,
      formalScoreExpanded: false,
      emphasizeRecover: false,
      intelligenceTabKeys: ['today', 'skills', 'progress', 'history'],
    }
  }

  if (bt === 'technical') {
    return {
      showQuickScores: false,
      showFormalScoreGrid: false,
      showRaceTiming: false,
      showModeTags: false,
      showIntelligenceTabs: false,
      timeExpanded: false,
      formalScoreExpanded: false,
      emphasizeRecover: false,
      intelligenceTabKeys: ['today', 'progress', 'history'],
    }
  }

  if (mode === 'recovery' || bt === 'recovery') {
    return {
      showQuickScores: true,
      showFormalScoreGrid: false,
      showRaceTiming: false,
      showModeTags: true,
      showIntelligenceTabs: true,
      timeExpanded: false,
      formalScoreExpanded: false,
      emphasizeRecover: true,
      intelligenceTabKeys: ['today', 'skills', 'progress', 'history'],
    }
  }

  if (mode === 'testing') {
    return {
      showQuickScores: true,
      showFormalScoreGrid: false,
      showRaceTiming: false,
      showModeTags: true,
      showIntelligenceTabs: true,
      timeExpanded: true,
      formalScoreExpanded: false,
      emphasizeRecover: false,
      intelligenceTabKeys: ['today', 'skills', 'progress', 'history'],
    }
  }

  return {
    showQuickScores: true,
    showFormalScoreGrid: false,
    showRaceTiming: false,
    showModeTags: true,
    showIntelligenceTabs: true,
    timeExpanded: false,
    formalScoreExpanded: false,
    emphasizeRecover: false,
    intelligenceTabKeys: ['today', 'skills', 'progress', 'history'],
  }
}
