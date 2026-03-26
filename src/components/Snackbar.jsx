import React from 'react'

const Snackbar = ({ message, type }) => {
  const bgClass =
    type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : 'bg-danger'

  return (
    <div
      className={`position-fixed bottom-0 start-50 translate-middle-x p-3 ${bgClass} text-white rounded shadow`}
      style={{ zIndex: 9999 }}
    >
      {message}
    </div>
  )
}

export default Snackbar
