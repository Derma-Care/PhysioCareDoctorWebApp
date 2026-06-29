importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyApKucCeDspoqLR-hLZOFm7ZKMJBza281c',
  authDomain: 'ccms-45d7d.firebaseapp.com',
  projectId: 'ccms-45d7d',
  messagingSenderId: '386304374153',
  appId: '1:386304374153:web:a38254c2401db7bafd9d58',
})

const messaging = firebase.messaging()

// ─── Helper: Persist notification to localStorage so the app can
//     pick it up when it comes back to the foreground / is re-opened ────────
async function persistNotificationToStorage(payload, resolvedTitle, resolvedBody) {
  try {
    const notif = {
      id: Date.now(),
      title: resolvedTitle || payload.notification?.title || 'Clinic Notification',
      message: resolvedBody || payload.notification?.body || '',
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

    // Save notification in IndexedDB
    await storeInIDB(notif, 'pending_notifications')
    await storeInIDB(notif, 'notifications_history')

    console.log("[SW] Notification saved successfully")

    // Send to open tabs
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    windowClients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_NOTIFICATION',
        notif,
      })
    })

    // BroadcastChannel
    const channel = new BroadcastChannel('fcm_background_channel')
    channel.postMessage({
      type: 'BACKGROUND_NOTIFICATION',
      notif,
    })

    setTimeout(() => channel.close(), 1000)
  } catch (e) {
    console.error('[SW] persistNotificationToStorage error:', e)
  }
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const IDB_NAME = 'physio_sw_store'
const IDB_STORE = 'pending_notifications'
const IDB_HISTORY_STORE = 'notifications_history'

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 3) // ✅ must match firebase.js version
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(IDB_HISTORY_STORE)) {
        db.createObjectStore(IDB_HISTORY_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

async function storeInIDB(notif, storeName) {
  try {
    const db = await openIDB()

    const tx = db.transaction(storeName, 'readwrite')

    tx.objectStore(storeName).put(notif)

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })

    console.log("[SW] Notification stored in " + storeName, notif)

    db.close()

  } catch (e) {
    console.error("[SW] storeInIDB error in " + storeName, e)
  }
}

// ─── Background message handler ───────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

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

  const options = {
    body: body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data,
    tag: 'physio-notification',
    renotify: true,
  }

  // IMPORTANT: Run persistence asynchronously so it doesn't block the visual notification display
  persistNotificationToStorage(payload, title, body).catch((e) => {
    console.error('[SW] Background persist failed:', e)
  })

  return self.registration.showNotification(title, options)
})

// ─── Handle notification click (brings the app to front) ─────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}

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
  const serviceDate = data.serviceDate || data.date;
  const bodyText = (event.notification.body || '').toLowerCase();
  const titleText = (event.notification.title || '').toLowerCase();
  
  let isToday = false;
  if (serviceDate) {
    isToday = toISODate(serviceDate) === todayISO;
  } else {
    isToday = bodyText.includes('today') || titleText.includes('today') || bodyText.includes(todayISO) || titleText.includes(todayISO);
  }

  let targetUrl = '/'
  if (data.path) {
    targetUrl = isToday ? '/dashboard' : data.path
  } else if (data.patientId && (data.type === 'SESSION_FEEDBACK')) {
    const bookingParam = data.bookingId ? `&bookingId=${data.bookingId}` : ''
    targetUrl = `/session-feedback?patientId=${data.patientId}${bookingParam}`
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'NOTIFICATION_CLICK', notif: { path: targetUrl, ...data } })
          return
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// ─── Auto-Update Listeners ───────────────────────────────────────────────────
// Force the new Service Worker to activate immediately without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Ensure the new Service Worker takes control of the page immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
