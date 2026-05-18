import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionBlockList from './SessionBlockList'

const blocks = [
  { id: 'a', title: 'Warmup', blockType: 'warmup', sequenceNo: 1 },
  { id: 'b', title: 'Technical work', blockType: 'technical', sequenceNo: 2 },
]

describe('SessionBlockList', () => {
  it('highlights exactly one active block', () => {
    render(
      <SessionBlockList
        blocks={blocks}
        activeBlockId="a"
        onSelectBlock={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onAddRequest={vi.fn()}
      />,
    )
    expect(screen.getByTestId('session-block-item-a')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('session-block-item-b')).toHaveAttribute('data-active', 'false')
  })

  it('one-tap selects block on row press', () => {
    const onSelect = vi.fn()
    render(
      <SessionBlockList
        blocks={blocks}
        activeBlockId="a"
        onSelectBlock={onSelect}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onAddRequest={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Technical work/i }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })
})
