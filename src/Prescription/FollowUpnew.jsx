import React, { useState, useEffect } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'

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

const EMPTY_FORM = {
  nextVisitDate: '',
  reviewNotes: '',
  continueTreatment: '',
  modifications: '',
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
// ✅ FIX: Accept seed prop; seed = formData.followUp which is an array (set by handleNext below)
const FollowUpnew = ({ seed = [], onNext }) => {

  const [form, setForm] = useState({ ...EMPTY_FORM })
  // ✅ FIX: Initialize data from seed (seed is the saved array from formData.followUp)
  const [data, setData] = useState(Array.isArray(seed) ? seed : [])
  const [editIndex, setEditIndex] = useState(null)

  // ✅ FIX: Sync when seed changes (i.e. when user navigates back to this tab)
  useEffect(() => {
    if (Array.isArray(seed)) {
      setData(seed)
    }
  }, [seed])

  const set = field => val => setForm(prev => ({ ...prev, [field]: val }))

  /* ── Save / Update ── */
  const handleSave = () => {
    if (!form.nextVisitDate) return

    if (editIndex !== null) {
      const updated = [...data]
      updated[editIndex] = { ...form }
      setData(updated)
      setEditIndex(null)
    } else {
      setData(prev => [...prev, { ...form }])
    }

    setForm({ ...EMPTY_FORM })
  }

  const handleEdit = (index) => {
    setForm({ ...data[index] })
    setEditIndex(index)
  }

  const handleDelete = (index) => {
    setData(prev => prev.filter((_, i) => i !== index))
    if (editIndex === index) { setForm({ ...EMPTY_FORM }); setEditIndex(null) }
  }

  const handleCancel = () => { setForm({ ...EMPTY_FORM }); setEditIndex(null) }

  /* ── Next ── */
  const handleNext = () => {
    const payload = { followUp: data }
    console.log('🚀 FollowUp Payload:', payload)
    onNext?.(payload)
  }

  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

        {/* FORM CARD */}
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
              <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>
                {editIndex !== null ? `Editing Entry #${editIndex + 1}` : 'Follow Up'}
              </h5>
            </div>

            <div style={gridTwo}>
              <div>
                <label style={labelStyle}>Next Visit Date</label>
                <input
                  type="date"
                  value={form.nextVisitDate}
                  onChange={e => set('nextVisitDate')(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Continue Treatment</label>
                <select
                  value={form.continueTreatment}
                  onChange={e => set('continueTreatment')(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div style={gridTwo}>
              <div>
                <label style={labelStyle}>Review Notes</label>
                <textarea
                  value={form.reviewNotes}
                  onChange={e => set('reviewNotes')(e.target.value)}
                  style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Modifications</label>
                <textarea
                  value={form.modifications}
                  onChange={e => set('modifications')(e.target.value)}
                  style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
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

        {/* TABLE CARD */}
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
                      {['#', 'Next Visit Date', 'Review Notes', 'Continue Treatment', 'Modifications', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* ✅ FIX: was using undefined `idx`, now correctly uses `i` */}
                    {data.map((item, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{item.nextVisitDate || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{item.reviewNotes || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{item.continueTreatment || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>{item.modifications || '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleEdit(i)} style={{
                            marginRight: 6, padding: '4px 12px', borderRadius: 6,
                            border: '1.5px solid #1a5fa8', background: '#f0f7ff',
                            color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                          }}>✏️ Edit</button>
                          <button onClick={() => handleDelete(i)} style={{
                            padding: '4px 12px', borderRadius: 6,
                            border: '1.5px solid #e53e3e', background: '#fff5f5',
                            color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                          }}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </CCardBody>
          </CCard>
        )}

      </CContainer>

      {/* Bottom Button */}
      <div className="position-fixed bottom-0"
        style={{
          left: 0,
          right: 0,
          background: '#a5c4d4ff', // ✅ light background
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)', // ✅ soft shadow
        }}>
        <Button customColor="#ffffff" // ✅ white button bg
          color="#7e3a93"       // ✅ purple text
          onClick={handleNext}
          style={{
            borderRadius: '20px',
            fontWeight: 600,
            padding: '6px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}>
          Next
        </Button>
      </div>

    </div>
  )
}

export default FollowUpnew