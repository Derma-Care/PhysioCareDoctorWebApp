import React, { useState, useEffect } from 'react'
import './FileUploader.css'
import { useNavigate } from 'react-router-dom'

/** ---------- helpers ---------- **/

// Convert anything (data URL / base64 / binary string / ArrayBuffer / Uint8Array / URL) to a displayable object
function normalizeAttachment(input) {
  // If it's already a data URL, just return as-is
  if (typeof input === 'string' && input.startsWith('data:')) {
    const mime = input.slice(5, input.indexOf(';')) || 'application/octet-stream'
    return { type: mime, name: guessNameFromMime(mime), path: input }
  }

  // If it looks like an http(s) URL or a filename, just return it (browser will fetch it)
  if (typeof input === 'string' && (/^https?:\/\//i.test(input) || /\.\w{2,5}$/i.test(input))) {
    const mime = guessMimeFromExtension(input)
    return { type: mime, name: guessNameFromMime(mime), path: input }
  }

  // If it's a plain base64 (no data: prefix), try to decode and detect mime
  if (typeof input === 'string' && looksLikeBase64(input)) {
    try {
      const bytes = base64ToBytes(input)
      const mime = detectMimeFromBytes(bytes) || 'application/octet-stream'
      const dataUrl = bytesToDataUrl(bytes, mime)
      return { type: mime, name: guessNameFromMime(mime), path: dataUrl }
    } catch {
      // fall through
    }
  }

  // If it's a binary string (your case: starts with �PNG...), convert to bytes and detect
  if (typeof input === 'string') {
    const bytes = binaryStringToBytes(input)
    const mime = detectMimeFromBytes(bytes) || 'application/octet-stream'
    const dataUrl = bytesToDataUrl(bytes, mime)
    return { type: mime, name: guessNameFromMime(mime), path: dataUrl }
  }

  // If it's bytes
  if (input instanceof Uint8Array) {
    const mime = detectMimeFromBytes(input) || 'application/octet-stream'
    const dataUrl = bytesToDataUrl(input, mime)
    return { type: mime, name: guessNameFromMime(mime), path: dataUrl }
  }
  if (input instanceof ArrayBuffer) {
    const bytes = new Uint8Array(input)
    const mime = detectMimeFromBytes(bytes) || 'application/octet-stream'
    const dataUrl = bytesToDataUrl(bytes, mime)
    return { type: mime, name: guessNameFromMime(mime), path: dataUrl }
  }

  // Unknown
  return { type: 'application/octet-stream', name: 'File', path: '' }
}

function looksLikeBase64(str) {
  const s = str.trim().replace(/\s+/g, '')
  // Base64 should be long and only contain base64 chars with optional padding
  if (s.length < 64) return false
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return false
  // sanity: try decode
  try {
    atob(s)
    return true
  } catch {
    return false
  }
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function binaryStringToBytes(binaryStr) {
  const out = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) out[i] = binaryStr.charCodeAt(i) & 0xff
  return out
}

function bytesToDataUrl(bytes, mime) {
  // bytes -> base64
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const b64 = btoa(bin)
  return `data:${mime};base64,${b64}`
}

function detectMimeFromBytes(bytes) {
  if (!bytes || bytes.length < 12) return null
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png'
  // JPG: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg'
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38)
    return 'image/gif'
  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp'
  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return 'image/webp'
  // PDF: %PDF-
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
    return 'application/pdf'
  return null
}

function guessMimeFromExtension(path) {
  const m = (path.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase()
  switch (m) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'bmp':
      return 'image/bmp'
    case 'webp':
      return 'image/webp'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

function guessNameFromMime(mime) {
  if (mime.startsWith('image/')) return 'Image'
  if (mime === 'application/pdf') return 'PDF'
  return 'File'
}

/** ---------- component ---------- **/

const FileUploader = ({ label, attachments = [] }) => {
  const [previewFile, setPreviewFile] = useState(null)
  const [files, setFiles] = useState([])
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // Support both: array of strings OR array of objects with a data field
  useEffect(() => {
    const processed = (attachments || []).map((item) => {
      // If backend sends objects like { name, date, result, unit, referenceRange, data/base64/attachments }
      if (
        item &&
        typeof item === 'object' &&
        !(item instanceof Uint8Array) &&
        !(item instanceof ArrayBuffer)
      ) {
        const raw =
          item.data ??
          item.base64 ??
          item.attachments ?? // some backends use this
          item.path ??
          ''
        const normalized = normalizeAttachment(raw)
        return {
          ...normalized,
          // prefer name from backend if available
          name: item.name || normalized.name,
          meta: {
            date: item.date,
            result: item.result,
            unit: item.unit,
            referenceRange: item.referenceRange,
          },
        }
      }
      // If it’s a string/bytes directly
      const normalized = normalizeAttachment(item)
      return normalized
    })

    setFiles(processed)
  }, [attachments])

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <img src={file.path} alt={file.name} width={100} className="border rounded" />
    } else if (file.type === 'application/pdf') {
      return <img src="/icons/pdf.png" alt="PDF Icon" width={80} />
    } else {
      return <div className="text-danger">Unsupported</div>
    }
  }

  // --- URL helpers ---
  const isHttpUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s)
  const isDataUrl = (s) => typeof s === 'string' && s.startsWith('data:')

  // Turn a data: URL into a Blob
  const dataUrlToBlob = (dataUrl) => {
    const [meta, b64] = dataUrl.split(',')
    const mime = (meta.match(/data:(.*?);/) || [, 'application/octet-stream'])[1]
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }

  // Fetch a protected URL with auth -> Blob
  const fetchToBlobWithAuth = async (url) => {
    // customize this to your auth setup:
    // If you use cookies/sessions:
    const opts = { credentials: 'include' }

    // If you use bearer tokens:
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      opts.headers = { Authorization: `Bearer ${token}` }
    }

    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`)
    return await res.blob()
  }

  // Open a Blob in a new tab (iOS-safe: pre-open window to avoid popup blockers)
  const openBlobInNewTab = (blob) => {
    const blobUrl = URL.createObjectURL(blob)
    const win = window.open('', '_blank') // pre-open
    if (win) {
      win.location = blobUrl
    } else {
      // fallback
      const a = document.createElement('a')
      a.href = blobUrl
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    // optional: revoke later
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  }

  const handleFileClick = async (file) => {
    // PDFs -> open in a new tab correctly (with auth)
    if (file.type === 'application/pdf') {
      try {
        setOpening(true)

        if (isDataUrl(file.path)) {
          // data: URL (already inline)
          const blob = dataUrlToBlob(file.path)
          openBlobInNewTab(blob)
        } else if (isHttpUrl(file.path)) {
          // protected URL -> fetch with auth -> blob
          const blob = await fetchToBlobWithAuth(file.path)
          openBlobInNewTab(blob)
        } else {
          // local/relative path – try just opening
          const win = window.open(file.path, '_blank')
          if (!win) throw new Error('Popup blocked')
        }
      } catch (e) {
        console.error('Open PDF failed:', e)
        // optional: show a toast here
      } finally {
        setOpening(false)
      }
      return
    }

    // Images -> preview modal
    if (file.type.startsWith('image/')) {
      setPreviewFile(file)
      return
    }

    // Other types
    console.warn('Unsupported file type:', file.type)
  }

  const closePreview = () => setPreviewFile(null)
  const handleCloseOrBack = () => (previewFile ? closePreview() : navigate(-1))

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div className="upload-boxes-scroll d-flex flex-wrap gap-3">
        {files.map((file, index) => (
          <div className="upload-placeholder-wrapper" key={index}>
            <div className="upload-placeholder" onClick={() => handleFileClick(file)}>
              {getFileIcon(file)}
            </div>
            {/* Optional: show simple meta if present */}
            {file.meta && (file.meta.result || file.meta.date) && (
              <div className="small mt-1">
                {file.meta.result && <span>{file.meta.result} </span>}
                {file.meta.unit && <span>{file.meta.unit} </span>}
                {file.meta.referenceRange && <span>({file.meta.referenceRange}) </span>}
                {file.meta.date && <div>{file.meta.date}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseOrBack}>
              ×
            </button>
            {previewFile.type.startsWith('image/') ? (
              <img src={previewFile.path} alt="Preview" className="modal-image" />
            ) : previewFile.type === 'application/pdf' ? (
              <iframe src={previewFile.path} title="PDF Preview" className="modal-iframe" />
            ) : (
              <p>{previewFile.name}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader
