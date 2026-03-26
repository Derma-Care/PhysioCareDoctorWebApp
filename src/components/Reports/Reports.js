import React, { useEffect, useMemo, useState } from 'react'
import { FaDownload, FaFilePdf, FaFileImage, FaEye } from 'react-icons/fa'
import { Get_ReportsByBookingIdData } from '../../Auth/Auth'
import './ReportDetails.css'

const ReportDetails = ({ patientData, formData, show, label = 'Reports' }) => {
  const bookingId = useMemo(
    () => patientData?.bookingId || formData?.bookingId || '',
    [patientData, formData],
  )

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ---- helpers ----
  const isPdfFromBase64 = (base64, name = '', type = '') => {
    const n = (name || '').toLowerCase()
    const t = (type || '').toLowerCase()
    if (n.endsWith('.pdf') || t.includes('pdf')) return true
    if (!base64) return false
    return (base64 || '').trim().slice(0, 8).toUpperCase().startsWith('JVBER')
  }
  const mimeFromBase64 = (base64) => {
    if (!base64) return 'application/octet-stream'
    const head = (base64 || '').trim().slice(0, 8).toUpperCase()
    if (head.startsWith('JVBER')) return 'application/pdf'
    if (head.startsWith('/9J/')) return 'image/jpeg'
    if (head.startsWith('IVBOR')) return 'image/png'
    return 'application/octet-stream'
  }

  // Open in a NEW TAB using Blob -> ObjectURL (prevents SPA navigating to data:)
  const openInNewTab = (dataUrl) => {
    if (!dataUrl) return
    try {
      const [header, b64] = dataUrl.split(',')
      const mimeFromHeader = header?.split(':')[1]?.split(';')[0] || ''
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: mimeFromHeader || 'application/octet-stream' })
      const objectUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = objectUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
    } catch {
      // fallback: still open in new tab (may be blocked by popup settings)
      window.open(dataUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // ---- load data ----
  useEffect(() => {
    const load = async () => {
      if (!bookingId) {
        setItems([])
        setError('Missing booking ID.')
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await Get_ReportsByBookingIdData(bookingId)
        const raw = Array.isArray(res) ? res : []
        const reports = raw.flatMap((r) => r?.reportsList || [])

        const mapped = reports
          .map((r, idx) => {
            const b64 = Array.isArray(r.reportFile) ? r.reportFile[0] : r.reportFile
            if (!b64) return null
            const isPdf = isPdfFromBase64(b64, r?.reportName, r?.reportType)
            const mime = isPdf ? 'application/pdf' : mimeFromBase64(b64)
            const ext = isPdf ? 'pdf' : mime.includes('image/') ? mime.split('/')[1] : 'dat'
            const fileUrl = `data:${mime};base64,${(b64 || '').trim()}`
            const name = r?.reportName || `Report ${idx + 1}`
            const fileName = `${name}.${ext}`

            return {
              id: `${bookingId}-${idx}`,
              name,
              fileName,
              fileUrl,
              isPdf,
              typeLabel: r?.reportType || (isPdf ? 'PDF' : 'Image'),
              date: r?.reportDate || '',
            }
          })
          .filter(Boolean)

        setItems(mapped)
      } catch (e) {
        console.error(e)
        setError('Failed to load reports.')
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId])

  return (
    <div className="report-wrapper">
      {show && (
        <div className="report-header">
          <h6 className="m-0">{label}</h6>
          {/* <span className="report-header__id">Booking ID: {bookingId || 'N/A'}</span> */}
        </div>
      )}

      {loading && <div className="mt-2">Loading…</div>}
      {error && !loading && <div className="mt-2 text-danger">{error}</div>}

      {!loading &&
        !error &&
        (items.length > 0 ? (
          <div className="report-list">
            {items.map((it) => (
              <div
                key={it.id}
                className="report-item"
                role="link"
                tabIndex={0}
                onClick={() => openInNewTab(it.fileUrl)}
                onKeyDown={(e) => (e.key === 'Enter' ? openInNewTab(it.fileUrl) : null)}
              >
                <div className={`report-icon ${it.isPdf ? 'pdf' : 'img'}`}>
                  {it.isPdf ? <FaFilePdf size={22} /> : <FaFileImage size={22} />}
                </div>

                <div className="report-info">
                  <div className="report-name" title={it.name}>
                    {it.name}
                  </div>
                  <div className="report-meta">
                    {it.typeLabel || '-'}
                    {it.date ? ` • ${it.date}` : ''}
                  </div>
                </div>

                <div className="report-dl btn btn-sm btn-success">
                  <FaEye />
                </div>

                <a
                  className="report-dl btn btn-sm btn-primary"
                  href={it.fileUrl}
                  download={it.fileName || it.name}
                  title="Download"
                  onClick={(e) => {
                    // keep download from also opening preview
                    e.stopPropagation()
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <FaDownload />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '60vh' }}
          >
            <span>No Reports Found</span>
          </div>
        ))}
    </div>
  )
}

export default ReportDetails
