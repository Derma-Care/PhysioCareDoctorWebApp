import React, { Suspense, useEffect, useState } from 'react'
import { HashRouter, Route, Routes, Navigate, BrowserRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'
import { COLORS } from './Themes'
import { ToastContainer } from 'react-toastify'
import { LogoLoader } from './utils/LogoLoder'
import { AppSkeleton } from './components/index'
import PWAInstallPrompt from './components/PWAInstallPrompt'
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

import appLogo from './assets/images/ic_launcher.png'

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)
  const [isMobile, setIsMobile] = useState(false)

  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1800);
    const removeTimer = setTimeout(() => setSplashVisible(false), 2300);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

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

      const deviceId = localStorage.getItem('deviceId')
      localStorage.clear()

      if (deviceId) localStorage.setItem('deviceId', deviceId)
    }
  }, [])

  const doctorData = JSON.parse(localStorage.getItem('clinicDetails') || localStorage.getItem('user') || '{}');
  const hospitalName = doctorData?.name || doctorData?.hospitalName || 'PhysioElite';
  const hospitalLogo = doctorData?.hospitalLogo
    ? `data:image/webp;base64,${doctorData.hospitalLogo}`
    : appLogo;

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
    <>
      {splashVisible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1527 55%, #091018 100%)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          opacity: splashFading ? 0 : 1,
          transform: splashFading ? 'scale(1.05)' : 'scale(1)',
          pointerEvents: splashFading ? 'none' : 'all',
        }}>
          <style>{`
            @keyframes sp-glow-pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.45), 0 0 30px rgba(59,130,246,0.15); transform: scale(1); }
              50%       { box-shadow: 0 0 0 18px rgba(59,130,246,0), 0 0 60px rgba(59,130,246,0.28); transform: scale(1.07); }
            }
            @keyframes sp-ring-spin {
              0%   { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes sp-ring-spin-rev {
              0%   { transform: rotate(0deg); }
              100% { transform: rotate(-360deg); }
            }
            @keyframes sp-shimmer {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
            @keyframes sp-bar-fill {
              0%   { width: 0%; }
              40%  { width: 55%; }
              80%  { width: 85%; }
              100% { width: 98%; }
            }
            @keyframes sp-fade-up {
              from { opacity: 0; transform: translateY(14px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes sp-dot {
              0%, 80%, 100% { transform: scale(0.5); opacity: 0.25; }
              40%            { transform: scale(1);   opacity: 1; }
            }
          `}</style>

          {/* Logo ring assembly */}
          <div style={{ position: 'relative', width: 124, height: 124, marginBottom: 28 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#3b82f6',
              borderRightColor: 'rgba(59,130,246,0.25)',
              animation: 'sp-ring-spin 1.2s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              border: '1.5px solid transparent',
              borderBottomColor: 'rgba(96,165,250,0.5)',
              borderLeftColor: 'rgba(96,165,250,0.15)',
              animation: 'sp-ring-spin-rev 2.4s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 14, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.07)',
            }} />
            <div style={{
              position: 'absolute', inset: 18,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'sp-glow-pulse 2.2s ease-in-out infinite',
            }}>
              <img
                src={hospitalLogo}
                alt="Logo"
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: '50%' }}
              />
            </div>
          </div>

          {/* Clinic name */}
          <div style={{
            fontSize: 18, fontWeight: 700, color: '#f0f6ff',
            letterSpacing: '0.03em', marginBottom: 5,
            fontFamily: "'Inter', 'Poppins', sans-serif",
            animation: 'sp-fade-up 0.6s ease 0.3s both',
          }}>{hospitalName}</div>

          {/* Subtitle */}
          <div style={{
            fontSize: 11, color: 'rgba(148,163,184,0.75)', fontWeight: 500,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 34,
            animation: 'sp-fade-up 0.6s ease 0.5s both',
          }}>Doctor Portal</div>

          {/* Progress bar */}
          <div style={{
            width: 160, height: 3, borderRadius: 99,
            background: 'rgba(255,255,255,0.07)',
            overflow: 'hidden', marginBottom: 20,
            animation: 'sp-fade-up 0.6s ease 0.6s both',
          }}>
            <div style={{
              height: '100%', borderRadius: 99,
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)',
              animation: 'sp-bar-fill 1.9s ease-out forwards',
            }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                animation: 'sp-shimmer 1.5s ease-in-out 0.5s infinite',
              }} />
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 7, animation: 'sp-fade-up 0.6s ease 0.7s both' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#3b82f6',
                animation: `sp-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3500} />
        <Suspense fallback={<LogoLoader />}>
          <div style={{ minHeight: '100vh', backgroundColor: COLORS.theme, padding: 20 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={
                <Suspense fallback={<AppSkeleton />}>
                  <DefaultLayout />
                </Suspense>
              } />
              <Route path="/404" element={<Page404 />} />
              <Route path="/500" element={<Page500 />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </Suspense>
      </BrowserRouter>
      {/* <PWAInstallPrompt /> */}
    </>
  )
}

export default App
