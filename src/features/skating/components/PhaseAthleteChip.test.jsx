import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhaseAthleteChip from './PhaseAthleteChip'

const baseAthlete = {
  id: 'a1',
  studentId: 's1',
  fullName: 'Alex R',
  lane: null,
  heatNumber: null,
  participationStatus: 'active',
}

describe('PhaseAthleteChip', () => {
  it('shows lane and heat selects on race phases', () => {
    render(
      <PhaseAthleteChip
        athlete={baseAthlete}
        phaseId="p1"
        isRacePhase
        otherPhases={[]}
        onMove={vi.fn()}
        onLane={vi.fn()}
        onHeat={vi.fn()}
        onStatus={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Lane for Alex/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Heat for Alex/i)).toBeInTheDocument()
  })

  it('hides lane and heat on non-race phases', () => {
    render(
      <PhaseAthleteChip
        athlete={baseAthlete}
        phaseId="p1"
        isRacePhase={false}
        otherPhases={[]}
        onMove={vi.fn()}
        onLane={vi.fn()}
        onHeat={vi.fn()}
        onStatus={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(/Lane for Alex/i)).not.toBeInTheDocument()
  })

  it('calls onMove when another phase is chosen', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(
      <PhaseAthleteChip
        athlete={baseAthlete}
        phaseId="p1"
        isRacePhase={false}
        otherPhases={[{ id: 'p2', title: 'Technical' }]}
        onMove={onMove}
        onLane={vi.fn()}
        onHeat={vi.fn()}
        onStatus={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Move to phase/i }))
    const select = screen.getByLabelText(/Move Alex R to phase/i)
    await user.selectOptions(select, 'p2')
    expect(onMove).toHaveBeenCalledWith('p2')
  })
})
