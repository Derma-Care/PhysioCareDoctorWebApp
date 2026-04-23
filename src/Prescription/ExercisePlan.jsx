import React, { useState, useEffect } from 'react'
import Button from '../components/CustomButton/CustomButton'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import { getTherapyExercises, getTodayAppointments } from '../Auth/Auth'

/* ─── Empty exercise entry ───────────────────────────────────────────────── */
const EMPTY_EXERCISE = {
  name: '', sets: '', reps: '', frequencyValue: '', frequencyUnit: 'day',
  instructions: '', videoUrl: '', thumbnail: '',
}

/* ─── Frequency unit options ─────────────────────────────────────────────── */
const FREQ_UNITS = [
  { label: 'per day',   value: 'day' },
  { label: 'per week',  value: 'week' },
  { label: 'per month', value: 'month' },
]

/* ─── Validation helpers ─────────────────────────────────────────────────── */
// Only allow letters, numbers, spaces, hyphens, apostrophes, parentheses
const VALID_NAME_REGEX = /^[a-zA-Z0-9\s\-'().]+$/

const sanitizeName = (val) => {
  // Strip any character that's not alphanumeric, space, hyphen, apostrophe, parens, period
  return val.replace(/[^a-zA-Z0-9\s\-'().]/g, '')
}

const isValidUrl = (val) => {
  if (!val) return true // optional field
  try { new URL(val); return true } catch { return false }
}

const validateForm = (form) => {
  const errors = {}
  const nameTrimmed = form.name.trim()

  if (!nameTrimmed) {
    errors.name = 'Exercise name is required'
  } else if (!VALID_NAME_REGEX.test(nameTrimmed)) {
    errors.name = 'Name contains invalid characters'
  }

  if (form.sets !== '' && form.sets !== null) {
    const n = Number(form.sets)
    if (isNaN(n) || n < 1 || n > 50 || !Number.isInteger(n)) {
      errors.sets = 'Sets must be a whole number between 1–50'
    }
  }

  if (form.reps !== '' && form.reps !== null) {
    const n = Number(form.reps)
    if (isNaN(n) || n < 1 || n > 200 || !Number.isInteger(n)) {
      errors.reps = 'Reps must be a whole number between 1–200'
    }
  }

  if (form.frequencyValue !== '' && form.frequencyValue !== null) {
    const n = Number(form.frequencyValue)
    if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
      errors.frequencyValue = 'Frequency must be a positive whole number'
    }
  }

  return errors
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 7,
  fontSize: '0.875rem',
  color: '#1a3a5c',
  backgroundColor: '#FFFFFF',
  padding: '7px 11px',
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.18s ease',
}

const labelStyle = {
  fontWeight: 700,
  fontSize: '0.82rem',
  color: '#1B4F8A',
  marginBottom: 4,
  display: 'block',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const gridFour = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  gap: '16px 20px',
  marginBottom: 16,
}

const cardStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 12,
  backgroundColor: '#FFFFFF',
  boxShadow: '0 4px 24px rgba(27,79,138,0.10)',
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const Field = ({ label, children, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={labelStyle}>{label}</label>}
    {children}
    {error && (
      <span style={{ marginTop: 2, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
        ⚠ {error}
      </span>
    )}
  </div>
)

const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
  />
)

const CardHeader = ({ emoji, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 20,
    borderBottom: '2px solid #dceeff',
    paddingBottom: 12,
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 17,
      boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
    }}>{emoji}</div>
    <h5 style={{ margin: 0, color: '#1B4F8A', fontWeight: 700, fontSize: '1.05rem' }}>{title}</h5>
  </div>
)

/* ─── Number Input with native spinner arrows (no negatives) ────────────── */
const StepperInput = ({ value, onChange, min = 1, max, placeholder, hasError }) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    placeholder={placeholder}
    onChange={e => {
      const raw = e.target.value
      if (raw === '') { onChange(''); return }
      const n = parseInt(raw)
      if (!isNaN(n) && n >= min && (!max || n <= max)) onChange(String(n))
    }}
    style={{
      ...inputStyle,
      borderColor: hasError ? '#e53e3e' : '#b6cfe8',
      backgroundColor: hasError ? '#fff5f5' : '#FFFFFF',
      MozAppearance: 'auto',
      WebkitAppearance: 'auto',
      appearance: 'auto',
    }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = hasError ? '#e53e3e' : '#b6cfe8')}
  />
)

/* ─── Frequency: value + unit combined ──────────────────────────────────── */
const FrequencyInput = ({ value, unit, onValueChange, onUnitChange, hasError }) => (
  <div style={{ display: 'flex', height: 38, gap: 0 }}>
    <input
      type="number"
      value={value}
      min={1}
      placeholder="e.g. 2"
      onChange={e => {
        const raw = e.target.value
        if (raw === '' || (parseInt(raw) >= 1)) onValueChange(raw)
      }}
      style={{
        ...inputStyle,
        width: 70,
        borderRadius: '7px 0 0 7px',
        borderRight: 'none',
        textAlign: 'center',
        MozAppearance: 'textfield',
        borderColor: hasError ? '#e53e3e' : '#b6cfe8',
        backgroundColor: hasError ? '#fff5f5' : '#FFFFFF',
      }}
      onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
      onBlur={e  => (e.target.style.borderColor = hasError ? '#e53e3e' : '#b6cfe8')}
    />
    <select
      value={unit}
      onChange={e => onUnitChange(e.target.value)}
      style={{
        ...inputStyle,
        width: 'auto',
        flex: 1,
        borderRadius: '0 7px 7px 0',
        cursor: 'pointer',
        appearance: 'auto',
        backgroundColor: '#f0f6ff',
      }}
      onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
      onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
    >
      {FREQ_UNITS.map(u => (
        <option key={u.value} value={u.value}>{u.label}</option>
      ))}
    </select>
  </div>
)

/* ─── Delete Confirmation Modal ──────────────────────────────────────────── */
const DeleteModal = ({ exerciseName, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10, 30, 60, 0.45)',
    backdropFilter: 'blur(3px)',
    animation: 'fadeIn 0.15s ease',
  }}>
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      boxShadow: '0 8px 40px rgba(27,79,138,0.22)',
      padding: '32px 36px',
      maxWidth: 420,
      width: '90%',
      border: '1.5px solid #b6cfe8',
      animation: 'slideUp 0.18s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fff0f0, #ffe0e0)',
        border: '2px solid #e53e3e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, margin: '0 auto 18px',
      }}>🗑️</div>

      {/* Title */}
      <h4 style={{
        textAlign: 'center', margin: '0 0 10px',
        color: '#1a3a5c', fontWeight: 800, fontSize: '1.1rem',
      }}>
        Delete Exercise?
      </h4>

      {/* Message */}
      <p style={{
        textAlign: 'center', margin: '0 0 26px',
        color: '#4a6580', fontSize: '0.9rem', lineHeight: 1.6,
      }}>
        Are you sure you want to remove{' '}
        <strong style={{ color: '#1B4F8A' }}>"{exerciseName}"</strong>?
        <br />
        <span style={{ fontSize: '0.8rem', color: '#888' }}>This action cannot be undone.</span>
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 9,
            border: '1.5px solid #b6cfe8', background: '#FFFFFF',
            color: '#1B4F8A', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f6ff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 9,
            border: 'none',
            background: 'linear-gradient(135deg, #c0392b, #e53e3e)',
            color: '#FFFFFF', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 10px rgba(229,62,62,0.30)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          🗑️ Yes, Delete
        </button>
      </div>
    </div>

    <style>{`
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    `}</style>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const HomePlan = ({ seed = {}, onNext, sidebarWidth = 0 }) => {

  /* Normalise seed exercises — legacy `frequency` string → split into value+unit */
  const normaliseSeedExercises = (arr) => {
    if (!Array.isArray(arr)) return []
    return arr.map(ex => {
      if (ex.frequencyValue !== undefined) return ex
      const match = String(ex.frequency || '').match(/^(\d+)\s*(day|week|month)?/i)
      return {
        ...ex,
        frequencyValue: match ? match[1] : '',
        frequencyUnit: match?.[2]?.toLowerCase() || 'day',
        frequency: undefined,
      }
    })
  }

  const [exercises, setExercises] = useState(normaliseSeedExercises(seed.exercises))
  const [homeAdvice, setHomeAdvice] = useState(seed.homeAdvice ?? '')
  const [form, setForm] = useState({ ...EMPTY_EXERCISE })
  const [editingIdx, setEditingIdx] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [loadingLibrary, setLoadingLibrary]   = useState(false)
  const [search, setSearch]                   = useState('')
  const [showDropdown, setShowDropdown]       = useState(false)

  const [bulkSelected, setBulkSelected] = useState(new Set())
  const [showBulkPanel, setShowBulkPanel] = useState(false)

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, idx: null, name: '' })

  useEffect(() => {
    const load = async () => {
      const clinicId = localStorage.getItem('clinicId') || localStorage.getItem('hospitalId') || ''
      if (!clinicId) return
      try {
        const res = await getTodayAppointments()
        const branchId = res?.data?.[0]?.branchId || ''
        if (!branchId) return
        setLoadingLibrary(true)
        const data = await getTherapyExercises(clinicId, branchId)
        setExerciseLibrary(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('❌ Error fetching exercises:', err)
      } finally {
        setLoadingLibrary(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    setExercises(normaliseSeedExercises(seed.exercises))
    setHomeAdvice(seed.homeAdvice ?? '')
  }, [seed])

  const set = field => val => {
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setForm(f => ({ ...f, [field]: val }))
  }

  const addedNames = new Set(
    exercises.filter((_, i) => i !== editingIdx).map(e => e.name?.trim().toLowerCase())
  )

  const filteredLibrary = exerciseLibrary.filter(ex => {
    const n = (ex.name || '').trim().toLowerCase()
    return n.includes(search.toLowerCase()) && !addedNames.has(n)
  })

  /* ── Single-exercise save ── */
  const handleSave = () => {
    const errors = validateForm(form)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    const frequencyStr = form.frequencyValue
      ? `${form.frequencyValue} ${form.frequencyUnit}${Number(form.frequencyValue) > 1 ? 's' : ''}`
      : ''

    const entry = { ...form, frequency: frequencyStr }

    if (editingIdx !== null) {
      setExercises(prev => prev.map((e, i) => i === editingIdx ? entry : e))
      setEditingIdx(null)
    } else {
      setExercises(prev => [...prev, entry])
    }
    setForm({ ...EMPTY_EXERCISE })
    setSearch('')
    setFieldErrors({})
  }

  /* ── Bulk add ── */
  const handleBulkAdd = () => {
    const toAdd = exerciseLibrary
      .filter(ex => bulkSelected.has(ex.name))
      .filter(ex => !addedNames.has((ex.name || '').trim().toLowerCase()))
      .map(ex => {
        const fv = ex.frequency ? String(ex.frequency).match(/^(\d+)/)?.[1] || '' : ''
        const fu = ex.frequency ? (String(ex.frequency).match(/day|week|month/i)?.[0]?.toLowerCase() || 'day') : 'day'
        const freqStr = fv ? `${fv} ${fu}${Number(fv) > 1 ? 's' : ''}` : ''
        return {
          therapyExercisesId: ex.therapyExercisesId,
          name: ex.name || '',
          sets: ex.sets !== null && ex.sets !== undefined ? String(ex.sets) : '',
          reps: ex.repetitions !== null && ex.repetitions !== undefined ? String(ex.repetitions) : '',
          frequencyValue: fv,
          frequencyUnit: fu,
          frequency: freqStr,
          instructions: ex.notes || '',
          videoUrl: ex.video || '',
          thumbnail: ex.image || '',
        }
      })
    setExercises(prev => [...prev, ...toAdd])
    setBulkSelected(new Set())
    setShowBulkPanel(false)
    setSearch('')
  }

  const toggleBulk = (name) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (bulkSelected.size === bulkLibrary.length) {
      setBulkSelected(new Set())
    } else {
      setBulkSelected(new Set(bulkLibrary.map(ex => ex.name)))
    }
  }

  const handleEdit = idx => {
    const ex = exercises[idx]
    setForm({ ...ex })
    setEditingIdx(idx)
    setSearch(ex.name || '')
    setFieldErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Delete: open modal ── */
  const handleDeleteClick = (idx) => {
    setDeleteModal({ open: true, idx, name: exercises[idx]?.name || `Exercise ${idx + 1}` })
  }

  /* ── Delete: confirmed ── */
  const handleDeleteConfirm = () => {
    const idx = deleteModal.idx
    setExercises(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) {
      setForm({ ...EMPTY_EXERCISE })
      setEditingIdx(null)
      setSearch('')
      setIsManualEntry(false)
    }
    setDeleteModal({ open: false, idx: null, name: '' })
  }

  const handleCancel = () => {
    setForm({ ...EMPTY_EXERCISE })
    setEditingIdx(null)
    setSearch('')
    setFieldErrors({})
  }

  const handleNext = () => {
    const payload = {
      exercisePlan: {
        exercises: exercises.map(ex => ({
          ...ex,
          frequency: ex.frequencyValue
            ? `${ex.frequencyValue} ${ex.frequencyUnit}${Number(ex.frequencyValue) > 1 ? 's' : ''}`
            : ex.frequency || '',
        })),
        homeAdvice,
      },
    }
    console.log('handleNext payload:', payload)
    onNext?.(payload)
  }

  const bulkLibrary = exerciseLibrary.filter(ex => {
    const n = (ex.name || '').trim().toLowerCase()
    const alreadyAdded = exercises.some(e => e.name?.trim().toLowerCase() === n)
    return n.includes(search.toLowerCase()) && !alreadyAdded
  })

  /* ── Render ── */
  return (
    <div
      className="pb-5"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", backgroundColor: '#FFFFFF', minHeight: '100vh' }}
    >
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <DeleteModal
          exerciseName={deleteModal.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal({ open: false, idx: null, name: '' })}
        />
      )}

      <CContainer fluid className="p-1">

        {/* ══ FORM CARD ══════════════════════════════════════════════════ */}
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>

            {/* Card header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, borderBottom: '2px solid #dceeff', paddingBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
                }}>🏋️</div>
                <h5 style={{ margin: 0, color: '#1B4F8A', fontWeight: 700, fontSize: '1.05rem' }}>
                  {editingIdx !== null ? `Editing Exercise #${editingIdx + 1}` : 'Add Exercise'}
                </h5>
              </div>

              {exerciseLibrary.length > 0 && editingIdx === null && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowBulkPanel(v => !v); setSearch(''); setBulkSelected(new Set()) }}
                    style={{
                      padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                      border: '1.5px solid #1B4F8A',
                      background: showBulkPanel ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#FFFFFF',
                      color: showBulkPanel ? '#fff' : '#1B4F8A',
                      fontWeight: 700, fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: showBulkPanel ? '0 2px 8px rgba(27,79,138,0.25)' : 'none',
                    }}
                  >
                    📚 {showBulkPanel ? '✕ Close' : 'Browse Exercises'}
                  </button>
                </div>
              )}
            </div>

            {/* ══ BULK LIBRARY PANEL ══════════════════════════════════════ */}
            {showBulkPanel && (
              <div style={{ marginBottom: 24, border: '1.5px solid #b6cfe8', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0f6ff', borderBottom: '1px solid #b6cfe8', flexWrap: 'wrap' }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search exercises..."
                    style={{ ...inputStyle, width: 220, height: 34 }}
                    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
                    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
                  />
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #1B4F8A', background: '#FFFFFF', color: '#1B4F8A', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {bulkSelected.size === bulkLibrary.length && bulkLibrary.length > 0 ? '☑ Deselect All' : '☐ Select All'}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#1B4F8A', fontWeight: 600 }}>
                    {bulkSelected.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={bulkSelected.size === 0}
                    style={{
                      marginLeft: 'auto', padding: '6px 20px', borderRadius: 8, border: 'none',
                      background: bulkSelected.size > 0 ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#b6cfe8',
                      color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                      cursor: bulkSelected.size > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                    }}
                  >
                    ➕ Add {bulkSelected.size > 0 ? `${bulkSelected.size} ` : ''}Exercise{bulkSelected.size !== 1 ? 's' : ''}
                  </button>
                </div>

                {loadingLibrary ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#4a7abf', fontSize: '0.875rem' }}>Loading exercises…</div>
                ) : bulkLibrary.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#8aaac8', fontSize: '0.875rem' }}>No exercises found.</div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {bulkLibrary.map((ex, i) => {
                      const exName = ex.name || ''
                      const exSets = ex.sets !== null && ex.sets !== undefined ? String(ex.sets) : ''
                      const exReps = ex.repetitions !== null && ex.repetitions !== undefined ? String(ex.repetitions) : ''
                      const exFreq = ex.frequency || ''
                      const exSession = ex.session ? String(ex.session) : ''
                      const isChecked = bulkSelected.has(exName)
                      return (
                        <label
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid #dceeff',
                            background: isChecked ? '#dceeff' : i % 2 === 0 ? '#f0f6ff' : '#FFFFFF',
                            transition: 'background 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBulk(exName)}
                            style={{ width: 16, height: 16, accentColor: '#1B4F8A', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a3a5c' }}>{exName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                              {[
                                exSets && `🔁 ${exSets} sets`,
                                exReps && `🔄 ${exReps} reps`,
                                exFreq && `📆 ${exFreq}`,
                                exSession && `🗓 ${exSession} session(s)`,
                              ].filter(Boolean).join('  ·  ') || 'No details'}
                            </div>
                          </div>
                          {isChecked && <span style={{ color: '#1B4F8A', fontWeight: 700, fontSize: '1rem' }}>✓</span>}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ SINGLE EXERCISE FORM ════════════════════════════════════ */}
            {(!showBulkPanel) && (
              <>
                {/* Exercise Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...labelStyle, color: fieldErrors.name ? '#e53e3e' : '#1B4F8A' }}>
                    Exercise Name <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  {fieldErrors.name && (
                    <span style={{ marginLeft: 8, fontWeight: 600, fontSize: '0.8rem', color: '#e53e3e' }}>
                      ⚠ {fieldErrors.name}
                    </span>
                  )}
                  <div style={{ position: 'relative', marginTop: 4 }}>
                    <input
                      value={search || form.name}
                      onChange={e => {
                        const raw = e.target.value
                        const safe = sanitizeName(raw)
                        setSearch(safe)
                        set('name')(safe)
                        setShowDropdown(true)
                        setFieldErrors(prev => ({ ...prev, name: '' }))
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      onFocusCapture={e => (e.target.style.borderColor = '#1B4F8A')}
                      onBlurCapture={e  => (e.target.style.borderColor = fieldErrors.name ? '#e53e3e' : '#b6cfe8')}
                      placeholder={
                        loadingLibrary
                          ? 'Loading exercises...'
                          : exerciseLibrary.length > 0
                            ? 'Search or type exercise name...'
                            : 'Type exercise name...'
                      }
                      style={{
                        ...inputStyle,
                        borderColor: fieldErrors.name ? '#e53e3e' : '#b6cfe8',
                        backgroundColor: fieldErrors.name ? '#fff5f5' : '#FFFFFF',
                      }}
                    />

                    {/* Dropdown */}
                    {showDropdown && !loadingLibrary && filteredLibrary.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: '#fff', border: '1px solid #b6cfe8', borderRadius: 8,
                        maxHeight: 260, overflowY: 'auto', zIndex: 1000,
                        boxShadow: '0 4px 16px rgba(27,79,138,0.12)',
                      }}>
                        {filteredLibrary.map((ex, i) => {
                          const exId   = ex.therapyExercisesId
                          const exName = ex.name || ''
                          const exSets = ex.sets !== null && ex.sets !== undefined ? String(ex.sets) : ''
                          const exReps = ex.repetitions !== null && ex.repetitions !== undefined ? String(ex.repetitions) : ''
                          const exSession = ex.session ? String(ex.session) : ''
                          const exFreq    = ex.frequency || ''
                          const exNotes   = ex.notes || ''
                          const exVideo   = ex.video || ''
                          const exImage   = ex.image || ''
                          const isSelected = form.name === exName
                          const fvMatch = String(exFreq).match(/^(\d+)\s*(day|week|month)?/i)
                          const fv = fvMatch ? fvMatch[1] : ''
                          const fu = fvMatch?.[2]?.toLowerCase() || 'day'

                          return (
                            <div
                              key={i}
                              onMouseDown={() => {
                                setForm(f => ({
                                  ...f,
                                  therapyExercisesId: exId,
                                  name: exName,
                                  sets: exSets || exSession || f.sets,
                                  reps: exReps || f.reps,
                                  frequencyValue: fv || f.frequencyValue,
                                  frequencyUnit: fu || f.frequencyUnit,
                                  instructions: exNotes || f.instructions,
                                  videoUrl: exVideo || f.videoUrl,
                                  thumbnail: exImage || f.thumbnail,
                                }))
                                setSearch(exName)
                                setShowDropdown(false)
                                setFieldErrors(prev => ({ ...prev, name: '' }))
                              }}
                              style={{
                                padding: '9px 12px', cursor: 'pointer',
                                borderBottom: '1px solid #dceeff',
                                background: isSelected ? '#dceeff' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0f6ff' }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#dceeff' : '#fff' }}
                            >
                              <div>
                                <strong style={{ color: '#1B4F8A', fontSize: '0.88rem' }}>{exName}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                                  {[
                                    exSets && `🔁 ${exSets} sets`,
                                    exReps && `🔄 ${exReps} reps`,
                                    exFreq && `📆 ${exFreq}`,
                                    exSession && `🗓 ${exSession} session(s)`,
                                  ].filter(Boolean).join('  ·  ')}
                                </div>
                              </div>
                              {isSelected && <span style={{ color: '#38a169', fontWeight: 700, fontSize: '0.78rem' }}>✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sets | Reps | Frequency value | Frequency unit */}
                <div style={gridFour}>
                  <div>
                    <label style={{ ...labelStyle, color: fieldErrors.sets ? '#e53e3e' : '#1B4F8A' }}>Sets</label>
                    {fieldErrors.sets && (
                      <span style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
                        ⚠ {fieldErrors.sets}
                      </span>
                    )}
                    <StepperInput
                      value={form.sets}
                      onChange={val => { set('sets')(val); setFieldErrors(prev => ({ ...prev, sets: '' })) }}
                      min={1} max={50}
                      placeholder="e.g. 3"
                      hasError={!!fieldErrors.sets}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: fieldErrors.reps ? '#e53e3e' : '#1B4F8A' }}>Reps</label>
                    {fieldErrors.reps && (
                      <span style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
                        ⚠ {fieldErrors.reps}
                      </span>
                    )}
                    <StepperInput
                      value={form.reps}
                      onChange={val => { set('reps')(val); setFieldErrors(prev => ({ ...prev, reps: '' })) }}
                      min={1} max={200}
                      placeholder="e.g. 10"
                      hasError={!!fieldErrors.reps}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ ...labelStyle, color: fieldErrors.frequencyValue ? '#e53e3e' : '#1B4F8A' }}>Frequency</label>
                    {fieldErrors.frequencyValue && (
                      <span style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
                        ⚠ {fieldErrors.frequencyValue}
                      </span>
                    )}
                    <FrequencyInput
                      value={form.frequencyValue}
                      unit={form.frequencyUnit}
                      onValueChange={val => {
                        setFieldErrors(prev => ({ ...prev, frequencyValue: '' }))
                        setForm(f => ({ ...f, frequencyValue: val }))
                      }}
                      onUnitChange={val => setForm(f => ({ ...f, frequencyUnit: val }))}
                      hasError={!!fieldErrors.frequencyValue}
                    />
                  </div>
                </div>

                {/* Video URL */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...labelStyle, color: fieldErrors.videoUrl ? '#e53e3e' : '#1B4F8A' }}>Video URL</label>
                  {fieldErrors.videoUrl && (
                    <span style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
                      ⚠ {fieldErrors.videoUrl}
                    </span>
                  )}
                  <input
                    value={form.videoUrl}
                    onChange={e => { set('videoUrl')(e.target.value); setFieldErrors(prev => ({ ...prev, videoUrl: '' })) }}
                    placeholder="https://example.com/video"
                    style={{
                      ...inputStyle,
                      borderColor: fieldErrors.videoUrl ? '#e53e3e' : '#b6cfe8',
                      backgroundColor: fieldErrors.videoUrl ? '#fff5f5' : '#FFFFFF',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
                    onBlur={e  => (e.target.style.borderColor = fieldErrors.videoUrl ? '#e53e3e' : '#b6cfe8')}
                  />
                </div>

                {/* Instructions */}
                <div style={{ marginBottom: 20 }}>
                  <Field label="Instructions">
                    <Textarea value={form.instructions} onChange={set('instructions')}
                      placeholder="e.g. Lie on back and tilt pelvis upward" rows={3} />
                  </Field>
                </div>

                {/* Buttons — right aligned */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  {editingIdx !== null && (
                    <button type="button" onClick={handleCancel}
                      style={{
                        padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                        border: '1.5px solid #b6cfe8', background: '#FFFFFF',
                        color: '#1B4F8A', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                      }}>
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={handleSave}
                    style={{
                      padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
                      color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
                      boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
                    }}>
                    {editingIdx !== null ? '✅ Update Exercise' : '➕ Add Exercise'}
                  </button>
                </div>
              </>
            )}

          </CCardBody>
        </CCard>

        {/* ══ TABLE CARD ═════════════════════════════════════════════════ */}
        {exercises.length > 0 && (
          <CCard className="mb-4" style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>
              <CardHeader emoji="📋" title={`Exercise List (${exercises.length})`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#1a3a5c' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)', color: '#fff' }}>
                      {['#', 'Name', 'Sets', 'Reps', 'Frequency', 'Instructions', 'Video', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex, idx) => {
                      const freqDisplay = ex.frequencyValue
                        ? `${ex.frequencyValue} ${ex.frequencyUnit}${Number(ex.frequencyValue) > 1 ? 's' : ''}`
                        : ex.frequency || '—'
                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f0f6ff' : '#FFFFFF', borderBottom: '1px solid #dceeff' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1B4F8A' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 600 }}>{ex.name || '—'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {ex.sets ? <span style={{ background: '#dceeff', color: '#1B4F8A', borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: '0.78rem' }}>🔁 {ex.sets}</span> : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {ex.reps !== '' && ex.reps !== null && ex.reps !== undefined
                              ? <span style={{ background: '#dceeff', color: '#1B4F8A', borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: '0.78rem' }}>🔄 {ex.reps}</span>
                              : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {freqDisplay !== '—'
                              ? <span style={{ background: '#f0f6ff', color: '#1a3a5c', borderRadius: 8, padding: '2px 9px', fontWeight: 600, fontSize: '0.78rem' }}>📆 {freqDisplay}</span>
                              : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>
                              {ex.instructions || '—'}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {ex.videoUrl ? <a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{ color: '#1B4F8A', fontWeight: 600, fontSize: '0.8rem' }}>▶ Watch</a> : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEdit(idx)}
                              style={{ marginRight: 6, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #1B4F8A', background: '#FFFFFF', color: '#1B4F8A', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✏️ Edit
                            </button>
                            <button onClick={() => handleDeleteClick(idx)}
                              style={{ padding: '4px 12px', borderRadius: 6, border: '1.5px solid #e53e3e', background: '#fff5f5', color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                              🗑️ Delete
                            </button>
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

        {/* ══ HOME ADVICE CARD ═══════════════════════════════════════════ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '24px 32px' }}>
            <CardHeader emoji="🏠" title="Home Advice" />
            <Field label="Home Advice">
              <Textarea value={homeAdvice} onChange={setHomeAdvice}
                placeholder="e.g. Maintain correct posture and do exercises daily" rows={4} />
            </Field>
          </CCardBody>
        </CCard>

      </CContainer>

      {/* ══ STICKY BOTTOM BAR ══════════════════════════════════════════════ */}
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

export default HomePlan