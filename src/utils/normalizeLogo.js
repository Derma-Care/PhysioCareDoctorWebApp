// src/utils/normalizeLogo.js
const looksLikeBase64 = (str) => {
  if (typeof str !== 'string') return false
  const s = str.trim().replace(/\s+/g, '')
  if (s.length < 64) return false
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return false
  try {
    // eslint-disable-next-line no-undef
    atob(s)
    return true
  } catch {
    return false
  }
}

const base64ToBytes = (b64) => {
  // eslint-disable-next-line no-undef
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const detectMimeFromBytes = (b) => {
  if (!b || b.length < 12) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp'
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'image/webp'
  return 'image/jpeg'
}

const bytesToDataUrl = (bytes, mime) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  // eslint-disable-next-line no-undef
  return `data:${mime};base64,${btoa(bin)}`
}

// If you expose Windows/server paths via API, change this to your endpoint
const toFileUrl = (p) => `/api/files?path=${encodeURIComponent(p)}`

/**
 * Normalize any clinic logo value to a URL/data URL react-pdf can render.
 * @param {*} raw           - clinicDetails.hospitalLogo (raw base64, data URL, http URL, file path, etc.)
 * @param {string} fallback - public URL for fallback image (we convert to dataURL for reliability)
 * @returns {Promise<string>} a data URL or http(s) URL
 */
export const normalizeClinicLogo = async (raw, fallback) => {
  if (!raw) {
    // Convert fallback URL to a data URL (react-pdf prefers data URLs)
    const resp = await fetch(fallback)
    const blob = await resp.blob()
    return await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result) // data URL
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  }

  const s = String(raw).trim()

  if (s.startsWith('data:image/')) return s // already a data URL
  if (/^https?:\/\//i.test(s)) return s     // absolute URL (ensure CORS works)
  if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(s)) return s // public path

  if (looksLikeBase64(s)) {
    const bytes = base64ToBytes(s)
    const mime = detectMimeFromBytes(bytes)
    return bytesToDataUrl(bytes, mime)
  }

  // If backend returns a file system path, your API should serve it:
  if (s.includes('\\') || s.includes('/')) {
    return toFileUrl(s)
  }

  // Fallback to provided fallback image as data URL
  const resp = await fetch(fallback)
  const blob = await resp.blob()
  return await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}
