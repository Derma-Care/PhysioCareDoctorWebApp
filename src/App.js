import React, { Suspense, useEffect, useState } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'
import { COLORS } from './Themes'
import { ToastContainer } from 'react-toastify'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) setColorMode(theme)
    if (!isColorModeSet()) setColorMode(storedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Optional: clear localStorage if session is invalid
  useEffect(() => {
    const sessionKey = localStorage.getItem('sessionKey')
    if (!sessionKey) {
      localStorage.clear()
    }
  }, [])

  if (isMobile) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: 20,
          backgroundColor: '#f4f6f8',
        }}
      >
        <div style={{ fontSize: 60, color: '#ff4d4f', marginBottom: 20 }}>📵</div>
        <h2 style={{ marginBottom: 10 }}>Mobile View Not Supported</h2>
        <p style={{ maxWidth: 300 }}>
          This application is optimized for desktop use. Please open it on a laptop or desktop.
        </p>
      </div>
    )
  }

  return (
    <HashRouter>
      <ToastContainer position="top-right" autoClose={3500} />
      <Suspense
        fallback={
          <div
            className="pt-3 text-center"
            style={{ backgroundColor: COLORS.theme, minHeight: '100vh' }}
          >
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <div style={{ minHeight: '100vh', backgroundColor: COLORS.theme, padding: 20 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<DefaultLayout />} />
            <Route path="/404" element={<Page404 />} />
            <Route path="/500" element={<Page500 />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </Suspense>
    </HashRouter>
  )
}

export default App
