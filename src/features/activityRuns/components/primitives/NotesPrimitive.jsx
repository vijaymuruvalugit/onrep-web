import React, { useState } from 'react'
import { CFormTextarea, CButton } from '@coreui/react'

export default function NotesPrimitive({ disabled, onSave, placeholder = 'Coach notes' }) {
  const [text, setText] = useState('')

  return (
    <div className="notes-primitive">
      <CFormTextarea
        rows={3}
        size="lg"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
      />
      <CButton
        type="button"
        className="mt-2"
        color="primary"
        size="lg"
        disabled={disabled || !text.trim()}
        onClick={() => onSave?.(text.trim())}
      >
        Save note
      </CButton>
    </div>
  )
}
