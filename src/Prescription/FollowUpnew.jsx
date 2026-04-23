import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'

/* ─── Theme ─────────────────────────────────────────────────────────────── */
const T = {
  bgcolor: '#1B4F8A',
  orange: '#f9c571',
  white: '#FFFFFF',
  bgLight: '#F0F6FF',
  border: '#c2d8f0',
  textDark: '#1B4F8A',
}

/* ─── Styles ───────────────────────────────────────────────────────────── */
const inputStyle = {
  border: `1.5px solid ${T.border}`,
  borderRadius: 7,
  fontSize: '0.875rem',
  color: T.textDark,
  backgroundColor: T.bgLight,
  padding: '7px 11px',
  width: '100%',
  height: 38,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle = {
  fontWeight: 700,
  fontSize: '0.875rem',
  color: T.textDark,
  marginBottom: 6,
  display: 'block',
}

const cardStyle = {
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: '0 2px 16px rgba(27,79,138,0.10)',
}

/* ─── Today's date string (yyyy-mm-dd) ───────────────────────────────── */
const todayStr = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

/* ─── Visit urgency ──────────────────────────────────────────────────── */
const getVisitUrgency = (dateStr) => {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const visit = new Date(dateStr); visit.setHours(0, 0, 0, 0)
  const diffDays = Math.round((visit - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Overdue', bg: '#fff5f5', color: '#c53030', border: '#fc8181', icon: '⚠️' }
  if (diffDays === 0) return { label: 'Today', bg: '#f0fff4', color: '#276749', border: '#68d391', icon: '📍' }
  if (diffDays <= 3) return { label: 'Very Soon', bg: '#fffbeb', color: '#7b341e', border: '#f6ad55', icon: '🔔' }
  if (diffDays <= 7) return { label: 'This Week', bg: '#ebf8ff', color: '#2a4365', border: '#63b3ed', icon: '📅' }
  return { label: 'Upcoming', bg: '#f5f0ff', color: '#44337a', border: '#b794f4', icon: '🗓️' }
}

const EMPTY_FORM = {
  nextVisitDate: '',
  reviewNotes: '',
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════ */
const FollowUpnew = ({ seed = [], onNext }) => {

  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [data, setData]           = useState(Array.isArray(seed) ? seed : [])
  const [editIndex, setEditIndex] = useState(null)
  const [dupError, setDupError]   = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  /* delete-confirmation state */
  const [confirmDelete, setConfirmDelete] = useState(null) // index or null

  const dateInputRef = useRef(null)

  useEffect(() => {
    if (Array.isArray(seed)) setData(seed)
  }, [seed])

  const set = field => val => {
    setDupError(false)
    setFieldErrors(prev => ({ ...prev, [field]: false }))
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const urgency = getVisitUrgency(form.nextVisitDate)

  const isDuplicate = (entry, excludeIdx = null) =>
    data.some((e, i) => {
      if (i === excludeIdx) return false
      return (
        (e.nextVisitDate || '') === (entry.nextVisitDate || '') &&
        (e.reviewNotes || '').trim().toLowerCase() === (entry.reviewNotes || '').trim().toLowerCase()
      )
    })

  /* ── Validate & save ── */
  const handleSave = () => {
    const errors = {}
    if (!form.nextVisitDate) errors.nextVisitDate = true
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    if (isDuplicate(form, editIndex ?? null)) { setDupError(true); return }

    if (editIndex !== null) {
      setData(prev => prev.map((e, i) => i === editIndex ? { ...form } : e))
      setEditIndex(null)
    } else {
      setData(prev => [...prev, { ...form }])
    }
    setForm({ ...EMPTY_FORM })
    setDupError(false)
    setFieldErrors({})
  }

  const handleEdit = (index) => {
    setForm({ ...data[index] })
    setEditIndex(index)
    setDupError(false)
    setFieldErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Delete with confirmation ── */
  const handleDeleteRequest = (index) => setConfirmDelete(index)

  const handleDeleteConfirm = () => {
    const index = confirmDelete
    setData(prev => prev.filter((_, i) => i !== index))
    if (editIndex === index) {
      setForm({ ...EMPTY_FORM })
      setEditIndex(null)
      setDupError(false)
      setFieldErrors({})
    }
    setConfirmDelete(null)
  }

  const handleDeleteCancel = () => setConfirmDelete(null)

  const handleCancel = () => {
    setForm({ ...EMPTY_FORM })
    setEditIndex(null)
    setDupError(false)
    setFieldErrors({})
  }

  const handleNext = () => {
    const payload = { followUp: data }
    console.log('🚀 FollowUp Payload:', payload)
    onNext?.(payload)
  }

  /* ─── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

        {/* ══ FORM CARD ═══════════════════════════════════════════════ */}
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: `1.5px solid ${T.border}`, paddingBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.bgcolor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
              <h5 style={{ margin: 0, color: T.textDark, fontWeight: 700, fontSize: '1.15rem' }}>
                {editIndex !== null ? `Editing Entry #${editIndex + 1}` : 'Follow Up'}
              </h5>
            </div>

            {/* Duplicate error */}
            {dupError && (
              <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fff5f5', border: '1.5px solid #fc8181', color: '#c53030', fontWeight: 600, fontSize: '0.875rem' }}>
                ⚠️ Duplicate entry detected. This follow-up record already exists.
              </div>
            )}

            {/* ── Two-column layout ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 20 }}>

              {/* Next Visit Date — shrunk with calendar icon */}
              <div>
                <label style={labelStyle}>
                  Next Visit Date
                  {fieldErrors.nextVisitDate && (
                    <span style={{ color: '#e53e3e', marginLeft: 8, fontWeight: 600, fontSize: '0.8rem' }}>* Required</span>
                  )}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* shrunk date input */}
                  <div style={{ position: 'relative', width: 180, flexShrink: 0 }}>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={form.nextVisitDate}
                      min={todayStr()}
                      onChange={e => set('nextVisitDate')(e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 180,
                        borderColor: fieldErrors.nextVisitDate ? '#e53e3e' : T.border,
                        paddingRight: 10,
                      }}
                    />
                  </div>
                  
                  {/* urgency badge */}
                  {urgency && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: urgency.bg, border: `1px solid ${urgency.border}`,
                      borderRadius: 20, padding: '3px 12px',
                      fontSize: '0.78rem', color: urgency.color, fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>
                      {urgency.icon} {urgency.label}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <label style={labelStyle}>Review Notes</label>
                <textarea
                  value={form.reviewNotes}
                  onChange={e => set('reviewNotes')(e.target.value)}
                  placeholder="e.g. Patient showing improvement in mobility"
                  style={{ ...inputStyle, height: 90, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Buttons — right-aligned */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {editIndex !== null && (
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${T.border}`, background: T.bgLight,
                    color: T.textDark, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none',
                  background: T.bgcolor, color: T.white,
                  fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
                }}
              >
                {editIndex !== null ? '✅ Update' : '➕ Add'}
              </button>
            </div>

          </CCardBody>
        </CCard>

        {/* ══ TABLE CARD ══════════════════════════════════════════════ */}
        {data.length > 0 && (
          <CCard style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: `1.5px solid ${T.border}`, paddingBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.bgcolor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <h5 style={{ margin: 0, color: T.textDark, fontWeight: 700, fontSize: '1.15rem' }}>Follow Up List ({data.length})</h5>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: T.textDark }}>
                  <thead>
                    <tr style={{ background: T.bgcolor, color: T.white }}>
                      {['#', 'Next Visit Date', 'Urgency', 'Review Notes', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => {
                      const u = getVisitUrgency(item.nextVisitDate)
                      return (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? T.bgLight : T.white, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{item.nextVisitDate || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {u
                              ? <span style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}`, borderRadius: 12, padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{u.icon} {u.label}</span>
                              : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', maxWidth: 340 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reviewNotes}>
                              {item.reviewNotes || '—'}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleEdit(i)}
                              style={{
                                marginRight: 6, padding: '4px 12px', borderRadius: 6,
                                border: `1.5px solid ${T.bgcolor}`, background: T.bgLight,
                                color: T.bgcolor, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >✏️ Edit</button>
                            <button
                              onClick={() => handleDeleteRequest(i)}
                              style={{
                                padding: '4px 12px', borderRadius: 6,
                                border: '1.5px solid #e53e3e', background: '#fff5f5',
                                color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >🗑️ Delete</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CCardBody>
          </CCard>
        )}

      </CContainer>

      {/* ══ DELETE CONFIRMATION MODAL ══════════════════════════════════ */}
      {confirmDelete !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '32px 36px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxWidth: 380, width: '90%',
            border: `1.5px solid ${T.border}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h6 style={{ color: T.textDark, fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
              Delete Follow-Up Record?
            </h6>
            <p style={{ color: '#4a5568', fontSize: '0.875rem', marginBottom: 24 }}>
              Are you sure you want to delete entry <strong>#{confirmDelete + 1}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${T.border}`, background: T.bgLight,
                  color: T.textDark, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none',
                  background: '#e53e3e', color: '#fff',
                  fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(229,62,62,0.30)',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0, right: 0,
          background: '#FFFFFF',
          borderTop: '2px solid #1B4F8A',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(27,79,138,0.12)',
        }}
      >
        <Button
          customColor="#1B4F8A"
          color="#FFFFFF"
          onClick={handleNext}
          style={{
            borderRadius: '20px',
            fontWeight: 700,
            padding: '6px 24px',
            boxShadow: '0 2px 8px rgba(27,79,138,0.30)',
            border: '1.5px solid #1B4F8A',
          }}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default FollowUpnew