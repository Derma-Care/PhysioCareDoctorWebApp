import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { getTherapyExercises, getTodayAppointments } from '../Auth/Auth'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const MODALITY_OPTIONS = [
  'IFT', 'Ultrasound Therapy', 'Hot Pack', 'Cold Pack',
  'TENS', 'Laser Therapy', 'Traction', 'Wax Bath',
]

const DURATION_UNIT_OPTIONS = ['mins', 'hrs']

const OVERALL_STATUS_OPTIONS = ['Completed', 'In Progress', 'Pending', 'Cancelled']

const EMPTY_SESSION = {
  sessionDate: '',
  durationValue: '',
  durationUnit: 'mins',
  modalitiesUsed: [],
  exercisesDone: [],       // ← now an array for multi-select
  patientResponse: '',
  therapistNotes: '',
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8', borderRadius: 7, fontSize: '0.875rem',
  color: '#1a3a5c', backgroundColor: '#f5f9ff', padding: '7px 11px',
  width: '100%', boxSizing: 'border-box', height: 38,
  outline: 'none', fontFamily: 'inherit',
}

const labelStyle = {
  fontWeight: 700, fontSize: '0.875rem', color: '#1a3a5c',
  marginBottom: 6, display: 'block',
}

const gridTwo = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: '18px 32px', marginBottom: 18,
}

const cardStyle = {
  border: '1px solid #d8e8f5', borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

const cardHeader = (emoji, title) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{emoji}</div>
    <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>{title}</h5>
  </div>
)

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder = '', type = 'text' }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} style={inputStyle} />
)

const NativeSelect = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
    {options.map(o => (
      <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
        {typeof o === 'string' ? o : o.label}
      </option>
    ))}
  </select>
)

/* ─── Duration Field (number + unit combo) ───────────────────────────────── */
const DurationField = ({ durationValue, durationUnit, onValueChange, onUnitChange }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    <input
      type="number"
      min="0"
      value={durationValue}
      onChange={e => onValueChange(e.target.value)}
      placeholder="e.g. 30"
      style={{ ...inputStyle, flex: 2 }}
    />
    <select
      value={durationUnit}
      onChange={e => onUnitChange(e.target.value)}
      style={{ ...inputStyle, flex: 1, cursor: 'pointer', appearance: 'auto' }}
    >
      {DURATION_UNIT_OPTIONS.map(u => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  </div>
)

/* ─── Multi-Select with Search ──────────────────────────────────────────── */
const MultiSelectSearch = ({ selected = [], onChange, options = [], loading = false }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = val => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const removeTag = val => onChange(selected.filter(v => v !== val))

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input box showing tags + search */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle,
          height: 'auto',
          minHeight: 38,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
          cursor: 'text',
          padding: '4px 10px',
        }}
      >
        {selected.map(val => (
          <span key={val} style={{
            background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
            color: '#fff',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            {val}
            <span
              onClick={e => { e.stopPropagation(); removeTag(val) }}
              style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1 }}
            >×</span>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? (loading ? 'Loading...' : 'Search & select exercises...') : ''}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '0.875rem', color: '#1a3a5c', fontFamily: 'inherit',
            flex: 1, minWidth: 120, padding: '2px 0',
          }}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1000, top: '100%', left: 0, right: 0,
          background: '#fff', border: '1.5px solid #b6cfe8', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(26,90,168,0.13)',
          maxHeight: 200, overflowY: 'auto', marginTop: 4,
        }}>
          {loading ? (
            <div style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.85rem' }}>Loading exercises...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', color: '#6b7280', fontSize: '0.85rem' }}>No exercises found</div>
          ) : (
            filtered.map(o => {
              const isSelected = selected.includes(o.value)
              return (
                <div
                  key={o.value}
                  onMouseDown={e => { e.preventDefault(); toggle(o.value) }}
                  style={{
                    padding: '8px 14px', cursor: 'pointer', fontSize: '0.875rem',
                    color: isSelected ? '#1a5fa8' : '#1a3a5c',
                    background: isSelected ? '#f0f7ff' : 'transparent',
                    fontWeight: isSelected ? 700 : 400,
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f5f9ff' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: `2px solid ${isSelected ? '#1a5fa8' : '#b6cfe8'}`,
                    background: isSelected ? '#1a5fa8' : 'transparent',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: '0.7rem', lineHeight: 1 }}>✓</span>}
                  </span>
                  {o.label}
                </div>
              )
            })
          )}
          {selected.length > 0 && (
            <div
              onMouseDown={e => { e.preventDefault(); onChange([]); setSearch('') }}
              style={{
                padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem',
                color: '#e53e3e', fontWeight: 700, borderTop: '1px solid #f0f0f0',
              }}
            >
              ✕ Clear all selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Chip modality picker ───────────────────────────────────────────────── */
const ModalityPicker = ({ selected, onChange }) => {
  const toggle = mod =>
    onChange(selected.includes(mod) ? selected.filter(m => m !== mod) : [...selected, mod])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {MODALITY_OPTIONS.map(mod => {
        const active = selected.includes(mod)
        return (
          <button key={mod} type="button" onClick={() => toggle(mod)} style={{
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
            borderColor: active ? '#1a5fa8' : '#b6cfe8',
            background: active ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#f5f9ff',
            color: active ? '#fff' : '#1a3a5c',
            fontWeight: active ? 700 : 500, fontSize: '0.8rem',
            cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
          }}>{mod}</button>
        )
      })}
    </div>
  )
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const colors = {
    Completed:     { bg: '#d1fae5', color: '#065f46' },
    Pending:       { bg: '#fef3c7', color: '#92400e' },
    Cancelled:     { bg: '#fee2e2', color: '#991b1b' },
    'In Progress': { bg: '#dbeafe', color: '#1e40af' },
  }
  const c = colors[status] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ ...c, padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700 }}>
      {status}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const FollowUp = ({ seed = {}, onNext }) => {

  const [overallStatus, setOverallStatus] = useState(seed.overallStatus ?? 'Pending')
  const [sessions,      setSessions]      = useState(Array.isArray(seed.sessions) ? seed.sessions : [])
  const [form,          setForm]          = useState({ ...EMPTY_SESSION })
  const [editingIdx,    setEditingIdx]    = useState(null)

  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [loadingLibrary,  setLoadingLibrary]  = useState(false)

  useEffect(() => {
    setOverallStatus(seed.overallStatus ?? 'In Progress')
    setSessions(Array.isArray(seed.sessions) ? seed.sessions : [])
  }, [seed])

  /* ─── API CALL (Exercises) ───────────────── */
  useEffect(() => {
    const resolveIdsAndFetchExercises = async () => {
      const resolvedClinicId =
        localStorage.getItem('clinicId') ||
        localStorage.getItem('hospitalId') ||
        ''

      if (!resolvedClinicId) {
        console.warn('⚠️ clinicId not found')
        return
      }

      try {
        const appointmentRes = await getTodayAppointments()
        const appointments = appointmentRes?.data || []
        const resolvedBranchId = appointments[0]?.branchId || ''

        if (!resolvedBranchId) {
          console.warn('⚠️ branchId not found')
          return
        }

        setLoadingLibrary(true)
        const data = await getTherapyExercises(resolvedClinicId, resolvedBranchId)
        const list = Array.isArray(data) ? data : data?.data || []
        setExerciseLibrary(list)
      } catch (err) {
        console.error('❌ Error fetching exercises:', err)
        setExerciseLibrary([])
      } finally {
        setLoadingLibrary(false)
      }
    }

    resolveIdsAndFetchExercises()
  }, [])

  /* ─── Exercise options for MultiSelect ─── */
  const exerciseOptions = exerciseLibrary.map(item => ({
    label: item.exerciseName || item.name || item.exercise_name || 'Unknown',
    value: item.exerciseName || item.name || item.exercise_name || '',
  }))

  const set = field => val => setForm(f => ({ ...f, [field]: val }))

  /* ── Add / Update ── */
  const handleSave = () => {
    if (!form.sessionDate) return
    if (editingIdx !== null) {
      setSessions(prev => prev.map((s, i) => i === editingIdx ? { ...form } : s))
      setEditingIdx(null)
    } else {
      setSessions(prev => [...prev, { ...form }])
    }
    setForm({ ...EMPTY_SESSION })
  }

  const handleEdit = idx => {
    setForm({ ...sessions[idx] })
    setEditingIdx(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = idx => {
    setSessions(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) { setForm({ ...EMPTY_SESSION }); setEditingIdx(null) }
  }

  const handleCancel = () => { setForm({ ...EMPTY_SESSION }); setEditingIdx(null) }

  /* ── Next ── */
  const handleNext = () => {
    const payload = { therapySessions: { overallStatus, sessions } }
    console.log('🚀 FollowUp payload:', payload)
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
            {cardHeader('📋', editingIdx !== null ? `Editing Session #${editingIdx + 1}` : 'Add Therapy Session')}

            {/* Row 1 — Session Date | Duration */}
            <div style={gridTwo}>
              <Field label="Session Date">
                <TextInput type="date" value={form.sessionDate} onChange={set('sessionDate')} />
              </Field>
              <Field label="Duration">
                <DurationField
                  durationValue={form.durationValue}
                  durationUnit={form.durationUnit}
                  onValueChange={set('durationValue')}
                  onUnitChange={set('durationUnit')}
                />
              </Field>
            </div>

            {/* Modalities */}
            <div style={{ marginBottom: 18 }}>
              <Field label="Modalities Used">
                <ModalityPicker selected={form.modalitiesUsed} onChange={set('modalitiesUsed')} />
              </Field>
              {form.modalitiesUsed.length > 0 && (
                <div style={{ marginTop: 8, padding: '6px 12px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #c8ddf0', fontSize: '0.82rem', color: '#1a3a5c' }}>
                  <strong>Selected ({form.modalitiesUsed.length}):</strong>{' '}{form.modalitiesUsed.join(' • ')}
                  <button type="button" onClick={() => set('modalitiesUsed')([])}
                    style={{ marginLeft: 12, background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', padding: 0, fontFamily: 'inherit' }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Row 2 — Patient Response | Exercises Done */}
            <div style={gridTwo}>
              <Field label="Patient Response">
                <TextInput
                  value={form.patientResponse}
                  onChange={set('patientResponse')}
                  placeholder="Describe patient's response..."
                />
              </Field>
              <Field label="Exercises Done">
                <MultiSelectSearch
                  selected={form.exercisesDone}
                  onChange={set('exercisesDone')}
                  options={exerciseOptions}
                  loading={loadingLibrary}
                />
              </Field>
            </div>

            {/* Form action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={handleSave} style={{
                padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
              }}>
                {editingIdx !== null ? '✅ Update Session' : '➕ Add Session'}
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
        {sessions.length > 0 && (
          <CCard style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>
              {cardHeader('🗓️', `Therapy Sessions (${sessions.length})`)}

              

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#1a3a5c' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Session Date', 'Duration', 'Modalities Used', 'Exercises Done', 'Patient Response', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{s.sessionDate || '—'}</td>
                        {/* Duration column */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {s.durationValue ? `${s.durationValue} ${s.durationUnit}` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                          {s.modalitiesUsed?.length > 0
                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {s.modalitiesUsed.map(m => (
                                  <span key={m} style={{ background: '#dbeafe', color: '#1a5fa8', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>{m}</span>
                                ))}
                              </div>
                            : '—'}
                        </td>
                        {/* Exercises Done — multi values */}
                        <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                          {Array.isArray(s.exercisesDone) && s.exercisesDone.length > 0
                            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {s.exercisesDone.map(ex => (
                                  <span key={ex} style={{ background: '#d1fae5', color: '#065f46', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>{ex}</span>
                                ))}
                              </div>
                            : (typeof s.exercisesDone === 'string' && s.exercisesDone) ? s.exercisesDone : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.patientResponse}>
                            {s.patientResponse || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleEdit(idx)} style={{
                            marginRight: 6, padding: '4px 12px', borderRadius: 6,
                            border: '1.5px solid #1a5fa8', background: '#f0f7ff',
                            color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                          }}>✏️ Edit</button>
                          <button onClick={() => handleDelete(idx)} style={{
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

      {/* ── Sticky bottom bar ── */}
      <div className="position-fixed bottom-0"
        style={{
          left: 0, right: 0,
          background: '#a5c4d4ff',
          display: 'flex', justifyContent: 'flex-end',
          gap: 16, padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        }}>
        <Button
          customColor="#ffffff"
          color="#7e3a93"
          onClick={handleNext}
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default FollowUp