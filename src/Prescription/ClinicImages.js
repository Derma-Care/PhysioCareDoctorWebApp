import React, { useEffect, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCamera, cilColumns, cilFolderOpen, cilTrash } from '@coreui/icons'
import Button from '../components/CustomButton/CustomButton'
import { COLORS /*, compareSvg*/ } from '../Themes'
import './ClinicImages.css'

export default function MultiImageUpload() {
  const STORAGE_KEY = 'multiImageUpload.items.v1'

  const [items, setItems] = useState([]) // { id, file, preview }
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  // Compare modal state
  const [showCompare, setShowCompare] = useState(false)
  const [savedGrid, setSavedGrid] = useState([]) // [{id, name, dataUrl, savedAt}]
  const [selectedSavedId, setSelectedSavedId] = useState(null)
  const [selectedCurrentId, setSelectedCurrentId] = useState(null)

  // drag & drop highlight
  const [isDragging, setIsDragging] = useState(false)
  const [active, setActive] = useState(false);
  // file inputs
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  // true camera capture (getUserMedia)
  const [camOpen, setCamOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false) // <-- missing before
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB per image

  const setInfo = (text) => setMsg({ type: 'info', text })
  const setWarn = (text) => setMsg({ type: 'warning', text })
  const setErr = (text) => setMsg({ type: 'danger', text })
  const clearMsg = () => setMsg({ type: '', text: '' })

  const readSavedFromLocalStorage = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      const arr = JSON.parse(raw)
      return arr.map((s) => ({
        id: s.id || `${s.name}-${Math.random()}`,
        name: s.name || 'image.jpg',
        dataUrl: s.dataUrl,
        savedAt: s.savedAt || new Date().toISOString(),
      }))
    } catch {
      return []
    }
  }

  // Open compare modal (requires at least 1 uploaded image)
  const openCompare = () => {
    if (items.length === 0) {
      setWarn('Please upload at least one image to compare.')
      return
    }
    const saved = readSavedFromLocalStorage()
    if (saved.length === 0) {
      setWarn('No saved images found. Use "Save to Device" first.')
      return
    }
    setSavedGrid(saved)
    setSelectedCurrentId(items[0]?.id || null)
    setSelectedSavedId(saved[0]?.id || null)
    setShowCompare(true)
  }

  const addFiles = async (files) => {
    const next = files
      .filter((f) => {
        if (!f.type?.startsWith('image/')) {
          setErr('Only image files are allowed.')
          return false
        }
        if (f.size > MAX_SIZE) {
          setWarn('Some files were >5MB and skipped.')
          return false
        }
        return true
      })
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }))
    setItems((prev) => [...prev, ...next])
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    clearMsg()
    setBusy(true)
    try {
      await addFiles(files)
    } finally {
      setBusy(false)
    }
  }

  // Gallery
  const onPickGallery = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  // Camera (file input with capture hint — may still show chooser)
  const onPickCamera = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  // Remove one / Clear all
  const removeOne = (id) => {
    setItems((prev) => {
      const gone = prev.find((x) => x.id === id)
      if (gone?.preview?.startsWith('blob:')) URL.revokeObjectURL(gone.preview)
      return prev.filter((x) => x.id !== id)
    })
  }
  const clearAll = () => {
    items.forEach((x) => x.preview?.startsWith('blob:') && URL.revokeObjectURL(x.preview))
    setItems([])
  }

  // ---- Drag & Drop ----
  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // ---- Live Camera: open modal first, then attach stream ----
  const startCamera = () => {
    clearMsg()
    setCameraReady(false)
    setCamOpen(true)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    let cancelled = false

    const attachStream = async () => {
      if (!camOpen) {
        stopCamera()
        setCameraReady(false)
        return
      }
      try {
        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          video.setAttribute('playsinline', '')
          await video.play()
          setCameraReady(true)
          setInfo('Camera ready.')
        }
      } catch (err) {
        console.error(err)
        setErr('Unable to access camera. Use HTTPS/localhost and allow camera permission.')
        setCamOpen(false)
      }
    }

    attachStream()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [camOpen])

  const capturePhoto = async () => {
    clearMsg()
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video) return

    if (!cameraReady || !video.videoWidth || !video.videoHeight) {
      setWarn('Camera not ready yet. Give it a second.')
      return
    }

    const w = video.videoWidth
    const h = video.videoHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)

    const getBlob = () =>
      new Promise((resolve) => {
        if (canvas.toBlob) {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
        } else {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
          dataUrlToBlob(dataUrl).then(resolve)
        }
      })

    const blob = await getBlob()
    if (!blob) {
      setErr('Capture failed.')
      return
    }
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    addFiles([file])
    setInfo('Captured a photo from camera.')
  }

  // --- LocalStorage helpers ---
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result) // data URL
      fr.onerror = reject
      fr.readAsDataURL(file)
    })

  const dataUrlToBlob = async (dataUrl) => {
    const res = await fetch(dataUrl)
    return await res.blob()
  }

  const dataUrlToFile = async (dataUrl, name = `image-${Date.now()}.jpg`) => {
    const blob = await dataUrlToBlob(dataUrl)
    return new File([blob], name, { type: blob.type || 'image/jpeg', lastModified: Date.now() })
  }

  const saveToLocalStorage = async () => {
    try {
      setBusy(true)
      clearMsg()

      const serialized = await Promise.all(
        items.map(async (it) => {
          const isDataUrl = typeof it.preview === 'string' && it.preview.startsWith('data:')
          const dataUrl = isDataUrl
            ? it.preview
            : it.file
              ? await fileToDataUrl(it.file)
              : it.preview

          return {
            id: it.id,
            name: it.file?.name || 'image.jpg',
            type: it.file?.type || (isDataUrl ? dataUrl.split(';')[0].replace('data:', '') : ''),
            size: it.file?.size || undefined,
            lastModified: it.file?.lastModified || undefined,
            dataUrl,
          }
        }),
      )

      const payload = JSON.stringify(serialized)
      const bytes = new TextEncoder().encode(payload).length
      const mb = (bytes / (1024 * 1024)).toFixed(2)
      if (bytes > 4.5 * 1024 * 1024) {
        setWarn(`Data is ~${mb} MB and may exceed localStorage limits.`)
      }

      localStorage.setItem(STORAGE_KEY, payload)
      setInfo(`Saved ${serialized.length} image(s) to device.`)

      // Revoke old blob URLs and clear UI
      items.forEach((x) => {
        if (typeof x.preview === 'string' && x.preview.startsWith('blob:')) {
          URL.revokeObjectURL(x.preview)
        }
      })
      setItems([])
    } catch (err) {
      console.error(err)
      setErr('Failed to save images to device storage.')
    } finally {
      setBusy(false)
    }
  }

  const loadFromLocalStorage = async () => {
    clearMsg()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setWarn('No saved images found.')
      return
    }
    try {
      setBusy(true)
      const saved = JSON.parse(raw)
      const rebuilt = await Promise.all(
        saved.map(async (s) => {
          const file = undefined // keep light; preview from dataUrl
          return {
            id: s.id || `${s.name}-${Math.random()}`,
            file,
            preview: s.dataUrl,
          }
        }),
      )

      items.forEach((x) => x.preview?.startsWith('blob:') && URL.revokeObjectURL(x.preview))
      setItems(rebuilt)
      setInfo(`Loaded ${rebuilt.length} image(s) from device.`)
    } catch (err) {
      console.error(err)
      setErr('Failed to load saved images.')
    } finally {
      setBusy(false)
    }
  }

  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY)
    setInfo('Cleared saved images.')
  }


  // Save
  const saveToServer = async () => {
    try {
      setBusy(true);
      clearMsg();
      await saveImagesToServer(items.map((it) => it.file));
      setInfo(`Saved ${items.length} image(s) to server.`);
      clearAll();
    } catch (err) {
      setErr("Failed to save images.");
    } finally {
      setBusy(false);
    }
  };

  // Load
  const loadFromServer = async () => {
    try {
      setBusy(true);
      clearMsg();
      const saved = await loadImagesFromServer();
      setItems(saved.map((s) => ({ id: s.id, file: undefined, preview: s.url })));
      setInfo(`Loaded ${saved.length} image(s) from server.`);
    } catch (err) {
      setErr("Failed to load saved images.");
    } finally {
      setBusy(false);
    }
  };

  // Clear
  const clearServer = async () => {
    try {
      setBusy(true);
      clearMsg();
      await clearImagesOnServer();
      setInfo("Cleared saved images from server.");
    } catch (err) {
      setErr("Failed to clear saved images.");
    } finally {
      setBusy(false);
    }
  };


  const handleClick = () => {
    setActive(true); // Change background color on click
    galleryRef.current?.click();
    setTimeout(() => setActive(false), 200); // Reset after a short delay if needed
  };
  return (
    <CContainer fluid className="p-0 pb-4">
      <CRow className="g-3">
        <CCol xs={12}>
          <CCard className="shadow-sm">
            <CCardHeader className="d-flex align-items-center justify-content-between py-2">
              <strong style={{ color: COLORS.black }}>Upload Images</strong>
              <div className="small text-body-secondary">
                Gallery (multiple), Camera (hint), or Live Capture
              </div>
            </CCardHeader>

            <CCardBody>
              {msg.text && (
                <CAlert color={msg.type || 'info'} className="mb-3">
                  {msg.text}
                </CAlert>
              )}

              {/* Hidden inputs */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={onPickGallery}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={onPickCamera}
              />

              {/* Controls */}
              <div className="d-flex justify-content-evenly flex-wrap gap-2 mb-3">
                <Button
                  size="small"
                  variant="outline"
                  onClick={handleClick}
                  disabled={busy}
                  style={{
                    backgroundColor: active ? '#d1e7dd' : 'white', // Change '#d1e7dd' to your desired color
                    transition: 'background-color 0.3s',
                  }}
                >
                  <CIcon icon={cilFolderOpen} className="me-2" />
                  Choose from Gallery
                </Button>
                <Button
                  size="small"
                  variant="outline"
                  onClick={startCamera}
                  disabled={busy || !navigator.mediaDevices?.getUserMedia}
                  title="Opens live camera stream to capture"
                >
                  <CIcon icon={cilCamera} className="me-2" />
                  Open Live Camera
                </Button>

                {items.length > 0 && (
                  <Button

                    size="small"
                    variant="outline"
                    onClick={clearAll}
                    disabled={busy}
                  >
                    <CIcon icon={cilTrash} className="me-2" />
                    Clear All
                  </Button>
                )}

                <Button
                  size="small"
                  variant="outline"
                  onClick={openCompare}
                  disabled={busy}
                >
                  <CIcon icon={cilColumns} className="me-2" />
                  Compare
                </Button>

                {busy && (
                  <span className="d-inline-flex align-items-center ms-1">
                    <CSpinner size="sm" className="me-2" /> Processing…
                  </span>
                )}
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className="border rounded d-flex align-items-center justify-content-center mb-3"
                style={{
                  height: 140,
                  background: isDragging ? 'rgba(0,123,255,0.08)' : 'var(--cui-body-bg)',
                  borderStyle: isDragging ? 'dashed' : 'solid',
                }}
              >
                <div className="text-center">
                  <div className="fw-semibold">Drag & Drop images here</div>
                  <div className="text-body-secondary small">or use the buttons above</div>
                </div>
              </div>

              {/* Grid previews */}
              {items.length === 0 ? (
                <div className="text-body-secondary">No images selected yet.</div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="position-relative image-container">
                      <img
                        src={it.preview}
                        alt="uploaded"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                      <CButton
                        color="danger"
                        size="sm"
                        className="position-absolute"
                        style={{ top: 6, right: 6, backgroundColor: "black", border: "none" }}
                        onClick={() => removeOne(it.id)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </div>
                  ))}

                  <style jsx>{`
    .image-container {
      width: 100%; /* 1 image per row on extra-small screens */
      aspect-ratio: 1 / 1;
      overflow: hidden;
    }

    @media (min-width: 576px) {
      .image-container {
        width: calc((100% - 1 * 0.5rem) / 2); /* 2 images per row on small screens */
      }
    }

    @media (min-width: 992px) {
      .image-container {
        width: calc((100% - 2 * 0.5rem) / 3); /* 3 images per row on large screens and above */
      }
    }
  `}</style>
                </div>

              )}


            </CCardBody>

            <div className="d-flex flex-wrap gap-2 mb-3 ps-3">
              <Button
                size="small"
                variant="outline"
                onClick={saveToLocalStorage}
                disabled={busy || items.length === 0}
              >
                Save to Server
              </Button>

              <Button variant="outline" size="small" onClick={loadFromLocalStorage} disabled={busy}>
                Load Saved
              </Button>

              <Button
                // customColor={COLORS.danger}
                size="small"
                variant="outline"
                onClick={clearSaved}
                disabled={busy}
              >
                Clear Saved
              </Button>
            </div>
          </CCard>
        </CCol>
      </CRow>

      {/* Live Camera Modal */}
      <CModal visible={camOpen} onClose={() => setCamOpen(false)} size="lg" alignment="center">
        <CModalHeader>
          <CModalTitle>Live Camera</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex justify-content-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              style={{ width: '100%', maxWidth: 640, background: '#000', borderRadius: 6 }}
            />
          </div>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => {
              setCamOpen(false)
              setCameraReady(false)
            }}
          >
            Close
          </CButton>
          <CButton color="success" onClick={capturePhoto} disabled={!cameraReady}>
            Capture Photo
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Compare Modal */}
      <CModal
        visible={showCompare}
        onClose={() => setShowCompare(false)}
        size="xl"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle style={{ color: COLORS.black }}>Compare Images</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {/* Compare preview */}
          <div className="border rounded p-2 mb-3">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-stretch">
              {/* Before pane */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div
                  className="fw-semibold mb-1 text-center"
                  style={{ color: COLORS.black }}
                >
                  Before
                </div>
                <div className="compare-pane">
                  {(() => {
                    const sel = savedGrid.find((s) => s.id === selectedSavedId);
                    return sel ? (
                      <img src={sel.dataUrl} alt="saved" className="compare-img" />
                    ) : (
                      <div className="text-body-secondary">No saved selected</div>
                    );
                  })()}
                </div>
              </div>

              {/* Separation line */}
              <div
                style={{
                  width: '1px',
                  backgroundColor: '#ccc',
                  margin: '0 10px',
                  alignSelf: 'stretch',
                }}
              />

              {/* After pane */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div
                  className="fw-semibold mb-1 text-center"
                  style={{ color: COLORS.black }}
                >
                  After
                </div>
                <div className="compare-pane">
                  {(() => {
                    const sel = items.find((it) => it.id === selectedCurrentId);
                    return sel ? (
                      <img src={sel.preview} alt="current" className="compare-img" />
                    ) : (
                      <div className="text-body-secondary">No current selected</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Pickers: Saved grid + Current grid */}
          <div className="d-flex flex-wrap gap-3 align-items-stretch" style={{ position: 'relative' }}>
            {/* Saved grid */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="fw-semibold mb-2 text-center" style={{ color: COLORS.black }}>
                Saved Images
              </div>
              {savedGrid.length === 0 ? (
                <div className="text-body-secondary small">No saved images.</div>
              ) : (
                <div className="compare-grid">
                  {savedGrid.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`cmp-card ${selectedSavedId === s.id ? 'active' : ''}`}
                      onClick={() => setSelectedSavedId(s.id)}
                      title={s.name}
                    >
                      <img src={s.dataUrl} alt={s.name} />
                      <div className="cmp-meta">
                        <div className="cmp-name">{s.name}</div>
                        <div className="cmp-date">{new Date(s.savedAt).toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Full-height separation line */}
            <div style={{
              width: '1px',
              backgroundColor: '#ccc',
              margin: '0 15px',
              alignSelf: 'stretch',
            }} />

            {/* Current grid */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="fw-semibold mb-2 text-center" style={{ color: COLORS.black }}>
                Current Uploads
              </div>
              {items.length === 0 ? (
                <div className="text-body-secondary small">No uploads.</div>
              ) : (
                <div className="compare-grid">
                  <div className="preview-grid">
                    {items.map((it) => (
                      <div key={it.id} className="preview-item">
                        <img src={it.preview} alt="uploaded" className="preview-img" />
                        <Button
                          color="danger"
                          size="sm"
                          variant="ghost"
                          className="remove-btn"
                          onClick={() => removeOne(it.id)}
                          aria-label="Remove"
                          title="Remove"
                        >
                          <CIcon icon={cilTrash} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </CModalBody>

        <CModalFooter className="d-flex justify-content-between">
          <CButton
            variant="outline"
            onClick={() => setShowCompare(false)}
            style={{ backgroundColor: COLORS.bgcolor, borderColor: COLORS.bgcolor, color: COLORS.black, fontWeight: 'bold' }}
          >
            Close
          </CButton>

          <div>
            <CButton
              style={{ backgroundColor: COLORS.bgcolor, color: COLORS.black, fontWeight: 'bold' }}
              disabled={!selectedSavedId || !selectedCurrentId}
              onClick={() => setInfo('Comparison ready.')}
            >
              Confirm Compare
            </CButton>
          </div>
        </CModalFooter>
      </CModal>
    </CContainer>
  )
}
