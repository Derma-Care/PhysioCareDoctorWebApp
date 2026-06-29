import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  getFCMToken,
  listenNotification,
  readPendingNotificationsFromIDB,
  subscribeToBroadcastChannel,
  saveNotificationToHistoryDB,
  getUnreadNotificationsCountFromDB
} from '../firebase'
import api from '../Auth/axiosInterceptor'
import { useToast } from '../utils/Toaster'

const FCMNotificationHandler = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const routeNotification = (notif) => {
    if (!notif?.path) return

    const toISODate = (val) => {
      if (!val) return ''
      const parsed = new Date(val)
      if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
      const parts = String(val).split(/[-/]/)
      if (parts.length === 3) {
        const [d, m, y] = parts
        const tryDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
        if (!isNaN(tryDate)) return tryDate.toISOString().slice(0, 10)
      }
      return ''
    }

    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const serviceDate = notif.serviceDate || notif.date;
    const bodyText = (notif.message || notif.detail || notif.body || '').toLowerCase();
    const titleText = (notif.title || '').toLowerCase();
    
    let isToday = false;
    if (serviceDate) {
      isToday = toISODate(serviceDate) === todayISO;
    } else {
      isToday = bodyText.includes('today') || titleText.includes('today') || bodyText.includes(todayISO) || titleText.includes(todayISO);
    }

    navigate(isToday ? '/dashboard' : '/appointments')
  }

  useEffect(() => {
    const doctorId = localStorage.getItem('doctorId')
    if (!doctorId) return

    // Helper to calculate and update Redux badge state
    const updateBadgeCount = async () => {
      try {
        const count = await getUnreadNotificationsCountFromDB()
        dispatch({ type: 'set', unreadNotificationsCount: count })
      } catch (err) {
        console.warn('[FCM] Failed to update badge count:', err)
      }
    }
    updateBadgeCount()

    // 1. Register Service Worker on mount to ensure background notifications are active
    const registerSW = async () => {
      try {
        const token = await getFCMToken()
        if (token) {
          console.log('[FCM] Service worker registered and active on mount. Token:', token)
        }
      } catch (e) {
        console.warn('[FCM] Service worker registration failed on mount:', e.message)
      }
    }
    registerSW()

    // 2. Foreground FCM listener
    const unsubscribeForeground = listenNotification(async (payload) => {
      let title = payload.notification?.title || ''
      let body = payload.notification?.body || ''
      const data = payload.data || {}

      if (!title) {
        title = 'New Appointment Booked'
      }

      if (!body) {
        const pName = data.patientName || data.patientname || ''
        if (pName) {
          const pDate = data.serviceDate || data.date || data.servicedate || ''
          const pTime = data.servicetime || data.serviceTime || ''
          const pService = data.subServiceName || data.servicename || ''
          body = `Patient ${pName} has booked${pService ? ` a ${pService}` : ' an'} appointment`
          if (pDate) body += ` for ${pDate}`
          if (pTime) body += ` at ${pTime}`
          body += '.'
        } else {
          body = 'A new appointment has been scheduled.'
        }
      }

      toast.info(body, { title, duration: 15000 })

      // Save to IndexedDB history
      const notif = {
        id: Date.now(),
        title,
        message: body,
        patientName: payload.data?.patientName || payload.data?.patientname || payload.data?.name || '',
        mobileNumber: payload.data?.mobileNumber || payload.data?.mobilenumber || payload.data?.patientMobileNumber || payload.data?.patientmobilenumber || '',
        patientId: payload.data?.patientId || payload.data?.patientid || payload.data?.patientID || '',
        bookingId: payload.data?.bookingId || payload.data?.bookingid || payload.data?.bookingID || '',
        type: payload.data?.type || '',
        path: payload.data?.path || '',
        serviceDate: payload.data?.serviceDate || payload.data?.date || payload.data?.servicedate || '',
        receivedAt: Date.now(),
        read: false,
      }
      await saveNotificationToHistoryDB(notif)
      updateBadgeCount()

      // Broadcast to other components/tabs after the write completes
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('fcm_background_channel')
        channel.postMessage({
          type: 'BACKGROUND_NOTIFICATION',
          notif,
        })
        setTimeout(() => channel.close(), 500)
      }
    })

    // 3. BroadcastChannel listener (real-time background tab updates)
    const unsubscribeBroadcast = subscribeToBroadcastChannel((notif) => {
      toast.info(notif.message || notif.body, { title: notif.title, duration: 15000 })
      updateBadgeCount()
    })

    // 4. Service Worker Message Listener (navigates when already-open tab is clicked)
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        if (event.data.notif) {
          routeNotification(event.data.notif)
        }
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    // 5. Read pending background notifications stored in IndexedDB
    const checkPending = async () => {
      try {
        const pending = await readPendingNotificationsFromIDB()
        if (pending && pending.length > 0) {
          pending.forEach((notif) => {
            toast.info(notif.message || notif.body, { title: notif.title, duration: 15000 })
            
            // Optionally navigate if there's a target path in the pending notification
            if (notif.path) {
              routeNotification(notif)
            }
          })
          updateBadgeCount()
        }
      } catch (err) {
        console.error('[FCM] Error reading pending notifications:', err)
      }
    }
    checkPending()

    return () => {
      if (unsubscribeForeground) unsubscribeForeground()
      if (unsubscribeBroadcast) unsubscribeBroadcast()
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [toast, navigate, dispatch])

  return null
}

export default FCMNotificationHandler
