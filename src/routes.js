import React from 'react'
import NotificationDemo from './Prescription/Notification'
import HelpCenter from './Prescription/HelpCenter'

const DoctorProfile = React.lazy(() => import('./views/Profile/DoctorProfile'))
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Appointments = React.lazy(() => import('./Screens/Appointments/Appointments'))
const Settings = React.lazy(() => import('./Prescription/Settings'))
const Login = React.lazy(() => import('./views/pages/login/Login'))

const routes = [
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/appointments', name: 'Appointments', element: Appointments },
  { path: '/doctorprofile', name: 'DoctorProfile', element: DoctorProfile },
  { path: '/notifications', name: 'Notifications', element: NotificationDemo },
  { path: '/helpCentre', name: 'HelpCenter', element: HelpCenter },
]

export default routes
