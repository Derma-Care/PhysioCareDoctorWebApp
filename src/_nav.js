import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilAccountLogout,
  cilSpeedometer,
  cilCommentSquare,
  cilUser,
  cilCalendar,
  cilNotes,
} from '@coreui/icons'
import { CNavItem } from '@coreui/react'
import { COLORS } from './Themes'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon"  style={{color:COLORS.black}}/>,
    style:{color:COLORS.black},
  },

  {
    component: CNavItem,
    name: 'Appointments',
    to: '/appointments',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" style={{color:COLORS.black}}/>,
    style:{color:COLORS.black},
  },

  {
    component: CNavItem,
    name: 'Doctor Template',
    to: '/doctor-template',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" style={{color:COLORS.black}}/>,
    style:{color:COLORS.black},
  },
  {
    component: CNavItem,
    name: 'Profile',
    to: '/doctorprofile',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" style={{color:COLORS.black}}/>,
    style:{color:COLORS.black},
  },
  {
    component: CNavItem,
    name: 'Help Centre',
    to: '/helpCentre',
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" style={{color:COLORS.black}}/>,
    style:{color:COLORS.black},
  },

  
]

export default _nav
