import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react'
import { createPortal } from 'react-dom'
import './ToasterStyles.css'
import { toast } from 'react-toastify'
// utils/Toaster.js
 
const ToastCtx = createContext(null)
export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider/>')
  return ctx
}

/**
 * images: { success, error, info, warning } -> URL strings
 * autoClose: milliseconds (default 3500)
 * position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 */
export function ToastProvider({
  children,
  images,
  autoClose = 3500,
  position = 'top-right',
  max = 3,
}) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const ensurePortal = useMemo(() => {
    let el = document.getElementById('toast-root')
    if (!el) {
      el = document.createElement('div')
      el.id = 'toast-root'
      document.body.appendChild(el)
    }
    return el
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const show = useCallback(
    (type, message, opts = {}) => {
      const id = Math.random().toString(36).slice(2)
      const toast = {
        id,
        type,
        message,
        image: (opts.imageSrc || images?.[type]) ?? images?.info,
        duration: opts.duration ?? autoClose,
        title: opts.title,
      }
      setToasts((prev) => [toast, ...prev].slice(0, max))
      if (toast.duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), toast.duration)
      }
      return id
    },
    [autoClose, dismiss, images, max],
  )

  const api = useMemo(
    () => ({
      success: (msg, opts) => show('success', msg, opts),
      error: (msg, opts) => show('error', msg, opts),
      info: (msg, opts) => show('info', msg, opts),
      warning: (msg, opts) => show('warning', msg, opts),
      dismiss,
    }),
    [show, dismiss],
  )

  // ESC closes most recent
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && toasts[0]) dismiss(toasts[0].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toasts, dismiss])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div className={`toast-wrap ${position}`} aria-live="polite" aria-atomic="true">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-card ${t.type}`} role="status">
              <div className="toast-left">
                {t.image ? <img src={t.image} alt="" /> : <div className="toast-placeholder" />}
              </div>
              <div className="toast-main">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-msg">{t.message}</div>
              </div>
              <button className="toast-close" aria-label="Close" onClick={() => dismiss(t.id)}>
                ×
              </button>
            </div>
          ))}
        </div>,
        ensurePortal,
      )}
    </ToastCtx.Provider>
  )
}



// utils/Toaster.js


export const showSuccess = (message, options) => {
  toast.success(message, options);
};

export const showInfo = (message, options) => {
  toast.info(message, options);
};

