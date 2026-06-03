// Disable right-click context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Disable developer tools shortcuts
document.addEventListener('keydown', (e) => {
  // F12 key
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+Shift+K
  if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K', 'i', 'j', 'c', 'k'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
  // Cmd+Opt+I / Cmd+Opt+J / Cmd+Opt+C / Cmd+Opt+K (Mac)
  if (e.metaKey && e.altKey && ['I', 'J', 'C', 'K', 'i', 'j', 'c', 'k'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
  // Ctrl+U / Cmd+U (View Source)
  if ((e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
});

// Override all console methods globally to prevent output
const noop = () => { };
console.log = noop;
console.warn = noop;
console.error = noop;
console.info = noop;
console.debug = noop;

import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import { registerSW } from 'virtual:pwa-register'

import App from './App'
import store from './store'
import { DoctorProvider } from './Context/DoctorContext'
import { ToastProvider } from './utils/Toaster'

import logo from './assets/images/ic_launcher.png'

// Register PWA service worker — auto-updates in background
registerSW({
  onNeedRefresh() {
    // A new version is available — auto reload silently
    window.location.reload()
  },
  onOfflineReady() {
    // App is ready to work offline
  },
})

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ToastProvider
      images={{
        success: logo,
        error: logo,
        info: logo,
        warning: logo,
      }}
    >
      <DoctorProvider>
        <App />
      </DoctorProvider>
    </ToastProvider>
  </Provider>,
)
