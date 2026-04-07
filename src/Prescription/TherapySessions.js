import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import {
  getTherapyExercises,
  getTodayAppointments,
  getTherapists,
  getProgramsByBranch,
  getPrograms,
  getProgramById,
} from '../Auth/Auth'

/* ─── Constants ──────────────────────────────────────────────────────────── */
const MODALITY_OPTIONS = [
  'IFT', 'Ultrasound Therapy', 'Hot Pack', 'Cold Pack',
  'TENS', 'Laser Therapy', 'Traction', 'Wax Bath',
]
const FREQ_UNITS = ['Day', 'Week', 'Month']

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
const cardStyle = {
  border: '1px solid #d8e8f5', borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)', marginBottom: 20,
}

/* ─── Reusable UI ────────────────────────────────────────────────────────── */
const Field = ({ label, children, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)
const TextInput = ({ value, onChange, placeholder = '', type = 'text', disabled = false }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled}
    style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }} />
)
const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }} />
)
const SectionHeader = ({ emoji, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1.5px solid #e3eef8' }}>
    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{emoji}</div>
    <div>
      <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.05rem' }}>{title}</h5>
      {subtitle && <span style={{ fontSize: '0.8rem', color: '#6b9fc7', fontWeight: 500 }}>{subtitle}</span>}
    </div>
  </div>
)

/* ─── Radio Button ───────────────────────────────────────────────────────── */
const RadioBtn = ({ label, emoji, value, active, onClick }) => (
  <button type="button" onClick={() => onClick(value)} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 28px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
    border: `2px solid ${active ? '#1a5fa8' : '#c8ddf0'}`,
    background: active ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#f5f9ff',
    color: active ? '#fff' : '#4a6a8a',
    fontWeight: active ? 700 : 500, fontSize: '0.95rem',
    transition: 'all 0.18s', boxShadow: active ? '0 3px 12px rgba(26,90,168,0.22)' : 'none',
  }}>
    <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? 'rgba(255,255,255,0.7)' : '#b6cfe8'}`, background: active ? 'rgba(255,255,255,0.25)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
    </span>
    {emoji} {label}
  </button>
)

/* ─── Modality Picker ────────────────────────────────────────────────────── */
const ModalityPicker = ({ selected, onChange }) => {
  const toggle = mod => onChange(selected.includes(mod) ? selected.filter(m => m !== mod) : [...selected, mod])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {MODALITY_OPTIONS.map(mod => {
        const active = selected.includes(mod)
        return (
          <button key={mod} type="button" onClick={() => toggle(mod)} style={{
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
            borderColor: active ? '#1a5fa8' : '#b6cfe8',
            background: active ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#f5f9ff',
            color: active ? '#fff' : '#1a3a5c', fontWeight: active ? 700 : 500,
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
          }}>{mod}</button>
        )
      })}
    </div>
  )
}

/* ─── Therapist Search ───────────────────────────────────────────────────── */
const TherapistSearch = ({ therapists, loading, value, name, onChange }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)

  useEffect(() => { setSearch(value && name ? `${value} - ${name}` : '') }, [value, name])

  const filtered = therapists.filter(t => {
    const q = search.toLowerCase()
    return (t.therapistId || '').toLowerCase().includes(q) || (t.fullName || '').toLowerCase().includes(q)
  })
  const clear = () => { onChange('', ''); setSearch(''); setOpen(true) }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (value) onChange('', ''); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={loading ? 'Loading therapists...' : !therapists.length ? 'No therapists available' : 'Search by ID or name...'}
          disabled={loading}
          style={{ ...inputStyle, paddingRight: value ? 36 : 11, opacity: loading ? 0.6 : 1, borderColor: value ? '#38a169' : '#b6cfe8', backgroundColor: value ? '#f0fff4' : '#f5f9ff' }}
        />
        {value && (
          <button type="button" onMouseDown={e => { e.preventDefault(); clear() }}
            style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: 700, fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>✕</button>
        )}
      </div>
      {value && name && (
        <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', color: '#234e52', fontWeight: 600 }}>
          ✅ {value} — {name}
        </div>
      )}
      {open && !loading && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #b6cfe8', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 16px rgba(26,90,168,0.12)', marginTop: 2 }}>
          {filtered.length > 0 ? filtered.map((t, i) => {
            const isSel = value === t.therapistId
            return (
              <div key={i}
                onMouseDown={e => { e.preventDefault(); onChange(t.therapistId, t.fullName); setSearch(`${t.therapistId} - ${t.fullName}`); setOpen(false) }}
                style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', background: isSel ? '#e0f2fe' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f0f7ff' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? '#e0f2fe' : '#fff' }}>
                <span><strong style={{ color: '#1a5fa8' }}>{t.therapistId}</strong><span style={{ color: '#1a3a5c' }}> — {t.fullName}</span></span>
                {isSel && <span style={{ color: '#38a169', fontWeight: 700, fontSize: '0.8rem' }}>✓ Selected</span>}
              </div>
            )
          }) : (
            <div style={{ padding: '10px 12px', color: '#888', fontSize: '0.85rem' }}>
              {!therapists.length ? 'No therapists found for this branch' : 'No match — try a different name'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Program Dropdown ───────────────────────────────────────────────────── */
const getName = p => p.programName || p.name || p.title || `Program ${p.id ?? ''}`
const getId   = p => String(p.id || p._id || p.programId || '')

const ProgramDropdown = ({ programs, loading, value, onChange, mode }) => {
  const [search, setSearch] = useState('')
  const [open,   setOpen]   = useState(false)

  const selectedObj = programs.find(p => getId(p) === value)

  useEffect(() => {
    setSearch(selectedObj ? getName(selectedObj) : '')
  }, [value, programs])

  const filtered = programs.filter(p =>
    getName(p).toLowerCase().includes(search.toLowerCase())
  )

  const clear = () => { onChange(null, null); setSearch(''); setOpen(true) }

  const placeholder = loading
    ? `Loading ${mode}s...`
    : !programs.length
    ? `No ${mode}s available`
    : `Search or select a ${mode}...`

  return (
    <div style={{ position: 'relative', maxWidth: 460 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (value) onChange(null, null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          disabled={loading}
          style={{
            ...inputStyle,
            paddingRight: value ? 36 : 30,
            opacity: loading ? 0.6 : 1,
            borderColor: value ? '#1a5fa8' : '#b6cfe8',
            backgroundColor: value ? '#eef5ff' : '#f5f9ff',
            fontWeight: value ? 600 : 400,
          }}
        />
        <span style={{ position: 'absolute', right: value ? 32 : 10, color: '#6b9fc7', fontSize: 13, pointerEvents: 'none', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        {value && (
          <button type="button" onMouseDown={e => { e.preventDefault(); clear() }}
            style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: 700, fontSize: 15, lineHeight: 1, padding: '2px 4px' }}>✕</button>
        )}
      </div>

      {value && selectedObj && (
        <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef5ff', border: '1px solid #a8c6f0', borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', color: '#1a3a5c', fontWeight: 600 }}>
          {mode === 'program' ? '🎯' : '📦'} {getName(selectedObj)}
        </div>
      )}

      {open && !loading && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #b6cfe8', borderRadius: 8, maxHeight: 260, overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 20px rgba(26,90,168,0.13)', marginTop: 2 }}>
          {filtered.length > 0 ? filtered.map((p, i) => {
            const id    = getId(p)
            const label = getName(p)
            const isSel = value === id
            return (
              <div key={i}
                onMouseDown={e => { e.preventDefault(); onChange(id, p); setSearch(label); setOpen(false) }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #eef3f8', background: isSel ? '#ddeeff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.12s' }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f0f7ff' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? '#ddeeff' : '#fff' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{mode === 'program' ? '🎯' : '📦'}</span>
                  <span style={{ color: '#1a3a5c', fontSize: '0.88rem', fontWeight: isSel ? 700 : 500 }}>{label}</span>
                </span>
                {isSel && <span style={{ color: '#1a5fa8', fontWeight: 700, fontSize: '0.8rem' }}>✓</span>}
              </div>
            )
          }) : (
            <div style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.85rem' }}>
              No {mode}s match your search
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Always-Editable Number Cell ────────────────────────────────────────── */
const NumCell = ({ value, onChange }) => (
  <input type="number" min="0" value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    style={{ width: 64, textAlign: 'center', fontFamily: 'inherit', border: '1.5px solid #1a5fa8', borderRadius: 6, padding: '4px 2px', fontSize: '0.82rem', color: '#1a3a5c', background: '#fff', outline: 'none' }}
    onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(26,95,168,0.15)' }}
    onBlur={e  => { e.target.style.boxShadow = 'none' }}
  />
)

/* ─── Always-Editable Frequency Cell ─────────────────────────────────────── */
const FreqCell = ({ count, unit, onCountChange, onUnitChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <input type="number" min="0" value={count ?? ''} placeholder="0"
      onChange={e => onCountChange(e.target.value)}
      style={{ width: 50, textAlign: 'center', border: '1.5px solid #1a5fa8', borderRadius: 6, padding: '4px 2px', fontSize: '0.82rem', color: '#1a3a5c', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
      onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(26,95,168,0.15)' }}
      onBlur={e  => { e.target.style.boxShadow = 'none' }}
    />
    <select value={unit ?? 'Week'} onChange={e => onUnitChange(e.target.value)}
      style={{ border: '1.5px solid #1a5fa8', borderRadius: 6, padding: '4px 6px', fontSize: '0.78rem', color: '#1a3a5c', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
      {FREQ_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  </div>
)

/* ─── Exercise Table ─────────────────────────────────────────────────────── */
const ExerciseTable = ({ exercises, onUpdate }) => {
  const setField = (idx, field, val) =>
    onUpdate(exercises.map((ex, i) => i === idx ? { ...ex, [field]: val } : ex))

  if (!exercises || exercises.length === 0) return (
    <div style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.83rem', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', marginTop: 8 }}>
      No exercises available for this therapy
    </div>
  )

  const TH = ({ children, center }) => (
    <th style={{ padding: '9px 10px', textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.82rem' }}>{children}</th>
  )
  const TD = ({ children, style = {} }) => (
    <td style={{ padding: '7px 10px', verticalAlign: 'middle', ...style }}>{children}</td>
  )

  return (
    <div style={{ overflowX: 'auto', marginTop: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: '#1a3a5c' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
            <TH>#</TH>
            <TH>Exercise Name</TH>
            <TH center>Sessions</TH>
            <TH center>Sets</TH>
            <TH center>Reps</TH>
            <TH>Frequency</TH>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, idx) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f5f9ff' : '#fff', borderBottom: '1px solid #e3eef8' }}>
              <TD style={{ fontWeight: 700, color: '#1a5fa8' }}>{idx + 1}</TD>
              <TD style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#1a3a5c' }}>
                {ex.exerciseName || ex.name || ex.exercise_name || '—'}
              </TD>
              <TD style={{ textAlign: 'center' }}>
                <NumCell value={ex.sessions} onChange={v => setField(idx, 'sessions', v)} />
              </TD>
              <TD style={{ textAlign: 'center' }}>
                <NumCell value={ex.sets} onChange={v => setField(idx, 'sets', v)} />
              </TD>
              <TD style={{ textAlign: 'center' }}>
                <NumCell value={ex.reps} onChange={v => setField(idx, 'reps', v)} />
              </TD>
              <TD>
                <FreqCell
                  count={ex.frequencyCount} unit={ex.frequencyUnit}
                  onCountChange={v => setField(idx, 'frequencyCount', v)}
                  onUnitChange={v  => setField(idx, 'frequencyUnit', v)}
                />
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Therapy Block ──────────────────────────────────────────────────────── */
const TherapyBlock = ({ therapy, checked, onToggle, exercises, onUpdateExercises, loading }) => (
  <div style={{ border: `2px solid ${checked ? '#1a5fa8' : '#dde8f2'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.18s', marginBottom: 12 }}>
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: checked ? 'linear-gradient(135deg,#eef5ff,#ddeeff)' : '#f5f8fc', cursor: 'pointer', userSelect: 'none', borderBottom: checked ? '1.5px solid #c8ddf0' : 'none', transition: 'background 0.15s' }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? '#1a5fa8' : '#a0bcda'}`, background: checked ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
        {checked && <span style={{ color: '#fff', fontSize: '0.72rem', lineHeight: 1, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.93rem', color: '#1a3a5c', flex: 1 }}>{therapy}</span>
      {loading
        ? <span style={{ fontSize: '0.78rem', color: '#6b9fc7', fontWeight: 500 }}>Loading exercises...</span>
        : <span style={{ fontSize: '0.78rem', color: checked ? '#1a5fa8' : '#8fa8c0', fontWeight: 600 }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
      }
      <span style={{ fontSize: '0.8rem', color: checked ? '#1a5fa8' : '#b0c4d8', transition: 'transform 0.2s', display: 'inline-block', transform: checked ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
    </div>
    {checked && (
      <div style={{ padding: '4px 18px 16px' }}>
        {loading
          ? <div style={{ padding: '16px', textAlign: 'center', color: '#6b9fc7', fontSize: '0.85rem' }}>⏳ Loading exercises...</div>
          : <ExerciseTable exercises={exercises} onUpdate={onUpdateExercises} />
        }
      </div>
    )}
  </div>
)

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const TherapySession = ({ seed = {}, onNext }) => {

  /* ── Mode ── */
  const [mode, setMode] = useState(seed.mode ?? 'program')

  /* ── Clinic / Branch IDs ── */
  const [clinicId, setClinicId] = useState('')
  const [branchId, setBranchId] = useState('')
  const idsReady = clinicId && branchId  // ← both must exist before fetching

  /* ── Therapists ── */
  const [therapists,        setTherapists]        = useState([])
  const [loadingTherapists, setLoadingTherapists] = useState(false)
  const [therapistId,       setTherapistId]       = useState(seed.therapistId   ?? '')
  const [therapistName,     setTherapistName]     = useState(seed.therapistName ?? '')

  /* ── Programs ── */
  const [programs,        setPrograms]        = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)

  /* ── All exercises (cached once per branch) ── */
  const [allExercises,        setAllExercises]        = useState([])
  const [loadingAllExercises, setLoadingAllExercises] = useState(false)
  const exercisesFetchedRef = useRef(false)  // prevent double-fetch

  /* ── Selected program ── */
  const [selectedProgramId,  setSelectedProgramId]  = useState(seed.selectedProgram ?? null)
  const [selectedProgramObj, setSelectedProgramObj] = useState(null)
  const [loadingProgramDetail, setLoadingProgramDetail] = useState(false)

  /* ── Therapy library built from program.therophy[] ── */
  const [therapyLibrary, setTherapyLibrary] = useState([])

  /* ── Therapy state: { [therapyName]: { checked, exercises[] } } ── */
  const [therapyState, setTherapyState] = useState({})

  /* ── Session Details ── */
  const [modalitiesUsed,  setModalitiesUsed]  = useState(seed.modalitiesUsed  ?? [])
  const [patientResponse, setPatientResponse] = useState(seed.patientResponse ?? '')
  const [manualTherapy,   setManualTherapy]   = useState(seed.manualTherapy   ?? '')
  const [precautions,     setPrecautions]     = useState(seed.precautions     ?? '')

  /* ────────────────────────────────────────────────────────────────────────
     STEP 1 — On mount: resolve clinicId & branchId from localStorage +
               today's appointments. Both IDs must be known before any
               data-fetch happens.
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const resolveIds = async () => {
      const cId = localStorage.getItem('clinicId') || localStorage.getItem('hospitalId') || ''
      if (!cId) {
        console.warn('⚠️ No clinicId in localStorage')
        return
      }

      let bId = ''
      try {
        const res = await getTodayAppointments()
        bId = res?.data?.[0]?.branchId || ''
      } catch (err) {
        console.error('❌ getTodayAppointments error:', err)
      }

      console.log(`✅ IDs resolved — clinicId: ${cId}, branchId: ${bId}`)
      setClinicId(cId)
      setBranchId(bId)
    }
    resolveIds()
  }, [])

  /* ────────────────────────────────────────────────────────────────────────
     STEP 2 — Once both IDs are ready, fetch therapists + programs in
               parallel. Programs: try branch-specific first, fall back to
               getAll. This runs exactly once when idsReady flips to true.
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!idsReady) return

    const fetchTherapistsAndPrograms = async () => {
      setLoadingTherapists(true)
      setLoadingPrograms(true)

      try {
        // ── Therapists & Programs in parallel ──
        const [therapistData, branchPrograms] = await Promise.allSettled([
          getTherapists(clinicId, branchId),
          branchId ? getProgramsByBranch(clinicId, branchId) : Promise.resolve([]),
        ])

        // Therapists
        const tList = therapistData.status === 'fulfilled'
          ? (Array.isArray(therapistData.value) ? therapistData.value : [])
          : []
        setTherapists(tList)
        console.log(`✅ Therapists loaded: ${tList.length}`)

        // Programs — fall back to getAll if branch returned empty
        let pList = branchPrograms.status === 'fulfilled'
          ? (Array.isArray(branchPrograms.value) ? branchPrograms.value : [])
          : []

        if (!pList.length) {
          console.log('⚠️ No branch programs — falling back to getAll')
          try {
            const allPrograms = await getPrograms()
            pList = Array.isArray(allPrograms) ? allPrograms : []
          } catch (e) {
            console.error('❌ getPrograms fallback error:', e)
          }
        }
        setPrograms(pList)
        console.log(`✅ Programs loaded: ${pList.length}`)

      } catch (err) {
        console.error('❌ fetchTherapistsAndPrograms error:', err)
      } finally {
        setLoadingTherapists(false)
        setLoadingPrograms(false)
      }
    }

    fetchTherapistsAndPrograms()
  }, [idsReady, clinicId, branchId])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────────────────────────────────────────────────────
     STEP 3 — Once IDs are ready, pre-fetch ALL exercises for this branch
               once and cache them. They'll be filtered per therapy in
               STEP 5 without any additional network calls.
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!idsReady || exercisesFetchedRef.current) return
    exercisesFetchedRef.current = true

    const fetchAllExercises = async () => {
      setLoadingAllExercises(true)
      try {
        const data = await getTherapyExercises(clinicId, branchId)
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setAllExercises(list)
        console.log(`✅ All exercises cached: ${list.length}`)
      } catch (err) {
        console.error('❌ getTherapyExercises error:', err)
        setAllExercises([])
      } finally {
        setLoadingAllExercises(false)
      }
    }

    fetchAllExercises()
  }, [idsReady, clinicId, branchId])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────────────────────────────────────────────────────
     STEP 4 — When a program is selected, extract its therophy[] array and
               build the therapy library. No API call needed here — the
               full program object (with therophy[]) is already in state.
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedProgramId || !selectedProgramObj) {
      setTherapyLibrary([])
      setTherapyState({})
      return
    }

    // therophy[] lives inside the program object returned by the API
    const therapies = selectedProgramObj?.therophy ?? []

    if (!therapies.length) {
      console.warn('⚠️ Selected program has no therophy[] array:', selectedProgramObj)
      setTherapyLibrary([])
      setTherapyState({})
      return
    }

    const lib = therapies.map(t => ({
      therapyId:   t.theraphyId,
      therapyName: t.theraphyName,
    }))

    console.log(`✅ Therapy library built: ${lib.length} therapies`, lib)
    setTherapyLibrary(lib)

    // Init therapy state — all checked, exercises empty (filled in STEP 5)
    const initState = {}
    lib.forEach(({ therapyName }) => {
      initState[therapyName] = { checked: true, exercises: [] }
    })
    setTherapyState(initState)

  }, [selectedProgramId, selectedProgramObj])

  /* ────────────────────────────────────────────────────────────────────────
     STEP 5 — Once both therapyLibrary AND allExercises are ready,
               filter exercises per therapy using theraphyId.
               Runs whenever either changes (e.g. new program selected
               or exercise cache just arrived).
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!therapyLibrary.length) return
    // Wait until exercises are loaded (don't overwrite with empty arrays)
    if (loadingAllExercises) return

    setTherapyState(prev => {
      const updated = { ...prev }

      therapyLibrary.forEach(({ therapyId, therapyName }) => {
        const matched = allExercises.filter(ex => {
          const exTherapyId = String(
            ex.theraphyId || ex.therapyId || ex.therapy_id || ''
          )
          return exTherapyId === String(therapyId)
        })

        console.log(`🎯 "${therapyName}" (id=${therapyId}) → ${matched.length} exercises`)

        updated[therapyName] = {
          ...(updated[therapyName] || { checked: true }),
          exercises: matched.map(ex => ({
            ...ex,
            sessions:       ex.sessions       ?? '',
            sets:           ex.sets           ?? '',
            reps:           ex.reps           ?? '',
            frequencyCount: ex.frequencyCount ?? '',
            frequencyUnit:  ex.frequencyUnit  ?? 'Week',
          })),
        }
      })

      return updated
    })
  }, [therapyLibrary, allExercises, loadingAllExercises])

  /* ── Therapy helpers ── */
  const toggleTherapy = name =>
    setTherapyState(prev => ({ ...prev, [name]: { ...prev[name], checked: !prev[name].checked } }))

  const updateExercises = (name, updated) =>
    setTherapyState(prev => ({ ...prev, [name]: { ...prev[name], exercises: updated } }))

  const allChecked   = therapyLibrary.length > 0 && therapyLibrary.every(t => therapyState[t.therapyName]?.checked)
  const checkedCount = therapyLibrary.filter(t => therapyState[t.therapyName]?.checked).length

  const toggleAll = () => {
    const next = !allChecked
    setTherapyState(prev => {
      const u = { ...prev }
      therapyLibrary.forEach(({ therapyName }) => { u[therapyName] = { ...u[therapyName], checked: next } })
      return u
    })
  }

  /* ── Mode change ── */
  const handleModeChange = val => {
    setMode(val)
    setSelectedProgramId(null)
    setSelectedProgramObj(null)
    setTherapyLibrary([])
    setTherapyState({})
  }

  /* ── Program selection — fetch full detail by programId ── */
  const handleProgramChange = async (id, obj) => {
    if (!id) {
      setSelectedProgramId(null)
      setSelectedProgramObj(null)
      setTherapyLibrary([])
      setTherapyState({})
      return
    }

    setSelectedProgramId(id)
    setSelectedProgramObj(null)  // clear while loading
    setTherapyLibrary([])
    setTherapyState({})
    setLoadingProgramDetail(true)

    try {
      // GET /clinic-admin/program/getBycIdAndbId/{clinicId}/{branchId}/{programId}
      const detail = await getProgramById(clinicId, branchId, id)
      console.log('✅ Program detail fetched:', detail)
      setSelectedProgramObj(detail)  // therophy[] lives inside this object
    } catch (err) {
      console.error('❌ getProgramById error:', err)
      // fall back to the summary object from the list (may lack therophy[])
      setSelectedProgramObj(obj)
    } finally {
      setLoadingProgramDetail(false)
    }
  }

  /* ── Next ── */
  const handleNext = () => {
    const selectedTherapies = therapyLibrary
      .filter(t => therapyState[t.therapyName]?.checked)
      .map(t => ({
        therapyId:   t.therapyId,
        therapyName: t.therapyName,
        exercises:   therapyState[t.therapyName]?.exercises || [],
      }))

    const payload = {
      mode, therapistId, therapistName,
      selectedProgramId, selectedProgramObj,
      selectedTherapies,
      modalitiesUsed, patientResponse, manualTherapy, precautions,
    }
    console.log('🚀 TherapySession payload:', payload)
    onNext?.(payload)
  }

  /* ── Derived loading flags ── */
  const loadingExercises = loadingAllExercises || loadingProgramDetail
  const loadingAnything  = loadingPrograms || loadingAllExercises || loadingProgramDetail

  /* ── Show a "waiting for IDs" state if init not done yet ── */
  const initPending = !clinicId

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

        {/* ── Init pending banner ── */}
        {initPending && (
          <div style={{ marginBottom: 16, padding: '10px 18px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, fontSize: '0.85rem', color: '#856404', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⏳ Resolving clinic & branch info…
          </div>
        )}

        {/* ══ 1. SESSION TYPE + PROGRAM SELECTOR ═══════════════════════ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader emoji="⚙️" title="Session Type" />

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <RadioBtn label="Program" emoji="🎯" value="program" active={mode === 'program'} onClick={handleModeChange} />
              <RadioBtn label="Package" emoji="📦" value="package" active={mode === 'package'} onClick={handleModeChange} />
            </div>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1.5px solid #e3eef8' }}>
              <Field label={mode === 'program' ? 'Select Program' : 'Select Package'}>
                <ProgramDropdown
                  programs={programs}
                  loading={loadingPrograms}
                  value={selectedProgramId}
                  onChange={handleProgramChange}
                  mode={mode}
                />
              </Field>
              {!loadingPrograms && !initPending && programs.length === 0 && (
                <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
                  No {mode === 'program' ? 'programs' : 'packages'} found for this branch.
                </p>
              )}
            </div>
          </CCardBody>
        </CCard>

        {/* ══ 2. ASSIGN THERAPIST ═══════════════════════════════════════ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader emoji="👤" title="Assign Therapist" />
            <TherapistSearch
              therapists={therapists}
              loading={loadingTherapists}
              value={therapistId}
              name={therapistName}
              onChange={(id, nm) => { setTherapistId(id); setTherapistName(nm) }}
            />
          </CCardBody>
        </CCard>

        {/* ══ 3. THERAPIES & EXERCISES ══════════════════════════════════ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader
              emoji={mode === 'program' ? '🎯' : '📦'}
              title={mode === 'program' ? 'Program — Therapies & Exercises' : 'Package — Therapies & Exercises'}
              subtitle={
                selectedProgramId
                  ? loadingExercises
                    ? 'Loading exercises…'
                    : `${checkedCount} / ${therapyLibrary.length} therapies selected`
                  : `Select a ${mode} above to view therapies`
              }
            />

            {/* No program selected */}
            {!selectedProgramId && !loadingAnything && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{mode === 'program' ? '🎯' : '📦'}</div>
                Please select a {mode} above to load its therapies and exercises.
              </div>
            )}

            {/* Programs loading */}
            {loadingPrograms && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#6b9fc7', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>⏳</div>
                Loading {mode}s…
              </div>
            )}

            {/* Selected program has no therapies */}
            {selectedProgramId && !loadingPrograms && therapyLibrary.length === 0 && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                No therapies found in the selected {mode}.
              </div>
            )}

            {/* Therapies list */}
            {selectedProgramId && !loadingPrograms && therapyLibrary.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '8px 14px', background: '#f0f6ff', borderRadius: 8, border: '1px solid #d0e4f7' }}>
                  <span style={{ fontSize: '0.83rem', color: '#4a6a8a', fontWeight: 600 }}>
                    {checkedCount} of {therapyLibrary.length} therapies selected
                  </span>
                  <button type="button" onClick={toggleAll} style={{
                    padding: '4px 14px', borderRadius: 6, border: '1.5px solid #1a5fa8',
                    background: allChecked ? '#1a5fa8' : '#f0f7ff',
                    color: allChecked ? '#fff' : '#1a5fa8',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    {allChecked ? '☑ Deselect All' : '☐ Select All'}
                  </button>
                </div>

                {therapyLibrary.map(({ therapyName }) => {
                  const state = therapyState[therapyName]
                  if (!state) return null
                  return (
                    <TherapyBlock
                      key={therapyName}
                      therapy={therapyName}
                      checked={state.checked}
                      onToggle={() => toggleTherapy(therapyName)}
                      exercises={state.exercises}
                      onUpdateExercises={updated => updateExercises(therapyName, updated)}
                      loading={loadingExercises}
                    />
                  )
                })}
              </>
            )}
          </CCardBody>
        </CCard>

        {/* ══ 4. SESSION DETAILS ════════════════════════════════════════ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader emoji="📋" title="Session Details" />

            <div style={{ marginBottom: 20 }}>
              <Field label="Modalities Used">
                <ModalityPicker selected={modalitiesUsed} onChange={setModalitiesUsed} />
              </Field>
              {modalitiesUsed.length > 0 && (
                <div style={{ marginTop: 8, padding: '6px 12px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #c8ddf0', fontSize: '0.82rem', color: '#1a3a5c' }}>
                  <strong>Selected ({modalitiesUsed.length}):</strong>{' '}{modalitiesUsed.join(' • ')}
                  <button type="button" onClick={() => setModalitiesUsed([])}
                    style={{ marginLeft: 12, background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', padding: 0, fontFamily: 'inherit' }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <Field label="Patient Response">
                <TextInput value={patientResponse} onChange={setPatientResponse} placeholder="Describe patient's response to the session..." />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px' }}>
              <Field label="Manual Therapy">
                <TextInput value={manualTherapy} onChange={setManualTherapy} placeholder="e.g. Soft tissue mobilization" />
              </Field>
              <Field label="Precautions">
                <Textarea value={precautions} onChange={setPrecautions} placeholder="e.g. Avoid heavy lifting and sudden movements" rows={3} />
              </Field>
            </div>
          </CCardBody>
        </CCard>

      </CContainer>

      {/* ── Sticky bottom bar ── */}
      <div className="position-fixed bottom-0" style={{ left: 0, right: 0, background: '#a5c4d4', display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '10px 24px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}>
        <Button customColor="#ffffff" color="#7e3a93" onClick={handleNext}
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          Next
        </Button>
      </div>
    </div>
  )
}

export default TherapySession