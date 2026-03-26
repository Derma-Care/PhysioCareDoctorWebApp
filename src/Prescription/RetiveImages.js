import { CCol, CRow } from '@coreui/react'
import React, { useState } from 'react'
import { Button, Modal, Spinner } from 'react-bootstrap'
import { COLORS } from '../Themes'

export default function ImageGallery() {
  const STORAGE_KEY = 'multiImageUpload.items.v1'
  const [items, setItems] = useState([]) // { id, preview }
  const [busy, setBusy] = useState(false)
  const [selectedImg, setSelectedImg] = useState(null)
  const [zoom, setZoom] = useState(1)

  // Retrieve images with 2s loader
  const retrieveImages = async () => {
    setBusy(true)

    // Force loader visible for 2 sec
    setTimeout(() => {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setItems([])
        setBusy(false)
        return
      }
      try {
        const saved = JSON.parse(raw)
        const rebuilt = saved.map((s) => ({
          id: s.id || `${s.name}-${Math.random()}`,
          preview: s.dataUrl,
        }))
        setItems(rebuilt)
      } catch (e) {
        console.error('Error loading images', e)
        setItems([])
      } finally {
        setBusy(false)
      }
    }, 2000)
  }

  // Clear images
  const clearImages = () => {
    setItems([])
  }

  return (
   <div
  style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: 20,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}
>
  {/* Retrieve Button (only if no images & not busy) */}
  {items.length === 0 && !busy && (
    <Button
      size="sm"
      onClick={retrieveImages}
      style={{ backgroundColor: COLORS.bgcolor, color: COLORS.black,fontWeight:"bold" }} // button with black background
    >
      Retrieve Images
    </Button>
  )}

  {/* Loader (centered) */}
  {busy && (
    <div
      style={{
        minHeight: '200px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spinner animation="border" role="status" />
        <div className="mt-2">Loading images...</div>
      </div>
    </div>
  )}

  {/* Clear Images button */}
  {items.length > 0 && !busy && (
    <div style={{ marginBottom: 15 }}>
      <Button variant="danger" size="sm" onClick={clearImages}>
        Clear Images
      </Button>
    </div>
  )}

  {/* Gallery */}
  {!busy && (
    <div style={{ marginTop: 20, width: '100%' }}>
      {items.length === 0 ? (
        <div className="text-body-secondary">
          Click <strong>Retrieve</strong> to view saved images.
        </div>
      ) : (
        <CRow className="g-2 justify-content-center">
          {items.map((it) => (
            <CCol xs={12} sm={6} md={4} lg={3} key={it.id}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedImg(it.preview);
                  setZoom(1);
                }}
              >
                <img
                  src={it.preview}
                  alt="uploaded"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 6,
                  }}
                />
              </div>
            </CCol>
          ))}
        </CRow>
      )}
    </div>
  )}

  {/* Full Image Modal */}
  <Modal show={!!selectedImg} onHide={() => setSelectedImg(null)} centered size="xl">
    <Modal.Body
      className="p-0 d-flex justify-content-center align-items-center"
      style={{
    background: '#000',
    overflow: 'hidden',
    height: '80vh',
  }}
    >
      {selectedImg && (
        <img
          src={selectedImg}
          alt="full-view"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease',
            borderRadius: 6,
            maxWidth: '100%',
            maxHeight: '80vh',
          }}
        />
      )}
    </Modal.Body>
    <Modal.Footer className="d-flex justify-content-between">
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
        >
          -
        </Button>{' '}
        <Button variant="secondary" size="sm" onClick={() => setZoom((z) => z + 0.2)}>
          +
        </Button>{' '}
        <Button variant="secondary" size="sm" onClick={() => setZoom(1)}>
          Reset
        </Button>
      </div>
      <Button variant="light" onClick={() => setSelectedImg(null)}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
</div>

  )
}
