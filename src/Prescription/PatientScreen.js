import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Tabs from './Tabs'
import TabContent from './TabContent'
import './PatientScreen.css'

const PatientScreen = () => {
  const [activeTab, setActiveTab] = useState('Symptoms')

  return (
    <div className="patient-layout">
      {/* <Sidebar/> */}
      <div className="patient-main">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabContent activeTab={activeTab} />
      </div>
    </div>
  )
}

export default PatientScreen
