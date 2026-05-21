import React from 'react'

export default function SuperAdminPageHeader({ title, subtitle, actions = null }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
      <div>
        <h2 className="mb-1 fw-semibold">{title}</h2>
        {subtitle ? <p className="text-body-secondary mb-0 small">{subtitle}</p> : null}
      </div>
      {actions ? <div className="d-flex gap-2 flex-wrap">{actions}</div> : null}
    </div>
  )
}
