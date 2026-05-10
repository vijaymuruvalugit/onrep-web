import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from 'src/test-utils/renderWithProviders'
import SkatingOpsPage from './SkatingOpsPage'

vi.mock('../api/skatingOpsApi', () => ({
  skatingOpsApi: {
    getOpsSnapshot: vi.fn().mockResolvedValue({ sessions: [], primaryFocusSessionId: null }),
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

vi.mock('../../places/api/placesApi', () => ({
  default: {
    listPlaces: vi.fn().mockResolvedValue({ places: [], total: 0 }),
  },
}))

describe('SkatingOpsPage (operational shell)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders stable root without full-page error after snapshot load', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/coach/skating" element={<SkatingOpsPage />} />
      </Routes>,
      { initialEntries: ['/coach/skating'] },
    )
    await waitFor(() => {
      expect(container.querySelector('[data-testid="skating-ops-page"]')).toBeTruthy()
    })
    expect(screen.getByTestId('skating-ops-page')).toBeInTheDocument()
  })
})
