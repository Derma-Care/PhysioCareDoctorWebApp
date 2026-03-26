import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import store from './store'
import * as serviceWorker from './serviceWorker'
import { DoctorProvider } from './Context/DoctorContext'
import { ToastProvider } from './utils/Toaster'

import logo from './assets/images/ic_launcher.png'
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
// serviceWorker.register()
