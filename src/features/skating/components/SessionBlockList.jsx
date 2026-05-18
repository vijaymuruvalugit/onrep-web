import React, { useCallback, useState } from 'react'
import { CButton, CFormInput, CFormSelect } from '@coreui/react'
import { BLOCK_TYPE_LABELS, BLOCK_TYPE_OPTIONS } from '../../../domain/sessionBlocks/sessionBlocksApi'

/**
 * Operational coaching phase list — spine of practice structure (not UI sections).
 *
 * @param {{
 *   blocks: Array<{ id: string, title: string, blockType: string, sequenceNo: number }>,
 *   activeBlockId: string,
 *   onSelectBlock: (id: string) => void,
 *   onRename: (id: string, title: string, blockType?: string) => void | Promise<void>,
 *   onDelete: (id: string) => void | Promise<void>,
 *   onMoveUp: (id: string) => void | Promise<void>,
 *   onMoveDown: (id: string) => void | Promise<void>,
 *   onAddRequest: () => void,
 *   busy?: boolean,
 *   athleteCountByPhaseId?: Record<string, number>,
 * }} props
 */
export default function SessionBlockList({
  blocks,
  activeBlockId,
  onSelectBlock,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddRequest,
  busy = false,
  athleteCountByPhaseId = {},
}) {
  const [editingId, setEditingId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('technical')

  const startEdit = useCallback((block) => {
    setEditingId(String(block.id))
    setEditTitle(block.title || '')
    setEditType(block.blockType || 'technical')
  }, [])

  const commitEdit = useCallback(async () => {
    if (!editingId) return
    const id = editingId
    setEditingId('')
    await onRename(id, editTitle, editType)
  }, [editingId, editTitle, editType, onRename])

  const cancelEdit = useCallback(() => {
    setEditingId('')
  }, [])

  if (!blocks?.length) {
    return (
      <div className="session-blocks-panel session-blocks-panel--empty">
        <p className="small text-body-secondary mb-2">No coaching phases yet — they appear when you open this session.</p>
        <CButton size="sm" color="primary" variant="outline" onClick={onAddRequest} disabled={busy}>
          Add phase
        </CButton>
      </div>
    )
  }

  return (
    <nav
      className="session-blocks-panel"
      data-testid="session-block-list"
      aria-label="Coaching phases"
    >
      <div className="session-blocks-panel__header d-flex justify-content-between align-items-center mb-2">
        <span className="small fw-semibold text-body-secondary text-uppercase">Phases</span>
        <CButton size="sm" color="primary" variant="ghost" onClick={onAddRequest} disabled={busy}>
          + Add
        </CButton>
      </div>
      <ul className="session-blocks-list list-unstyled mb-0">
        {blocks.map((block, index) => {
          const id = String(block.id)
          const isActive = id === String(activeBlockId)
          const isEditing = id === editingId
          const typeLabel = BLOCK_TYPE_LABELS[block.blockType] || block.blockType

          return (
            <li
              key={id}
              className={`session-blocks-list__item${isActive ? ' session-blocks-list__item--active' : ''}`}
              data-testid={`session-block-item-${id}`}
              data-active={isActive ? 'true' : 'false'}
            >
              {isEditing ? (
                <div className="session-blocks-list__edit p-2" onClick={(e) => e.stopPropagation()}>
                  <CFormInput
                    size="sm"
                    className="mb-2"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    aria-label="Phase title"
                  />
                  <CFormSelect
                    size="sm"
                    className="mb-2"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    aria-label="Phase type"
                  >
                    {BLOCK_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </CFormSelect>
                  <div className="d-flex gap-1">
                    <CButton size="sm" color="primary" onClick={() => void commitEdit()} disabled={busy}>
                      Save
                    </CButton>
                    <CButton size="sm" color="secondary" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </CButton>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="session-blocks-list__tap w-100 text-start border-0 bg-transparent p-2"
                  onClick={() => onSelectBlock(id)}
                  aria-pressed={isActive}
                  aria-label={`${block.title || 'Phase'}, ${typeLabel}${isActive ? ', active' : ''}`}
                >
                  <span className="session-blocks-list__title d-block fw-medium text-truncate">
                    {block.title || 'Phase'}
                  </span>
                  <span className="session-blocks-list__type small text-body-secondary">
                    {typeLabel}
                    {athleteCountByPhaseId[id] != null ? (
                      <span className="session-blocks-list__count ms-1">· {athleteCountByPhaseId[id]}</span>
                    ) : null}
                  </span>
                </button>
              )}
              {!isEditing ? (
                <div
                  className="session-blocks-list__actions d-flex align-items-center gap-1 px-2 pb-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CButton
                    size="sm"
                    color="secondary"
                    variant="ghost"
                    disabled={busy || index === 0}
                    onClick={() => void onMoveUp(id)}
                    aria-label="Move up"
                  >
                    ↑
                  </CButton>
                  <CButton
                    size="sm"
                    color="secondary"
                    variant="ghost"
                    disabled={busy || index === blocks.length - 1}
                    onClick={() => void onMoveDown(id)}
                    aria-label="Move down"
                  >
                    ↓
                  </CButton>
                  <CButton
                    size="sm"
                    color="secondary"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => startEdit(block)}
                    aria-label="Edit phase"
                  >
                    Edit
                  </CButton>
                  <CButton
                    size="sm"
                    color="danger"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void onDelete(id)}
                    aria-label="Remove phase"
                  >
                    ×
                  </CButton>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
