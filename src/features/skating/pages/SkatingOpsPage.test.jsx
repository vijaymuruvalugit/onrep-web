import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from 'src/test-utils/renderWithProviders'
import SkatingOpsPage from './SkatingOpsPage'

vi.mock('../api/skatingOpsApi', () => ({
  skatingOpsApi: {
    getSessionBundle: vi.fn().mockResolvedValue(null),
    listActiveSkaters: vi.fn().mockResolvedValue([]),
    recordLap: vi.fn(),
    deleteLap: vi.fn(),
    listSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn(),
    patchSession: vi.fn(),
    mergeGroup: vi.fn(),
    addRace: vi.fn(),
    listRacesAggregate: vi.fn().mockResolvedValue([]),
    postRapidObservation: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../../../domain/operationalSessions/operationalSessionsApi', () => ({
  default: {
    getDayBoard: vi.fn().mockResolvedValue({ date: '2026-01-01', sessions: [] }),
    getBoardRange: vi.fn().mockResolvedValue({ sessions: [], operationalToday: '2026-01-15' }),
  },
}))

vi.mock('../../../domain/sessionBlocks/sessionBlocksApi', () => ({
  sessionBlocksApi: {
    listBlocks: vi.fn().mockResolvedValue([]),
    createBlock: vi.fn(),
    reorderBlocks: vi.fn(),
    patchBlock: vi.fn(),
    deleteBlock: vi.fn(),
  },
  BLOCK_TYPE_LABELS: {},
  BLOCK_TYPE_OPTIONS: [],
}))

vi.mock('../../../domain/phaseAthletes/phaseAthletesApi', () => ({
  phaseAthletesApi: {
    listPhaseAthletes: vi.fn().mockResolvedValue([]),
    moveToPhase: vi.fn(),
    setLane: vi.fn(),
    setHeatNumber: vi.fn(),
    setParticipationStatus: vi.fn(),
  },
  PARTICIPATION_STATUS_OPTIONS: [],
}))

vi.mock('../../places/api/placesApi', () => ({
  default: {
    listPlaces: vi.fn().mockResolvedValue({ places: [], total: 0 }),
  },
}))

vi.mock('../api/skatingIntelligenceApi', () => ({
  skatingIntelligenceApi: {
    getSkillCatalog: vi.fn().mockResolvedValue({
      skills: [{ id: 's1', category: 'Speed', displayName: 'Sprint', canonicalName: 'Sprint' }],
    }),
    getStudentKpiSnapshots: vi.fn().mockResolvedValue({ kpis: [] }),
    getTimeline: vi.fn().mockResolvedValue({ timeline: [] }),
    patchStudentSkill: vi.fn(),
  },
}))

describe('SkatingOpsPage (operational command center)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders day board by default (no session selected)', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/coach/skating" element={<SkatingOpsPage />} />
      </Routes>,
      { initialEntries: ['/coach/skating'] },
    )
    await waitFor(() => {
      expect(screen.getByTestId('skating-ops-page')).toBeInTheDocument()
    })
    expect(screen.getByTestId('skating-ops-day-board')).toBeInTheDocument()
    expect(screen.getByText("Today's skating sessions")).toBeInTheDocument()
    expect(screen.queryByTestId('active-session-workspace-shell')).not.toBeInTheDocument()
  })

  it('does not auto-open a session when the day board has sessions', async () => {
    const { default: operationalSessionsApi } = await import(
      '../../../domain/operationalSessions/operationalSessionsApi'
    )
    operationalSessionsApi.getDayBoard.mockResolvedValue({
      date: '2026-05-18',
      sessions: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          state: 'active',
          sessionMode: 'competition',
          title: 'Evening Rink',
          sessionDate: '2026-05-18',
          startTime: '17:30',
          endTime: '19:00',
        },
      ],
    })

    const { skatingOpsApi } = await import('../api/skatingOpsApi')
    skatingOpsApi.getSessionBundle.mockResolvedValue({
      session: { id: '11111111-1111-1111-1111-111111111111', state: 'active' },
    })

    const { container } = renderWithProviders(
      <Routes>
        <Route path="/coach/skating" element={<SkatingOpsPage />} />
      </Routes>,
      { initialEntries: ['/coach/skating'] },
    )

    await waitFor(() => {
      expect(screen.getByTestId('skating-ops-day-board')).toBeInTheDocument()
    })

    await waitFor(
      () => {
        expect(screen.queryByTestId('active-session-workspace-shell')).not.toBeInTheDocument()
      },
      { timeout: 1500 },
    )

    expect(container.ownerDocument.location.search).not.toMatch(/session=/)
  })

  it('shows block list when a session workspace is open', async () => {
    const { default: operationalSessionsApi } = await import(
      '../../../domain/operationalSessions/operationalSessionsApi'
    )
    const { sessionBlocksApi } = await import('../../../domain/sessionBlocks/sessionBlocksApi')

    operationalSessionsApi.getDayBoard.mockResolvedValue({
      date: '2026-05-18',
      sessions: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          state: 'active',
          sessionMode: 'practice',
          title: 'Morning',
          sessionDate: '2026-05-18',
        },
      ],
    })

    sessionBlocksApi.listBlocks.mockResolvedValue([
      { id: 'b1', title: 'Warmup', blockType: 'warmup', sequenceNo: 1 },
      { id: 'b2', title: 'Technical work', blockType: 'technical', sequenceNo: 2 },
      { id: 'b3', title: 'Conditioning', blockType: 'conditioning', sequenceNo: 3 },
      { id: 'b4', title: 'Cooldown', blockType: 'cooldown', sequenceNo: 4 },
    ])

    const { skatingOpsApi } = await import('../api/skatingOpsApi')
    skatingOpsApi.getSessionBundle.mockResolvedValue({
      session: {
        id: '22222222-2222-2222-2222-222222222222',
        state: 'active',
        opsState: 'active',
        sessionSkaterIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
      },
      resolvedAthletes: [
        { student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', full_name: 'Aditi Test' },
      ],
    })

    renderWithProviders(
      <Routes>
        <Route
          path="/coach/skating"
          element={<SkatingOpsPage />}
        />
      </Routes>,
      { initialEntries: ['/coach/skating?session=22222222-2222-2222-2222-222222222222'] },
    )

    await waitFor(() => {
      expect(screen.getByTestId('active-session-workspace-shell')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByTestId('coach-live-session-view')).toBeInTheDocument()
    })
    expect(screen.getByTestId('phase-mode-strip')).toBeInTheDocument()
    expect(screen.getByTestId('athlete-card-strip')).toBeInTheDocument()
    expect(screen.queryByText('Laps stay in main panel.')).not.toBeInTheDocument()
    expect(sessionBlocksApi.listBlocks).toHaveBeenCalledWith(
      '22222222-2222-2222-2222-222222222222',
    )
  })

  it('shows unified live layout before session is started (upcoming)', async () => {
    const { default: operationalSessionsApi } = await import(
      '../../../domain/operationalSessions/operationalSessionsApi'
    )
    const { skatingOpsApi } = await import('../api/skatingOpsApi')

    operationalSessionsApi.getDayBoard.mockResolvedValue({
      date: '2026-05-18',
      sessions: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          state: 'scheduled',
          sessionMode: 'practice',
          title: 'Upcoming',
          sessionDate: '2026-05-18',
        },
      ],
    })

    skatingOpsApi.getSessionBundle.mockResolvedValue({
      session: {
        id: '33333333-3333-3333-3333-333333333333',
        opsState: 'upcoming',
        sessionSkaterIds: [],
      },
      resolvedAthletes: [],
    })

    renderWithProviders(
      <Routes>
        <Route path="/coach/skating" element={<SkatingOpsPage />} />
      </Routes>,
      { initialEntries: ['/coach/skating?session=33333333-3333-3333-3333-333333333333'] },
    )

    await waitFor(() => {
      expect(screen.getByTestId('coach-live-session-view')).toBeInTheDocument()
    })
    expect(screen.queryByText('Laps stay in main panel.')).not.toBeInTheDocument()
  })
})
