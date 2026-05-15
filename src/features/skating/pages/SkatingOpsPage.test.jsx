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
    getBoardRange: vi.fn().mockResolvedValue({ sessions: [] }),
  },
}))

vi.mock('../../places/api/placesApi', () => ({
  default: {
    listPlaces: vi.fn().mockResolvedValue({ places: [], total: 0 }),
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
})
