import React, { useState, useEffect } from 'react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import { getTherapyExercises, getTodayAppointments } from '../Auth/Auth'

/* ─── Empty exercise entry ───────────────────────────────────────────────── */
const EMPTY_EXERCISE = {
  name: '', sets: '', reps: '', frequency: '',
  instructions: '', videoUrl: '', thumbnail: '',
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

const gridThree = {
  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px 28px', marginBottom: 16,
}

const gridTwo = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: '16px 28px', marginBottom: 16,
}

const cardStyle = {
  border: '1px solid #d8e8f5', borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const Field = ({ label, children, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && (
      <span style={{ marginTop: 4, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
        ⚠ {error}
      </span>
    )}
  </div>
)

const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }} />
)

const CardHeader = ({ emoji, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{emoji}</div>
    <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>{title}</h5>
  </div>
)

/* ─── Validated Number Input (Sets / Reps) ──────────────────────────────── */
const NumberInput = ({ value, onChange, min = 1, max, placeholder }) => {
  const [touched, setTouched] = useState(false)
  const num = parseInt(value)
  const error = touched && value !== '' && (isNaN(num) || num < min || (max && num > max))
    ? `Enter a number between ${min}–${max ?? '∞'}`
    : null

  return (
    <Field error={error}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onBlur={() => setTouched(true)}
        onChange={e => {
          const raw = e.target.value
          if (raw === '' || /^\d+$/.test(raw)) onChange(raw)
        }}
        style={{
          ...inputStyle,
          borderColor: error ? '#fc8181' : value && !error ? '#68d391' : '#b6cfe8',
          backgroundColor: error ? '#fff5f5' : value && !error ? '#f0fff4' : '#f5f9ff',
        }}
      />

    </Field>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const HomePlan = ({ seed = {}, onNext, sidebarWidth = 0 }) => {

  const [exercises, setExercises] = useState(Array.isArray(seed.exercises) ? seed.exercises : [])
  const [homeAdvice, setHomeAdvice] = useState(seed.homeAdvice ?? '')
  const [form, setForm] = useState({ ...EMPTY_EXERCISE })
  const [editingIdx, setEditingIdx] = useState(null)

  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

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
    setExercises(Array.isArray(seed.exercises) ? seed.exercises : [])
    setHomeAdvice(seed.homeAdvice ?? '')
  }, [seed])

  const set = field => val => setForm(f => ({ ...f, [field]: val }))

  const addedNames = new Set(
    exercises.filter((_, i) => i !== editingIdx).map(e => e.name?.trim().toLowerCase())
  )

  const filteredLibrary = exerciseLibrary.filter(ex => {
    const n = (ex.name || '').trim().toLowerCase()
    return n.includes(search.toLowerCase()) && !addedNames.has(n)
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editingIdx !== null) {
      setExercises(prev => prev.map((e, i) => i === editingIdx ? { ...form } : e))
      setEditingIdx(null)
    } else {
      setExercises(prev => [...prev, { ...form }])
    }
    setForm({ ...EMPTY_EXERCISE })
    setSearch('')
  }

  const handleEdit = idx => {
    setForm({ ...exercises[idx] })
    setEditingIdx(idx)
    setSearch(exercises[idx].name || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = idx => {
    setExercises(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) { setForm({ ...EMPTY_EXERCISE }); setEditingIdx(null); setSearch('') }
  }

  const handleCancel = () => { setForm({ ...EMPTY_EXERCISE }); setEditingIdx(null); setSearch('') }

  const handleNext = () => onNext?.({ exercisePlan: { exercises, homeAdvice } })

  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

        {/* ══ FORM CARD ══════════════════════════════════════════════════ */}
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>
            <CardHeader emoji="🏋️" title={editingIdx !== null ? `Editing Exercise #${editingIdx + 1}` : 'Add Exercise'} />

            {/* Exercise Name */}
            <div style={{ marginBottom: 16 }}>
              <Field label="Exercise Name">
                <div style={{ position: 'relative' }}>
                  <input
                    value={search || form.name}
                    onChange={e => {
                      setSearch(e.target.value)
                      set('name')(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder={
                      loadingLibrary
                        ? 'Loading exercises...'
                        : exerciseLibrary.length > 0
                          ? 'Search or type exercise name...'
                          : 'Type exercise name...'
                    }
                    style={inputStyle}
                  />

                  {/* ── Dropdown ── */}
                  {showDropdown && !loadingLibrary && filteredLibrary.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: '#fff', border: '1px solid #b6cfe8', borderRadius: 8,
                      maxHeight: 260, overflowY: 'auto', zIndex: 1000,
                      boxShadow: '0 4px 16px rgba(26,90,168,0.12)',
                    }}>
                      {filteredLibrary.map((ex, i) => {
                        const exName = ex.name || ''
                        const exSets = ex.sets !== null && ex.sets !== undefined ? String(ex.sets) : ''
                        const exReps = ex.repetitions !== null && ex.repetitions !== undefined ? String(ex.repetitions) : ''
                        // session = number of sessions (maps to our "sets" field if sets is 0)
                        const exSession = ex.session ? String(ex.session) : ''
                        const exFreq = ex.frequency || ''
                        const exNotes = ex.notes || ''
                        const exVideo = ex.video || ''
                        const exImage = ex.image || ''
                        const isSelected = form.name === exName

                        return (
                          <div
                            key={i}
                            onMouseDown={() => {
                              setForm(f => ({
                                ...f,
                                name: exName,
                                // Prefer explicit sets/repetitions from API; fall back to session
                                sets: exSets || exSession || f.sets,
                                reps: exReps || f.reps,
                                frequency: exFreq || f.frequency,
                                instructions: exNotes || f.instructions,
                                videoUrl: exVideo || f.videoUrl,
                                thumbnail: exImage || f.thumbnail,
                              }))
                              setSearch(exName)
                              setShowDropdown(false)
                            }}
                            style={{
                              padding: '9px 12px', cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              background: isSelected ? '#e0f2fe' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0f7ff' }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#e0f2fe' : '#fff' }}
                          >
                            <div>
                              <strong style={{ color: '#1a5fa8', fontSize: '0.88rem' }}>{exName}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                                {[
                                  exSets && `🔁 ${exSets} sets`,
                                  exReps && `🔄 ${exReps} reps`,
                                  exFreq && `📆 ${exFreq}`,
                                  exSession && `🗓 ${exSession} session(s)`,
                                ].filter(Boolean).join('  ·  ')}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ color: '#38a169', fontWeight: 700, fontSize: '0.78rem' }}>✓</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* ── Sets | Reps | Frequency ── */}
            <div style={gridThree}>

              {/* Sets */}
              <div>
                <label style={labelStyle}>Sets</label>
                <NumberInput
                  value={form.sets}
                  onChange={set('sets')}
                  min={1} max={50}
                  placeholder="e.g. 3"
                />
              </div>

              {/* Reps */}
              <div>
                <label style={labelStyle}>Reps</label>
                <NumberInput
                  value={form.reps}
                  onChange={set('reps')}
                  min={1} max={200}
                  placeholder="e.g. 10"
                />
              </div>

              {/* Frequency — free-text, e.g. "2 time/ day" */}
              <div>
                <label style={labelStyle}>Frequency</label>
                <Field>
                  <input
                    value={form.frequency}
                    onChange={e => set('frequency')(e.target.value)}
                    placeholder="e.g. 2 time/ day"
                    style={{
                      ...inputStyle,
                      borderColor: form.frequency ? '#68d391' : '#b6cfe8',
                      backgroundColor: form.frequency ? '#f0fff4' : '#f5f9ff',
                    }}
                  />

                </Field>
              </div>

            </div>

            {/* Thumbnail (only when present) + Video URL */}
            <div style={form.thumbnail ? gridTwo : { marginBottom: 16 }}>
              {form.thumbnail && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Exercise Thumbnail</label>
                  <div style={{ marginTop: 6 }}>
                    <img
                      src={
                        form.thumbnail.startsWith('data:image')
                          ? form.thumbnail
                          : `data:image/png;base64,${form.thumbnail}`
                      }
                      alt="Thumbnail Preview"
                      style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #c8ddf0' }}
                    />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Video URL</label>
                <input
                  value={form.videoUrl}
                  onChange={e => set('videoUrl')(e.target.value)}
                  placeholder="https://example.com/video"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Instructions */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Instructions</label>
                <Textarea
                  value={form.instructions}
                  onChange={set('instructions')}
                  placeholder="e.g. Lie on back and tilt pelvis upward"
                  rows={3}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                  color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
                }}
              >
                {editingIdx !== null ? '✅ Update Exercise' : '➕ Add Exercise'}
              </button>
              {editingIdx !== null && (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                    border: '1.5px solid #b6cfe8', background: '#f5f9ff',
                    color: '#1a3a5c', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

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
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Name', 'Sets', 'Reps', 'Frequency', 'Instructions', 'Video', 'Thumbnail', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex, idx) => (
                      <tr
                        key={idx}
                        style={{ backgroundColor: idx % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{idx + 1}</td>

                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {ex.name || '—'}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {ex.sets
                            ? <span style={{ background: '#dbeafe', color: '#1a5fa8', borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: '0.78rem' }}>🔁 {ex.sets}</span>
                            : '—'}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {ex.reps !== '' && ex.reps !== null && ex.reps !== undefined
                            ? <span
                              style={{
                                background: '#dbeafe',
                                color: '#1a5fa8',
                                borderRadius: 10,
                                padding: '2px 9px',
                                fontWeight: 700,
                                fontSize: '0.78rem'
                              }}
                            >
                              🔄 {ex.reps}
                            </span>
                            : '—'}
                        </td>

                        {/* ── Frequency column ── */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {ex.frequency
                            ? <span style={{ background: '#f0f7ff', color: '#1a3a5c', borderRadius: 8, padding: '2px 9px', fontWeight: 600, fontSize: '0.78rem' }}>📆 {ex.frequency}</span>
                            : '—'}
                        </td>

                        <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>
                            {ex.instructions || '—'}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {ex.videoUrl
                            ? <a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{ color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem' }}>▶ Watch</a>
                            : '—'}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {ex.thumbnail
                            ? <img
                              src={ex.thumbnail}
                              alt={ex.name}
                              style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #c8ddf0' }}
                              onError={e => { e.target.style.display = 'none' }}
                            />
                            : '—'}
                        </td>

                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleEdit(idx)}
                            style={{ marginRight: 6, padding: '4px 12px', borderRadius: 6, border: '1.5px solid #1a5fa8', background: '#f0f7ff', color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                          >✏️ Edit</button>
                          <button
                            onClick={() => handleDelete(idx)}
                            style={{ padding: '4px 12px', borderRadius: 6, border: '1.5px solid #e53e3e', background: '#fff5f5', color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                          >🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Home Advice</label>
              <Textarea
                value={homeAdvice}
                onChange={setHomeAdvice}
                placeholder="e.g. Maintain correct posture and do exercises daily"
                rows={4}
              />
            </div>
          </CCardBody>
        </CCard>

      </CContainer>

      {/* ══ STICKY BOTTOM BAR ══ */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0, right: 0, background: '#a5c4d4ff',
          display: 'flex', justifyContent: 'flex-end', gap: 16,
          padding: '10px 24px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          customColor="#ffffff" color="#7e3a93"
          onClick={handleNext}
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        >
          Next
        </Button>
      </div>

      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}`}</style>
    </div>
  )
}

export default HomePlan