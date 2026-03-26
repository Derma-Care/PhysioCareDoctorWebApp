import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter
      className="px-4 py-2 bg-white shadow-sm fixed-bottom d-flex justify-content-center"
      style={{ zIndex: 1030 }}
    >
      <div
        className="d-flex justify-content-between align-items-center w-100 text-center"
        style={{ maxWidth: '60%' }}
      >
        <div className="text-end">
          <span className="me-1">Powered by</span>
          <a
            href="https://chiselontechnologies.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            Chiselon Technologies &copy; 2025
          </a>
        </div>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
