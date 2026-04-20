import React, { useState, useEffect } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'

/* ─── Styles ───────────────────────────────────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 7,
  fontSize: '0.875rem',
  color: '#1a3a5c',
  backgroundColor: '#f5f9ff',
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
  color: '#1a3a5c',
  marginBottom: 6,
  display: 'block',
}

const cardStyle = {
  border: '1px solid #d8e8f5',
  borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

/* ─── Visit urgency ──────────────────────────────────────────────────── */
const getVisitUrgency = (dateStr) => {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const visit = new Date(dateStr); visit.setHours(0, 0, 0, 0)
  const diffDays = Math.round((visit - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0)   return { label: 'Overdue',   bg: '#fff5f5', color: '#c53030', border: '#fc8181', icon: '⚠️' }
  if (diffDays === 0) return { label: 'Today',     bg: '#f0fff4', color: '#276749', border: '#68d391', icon: '📍' }
  if (diffDays <= 3)  return { label: 'Very Soon', bg: '#fffbeb', color: '#7b341e', border: '#f6ad55', icon: '🔔' }
  if (diffDays <= 7)  return { label: 'This Week', bg: '#ebf8ff', color: '#2a4365', border: '#63b3ed', icon: '📅' }
  return               { label: 'Upcoming',  bg: '#f5f0ff', color: '#44337a', border: '#b794f4', icon: '🗓️' }
}

const EMPTY_FORM = {
  nextVisitDate: '',
  reviewNotes:   '',
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════ */
const FollowUpnew = ({ seed = [], onNext }) => {

  const [form,      setForm]      = useState({ ...EMPTY_FORM })
  const [data,      setData]      = useState(Array.isArray(seed) ? seed : [])
  const [editIndex, setEditIndex] = useState(null)
  const [dupError,  setDupError]  = useState(false)

  useEffect(() => {
    if (Array.isArray(seed)) setData(seed)
  }, [seed])

  const set = field => val => {
    setDupError(false)
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const urgency = getVisitUrgency(form.nextVisitDate)

  const isDuplicate = (entry, excludeIdx = null) =>
    data.some((e, i) => {
      if (i === excludeIdx) return false
      return (
        (e.nextVisitDate || '') === (entry.nextVisitDate || '') &&
        (e.reviewNotes   || '').trim().toLowerCase() === (entry.reviewNotes || '').trim().toLowerCase()
      )
    })

  const handleSave = () => {
    if (!form.nextVisitDate) return
    if (isDuplicate(form, editIndex ?? null)) { setDupError(true); return }

    if (editIndex !== null) {
      setData(prev => prev.map((e, i) => i === editIndex ? { ...form } : e))
      setEditIndex(null)
    } else {
      setData(prev => [...prev, { ...form }])
    }
    setForm({ ...EMPTY_FORM })
    setDupError(false)
  }

  const handleEdit = (index) => {
    setForm({ ...data[index] })
    setEditIndex(index)
    setDupError(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (index) => {
    setData(prev => prev.filter((_, i) => i !== index))
    if (editIndex === index) {
      setForm({ ...EMPTY_FORM })
      setEditIndex(null)
      setDupError(false)
    }
  }

  const handleCancel = () => {
    setForm({ ...EMPTY_FORM })
    setEditIndex(null)
    setDupError(false)
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
              <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>
                {editIndex !== null ? `Editing Entry #${editIndex + 1}` : 'Follow Up'}
              </h5>
            </div>

            {/* Duplicate error */}
            {dupError && (
              <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fff5f5', border: '1.5px solid #fc8181', color: '#c53030', fontWeight: 600, fontSize: '0.875rem' }}>
                ⚠️ Duplicate entry detected. This follow-up record already exists.
              </div>
            )}

            {/* Next Visit Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Next Visit Date</label>
              <input
                type="date"
                value={form.nextVisitDate}
                onChange={e => set('nextVisitDate')(e.target.value)}
                style={inputStyle}
              />
              {urgency && (
                <div style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 5, background: urgency.bg, border: `1px solid ${urgency.border}`, borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', color: urgency.color, fontWeight: 700 }}>
                  {urgency.icon} {urgency.label}
                </div>
              )}
            </div>

            {/* Review Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Review Notes</label>
              <textarea
                value={form.reviewNotes}
                onChange={e => set('reviewNotes')(e.target.value)}
                placeholder="e.g. Patient showing improvement in mobility"
                style={{ ...inputStyle, height: 90, resize: 'vertical' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSave} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {editIndex !== null ? '✅ Update' : '➕ Add'}
              </button>
              {editIndex !== null && (
                <button onClick={handleCancel} style={{ padding: '8px 24px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid #b6cfe8', background: '#f5f9ff', color: '#1a3a5c', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              )}
            </div>

          </CCardBody>
        </CCard>

        {/* ══ TABLE CARD ══════════════════════════════════════════════ */}
        {data.length > 0 && (
          <CCard style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>Follow Up List ({data.length})</h5>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#1a3a5c' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Next Visit Date', 'Urgency', 'Review Notes', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => {
                      const u = getVisitUrgency(item.nextVisitDate)
                      return (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
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
                            <button onClick={() => handleEdit(i)} style={{ marginRight: 6, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #1a5fa8', background: '#f0f7ff', color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
                            <button onClick={() => handleDelete(i)} style={{ padding: '4px 12px', borderRadius: 6, border: '1.5px solid #e53e3e', background: '#fff5f5', color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Delete</button>
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

      {/* Fixed Bottom Bar */}
      <div className="position-fixed bottom-0" style={{ left: 0, right: 0, background: '#a5c4d4ff', display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '10px 24px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}>
        <Button customColor="#ffffff" color="#7e3a93" onClick={handleNext} style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          Next
        </Button>
      </div>
    </div>
  )
}

export default FollowUpnew