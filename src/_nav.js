import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilCommentSquare,
  cilUser,
  cilCalendar,
  cilBell,
} from '@coreui/icons'
import { CNavItem } from '@coreui/react'
import { COLORS } from './Themes'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" style={{ color: COLORS.white }} />,
    style: { color: COLORS.white },
  },
  {
    component: CNavItem,
    name: 'Appointments',
    to: '/appointments',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" style={{ color: COLORS.white }} />,
    style: { color: COLORS.white },
  },
  {
    component: CNavItem,
    name: 'Profile',
    to: '/doctorprofile',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" style={{ color: COLORS.white }} />,
    style: { color: COLORS.white },
  },
  {
    component: CNavItem,
    name: 'Notifications',
    to: '/notifications',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" style={{ color: COLORS.white }} />,
    style: { color: COLORS.white },
   
  },
  {
    component: CNavItem,
    name: 'Help Center',
    to: '/helpCentre',
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" style={{ color: COLORS.white }} />,
    style: { color: COLORS.white },
  },
]

export default _nav