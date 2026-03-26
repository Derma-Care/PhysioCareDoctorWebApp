import React, { useState } from 'react'
import './Sidebar.css'
import { FaBars } from 'react-icons/fa'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Hamburger menu for small screens */}
      <div className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        <FaBars />
      </div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="profile-section">
          <div className="avatar" />
          <h5 className="name">Vaishnavi</h5>
          <p><strong>Patient_Id:</strong> <span className="highlight">CR_001</span></p>
          <p><strong>Age/Gender:</strong> 18 Years / Female</p>
          <p className="phone"><strong>Phone:</strong> 9878987656</p>
        </div>

        <hr className="divider" />

        <div className="vitals-section">
          <h6>Vitals</h6>
          <p><strong>Height:</strong> -</p>
          <p><strong>Weight:</strong> -</p>
          <p><strong>Temperature:</strong> -</p>
          <p><strong>BMI:</strong> -</p>
        </div>

        <div className="status-box">
          <span className="status-label">COMPLETED</span>
        </div>

        <button className="btn btn-primary mt-3">JOIN CALL</button>
      </aside>
    </>
  )
}

export default Sidebar
