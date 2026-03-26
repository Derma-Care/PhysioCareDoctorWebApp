// src/components/Pagination.jsx
import React from 'react'
import Button from '../../../components/CustomButton/CustomButton'


const Paginations = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="d-flex justify-content-end align-items-center mt-2 gap-2">
      <Button
        size="small"
        variant="outline"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        Prev
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button
        size="small"
        variant="outline"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default Paginations
