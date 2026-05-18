import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AthleteQuickActionsMenu from './AthleteQuickActionsMenu'

describe('AthleteQuickActionsMenu', () => {
  it('renders menu toggle and calls onSetStatus', async () => {
    const user = userEvent.setup()
    const onSetStatus = vi.fn()
    render(
      <AthleteQuickActionsMenu
        studentId="s1"
        otherPhases={[{ id: 'p2', title: 'Skills' }]}
        onSetStatus={onSetStatus}
        onMoveAthlete={vi.fn()}
      />,
    )
    await user.click(screen.getByTestId('athlete-quick-actions-toggle'))
    await user.click(screen.getByText('Rest'))
    expect(onSetStatus).toHaveBeenCalledWith('s1', 'resting')
  })
})
