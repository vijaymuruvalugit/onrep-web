import React from 'react'
import { CAlert, CCard, CCardBody, CListGroup, CListGroupItem } from '@coreui/react'

export default function AttentionPanel({ title, items = [], emptyText = 'Nothing needs attention.', color = 'warning' }) {
  const list = items.filter(Boolean)
  return (
    <CCard className="h-100 border-0 shadow-sm">
      <CCardBody>
        <h6 className="text-uppercase text-body-secondary small mb-3">{title}</h6>
        {list.length === 0 ? (
          <p className="text-body-secondary small mb-0">{emptyText}</p>
        ) : (
          <CListGroup flush>
            {list.map((item, i) => (
              <CListGroupItem key={item.key || i} className="px-0 border-0">
                {item.href ? (
                  <a href={item.href} className="text-decoration-none">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
                {item.detail ? <div className="small text-body-secondary">{item.detail}</div> : null}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
        {list.length > 0 && color === 'danger' ? (
          <CAlert color="light" className="small mt-2 mb-0 py-2">
            Review and resolve — platform support only.
          </CAlert>
        ) : null}
      </CCardBody>
    </CCard>
  )
}
