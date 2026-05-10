import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="https://onrep.com" target="_blank" rel="noopener noreferrer">
          OnRep
        </a>
        <span className="ms-1">&copy; 2026 OnRep. All rights reserved.</span>
      </div>
      <div className="ms-auto text-body-secondary small">PRACTICE · PROGRESS · PERFORMANCE</div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
