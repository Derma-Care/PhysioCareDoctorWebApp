// Tabs.jsx
import React from 'react'
// import './Tabs.css'

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="d-flex mt-3 mb-0" style={{backgroundColor:"transparent",}}>
      {tabs.map((tab) => (
        <div
          key={tab}
          className={`tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </div>
      ))}
    </div>
  )
}

export default Tabs
