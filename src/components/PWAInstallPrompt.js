import React, { useState, useEffect } from 'react'
import logo from '../assets/images/ic_launcher.png'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show banner after a short delay so it doesn't feel jarring
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
    setInstalling(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Don't show again this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (isInstalled || !showBanner || sessionStorage.getItem('pwa-prompt-dismissed')) return null

  return (
    <>
      <style>{`
        .pwa-banner {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #5b1982 0%, #7e3a93 60%, #a155b9 100%);
          color: #fff;
          padding: 14px 20px;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(126, 58, 147, 0.45), 0 2px 8px rgba(0,0,0,0.18);
          min-width: 300px;
          max-width: 92vw;
          animation: pwa-slide-up 0.4s cubic-bezier(.22,1,.36,1);
        }
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(40px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .pwa-banner-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .pwa-banner-text { flex: 1; min-width: 0; }
        .pwa-banner-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pwa-banner-sub {
          font-size: 12px;
          opacity: 0.85;
          margin: 0;
        }
        .pwa-banner-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pwa-btn-install {
          background: #fff;
          color: #7e3a93;
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
        }
        .pwa-btn-install:hover { background: #f3e6ff; transform: scale(1.04); }
        .pwa-btn-install:disabled { opacity: 0.6; cursor: default; }
        .pwa-btn-dismiss {
          background: rgba(255,255,255,0.15);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .pwa-btn-dismiss:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      <div className="pwa-banner" role="dialog" aria-label="Install App">
        <img src={logo} alt="KWC Doctor" className="pwa-banner-icon" />
        <div className="pwa-banner-text">
          <p className="pwa-banner-title">Install KWC Doctor</p>
          <p className="pwa-banner-sub">Add to home screen for quick access</p>
        </div>
        <div className="pwa-banner-actions">
          <button
            className="pwa-btn-install"
            onClick={handleInstall}
            disabled={installing}
            id="pwa-install-btn"
          >
            {installing ? 'Installing…' : 'Install'}
          </button>
          <button
            className="pwa-btn-dismiss"
            onClick={handleDismiss}
            id="pwa-dismiss-btn"
          >
            Later
          </button>
        </div>
      </div>
    </>
  )
}

export default PWAInstallPrompt
