import React, { useState, useEffect } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import { getTodayAppointments } from '../Auth/Auth' // ← your existing API function

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

const gridTwo = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px 28px',
  marginBottom: 16,
}

const cardStyle = {
  border: '1px solid #d8e8f5',
  borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

/* ─── Treatment Status options ─────────────────────────────────────────── */
const STATUS_OPTIONS = ['Active', 'On Hold', 'Completed', 'Discharged']

const STATUS_STYLE = {
  Active:     { bg: '#f0fff4', border: '#68d391', color: '#276749', icon: '🟢' },
  'On Hold':  { bg: '#fffbeb', border: '#f6ad55', color: '#7b341e', icon: '🟡' },
  Completed:  { bg: '#ebf8ff', border: '#63b3ed', color: '#2a4365', icon: '🔵' },
  Discharged: { bg: '#fff5f5', border: '#fc8181', color: '#742a2a', icon: '🔴' },
}

/* ─── Visit urgency derived from date ──────────────────────────────────── */
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

/* ─── Empty form ────────────────────────────────────────────────────────── */
const EMPTY_FORM = {
  nextVisitDate:   '',
  treatmentStatus: '',
  reviewNotes:     '',
  modifications:   '',
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   Props:
     seed      – array of existing follow-up records
     bookingId – booking ID to match against API response
     onNext    – callback with { followUp: data }
══════════════════════════════════════════════════════════════════════════ */
const FollowUpnew = ({ seed = [], bookingId = '', onNext }) => {

  const [form,          setForm]          = useState({ ...EMPTY_FORM })
  const [data,          setData]          = useState(Array.isArray(seed) ? seed : [])
  const [editIndex,     setEditIndex]     = useState(null)
  const [dupError,      setDupError]      = useState(false)
  const [bookingStatus, setBookingStatus] = useState('')   // ← from API
  const [apiLoading,    setApiLoading]    = useState(false)

  /* ══ Fetch booking status from API ══════════════════════════════════════ */
  useEffect(() => {
    const fetchStatus = async () => {
      setApiLoading(true)
      try {
        const result = await getTodayAppointments()

        if (result.statusCode === 200 && Array.isArray(result.data)) {
          // Find the booking that matches the passed bookingId
          const matched = result.data.find(b => b.bookingId === bookingId)

          if (matched?.status) {
            setBookingStatus(matched.status)  // e.g. "Confirmed"
            console.log('✅ Booking status fetched:', matched.status)
          } else {
            console.warn('⚠️ No matching booking found for bookingId:', bookingId)
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch booking status:', error)
      } finally {
        setApiLoading(false)
      }
    }

    if (bookingId) {
      fetchStatus()
    }
  }, [bookingId])

  /* ── TRUE when booking status is "Confirmed" ── */
  const isConfirmed = bookingStatus?.trim() === 'Confirmed'

  /* ── TRUE only when Active AND not Confirmed — gates Modifications UI ── */
  const isActive = form.treatmentStatus === 'Active' && !isConfirmed

  useEffect(() => {
    if (Array.isArray(seed)) setData(seed)
  }, [seed])

  const set = field => val => {
    setDupError(false)
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const urgency     = getVisitUrgency(form.nextVisitDate)
  const statusStyle = STATUS_STYLE[form.treatmentStatus] || null

  /* ── Duplicate check ── */
  const isDuplicate = (entry, excludeIdx = null) =>
    data.some((e, i) => {
      if (i === excludeIdx) return false
      return (
        (e.nextVisitDate   || '') === (entry.nextVisitDate   || '') &&
        (e.treatmentStatus || '').toLowerCase() === (entry.treatmentStatus || '').toLowerCase() &&
        (e.reviewNotes     || '').trim().toLowerCase() === (entry.reviewNotes     || '').trim().toLowerCase() &&
        (e.modifications   || '').trim().toLowerCase() === (entry.modifications   || '').trim().toLowerCase()
      )
    })

  /* ── Save / Update ── */
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
    if (editIndex === index) { setForm({ ...EMPTY_FORM }); setEditIndex(null); setDupError(false) }
  }

  const handleCancel = () => { setForm({ ...EMPTY_FORM }); setEditIndex(null); setDupError(false) }

  const handleNext = () => {
    const payload = { followUp: data }
    console.log('🚀 FollowUp Payload:', payload)
    onNext?.(payload)
  }

  /* ── Table headers: hide "Modifications" column when Confirmed ── */
  const tableHeaders = [
    '#',
    'Next Visit Date',
    'Urgency',
    'Treatment Status',
    'Review Notes',
    ...(!isConfirmed ? ['Modifications'] : []),
    'Actions',
  ]

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

        {/* ══ API Loading indicator ════════════════════════════════════ */}
        {apiLoading && (
          <div style={{ marginBottom: 12, padding: '8px 16px', borderRadius: 8, background: '#ebf8ff', border: '1px solid #63b3ed', color: '#2a4365', fontSize: '0.82rem', fontWeight: 600 }}>
            ⏳ Loading booking details...
          </div>
        )}

        {/* ══ FORM CARD ═════════════════════════════════════════════════ */}
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
              <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>
                {editIndex !== null ? `Editing Entry #${editIndex + 1}` : 'Follow Up'}
              </h5>

              {/* ── Show lock badge ONLY when Confirmed ── */}
              {isConfirmed && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700,
                  background: '#ebf8ff', border: '1px solid #63b3ed', color: '#2a4365',
                  borderRadius: 20, padding: '3px 12px',
                }}>
                  🔒 Confirmed — Modifications hidden
                </span>
              )}
            </div>

            {/* Duplicate error banner */}
            {dupError && (
              <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fff5f5', border: '1.5px solid #fc8181', color: '#c53030', fontWeight: 600, fontSize: '0.875rem' }}>
                ⚠️ Duplicate entry detected. This follow-up record already exists.
              </div>
            )}

            {/* Row 1 — Next Visit Date + Treatment Status */}
            <div style={gridTwo}>

              {/* Next Visit Date */}
              <div>
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

              {/* Treatment Status */}
              <div>
                <label style={labelStyle}>Treatment Status</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                  {STATUS_OPTIONS.map(s => {
                    const active = form.treatmentStatus === s
                    const st = STATUS_STYLE[s]
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('treatmentStatus')(s)}
                        style={{
                          padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
                          borderColor: active ? st.border : '#b6cfe8',
                          background:  active ? st.bg    : '#f5f9ff',
                          color:       active ? st.color : '#64748b',
                          fontWeight:  active ? 700      : 500,
                          fontSize: '0.8rem', cursor: 'pointer',
                          transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                      >
                        {st.icon} {s}
                      </button>
                    )
                  })}
                </div>

                {/* Status badge */}
                {statusStyle && (
                  <div style={{ marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 5, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, borderRadius: 8, padding: '4px 12px', fontSize: '0.78rem', color: statusStyle.color, fontWeight: 700 }}>
                    {statusStyle.icon} Status: <strong>{form.treatmentStatus}</strong>
                    {isActive && (
                      <span style={{ marginLeft: 4, opacity: 0.8 }}>— Modifications enabled</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2 — Review Notes + Modifications */}
            <div style={{ ...gridTwo, gridTemplateColumns: isActive ? '1fr 1fr' : '1fr' }}>

              <div>
                <label style={labelStyle}>Review Notes</label>
                <textarea
                  value={form.reviewNotes}
                  onChange={e => set('reviewNotes')(e.target.value)}
                  placeholder="e.g. Patient showing improvement in mobility"
                  style={{ ...inputStyle, height: 90, resize: 'vertical' }}
                />
              </div>

              {/* Modifications: hidden when Confirmed OR not Active */}
              {isActive && (
                <div style={{ animation: 'fadeIn 0.2s ease' }}>
                  <label style={labelStyle}>
                    Modifications
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 500, color: '#276749', background: '#f0fff4', border: '1px solid #68d391', borderRadius: 10, padding: '1px 8px' }}>
                      Active only
                    </span>
                  </label>
                  <textarea
                    value={form.modifications}
                    onChange={e => set('modifications')(e.target.value)}
                    placeholder="e.g. Increase resistance, add balance exercises"
                    style={{ ...inputStyle, height: 90, resize: 'vertical' }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={handleSave} style={{
                padding: '8px 24px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {editIndex !== null ? '✅ Update' : '➕ Add'}
              </button>
              {editIndex !== null && (
                <button onClick={handleCancel} style={{
                  padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                  border: '1.5px solid #b6cfe8', background: '#f5f9ff',
                  color: '#1a3a5c', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                }}>
                  Cancel
                </button>
              )}
            </div>

          </CCardBody>
        </CCard>

        {/* ══ TABLE CARD ════════════════════════════════════════════════ */}
        {data.length > 0 && (
          <CCard style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>
                  Follow Up List ({data.length})
                </h5>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#1a3a5c' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {tableHeaders.map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => {
                      const u  = getVisitUrgency(item.nextVisitDate)
                      const st = STATUS_STYLE[item.treatmentStatus]
                      return (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{item.nextVisitDate || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {u
                              ? <span style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}`, borderRadius: 12, padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{u.icon} {u.label}</span>
                              : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {st
                              ? <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 12, padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{st.icon} {item.treatmentStatus}</span>
                              : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reviewNotes}>
                              {item.reviewNotes || '—'}
                            </div>
                          </td>

                          {/* Modifications column: hidden when Confirmed */}
                          {!isConfirmed && (
                            <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                              {item.treatmentStatus === 'Active'
                                ? <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.modifications}>{item.modifications || '—'}</div>
                                : <span style={{ color: '#a0aec0', fontSize: '0.78rem', fontStyle: 'italic' }}>N/A</span>
                              }
                            </td>
                          )}

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

      {/* ── Fixed Bottom Bar ── */}
      <div
        className="position-fixed bottom-0"
        style={{ left: 0, right: 0, background: '#a5c4d4ff', display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '10px 24px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}
      >
        <Button
          customColor="#ffffff"
          color="#7e3a93"
          onClick={handleNext}
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        >
          Next
        </Button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

export default FollowUpnew