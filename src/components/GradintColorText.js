// GradientTextCard.jsx
import { CFormLabel } from '@coreui/react'
import React from 'react'
import { COLORS } from '../Themes'

const GradientTextCard = ({ text }) => {
  return (
    <div
      style={{
         marginBottom:"5px",
        alignItems: 'start',
        background: `linear-gradient(to right,${COLORS.lowgray},${COLORS.white})`, // blue → white
       
      }}
    >
      <CFormLabel  style={{ color: COLORS.black}}>{text}</CFormLabel>
      
    </div>
  )
}

export default GradientTextCard
