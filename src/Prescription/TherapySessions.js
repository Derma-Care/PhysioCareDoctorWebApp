import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import {
  getTherapyExercises,
  getTodayAppointments,
  getTherapists,
  getProgramsByBranch,
  getPrograms,

  getProgramsByBranchAndId,
} from '../Auth/Auth'

/* ─── Constants ──────────────────────────────────────────────────────────── */
const MODALITY_OPTIONS = [
  'IFT', 'Ultrasound Therapy', 'Hot Pack', 'Cold Pack',
  'TENS', 'Laser Therapy', 'Traction', 'Wax Bath',
]
const FREQ_UNITS = ['Day', 'Week', 'Month']

/* ─── Frequency Parser ───────────────────────────────────────────────────── */
const parseFrequency = (raw) => {
  if (raw === null || raw === undefined || raw === '') return { count: '', unit: 'Day' }
  const str = String(raw).toLowerCase().trim()
  if (/^\d+$/.test(str)) return { count: str, unit: 'Day' }
  const unitMap = {
    day: 'Day', daily: 'Day',
    week: 'Week', weekly: 'Week',
    month: 'Month', monthly: 'Month',
  }
  const countMatch = str.match(/(\d+)/)
  const count = countMatch ? countMatch[1] : ''
  let unit = 'Day'
  for (const [key, val] of Object.entries(unitMap)) {
    if (str.includes(key)) { unit = val; break }
  }
  return { count, unit }
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
  const [open, setOpen] = useState(false)

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
const getId = p => String(p.id || p._id || p.programId || '')

const ProgramDropdown = ({ programs, loading, value, onChange, mode }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

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
            const id = getId(p)
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
    onBlur={e => { e.target.style.boxShadow = 'none' }}
  />
)

/* ─── Always-Editable Frequency Cell ─────────────────────────────────────── */
const FreqCell = ({ count, unit, onCountChange, onUnitChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <input type="number" min="0" value={count ?? ''} placeholder="0"
      onChange={e => onCountChange(e.target.value)}
      style={{ width: 50, textAlign: 'center', border: '1.5px solid #1a5fa8', borderRadius: 6, padding: '4px 2px', fontSize: '0.82rem', color: '#1a3a5c', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
      onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(26,95,168,0.15)' }}
      onBlur={e => { e.target.style.boxShadow = 'none' }}
    />
    <select value={unit ?? 'Day'} onChange={e => onUnitChange(e.target.value)}
      style={{ border: '1.5px solid #1a5fa8', borderRadius: 6, padding: '4px 6px', fontSize: '0.78rem', color: '#1a3a5c', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
      {FREQ_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  </div>
)

/* ─── Exercise Checkbox ──────────────────────────────────────────────────── */
const ExerciseCheckbox = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
      border: `2px solid ${checked ? '#1a5fa8' : '#a0bcda'}`,
      background: checked ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.18s', margin: 'auto',
    }}
  >
    {checked && <span style={{ color: '#fff', fontSize: '0.65rem', lineHeight: 1, fontWeight: 700 }}>✓</span>}
  </div>
)

/* ─── Exercise Table ─────────────────────────────────────────────────────── */
const ExerciseTable = ({ exercises, onUpdate }) => {
  const setField = (idx, field, val) =>
    onUpdate(exercises.map((ex, i) => i === idx ? { ...ex, [field]: val } : ex))

  const toggleExercise = (idx) =>
    onUpdate(exercises.map((ex, i) => i === idx ? { ...ex, _checked: !ex._checked } : ex))

  const allChecked = exercises.length > 0 && exercises.every(ex => ex._checked !== false)
  const toggleAll = () => {
    const next = !allChecked
    onUpdate(exercises.map(ex => ({ ...ex, _checked: next })))
  }

  if (!exercises || exercises.length === 0) return (
    <div style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.83rem', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', marginTop: 8 }}>
      No exercises available for this therapy
    </div>
  )

  const checkedCount = exercises.filter(ex => ex._checked !== false).length

  const TH = ({ children, center }) => (
    <th style={{ padding: '9px 10px', textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.82rem' }}>{children}</th>
  )
  const TD = ({ children, style = {} }) => (
    <td style={{ padding: '7px 10px', verticalAlign: 'middle', ...style }}>{children}</td>
  )

  return (
    <div style={{ overflowX: 'auto', marginTop: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, padding: '5px 10px',
        background: '#f8fbff', borderRadius: 6, border: '1px solid #e0ecf8',
      }}>
        <span style={{ fontSize: '0.78rem', color: '#4a6a8a', fontWeight: 600 }}>
          {checkedCount} of {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} selected
        </span>
        <button type="button" onClick={toggleAll} style={{
          padding: '3px 12px', borderRadius: 5,
          border: '1.5px solid #1a5fa8',
          background: allChecked ? '#1a5fa8' : '#f0f7ff',
          color: allChecked ? '#fff' : '#1a5fa8',
          fontWeight: 700, fontSize: '0.75rem',
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}>
          {allChecked ? '☑ Deselect All' : '☐ Select All'}
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: '#1a3a5c' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
            <TH center>
              <div onClick={toggleAll} style={{
                width: 16, height: 16, borderRadius: 3, cursor: 'pointer',
                border: `2px solid ${allChecked ? '#fff' : 'rgba(255,255,255,0.6)'}`,
                background: allChecked ? 'rgba(255,255,255,0.3)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto',
              }}>
                {allChecked && <span style={{ color: '#fff', fontSize: '0.6rem', lineHeight: 1, fontWeight: 900 }}>✓</span>}
              </div>
            </TH>
            <TH>#</TH>
            <TH>Exercise Name</TH>
            <TH center>Sessions</TH>
            <TH center>Sets</TH>
            <TH center>Reps</TH>
            <TH>Frequency</TH>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, idx) => {
            const isChecked = ex._checked !== false
            return (
              <tr key={idx} style={{
                backgroundColor: !isChecked ? '#f0f0f0' : idx % 2 === 0 ? '#f5f9ff' : '#fff',
                borderBottom: '1px solid #e3eef8',
                opacity: isChecked ? 1 : 0.5,
                transition: 'all 0.18s',
                display: isChecked ? 'table-row' : 'none',
              }}>
                <TD style={{ textAlign: 'center', width: 32 }}>
                  <ExerciseCheckbox checked={isChecked} onChange={() => toggleExercise(idx)} />
                </TD>
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
                    onUnitChange={v => setField(idx, 'frequencyUnit', v)}
                  />
                </TD>
              </tr>
            )
          })}
        </tbody>
      </table>

      {exercises.some(ex => ex._checked === false) && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#fdf4f4', border: '1px dashed #f5c6c6', borderRadius: 8 }}>
          <span style={{ fontSize: '0.75rem', color: '#9b5555', fontWeight: 700, marginRight: 8 }}>Hidden exercises:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {exercises.map((ex, idx) => {
              if (ex._checked !== false) return null
              const name = ex.exerciseName || ex.name || ex.exercise_name || `Exercise ${idx + 1}`
              return (
                <button key={idx} type="button" onClick={() => toggleExercise(idx)} title="Click to re-enable"
                  style={{ padding: '3px 10px', borderRadius: 12, border: '1.5px solid #f5c6c6', background: '#fff0f0', color: '#9b5555', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ffe0e0'; e.currentTarget.style.borderColor = '#e53e3e' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.borderColor = '#f5c6c6' }}>
                  <span style={{ fontSize: '0.7rem' }}>＋</span> {name}
                </button>
              )
            })}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#b07a7a' }}>Click any hidden exercise to re-enable it</p>
        </div>
      )}
    </div>
  )
}

/* ─── Therapy Block ──────────────────────────────────────────────────────── */
const TherapyBlock = ({ therapy, checked, onToggle, exercises, onUpdateExercises, loading }) => (
  <div style={{ border: `2px solid ${checked ? '#1a5fa8' : '#dde8f2'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.18s', marginBottom: 12 }}>
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: checked ? 'linear-gradient(135deg,#eef5ff,#ddeeff)' : '#f5f8fc', cursor: 'pointer', userSelect: 'none', borderBottom: checked ? '1.5px solid #c8ddf0' : 'none' }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? '#1a5fa8' : '#a0bcda'}`, background: checked ? 'linear-gradient(135deg,#1a5fa8,#3a8fd4)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <span style={{ color: '#fff', fontSize: '0.72rem', lineHeight: 1, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.93rem', color: '#1a3a5c', flex: 1 }}>{therapy}</span>
      {loading
        ? <span style={{ fontSize: '0.78rem', color: '#6b9fc7', fontWeight: 500 }}>Loading exercises...</span>
        : <span style={{ fontSize: '0.78rem', color: checked ? '#1a5fa8' : '#8fa8c0', fontWeight: 600 }}>
          {checked
            ? (() => {
              const total = exercises.length
              const active = exercises.filter(ex => ex._checked !== false).length
              return `${active} / ${total} exercise${total !== 1 ? 's' : ''}`
            })()
            : 'Hidden'}
        </span>
      }
      <span style={{ fontSize: '0.8rem', color: checked ? '#1a5fa8' : '#b0c4d8', transform: checked ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block' }}>▼</span>
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
   seed = formData.therapySessions (persisted between tab switches)
══════════════════════════════════════════════════════════════════════════ */
const TherapySession = ({ seed = {}, onNext }) => {

  // ── Restore previously saved session (from first session entry) ──────────
  const savedSession = Array.isArray(seed.sessions) ? (seed.sessions[0] ?? {}) : {}

  /* ── Mode — restored from seed ── */
  const [mode, setMode] = useState(savedSession.serviceType ?? seed.mode ?? 'program')

  /* ── Clinic / Branch IDs ── */
  const [clinicId, setClinicId] = useState('')
  const [branchId, setBranchId] = useState('')
  const idsReady = clinicId && branchId

  /* ── Therapists ── */
  const [therapists, setTherapists] = useState([])
  const [loadingTherapists, setLoadingTherapists] = useState(false)
  // Restore from seed
  const [therapistId, setTherapistId] = useState(savedSession.therapistId ?? seed.therapistId ?? '')
  const [therapistName, setTherapistName] = useState(savedSession.therapistName ?? seed.therapistName ?? '')

  /* ── Programs ── */
  const [programs, setPrograms] = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)

  /* ── All exercises (cached once per branch) ── */
  const [allExercises, setAllExercises] = useState([])
  const [loadingAllExercises, setLoadingAllExercises] = useState(false)
  const exercisesFetchedRef = useRef(false)

  /* ── Selected program — restore from seed ── */
  const [selectedProgramId, setSelectedProgramId] = useState(savedSession.programId ?? seed.selectedProgramId ?? null)
  const [selectedProgramObj, setSelectedProgramObj] = useState(null)
  const [loadingProgramDetail, setLoadingProgramDetail] = useState(false)

  /* ── Therapy library built from program.therophy[] ── */
  const [therapyLibrary, setTherapyLibrary] = useState([])

  /* ── Therapy state ── */
  const [therapyState, setTherapyState] = useState({})
  const [therophyDataState, setTherophyDataState] = useState({})

  /* ── Session Details — restored from seed ── */
  const [modalitiesUsed, setModalitiesUsed] = useState(savedSession.modalitiesUsed ?? seed.modalitiesUsed ?? [])
  const [patientResponse, setPatientResponse] = useState(savedSession.patientResponse ?? seed.patientResponse ?? '')
  const [manualTherapy, setManualTherapy] = useState(savedSession.manualTherapy ?? seed.manualTherapy ?? '')
  const [precautions, setPrecautions] = useState(savedSession.precautions ?? seed.precautions ?? '')
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const [selectedPackageObj, setSelectedPackageObj] = useState(null)

  const [selectedTherapy, setSelectedTherapy] = useState(null)
  /* ── Restore previously selected therapies from seed into state ──────────
     This runs once after programs/exercises are loaded; it re-populates
     therapyState / therophyDataState so the user's selections are visible. ── */
  const seedRestoredRef = useRef(false)

  /* ────────────────────────────────────────────────────────────────────────
     STEP 1 — Resolve clinicId & branchId
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const resolveIds = async () => {
      const cId = localStorage.getItem('clinicId') || localStorage.getItem('hospitalId') || ''
      if (!cId) { console.warn('⚠️ No clinicId in localStorage'); return }
      let bId = ''
      try {
        const res = await getTodayAppointments()
        bId = res?.data?.[0]?.branchId || ''
      } catch (err) { console.error('❌ getTodayAppointments error:', err) }
      setClinicId(cId)
      setBranchId(bId)
    }
    resolveIds()
  }, [])

  /* ────────────────────────────────────────────────────────────────────────
     STEP 2 — Fetch therapists + programs once IDs are ready
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!idsReady) return

    const fetchTherapistsAndPrograms = async () => {
      setLoadingTherapists(true)
      setLoadingPrograms(true)
      try {
        const [therapistData, branchPrograms] = await Promise.allSettled([
          getTherapists(clinicId, branchId),
          branchId ? getProgramsByBranch(clinicId, branchId) : Promise.resolve([]),
        ])

        const tList = therapistData.status === 'fulfilled'
          ? (Array.isArray(therapistData.value) ? therapistData.value : [])
          : []
        setTherapists(tList)

        let pList = branchPrograms.status === 'fulfilled'
          ? (Array.isArray(branchPrograms.value) ? branchPrograms.value : [])
          : []

        if (!pList.length) {
          try {
            const allPrograms = await getPrograms()
            pList = Array.isArray(allPrograms) ? allPrograms : []
          } catch (e) { console.error('❌ getPrograms fallback error:', e) }
        }
        setPrograms(pList)
      } catch (err) {
        console.error('❌ fetchTherapistsAndPrograms error:', err)
      } finally {
        setLoadingTherapists(false)
        setLoadingPrograms(false)
      }
    }

    fetchTherapistsAndPrograms()
  }, [idsReady, clinicId, branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────────────────────────────────────────────────────
     STEP 2b — If seed has a selectedProgramId, re-fetch program detail
               so therapies are restored after tab switch
  ──────────────────────────────────────────────────────────────────────── */
  // useEffect(() => {
  //   if (!idsReady || !selectedProgramId || selectedProgramObj || loadingProgramDetail) return
  //   setLoadingProgramDetail(true)
  //   getProgramsByBranchAndId(clinicId, branchId, selectedProgramId)
  //     .then(detail => { if (detail) setSelectedProgramObj(detail) })
  //     .catch(err => console.error('❌ re-fetch program detail error:', err))
  //     .finally(() => setLoadingProgramDetail(false))
  // }, [idsReady, selectedProgramId, clinicId, branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────────────────────────────────────────────────────
     STEP 3 — Pre-fetch ALL exercises for this branch (cached)
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
      } catch (err) {
        console.error('❌ getTherapyExercises error:', err)
        setAllExercises([])
      } finally {
        setLoadingAllExercises(false)
      }
    }
    fetchAllExercises()
  }, [idsReady, clinicId, branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────────────────────────────────────────────────────
     STEP 4a — When program selected: build therapy library from therophy[]
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedProgramId || !selectedProgramObj) {
      setTherapyLibrary([])
      setTherapyState({})
      return
    }
    const therapies = selectedProgramObj?.therophyData ?? []
    if (!therapies.length) { setTherapyLibrary([]); setTherapyState({}); return }

    const lib = therapies.map(t => ({ therapyId: t.theraphyId, therapyName: t.theraphyName }))
    setTherapyLibrary(lib)

    const initState = {}
    lib.forEach(({ therapyName }) => {
      initState[therapyName] = { checked: true, exercises: [] }
    })
    setTherapyState(initState)
  }, [selectedProgramId, selectedProgramObj])

  /* ────────────────────────────────────────────────────────────────────────
     STEP 4b — therophyData[] path
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedProgramObj?.therophyData?.length) { setTherophyDataState({}); return }

    const init = {}
    selectedProgramObj.therophyData.forEach((therapy, idx) => {
      const key = therapy.id || therapy.therapyName || index
      init[key] = {
        checked: true,
        exercises: (therapy.exercises || []).map(ex => {
          const freq = parseFrequency(ex.frequency)
          return {
            ...ex,
            exerciseName: ex.exerciseName || ex.name || ex.exercise_name || '',
            sessions: ex.session ?? ex.sessions ?? '',
            sets: ex.sets ?? '',
            reps: ex.repetitions ?? ex.reps ?? '',
            frequencyCount: freq.count,
            frequencyUnit: freq.unit,
            _checked: true,
          }
        }),
      }
    })
    setTherophyDataState(init)
  }, [selectedProgramObj])

  /* ────────────────────────────────────────────────────────────────────────
     STEP 5 — Filter cached exercises per therapy using theraphyId
  ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!therapyLibrary.length || loadingAllExercises) return
    setTherapyState(prev => {
      const updated = { ...prev }
      therapyLibrary.forEach(({ therapyId, therapyName }) => {
        const matched = allExercises.filter(ex => {
          const exTherapyId = String(ex.theraphyId || ex.therapyId || ex.therapy_id || '')
          return exTherapyId === String(therapyId)
        })
        updated[therapyName] = {
          ...(updated[therapyName] || { checked: true }),
          exercises: matched.map(ex => {
            const freq = parseFrequency(ex.frequency ?? ex.frequencyCount)
            return {
              ...ex,
              sessions: ex.sessions ?? '',
              sets: ex.sets ?? '',
              reps: ex.reps ?? '',
              frequencyCount: freq.count,
              frequencyUnit: freq.unit,
              _checked: true,
            }
          }),
        }
      })
      return updated
    })
  }, [therapyLibrary, allExercises, loadingAllExercises])

  /* ── Therapy helpers (therophy[] path) ── */
  const toggleTherapy = name =>
    setTherapyState(prev => ({ ...prev, [name]: { ...prev[name], checked: !prev[name].checked } }))
  const updateExercises = (name, updated) =>
    setTherapyState(prev => ({ ...prev, [name]: { ...prev[name], exercises: updated } }))

  /* ── Therapy helpers (therophyData[] path) ── */
  const toggleTherophyData = key =>
    setTherophyDataState(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }))
  const updateTherophyDataExercises = (key, updated) =>
    setTherophyDataState(prev => ({ ...prev, [key]: { ...prev[key], exercises: updated } }))

  /* ── Select All helpers ── */
  const hasTherophyData = (selectedProgramObj?.therophyData?.length ?? 0) > 0
  console.log("selectedProgramObj:", selectedProgramObj)
  console.log("therophyData:", selectedProgramObj?.therophyData)
  const tdKeys = Object.keys(therophyDataState)
  const tdAllChecked = tdKeys.length > 0 && tdKeys.every(k => therophyDataState[k]?.checked)
  const tdCheckedCnt = tdKeys.filter(k => therophyDataState[k]?.checked).length
  const tlAllChecked = therapyLibrary.length > 0 && therapyLibrary.every(t => therapyState[t.therapyName]?.checked)
  const tlCheckedCnt = therapyLibrary.filter(t => therapyState[t.therapyName]?.checked).length
  const allChecked = hasTherophyData ? tdAllChecked : tlAllChecked
  const checkedCount = hasTherophyData ? tdCheckedCnt : tlCheckedCnt
  const totalCount = hasTherophyData ? tdKeys.length : therapyLibrary.length

  const toggleAll = () => {
    if (hasTherophyData) {
      const next = !tdAllChecked
      setTherophyDataState(prev => { const u = { ...prev }; tdKeys.forEach(k => { u[k] = { ...u[k], checked: next } }); return u })
    } else {
      const next = !tlAllChecked
      setTherapyState(prev => { const u = { ...prev }; therapyLibrary.forEach(({ therapyName }) => { u[therapyName] = { ...u[therapyName], checked: next } }); return u })
    }
  }

  /* ── Mode change ── */
  const handleModeChange = val => {
    setMode(val)
    setSelectedProgramId(null)
    setSelectedProgramObj(null)
    setTherapyLibrary([])
    setTherapyState({})
    setTherophyDataState({})
  }

  /* ── Program selection ── */
  const handleProgramChange = async (id, obj) => {
    if (!id) {
      setSelectedProgramId(id)
      setSelectedProgramObj(null)
      setTherapyLibrary([])
      setTherapyState({})
      setTherophyDataState({})
      return
    }
    setSelectedProgramId(id)
    setSelectedProgramObj(null)
    setTherapyLibrary([])
    setTherapyState({})
    setTherophyDataState({})
    setLoadingProgramDetail(true)
    try {
      const detail = await getProgramsByBranchAndId(clinicId, branchId, id)
      setSelectedProgramObj(detail?.data || detail)
    } catch (err) {
      console.error('❌ getProgramById error:', err)
      setSelectedProgramObj(obj)
    } finally {
      setLoadingProgramDetail(false)
    }
  }

  /* ── Next — builds payload matching required API structure ── */
  const handleNext = () => {
    let selectedTherapies = []

    if (hasTherophyData) {
      selectedTherapies = (selectedProgramObj?.therophyData ?? [])
        .filter((therapy, idx) => {
          const key = therapy.therapyName || String(idx)
          return therophyDataState[key]?.checked
        })
        .map((therapy, idx) => {
          const key = therapy.therapyName || String(idx)
          return {
            therapyId: therapy.therapyId || therapy.id,
            therapyName: therapy.therapyName,
            exercises: (therophyDataState[key]?.exercises || []).filter(ex => ex._checked !== false),
          }
        })
    } else {
      selectedTherapies = therapyLibrary
        .filter(t => therapyState[t.therapyName]?.checked)
        .map(t => ({
          therapyId: t.therapyId,
          therapyName: t.therapyName,
          exercises: (therapyState[t.therapyName]?.exercises || []).filter(ex => ex._checked !== false),
        }))
    }

    const payload = {
      // serviceType is "program" or "package" based on the selected radio
      mode,
      serviceType: mode,   // ← explicitly named for clarity in parent
      therapistId,
      therapistName,
      selectedProgramId,
      selectedProgramObj,
      selectedTherapies,
      modalitiesUsed,
      patientResponse,
      manualTherapy,
      precautions,
    }

    console.log('🚀 TherapySession payload:', payload)
    onNext?.(payload)
  }

  /* ── Derived flags ── */
  const loadingExercises = loadingAllExercises || loadingProgramDetail
  const loadingAnything = loadingPrograms || loadingAllExercises || loadingProgramDetail
  const initPending = !clinicId
  const showTherapies =
    (mode === 'program' && selectedProgramId) ||
    (mode === 'package' && selectedPackageId) ||
    (mode === 'therapy') ||
    (mode === 'exercise')

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-1">

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
              <RadioBtn label="Package" emoji="📦" value="package" active={mode === 'package'} onClick={handleModeChange} />
              <RadioBtn label="Program" emoji="🎯" value="program" active={mode === 'program'} onClick={handleModeChange} />
              <RadioBtn label="Therapy" emoji="📦" value="therapy" active={mode === 'therapy'} onClick={handleModeChange} />
              <RadioBtn label="Exercise" emoji="📦" value="exercise" active={mode === 'exercise'} onClick={handleModeChange} />
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
                {mode === 'package' && (
                  <>
                    <ProgramDropdown
                      programs={programs}
                      value={selectedPackageId}
                      onChange={(id, obj) => {
                        setSelectedPackageId(id)
                        setSelectedPackageObj(obj)
                      }}
                      mode="package"
                    />

                    {/* Show programs inside package */}
                    {selectedPackageObj?.programs?.map((prog, i) => (
                      <div key={i}>
                        <h6>{prog.programName}</h6>

                        {prog.therophyData?.map((therapy, idx) => (
                          <TherapyBlock
                            key={idx}
                            therapy={therapy.therapyName}
                            checked={true}
                            onToggle={() => { }}
                            exercises={therapy.exercises || []}
                            onUpdateExercises={() => { }}
                          />
                        ))}
                      </div>
                    ))}
                  </>
                )}
                {mode === 'therapy' && (
                  <>
                    {[...new Set(allExercises.map(e => e.therapyName))].map((therapy, i) => (
                      <TherapyBlock
                        key={i}
                        therapy={therapy}
                        checked={true}
                        onToggle={() => setSelectedTherapy(therapy)}
                        exercises={allExercises.filter(e => e.therapyName === therapy)}
                        onUpdateExercises={() => { }}
                      />
                    ))}
                  </>
                )}
                {mode === 'exercise' && (
                  <ExerciseTable
                    exercises={allExercises.map(ex => ({
                      ...ex,
                      _checked: true
                    }))}
                    onUpdate={() => { }}
                  />
                )}
              </Field>
              {!loadingPrograms && !initPending && programs.length === 0 && (
                <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
                  No {mode} found for this branch.
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
                mode === 'program'
                  ? selectedProgramId
                    ? `${checkedCount} / ${totalCount} therapies selected`
                    : 'Select program'
                  : mode === 'package'
                    ? selectedPackageId
                      ? 'Programs & therapies loaded'
                      : 'Select package'
                    : mode === 'therapy'
                      ? 'Select therapies'
                      : 'Select exercises'
              }
            />

            {!selectedProgramId && !loadingAnything && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{mode === 'program' ? '🎯' : '📦'}</div>
                Please select a {mode} above to load its therapies and exercises.
              </div>
            )}

            {(loadingPrograms || loadingProgramDetail) && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#6b9fc7', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>⏳</div>
                {loadingPrograms ? `Loading ${mode}s…` : 'Loading program details…'}
              </div>
            )}

            {!showTherapies && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '8px 14px', background: '#f0f6ff', borderRadius: 8, border: '1px solid #d0e4f7' }}>
                  <span style={{ fontSize: '0.83rem', color: '#4a6a8a', fontWeight: 600 }}>
                    {checkedCount} of {totalCount} therapies selected
                  </span>
                  <button type="button" onClick={toggleAll} style={{
                    padding: '4px 14px', borderRadius: 6, border: '1.5px solid #1a5fa8',
                    background: allChecked ? '#1a5fa8' : '#f0f7ff',
                    color: allChecked ? '#fff' : '#1a5fa8',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {allChecked ? '☑ Deselect All' : '☐ Select All'}
                  </button>
                </div>

                {hasTherophyData && selectedProgramObj.therophyData.map((therapy, index) => {
                  const key = therapy.therapyName || String(index)
                  const ts = therophyDataState[key] || { checked: true, exercises: [] }
                  return (
                    <TherapyBlock
                      key={therapy.id || index}
                      therapy={therapy.therapyName}
                      checked={ts.checked}
                      onToggle={() => toggleTherophyData(key)}
                      exercises={ts.exercises}
                      onUpdateExercises={updated => updateTherophyDataExercises(key, updated)}
                      loading={loadingExercises}
                    />
                  )
                })}

                {!hasTherophyData && therapyLibrary.map((t, index) => (
                  <TherapyBlock
                    key={t.therapyId || index}
                    therapy={t.therapyName}
                    checked={therapyState[t.therapyName]?.checked ?? true}
                    onToggle={() => toggleTherapy(t.therapyName)}
                    exercises={therapyState[t.therapyName]?.exercises || []}
                    onUpdateExercises={updated => updateExercises(t.therapyName, updated)}
                    loading={loadingExercises}
                  />
                ))}
              </>
            )}

            {/* {selectedProgramId && !loadingAnything && hasTherophyData === false && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🔍</div>
                No therapies found in the selected {mode}.
              </div>
            )} */}
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