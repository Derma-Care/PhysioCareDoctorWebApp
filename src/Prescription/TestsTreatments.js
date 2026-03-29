import React, { useState, useEffect } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { getTherapists, getTodayAppointments } from '../Auth/Auth'

/* ─── Default modality options ──────────────────────────────────────────── */
const DEFAULT_MODALITIES = [
  'IFT', 'Ultrasound Therapy', 'Hot Pack', 'Cold Pack',
  'TENS', 'Laser Therapy', 'Traction', 'Wax Bath',
]

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 7,
  fontSize: '0.875rem',
  color: '#1a3a5c',
  backgroundColor: '#f5f9ff',
  padding: '7px 11px',
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  outline: 'none',
  fontFamily: 'inherit',
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
  gap: '20px 32px',
  marginBottom: 20,
}

const cardStyle = {
  border: '1px solid #d8e8f5',
  borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

const cardHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16,
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder = '' }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
)

const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }} />
)

/* ─── Chip / pill modality picker ───────────────────────────────────────── */
const ModalityPicker = ({ selected, onChange }) => {
  const toggle = mod =>
    onChange(selected.includes(mod) ? selected.filter(m => m !== mod) : [...selected, mod])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {DEFAULT_MODALITIES.map(mod => {
        const active = selected.includes(mod)
        return (
          <button key={mod} type="button" onClick={() => toggle(mod)} style={{
            padding: '5px 16px', borderRadius: 20, border: '1.5px solid',
            borderColor: active ? '#1a5fa8' : '#b6cfe8',
            background: active ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#f5f9ff',
            color: active ? '#fff' : '#1a3a5c',
            fontWeight: active ? 700 : 500, fontSize: '0.82rem',
            cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
          }}>
            {mod}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Empty form state ───────────────────────────────────────────────────── */
const EMPTY_FORM = {
  doctorId: '',
  doctorName: '',
  therapistId: '',     // ✅ FIXED
  therapistName: '',   // ✅ FIXED
  modalities: [],
  manualTherapy: '',
  sessionDuration: '',
  frequency: '',
  totalSessions: '',
  precautions: '',
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   TabContent passes: seed={formData.treatmentPlans} (an array)
   ✅ So seed is the array directly — read as Array.isArray(seed)
   NOTE: TabContent must pass seed={formData.treatmentPlans || []}
         not seed={formData.treatments || {}}
══════════════════════════════════════════════════════════════════════════ */
const TestTreatments = ({ seed = [], onNext }) => {

  /* ── Form state ── */
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [editingIdx, setEditingIdx] = useState(null)
  const [therapists, setTherapists] = useState([])
  const [search,     setSearch]     = useState('')
  const [showDropdown,      setShowDropdown]      = useState(false)
  const [loadingTherapists, setLoadingTherapists] = useState(false)

  /* ── Table rows — ✅ seed is the array directly ── */
  const [entries, setEntries] = useState(Array.isArray(seed) ? seed : [])

  /* ── IDs ── */
  const [clinicId, setClinicId] = useState('')
  const [branchId, setBranchId] = useState('')

  /* ── On mount: fetch therapists ── */
  useEffect(() => {
    const resolveIdsAndFetchTherapists = async () => {
      const resolvedClinicId =
        localStorage.getItem('clinicId') ||
        localStorage.getItem('hospitalId') ||
        ''

      if (!resolvedClinicId) return

      setClinicId(resolvedClinicId)

      try {
        const appointmentRes = await getTodayAppointments()
        const appointments = appointmentRes?.data || []
        const resolvedBranchId = appointments[0]?.branchId || ''

        if (!resolvedBranchId) return

        setBranchId(resolvedBranchId)
        setLoadingTherapists(true)
        const therapistData = await getTherapists(resolvedClinicId, resolvedBranchId)
        setTherapists(Array.isArray(therapistData) ? therapistData : [])
      } catch (err) {
        console.error('❌ Error fetching therapists:', err)
        setTherapists([])
      } finally {
        setLoadingTherapists(false)
      }
    }

    resolveIdsAndFetchTherapists()
  }, [])

  /* ✅ FIX: Sync seed — seed is the array directly */
  useEffect(() => {
    if (Array.isArray(seed)) setEntries(seed)
  }, [seed])

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }))

  /* ── Filtered therapist list ── */
  const filteredTherapists = therapists.filter(t => {
    const q = search.toLowerCase()
    const selectedLabel = form.therapistId && form.therapistName
      ? `${form.therapistId} - ${form.therapistName}`.toLowerCase()
      : ''
    if (q === selectedLabel) return true
    return (
      (t.therapistId || '').toLowerCase().includes(q) ||
      (t.fullName    || '').toLowerCase().includes(q)
    )
  })

  /* ── Add / Update ── */
  const handleSave = () => {
    if (!form.therapistName && !form.modalities.length && !form.sessionDuration) return

    if (editingIdx !== null) {
      setEntries(prev => prev.map((e, i) => i === editingIdx ? { ...form } : e))
      setEditingIdx(null)
    } else {
      setEntries(prev => [...prev, { ...form }])
    }
    setForm(EMPTY_FORM)
    setSearch('')
  }

  /* ── Edit ── */
  const handleEdit = (idx) => {
    const entry = entries[idx]
    setForm({ ...entry })
    setEditingIdx(idx)
    if (entry.therapistId && entry.therapistName) {
      setSearch(`${entry.therapistId} - ${entry.therapistName}`)
    } else {
      setSearch('')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Delete ── */
  const handleDelete = (idx) => {
    setEntries(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) { setForm(EMPTY_FORM); setEditingIdx(null); setSearch('') }
  }

  /* ── Cancel ── */
  const handleCancel = () => { setForm(EMPTY_FORM); setEditingIdx(null); setSearch('') }

  /* ── Next — wraps array back into shape PatientAppointmentDetails expects ── */
  const handleNext = () => {
    const payload = { treatmentPlans: entries }
    console.log('🚀 TestTreatments payload:', payload)
    onNext?.(payload)
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

        {/* ══ FORM CARD ══════════════════════════════════════════════════ */}
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>

            <div style={cardHeaderStyle}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏥</div>
              <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>
                {editingIdx !== null ? `Editing Entry #${editingIdx + 1}` : 'Treatment Plan'}
              </h5>
            </div>

            {/* ── Assign Therapist Dropdown ── */}
            <div style={{ marginBottom: 20 }}>
              <Field label="Assign Therapist">
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        if (form.therapistId) setForm(f => ({ ...f, therapistId: '', therapistName: '' }))
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder={
                        loadingTherapists  ? 'Loading therapists...'
                        : !clinicId || !branchId ? 'Resolving IDs...'
                        : therapists.length === 0 ? 'No therapists available'
                        : 'Search by ID or name...'
                      }
                      disabled={loadingTherapists}
                      style={{
                        ...inputStyle,
                        paddingRight: form.therapistId ? 36 : 11,
                        opacity: loadingTherapists ? 0.6 : 1,
                        cursor: loadingTherapists ? 'not-allowed' : 'text',
                        borderColor: form.therapistId ? '#38a169' : '#b6cfe8',
                        backgroundColor: form.therapistId ? '#f0fff4' : '#f5f9ff',
                      }}
                    />
                    {form.therapistId && (
                      <button type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setForm(f => ({ ...f,  therapistId: t.therapistId,therapistName: t.fullName  }))
                          setSearch('')
                          setShowDropdown(true)
                        }}
                        style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: 700, fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
                        title="Clear therapist"
                      >✕</button>
                    )}
                  </div>

                  {form.therapistId && form.therapistName && (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', color: '#234e52', fontWeight: 600 }}>
                      ✅ {form.therapistId} — {form.therapistName}
                    </div>
                  )}

                  {showDropdown && !loadingTherapists && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #b6cfe8', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 16px rgba(26,90,168,0.12)', marginTop: 2 }}>
                      {filteredTherapists.length > 0 ? (
                        filteredTherapists.map((t, i) => {
                          const isSelected = form.therapistId === t.therapistId
                          return (
                            <div key={i}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setForm(f => ({ ...f, therapistId: t.therapistId, therapistName: t.fullName }))
                                setSearch(`${t.therapistId} - ${t.fullName}`)
                                setShowDropdown(false)
                              }}
                              style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', transition: 'background 0.15s', background: isSelected ? '#e0f2fe' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0f7ff' }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                            >
                              <span>
                                <strong style={{ color: '#1a5fa8' }}>{t.therapistId}</strong>
                                <span style={{ color: '#1a3a5c' }}> — {t.fullName}</span>
                              </span>
                              {isSelected && <span style={{ color: '#38a169', fontWeight: 700, fontSize: '0.8rem' }}>✓ Selected</span>}
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ padding: '10px 12px', color: '#888', fontSize: '0.85rem' }}>
                          {therapists.length === 0 ? 'No therapists found for this branch' : 'No match — try a different name'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* Modalities */}
            <div style={{ marginBottom: 20 }}>
              <Field label="Modalities">
                <ModalityPicker selected={form.modalities} onChange={set('modalities')} />
              </Field>
              {form.modalities.length > 0 && (
                <div style={{ marginTop: 10, padding: '7px 12px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #c8ddf0', fontSize: '0.82rem', color: '#1a3a5c' }}>
                  <strong>Selected ({form.modalities.length}):</strong>{' '}{form.modalities.join(' • ')}
                  <button type="button" onClick={() => set('modalities')([])}
                    style={{ marginLeft: 12, background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', padding: 0, fontFamily: 'inherit' }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Row 3 — Session Duration | Frequency */}
            <div style={gridTwo}>
              <Field label="Session Duration">
                <TextInput value={form.sessionDuration} onChange={set('sessionDuration')} placeholder="e.g. 30 minutes" />
              </Field>
              <Field label="Frequency">
                <TextInput value={form.frequency} onChange={set('frequency')} placeholder="e.g. 3 times/week" />
              </Field>
            </div>

            {/* Row 4 — Total Sessions | Manual Therapy */}
            <div style={gridTwo}>
              <Field label="Total Sessions">
                <TextInput value={form.totalSessions} onChange={set('totalSessions')} placeholder="e.g. 12" />
              </Field>
              <Field label="Manual Therapy">
                <TextInput value={form.manualTherapy} onChange={set('manualTherapy')} placeholder="e.g. Soft tissue mobilization" />
              </Field>
            </div>

            {/* Row 5 — Precautions */}
            <div style={{ marginBottom: 20 }}>
              <Field label="Precautions">
                <Textarea value={form.precautions} onChange={set('precautions')} placeholder="e.g. Avoid heavy lifting and sudden movements" rows={3} />
              </Field>
            </div>

            {/* Form action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={handleSave} style={{
                padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
              }}>
                {editingIdx !== null ? '✅ Update Entry' : '➕ Add to Table'}
              </button>
              {editingIdx !== null && (
                <button type="button" onClick={handleCancel} style={{
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

        {/* ══ TABLE CARD ═════════════════════════════════════════════════ */}
        {entries.length > 0 && (
          <CCard style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>

              <div style={cardHeaderStyle}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>
                  Treatment Plan Entries ({entries.length})
                </h5>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#1a3a5c' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Therapy ID', 'Therapy Name', 'Modalities', 'Manual Therapy', 'Duration', 'Frequency', 'Sessions', 'Precautions', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px' }}>{e.therapistId || '—'}</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{e.therapistName || '—'}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 180 }}>
                          {e.modalities?.length > 0
                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {e.modalities.map(m => (
                                  <span key={m} style={{ background: '#dbeafe', color: '#1a5fa8', borderRadius: 12, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{m}</span>
                                ))}
                              </div>
                            : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{e.manualTherapy || '—'}</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{e.sessionDuration || '—'}</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{e.frequency || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{e.totalSessions || '—'}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.precautions}>
                            {e.precautions || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleEdit(idx)} style={{ marginRight: 6, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #1a5fa8', background: '#f0f7ff', color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete(idx)} style={{ padding: '4px 12px', borderRadius: 6, border: '1.5px solid #e53e3e', background: '#fff5f5', color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            🗑️ Delete
                          </button>
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

      {/* ── Sticky bottom bar ── */}
      <div className="position-fixed bottom-0" style={{
        left: 0, right: 0,
        background: 'linear-gradient(90deg,#1a3a5c,#1a5fa8)',
        display: 'flex', justifyContent: 'flex-end',
        padding: '10px 24px',
        boxShadow: '0 -2px 16px rgba(26,90,168,0.18)',
        zIndex: 999,
      }}>
        <Button customColor={COLORS.bgcolor} color={COLORS.black} onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  )
}

export default TestTreatments