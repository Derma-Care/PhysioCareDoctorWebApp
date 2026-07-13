import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, deleteToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyApKucCeDspoqLR-hLZOFm7ZKMJBza281c',
  authDomain: 'ccms-45d7d.firebaseapp.com',
  projectId: 'ccms-45d7d',
  storageBucket: 'ccms-45d7d.appspot.com',
  messagingSenderId: '386304374153',
  appId: '1:386304374153:web:a38254c2401db7bafd9d58',
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

// ─── Shared IndexedDB constants (must match service worker) ───────────────────
const IDB_NAME = 'physio_sw_store'
const IDB_STORE = 'pending_notifications'
const IDB_HISTORY_STORE = 'notifications_history'

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 3) // ✅ Bumped to 3 to recreate schema and include history store
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

/**
 * Reads ALL pending notifications that the service worker stored while
 * the app was killed / in the background, then clears them from IDB.
 * Returns an array of notification objects (may be empty).
 */
export const readPendingNotificationsFromIDB = async () => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)

    const items = await new Promise((res, rej) => {
      const req = store.getAll()
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })

    // Clear after reading so we don't show duplicates on next refresh
    await new Promise((res, rej) => {
      const clearReq = store.clear()
      clearReq.onsuccess = res
      clearReq.onerror = rej
    })

    await new Promise((res, rej) => {
      tx.oncomplete = res
      tx.onerror = rej
    })
    db.close()
    return items || []
  } catch (e) {
    console.error('[firebase.js] readPendingNotificationsFromIDB error:', e)
    return []
  }
}

/**
 * Subscribes to the BroadcastChannel that the service worker uses to
 * notify open tabs of background messages in real-time.
 * Returns an unsubscribe function — call it on component unmount.
 */
export const subscribeToBroadcastChannel = (onNotif) => {
  if (!('BroadcastChannel' in window)) return () => { }
  const channel = new BroadcastChannel('fcm_background_channel')
  channel.onmessage = (event) => {
    if (event.data?.type === 'BACKGROUND_NOTIFICATION' && event.data?.notif) {
      onNotif(event.data.notif)
    }
  }
  return () => channel.close()
}

// ─── GET TOKEN ────────────────────────────────────────────────────────────────

/** Deletes all Firebase/FCM-related IndexedDB databases.
 *  Does NOT unregister service workers — unregistering causes AbortError
 *  on the next login because the new SW hasn't activated yet. */
const clearFirebaseIDB = async () => {
  try {
    const dbs = await window.indexedDB.databases()
    const targets = dbs.filter(
      (db) => db.name && (db.name.includes('firebase') || db.name.includes('fcm'))
    )
    await Promise.all(
      targets.map(
        (db) =>
          new Promise((res) => {
            const req = window.indexedDB.deleteDatabase(db.name)
            req.onsuccess = res
            req.onerror = res
            req.onblocked = res
          })
      )
    )
    console.log('[firebase.js] Deleted Firebase IDB databases:', targets.map((d) => d.name))
  } catch (e) {
    console.warn('[firebase.js] Could not clear Firebase IDB:', e)
  }
}

/**
 * Waits until the given ServiceWorkerRegistration has an active worker.
 * Handles the race where the SW is still installing when getToken() is called.
 */
const waitForSWActive = (registration) =>
  new Promise((resolve) => {
    if (registration.active) {
      resolve(registration)
      return
    }
    // SW is installing or waiting — listen for statechange
    const sw = registration.installing || registration.waiting
    if (sw) {
      const onStateChange = () => {
        if (sw.state === 'activated') {
          sw.removeEventListener('statechange', onStateChange)
          resolve(registration)
        }
      }
      sw.addEventListener('statechange', onStateChange)
    } else {
      // Fallback: wait for navigator.serviceWorker.ready
      navigator.serviceWorker.ready.then(() => resolve(registration))
    }
  })

export const getFCMToken = async (isRetry = false) => {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.')
      return ''
    }

    let swUrl = `${import.meta.env.BASE_URL || '/'}firebase-messaging-sw.js`
    if (swUrl.startsWith('.')) {
      swUrl = swUrl.replace(/^\.+/, '')
      if (!swUrl.startsWith('/')) {
        swUrl = '/' + swUrl
      }
    }

    const registration = await navigator.serviceWorker.register(swUrl)

    // ✅ Wait for SW to be fully ACTIVE before subscribing.
    // navigator.serviceWorker.ready resolves when *a* SW is active but the
    // specific registration may still be installing — causing AbortError.
    await waitForSWActive(registration)

    console.log('SW registered and active:', registration)

    const token = await getToken(messaging, {
      vapidKey: 'BLzhc9fU0Jm5Xxqp1pLAzphwK2ff20MLyjZGVO_B93KNFcBoiK1Q0EsEvVKNBcS0-KD5xeWjLfGzhs6t7HH-nls',
      serviceWorkerRegistration: registration,
    })

    // ✅ If getToken returns empty (stale subscription on 2nd login), force-refresh the token
    if (!token && !isRetry) {
      console.warn('[firebase.js] Empty token — deleting stale subscription and retrying...')
      try {
        await deleteToken(messaging)
      } catch (_) {
        // ignore deleteToken errors, proceed to retry anyway
      }
      await new Promise((res) => setTimeout(res, 300))
      return getFCMToken(true) // retry once with a fresh subscription
    }

    // ✅ Clear the reload-guard flag on success
    sessionStorage.removeItem('fcm_idb_reload')
    console.log('FCM TOKEN:', token)
    return token || ''
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err)

    // ✅ VersionError: Firebase's internal IDB was opened at wrong version.
    // Firebase IDB connections are made at module-load time, so they cannot be
    // repaired by retrying in the same session. We must:
    //   1. Clear the bad IDB databases
    //   2. Reload the page so Firebase re-initializes cleanly
    // A sessionStorage flag prevents an infinite reload loop.
    if (err.message && err.message.includes('VersionError')) {
      const alreadyReloaded = sessionStorage.getItem('fcm_idb_reload')
      if (!alreadyReloaded) {
        console.warn('[firebase.js] VersionError — clearing Firebase IDB and reloading page...')
        sessionStorage.setItem('fcm_idb_reload', '1')
        await clearFirebaseIDB()
        // Small delay before reload to ensure IDB delete requests are dispatched
        await new Promise((res) => setTimeout(res, 400))
        window.location.reload()
        return '' // unreachable but satisfies type
      } else {
        // Already reloaded once — still failing, give up to avoid loop
        console.error('[firebase.js] VersionError persists after reload. FCM unavailable.')
        sessionStorage.removeItem('fcm_idb_reload')
      }
    }

    return ''
  }
}

// ─── FOREGROUND LISTENER ──────────────────────────────────────────────────────
export const listenNotification = (onMessageReceived) => {
  return onMessage(messaging, (payload) => {
    console.log('[firebase.js] Foreground message:', payload)
    if (onMessageReceived) {
      onMessageReceived(payload)
    }
  })
}

// ─── PERSISTENT NOTIFICATIONS HISTORY HELPERS ─────────────────────────────────

export const getNotificationHistoryFromDB = async () => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_HISTORY_STORE, 'readonly')
    const store = tx.objectStore(IDB_HISTORY_STORE)
    const items = await new Promise((res, rej) => {
      const req = store.getAll()
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    db.close()
    return items || []
  } catch (e) {
    console.error('[firebase.js] getNotificationHistoryFromDB error:', e)
    return []
  }
}

export const saveNotificationToHistoryDB = async (notif) => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_HISTORY_STORE, 'readwrite')
    tx.objectStore(IDB_HISTORY_STORE).put(notif)
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
  } catch (e) {
    console.error('[firebase.js] saveNotificationToHistoryDB error:', e)
  }
}

export const deleteNotificationFromHistoryDB = async (id) => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_HISTORY_STORE, 'readwrite')
    tx.objectStore(IDB_HISTORY_STORE).delete(id)
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
  } catch (e) {
    console.error('[firebase.js] deleteNotificationFromHistoryDB error:', e)
  }
}

export const clearNotificationHistoryDB = async () => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_HISTORY_STORE, 'readwrite')
    tx.objectStore(IDB_HISTORY_STORE).clear()
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
  } catch (e) {
    console.error('[firebase.js] clearNotificationHistoryDB error:', e)
  }
}

export const markNotificationAsReadInHistoryDB = async (id) => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_HISTORY_STORE, 'readwrite')
    const store = tx.objectStore(IDB_HISTORY_STORE)
    const notif = await new Promise((res, rej) => {
      const req = store.get(id)
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    if (notif) {
      notif.read = true
      store.put(notif)
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
    })
    db.close()
  } catch (e) {
    console.error('[firebase.js] markNotificationAsReadInHistoryDB error:', e)
  }
}

export const getUnreadNotificationsCountFromDB = async () => {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_HISTORY_STORE, 'readonly')
    const store = tx.objectStore(IDB_HISTORY_STORE)
    const items = await new Promise((res, rej) => {
      const req = store.getAll()
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    db.close()
    return items ? items.filter(n => !n.read).length : 0
  } catch (e) {
    return 0
  }
}
