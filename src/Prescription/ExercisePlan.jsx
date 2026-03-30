import React, { useState, useEffect } from 'react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import { getTherapyExercises, getTodayAppointments } from '../Auth/Auth'

/* ─── Empty exercise entry ───────────────────────────────────────────────── */
const EMPTY_EXERCISE = {
  name: '', sets: '', reps: '', duration: '',
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

const gridTwo = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: '16px 28px', marginBottom: 16,
}

const gridThree = {
  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px 28px', marginBottom: 16,
}

const cardStyle = {
  border: '1px solid #d8e8f5', borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder = '' }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} style={inputStyle} />
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

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   TabContent passes: seed={formData.exercisePlan}
   So seed = { exercises: [...], homeAdvice: '' } — NOT seed.exercisePlan.xxx
══════════════════════════════════════════════════════════════════════════ */
const ExercisePlan = ({ seed = {}, onNext, sidebarWidth = 0 }) => {

  // ✅ FIX: seed IS already the exercisePlan object, read directly
  const [exercises,       setExercises]     = useState(Array.isArray(seed.exercises) ? seed.exercises : [])
  const [homeAdvice,      setHomeAdvice]    = useState(seed.homeAdvice ?? '')
  const [form,            setForm]          = useState({ ...EMPTY_EXERCISE })
  const [editingIdx,      setEditingIdx]    = useState(null)

  /* ── IDs & exercise library from API ── */
  const [clinicId,        setClinicId]      = useState('')
  const [branchId,        setBranchId]      = useState('')
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [loadingLibrary,  setLoadingLibrary]  = useState(false)

  /* ── Search/dropdown ── */
  const [search,          setSearch]        = useState('')
  const [showDropdown,    setShowDropdown]  = useState(false)

  /* ── On mount: fetch IDs and exercise library ── */
  useEffect(() => {
    const resolveIdsAndFetchExercises = async () => {
      const resolvedClinicId =
        localStorage.getItem('clinicId') ||
        localStorage.getItem('hospitalId') ||
        ''

      if (!resolvedClinicId) {
        console.warn('⚠️ clinicId not found in localStorage')
        return
      }

      setClinicId(resolvedClinicId)

      try {
        const appointmentRes = await getTodayAppointments()
        const appointments = appointmentRes?.data || []
        const resolvedBranchId = appointments[0]?.branchId || ''

        if (!resolvedBranchId) {
          console.warn('⚠️ branchId not found in today\'s appointments')
          return
        }

        setBranchId(resolvedBranchId)
        setLoadingLibrary(true)
        const data = await getTherapyExercises(resolvedClinicId, resolvedBranchId)
        setExerciseLibrary(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('❌ Error fetching exercises:', err)
        setExerciseLibrary([])
      } finally {
        setLoadingLibrary(false)
      }
    }

    resolveIdsAndFetchExercises()
  }, [])

  // ✅ FIX: useEffect also reads flat — no more seed.exercisePlan wrapper
  useEffect(() => {
    setExercises(Array.isArray(seed.exercises) ? seed.exercises : [])
    setHomeAdvice(seed.homeAdvice ?? '')
  }, [seed])

  const set = field => val => setForm(f => ({ ...f, [field]: val }))

  /* ── Filtered exercise library ── */
  const filteredLibrary = exerciseLibrary.filter(ex =>
    (ex.name || '').toLowerCase().includes(search.toLowerCase())
  )

  /* ── Add / Update ── */
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
    const entry = exercises[idx]
    setForm({ ...entry })
    setEditingIdx(idx)
    setSearch(entry.name || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = idx => {
    setExercises(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) { setForm({ ...EMPTY_EXERCISE }); setEditingIdx(null); setSearch('') }
  }

  const handleCancel = () => { setForm({ ...EMPTY_EXERCISE }); setEditingIdx(null); setSearch('') }

  /* ── Next ── */
  const handleNext = () => {
    // Wrap back into the shape PatientAppointmentDetails expects
    const payload = { exercisePlan: { exercises, homeAdvice } }
    console.log('🚀 ExercisePlan payload:', payload)
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
            <CardHeader emoji="🏋️" title={editingIdx !== null ? `Editing Exercise #${editingIdx + 1}` : 'Add Exercise'} />

            {/* ── Exercise Name with library dropdown ── */}
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

                  {/* Dropdown from API library */}
                  {showDropdown && !loadingLibrary && filteredLibrary.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: '#fff', border: '1px solid #b6cfe8',
                      borderRadius: 8, maxHeight: 220, overflowY: 'auto',
                      zIndex: 1000, boxShadow: '0 4px 16px rgba(26,90,168,0.12)',
                    }}>
                      {filteredLibrary.map((ex, i) => {
                        const exName = ex.name || ''
                        const isSelected = form.name === exName
                        return (
                          <div
                            key={i}
                            onMouseDown={() => {
                              setForm(f => ({
                                ...f,
                                name:         exName,
                                duration:     ex.duration     || f.duration,
                                sets:         ex.session      || f.sets,
                                reps:         ex.frequency    || f.reps,
                                instructions: ex.notes        || f.instructions,
                                videoUrl:     ex.video        || f.videoUrl,
                                thumbnail:    ex.image        || f.thumbnail,
                              }))
                              setSearch(exName)
                              setShowDropdown(false)
                            }}
                            style={{
                              padding: '9px 12px', cursor: 'pointer',
                              borderBottom: '1px solid #eee', transition: 'background 0.15s',
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
                                  ex.duration  && `⏱ ${ex.duration}`,
                                  ex.session   && `🔁 ${ex.session} sessions`,
                                  ex.frequency && `📆 ${ex.frequency}`,
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
              </Field>
            </div>

            {/* Row 1 — Duration | Thumbnail */}
            <div style={gridTwo}>
              <Field label="Duration">
                <TextInput value={form.duration} onChange={set('duration')} placeholder="e.g. 10 mins" />
              </Field>
              <Field label="Exercise Thumbnail">
                {form.thumbnail && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={form.thumbnail.startsWith('data:image')
                        ? form.thumbnail
                        : `data:image/png;base64,${form.thumbnail}`}
                      alt="Thumbnail Preview"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </Field>
            </div>

            {/* Row 2 — Sets | Reps | Video */}
            <div style={gridThree}>
              <Field label="Sets">
                <TextInput value={form.sets} onChange={set('sets')} placeholder="e.g. 3" />
              </Field>
              <Field label="Reps">
                <TextInput value={form.reps} onChange={set('reps')} placeholder="e.g. 10" />
              </Field>
              <Field label="Video URL">
                <TextInput value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://example.com/video" />
              </Field>
            </div>

            {/* Row 3 — Instructions */}
            <div style={{ marginBottom: 16 }}>
              <Field label="Instructions">
                <Textarea value={form.instructions} onChange={set('instructions')}
                  placeholder="e.g. Lie on back and tilt pelvis upward" rows={3} />
              </Field>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button type="button" onClick={handleSave} style={{
                padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
              }}>
                {editingIdx !== null ? '✅ Update Exercise' : '➕ Add Exercise'}
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
        {exercises.length > 0 && (
          <CCard className="mb-4" style={cardStyle}>
            <CCardBody style={{ padding: '24px 32px' }}>
              <CardHeader emoji="📋" title={`Exercise List (${exercises.length})`} />

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#1a3a5c' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Name', 'Sets', 'Reps', 'Duration', 'Instructions', 'Video', 'Thumbnail', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 600 }}>{ex.name || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{ex.sets || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>{ex.reps || '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{ex.duration || '—'}</td>
                        <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>
                            {ex.instructions || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {ex.videoUrl
                            ? <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                                style={{ color: '#1a5fa8', fontWeight: 600, fontSize: '0.8rem' }}>▶ Watch</a>
                            : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {ex.thumbnail
                            ? <img src={ex.thumbnail} alt={ex.name} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #c8ddf0' }}
                                onError={e => { e.target.style.display = 'none' }} />
                            : '—'}
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

        {/* ══ HOME ADVICE CARD ═══════════════════════════════════════════ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '24px 32px' }}>
            <CardHeader emoji="🏠" title="Home Advice" />
            <Field label="Home Advice">
              <Textarea
                value={homeAdvice}
                onChange={setHomeAdvice}
                placeholder="e.g. Maintain correct posture and do exercises daily"
                rows={4}
              />
            </Field>
          </CCardBody>
        </CCard>

      </CContainer>

      {/* ── Sticky bottom bar ── */}
      <div  className="position-fixed bottom-0"
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

export default ExercisePlan