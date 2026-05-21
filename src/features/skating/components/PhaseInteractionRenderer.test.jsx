import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PhaseInteractionRenderer from './PhaseInteractionRenderer'

describe('PhaseInteractionRenderer', () => {
  it('renders exercise checklist for exercise_list mode', () => {
    render(
      <PhaseInteractionRenderer
        activePhase={{
          id: 'p1',
          title: 'Warmup',
          blockType: 'warmup',
          configJson: { interactionMode: 'exercise_list' },
          exercises: [{ id: 'e1', sequence: 1, exerciseName: 'Jog', configurationJson: {} }],
          sessionObservationDefs: [],
        }}
        phaseRoster={[]}
        phaseCapture={{ entries: [], sessionObsByPhaseKey: {} }}
      />,
    )
    expect(screen.getByTestId('exercise-list-phase-view')).toBeInTheDocument()
    expect(screen.getByTestId('phase-exercise-checklist')).toBeInTheDocument()
    expect(screen.queryByTestId('phase-athlete-capture-list')).not.toBeInTheDocument()
  })

  it('renders timing placeholder for timing mode', () => {
    render(
      <PhaseInteractionRenderer
        activePhase={{
          id: 'p2',
          title: 'Race',
          blockType: 'race_simulation',
          configJson: { interactionMode: 'timing' },
          exercises: [],
          sessionObservationDefs: [],
        }}
        phaseRoster={[]}
        phaseCapture={{ entries: [], sessionObsByPhaseKey: {} }}
      />,
    )
    expect(screen.getByTestId('timing-phase-view')).toBeInTheDocument()
    expect(screen.getByText(/Timing tools coming soon/i)).toBeInTheDocument()
  })

  it('renders observation list for observation mode', () => {
    render(
      <PhaseInteractionRenderer
        activePhase={{
          id: 'p3',
          title: 'Skills',
          blockType: 'technical',
          configJson: { interactionMode: 'observation' },
          captureItems: [
            {
              id: 'f1',
              fieldType: 'tags',
              label: 'Tags',
              configurationJson: { options: ['Good'] },
            },
          ],
        }}
        phaseRoster={[{ id: 'a1', full_name: 'Alex' }]}
        phaseCapture={{ entries: [], sessionObsByPhaseKey: {}, onEntryChange: () => {} }}
      />,
    )
    expect(screen.getByTestId('observation-phase-view')).toBeInTheDocument()
    expect(screen.getByTestId('phase-athlete-capture-list')).toBeInTheDocument()
  })
})
