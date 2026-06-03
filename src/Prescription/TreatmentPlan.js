import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import {
  getTherapyExercises,
  getTherapists,
  getProgramsByBranch,
  getPackagesByBranch,
  getTherapiesByBranch,
  getExercisesByBranch,
  getProgramsByBranchAndId,
  getTherapiesByBranchAndId,
  getExercisesByBranchAndIdAndId,
  getPackagesByBranchAndId,
} from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'

/* ─── Constants ──────────────────────────────────────────────────────────── */
const FREQ_UNITS = ['Day', 'Week', 'Month']

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const ToastContainer = ({ toasts }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding: '12px 18px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, maxWidth: 360, pointerEvents: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10,
        background: t.type === 'error' ? '#fff5f5' : t.type === 'success' ? '#f0fff4' : '#fffbeb',
        border: `1.5px solid ${t.type === 'error' ? '#fecaca' : t.type === 'success' ? '#6ee7b7' : '#fcd34d'}`,
        color: t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#065f46' : '#92400e',
        animation: 'toastSlide 0.25s ease',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : '⚠️'}</span>
        <span>{t.message}</span>
      </div>
    ))}
  </div>
)

const useToast = () => {
  const [toasts, setToasts] = useState([])
  const show = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  return {
    toasts,
    toastError: useCallback((msg) => show(msg, 'error'), [show]),
    toastSuccess: useCallback((msg) => show(msg, 'success'), [show]),
    toastWarning: useCallback((msg) => show(msg, 'warning'), [show]),
  }
}

/* ─── Frequency Parser ───────────────────────────────────────────────────── */
const parseFrequency = (raw) => {
  if (raw === null || raw === undefined || raw === '') return { count: '', unit: 'Day' }
  const str = String(raw).toLowerCase().trim()
  if (/^\d+$/.test(str)) return { count: str, unit: 'Day' }
  const unitMap = { day: 'Day', daily: 'Day', week: 'Week', weekly: 'Week', month: 'Month', monthly: 'Month' }
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

const cardStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 12,
  backgroundColor: '#FFFFFF',
  boxShadow: '0 4px 24px rgba(27,79,138,0.10)',
  marginBottom: 20,
}

/* ─── Field ──────────────────────────────────────────────────────────────── */
const Field = ({ label, children, required, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
    <label style={labelStyle}>
      {label}
      {required && <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>}
    </label>
    {children}
  </div>
)

/* ─── SectionHeader ──────────────────────────────────────────────────────── */
const SectionHeader = ({ emoji, title, subtitle }) => (
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
      fontSize: 17, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
    }}>{emoji}</div>
    <div>
      <h5 style={{ margin: 0, color: '#1B4F8A', fontWeight: 700, fontSize: '1.05rem' }}>{title}</h5>
      {subtitle && <span style={{ fontSize: '0.8rem', color: '#4a7abf', fontWeight: 500 }}>{subtitle}</span>}
    </div>
  </div>
)

/* ─── Radio Button ───────────────────────────────────────────────────────── */
const RadioBtn = ({ label, emoji, value, active, onClick }) => (
  <button type="button" onClick={() => onClick(value)} style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 10,
    cursor: 'pointer',
    border: `2px solid ${active ? '#1B4F8A' : '#b6cfe8'}`,
    background: active ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#FFFFFF',
    color: active ? '#fff' : '#4a6a8a', fontWeight: active ? 700 : 500, fontSize: '0.95rem',
    transition: 'all 0.18s', boxShadow: active ? '0 3px 12px rgba(27,79,138,0.25)' : 'none',
  }}>
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      border: `2px solid ${active ? 'rgba(255,255,255,0.7)' : '#b6cfe8'}`,
      background: active ? 'rgba(255,255,255,0.25)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
    </span>
    {emoji} {label}
  </button>
)

/* ─── Multi-Therapist Search ─────────────────────────────────────────────── */
const TherapistMultiSearch = ({ therapists, loading, selectedTherapists, onChange, hasError, onRefresh }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [hoveredTherapist, setHoveredTherapist] = useState(null)

  const filtered = therapists.filter(t => {
    const q = search.toLowerCase()
    return (t.therapistId || '').toLowerCase().includes(q) || (t.fullName || '').toLowerCase().includes(q)
  })

  const isSelected = (id) => selectedTherapists.some(t => t.therapistId === id)

  const toggleTherapist = (t) => {
    if (isSelected(t.therapistId)) {
      onChange([])
    } else {
      onChange([t])
    }
    setOpen(false)
  }

  const removeTherapist = (id) => {
    onChange(selectedTherapists.filter(t => t.therapistId !== id))
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={
              loading
                ? 'Loading therapists...'
                : !therapists.length
                  ? 'No therapists available'
                  : 'Search by ID or name to add therapist...'
            }
            disabled={loading}
            style={{
              ...inputStyle,
              opacity: loading ? 0.6 : 1,
              borderColor: hasError ? '#e53e3e' : selectedTherapists.length > 0 ? '#38a169' : '#b6cfe8',
              backgroundColor: hasError ? '#fff5f5' : '#FFFFFF',
              boxShadow: hasError ? '0 0 0 3px rgba(229,62,62,0.12)' : 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setSearch('') }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 700, fontSize: 14, padding: '2px 4px' }}
            >✕</button>
          )}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh therapist list"
            style={{
              width: 38, height: 38, borderRadius: 8, border: '1.5px solid #1B4F8A',
              background: '#f0f6ff', color: '#1B4F8A', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              transition: 'all 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#1B4F8A'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#f0f6ff'; e.currentTarget.style.color = '#1B4F8A' } }}
          >
            {loading ? '⌛' : '🔄'}
          </button>
        )}
      </div>

      {hasError && (
        <div style={{ marginTop: 5, fontSize: '0.78rem', color: '#e53e3e', fontWeight: 600 }}>
          ⚠️ Please assign at least one therapist
        </div>
      )}

      {/* Dropdown */}
      {open && !loading && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff',
          border: '1px solid #b6cfe8', borderRadius: 8, maxHeight: 220, overflowY: 'auto',
          zIndex: 1000, boxShadow: '0 -4px 16px rgba(27,79,138,0.12)', marginBottom: 2,
        }}>
          {filtered.length > 0 ? filtered.map((t, i) => {
            const sel = isSelected(t.therapistId)
            return (
              <div
                key={i}
                onMouseDown={e => { e.preventDefault(); toggleTherapist(t) }}
                style={{
                  padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #eee',
                  background: sel ? '#dceeff' : i % 2 === 0 ? '#f8fbff' : '#fff',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f0f7ff' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = i % 2 === 0 ? '#f8fbff' : '#fff' }}
              >
                {/* checkbox-style indicator */}
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${sel ? '#1B4F8A' : '#a0bcda'}`,
                  background: sel ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>}
                </div>
                <span 
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}
                  onMouseLeave={() => setHoveredTherapist(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: '#1B4F8A', fontSize: '0.9rem' }}>{t.therapistId}</strong>
                    <span style={{ color: '#1a3a5c', fontWeight: 600 }}>— {t.fullName}</span>
                    
                    {/* Service Type Badge */}
                    {Array.isArray(t.services) && t.services.length > 0 && (
                      <span style={{ background: '#e6fffa', border: '1px solid #81e6d9', padding: '2px 8px', borderRadius: 12, fontSize: '0.65rem', color: '#234e52', fontWeight: 700, textTransform: 'capitalize' }}>
                        {t.services.join(', ')}
                      </span>
                    )}

                    {/* View Button placed at the end */}
                    <div 
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={() => setHoveredTherapist(t.therapistId)}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <span style={{ cursor: 'pointer', color: '#319795', fontSize: '0.7rem', padding: '2px 8px', background: '#e6fffa', borderRadius: 12, border: '1px solid #81e6d9', fontWeight: 700 }}>👁️ View Details</span>
                    </div>
                  </div>
                  
                  {/* Expandable Line: Specialization and Expertise */}
                  {hoveredTherapist === t.therapistId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.72rem', color: '#4a5568', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, marginTop: 4 }}>
                      <span><strong style={{ color: '#718096' }}>Specialization:</strong> {Array.isArray(t.specializations) && t.specializations.length > 0 ? t.specializations.join(', ') : 'N/A'}</span>
                      <span><strong style={{ color: '#718096' }}>Expertise:</strong> {Array.isArray(t.expertiseAreas) && t.expertiseAreas.length > 0 ? t.expertiseAreas.join(', ') : 'N/A'}</span>
                    </div>
                  )}
                </span>
                {sel && <span style={{ color: '#38a169', fontWeight: 700, fontSize: '0.8rem' }}>Selected</span>}
              </div>
            )
          }) : (
            <div style={{ padding: '10px 12px', color: '#888', fontSize: '0.85rem' }}>
              {!therapists.length ? 'No therapists found for this branch' : 'No match — try a different name'}
            </div>
          )}
        </div>
      )}

      {/* Selected chips */}
      {selectedTherapists.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {selectedTherapists.map(t => (
            <div key={t.therapistId} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#e6fffa', border: '1px solid #81e6d9',
              borderRadius: 20, padding: '4px 12px',
              fontSize: '0.8rem', color: '#234e52', fontWeight: 600,
            }}>
              👤 {t.therapistId} — {t.fullName}
              <button
                type="button"
                onClick={() => removeTherapist(t.therapistId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: 700, fontSize: 13, padding: '0 2px', lineHeight: 1 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── getName / getId helpers ────────────────────────────────────────────── */
const getName = (p, mode) => {
  if (!p) return ''
  switch (mode) {
    case 'package': return p.packageName || p.name || p.title || `Package ${p.packageId ?? p.id ?? ''}`
    case 'program': return p.programName || p.name || p.title || `Program ${p.programId ?? p.id ?? ''}`
    case 'therapy': return p.therapyName || p.name || `Therapy ${p.therapyId ?? p.id ?? ''}`
    case 'exercise': return p.exerciseName || p.name || `Exercise ${p.therapyExercisesId ?? p.id ?? ''}`
    default: return p.name || p.title || `Item ${p.id ?? ''}`
  }
}
const getId = (p, mode) => {
  if (!p) return ''
  switch (mode) {
    case 'exercise': return String(p.therapyExercisesId || p.id || '')
    case 'therapy': return String(p.therapyId || p.id || '')
    case 'program': return String(p.programId || p.id || '')
    case 'package': return String(p.packageId || p.id || '')
    default: return String(p.id || '')
  }
}

const getModeEmoji = (mode) => {
  switch (mode) {
    case 'package': return '📦'
    case 'program': return '🎯'
    case 'therapy': return '💆'
    case 'exercise': return '🏋️'
    default: return '📋'
  }
}

/* ─── NumCell ────────────────────────────────────────────────────────────── */
const NumCell = ({ value, onChange }) => (
  <input type="number" min="0" value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    style={{ width: 64, textAlign: 'center', border: '1.5px solid #1B4F8A', borderRadius: 6, padding: '4px 2px', fontSize: '0.82rem', color: '#1a3a5c', background: '#fff', outline: 'none' }}
    onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(27,79,138,0.15)' }}
    onBlur={e => { e.target.style.boxShadow = 'none' }}
  />
)

/* ─── FreqCell ───────────────────────────────────────────────────────────── */
const FreqCell = ({ count, unit, onCountChange, onUnitChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <input type="number" min="0" value={count ?? ''} placeholder="0"
      onChange={e => onCountChange(e.target.value)}
      style={{ width: 50, textAlign: 'center', border: '1.5px solid #1B4F8A', borderRadius: 6, padding: '4px 2px', fontSize: '0.82rem', color: '#1a3a5c', background: '#fff', outline: 'none' }}
      onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(27,79,138,0.15)' }}
      onBlur={e => { e.target.style.boxShadow = 'none' }}
    />
    <select value={unit ?? 'Day'} onChange={e => onUnitChange(e.target.value)}
      style={{ border: '1.5px solid #1B4F8A', borderRadius: 6, padding: '4px 6px', fontSize: '0.78rem', color: '#1a3a5c', background: '#fff', outline: 'none', cursor: 'pointer' }}>
      {FREQ_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
    </select>
  </div>
)

/* ─── ExerciseCheckbox ───────────────────────────────────────────────────── */
const ExerciseCheckbox = ({ checked, onChange }) => (
  <div onClick={onChange} style={{
    width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
    border: `2px solid ${checked ? '#1B4F8A' : '#a0bcda'}`,
    background: checked ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s', margin: 'auto',
  }}>
    {checked && <span style={{ color: '#fff', fontSize: '0.65rem', lineHeight: 1, fontWeight: 700 }}>✓</span>}
  </div>
)

/* ─── NotesCell — editable inline ────────────────────────────────────────── */
const AddFieldModal = ({ onSave, onClose }) => {
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 320, borderRadius: 12, overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.25)', animation: 'toastSlide 0.25s ease' }}>
        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.02em' }}>➕ ADD PARAMETER</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B4F8A', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>Field Name</label>
            <input
              value={key} onChange={e => setKey(e.target.value)}
              placeholder="e.g. Intensity, Machine"
              style={{ ...inputStyle, height: 34, fontSize: '0.8rem', padding: '0 10px' }}
            />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B4F8A', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>Value</label>
            <input
              value={val} onChange={e => setVal(e.target.value)}
              placeholder="e.g. Moderate, Treadmill"
              style={{ ...inputStyle, height: 34, fontSize: '0.8rem', padding: '0 10px' }}
            />
          </div>
        </div>
        <div style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #dceeff', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '5px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => { if (key.trim()) { onSave(key.trim(), val); onClose() } }}
            disabled={!key.trim()}
            style={{ padding: '5px 18px', borderRadius: 8, border: 'none', background: key.trim() ? '#1B4F8A' : '#b6cfe8', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: key.trim() ? 'pointer' : 'not-allowed' }}
          >Add Field</button>
        </div>
      </div>
    </div>
  )
}

const NoteModal = ({ value, onSave, onClose }) => {
  const [text, setText] = useState(value || '')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', animation: 'toastSlide 0.3s ease' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1.5px solid #dceeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📝</span>
            <h6 style={{ margin: 0, fontWeight: 700, letterSpacing: '0.02em' }}>Activity Notes</h6>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>×</button>
        </div>
        <div style={{ padding: 22 }}>
          <label style={{ fontSize: '0.75rem', marginBottom: 8, display: 'block', color: '#475569' }}>Write your clinical notes below:</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            style={{
              width: '100%', minHeight: 180, border: '1.5px solid #b6cfe8', borderRadius: 10, padding: 14,
              outline: 'none', fontSize: '0.9rem', color: '#1a3a5c', lineHeight: 1.5,
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#1B4F8A'}
            onBlur={e => e.target.style.borderColor = '#b6cfe8'}
            placeholder="E.g. Patient showed improvement in range of motion, advised to continue daily sets..."
          />
        </div>
        <div style={{ padding: '14px 22px', background: '#f8fafc', borderTop: '1.5px solid #dceeff', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '7px 20px', borderRadius: 10, border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(text)} style={{ padding: '7px 24px', borderRadius: 10, border: 'none', background: '#1B4F8A', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(27,79,138,0.2)' }}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

const ParamModal = ({ label, value, onSave, onClose }) => {
  const [text, setText] = useState(value || '')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 420, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', animation: 'toastSlide 0.3s ease' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #dceeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚙️</span>
            <h6 style={{ margin: 0, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.85rem' }}>Edit {label}</h6>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ fontSize: '0.72rem', marginBottom: 8, display: 'block', color: '#475569', fontWeight: 700 }}>{label.toUpperCase()} VALUE:</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            style={{
              width: '100%', minHeight: 100, border: '1.5px solid #b6cfe8', borderRadius: 10, padding: 12,
              outline: 'none', fontSize: '0.88rem', color: '#1a3a5c', lineHeight: 1.4,
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#1B4F8A'}
            onBlur={e => e.target.style.borderColor = '#b6cfe8'}
          />
        </div>
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1.5px solid #dceeff', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '6px 18px', borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(text)} style={{ padding: '6px 20px', borderRadius: 8, border: 'none', background: '#1B4F8A', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Save Param</button>
        </div>
      </div>
    </div>
  )
}
const NotesCell = ({ value, onChange }) => {
  const [showModal, setShowModal] = useState(false)
  const isLong = value && value.length > 50

  return (
    <>
      <div style={{ minWidth: 140 }}>
        <div
          onClick={() => setShowModal(true)}
          title="Click to edit notes"
          style={{
            fontSize: '0.8rem',
            color: value ? '#475569' : '#94a3b8',
            fontStyle: value ? 'normal' : 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            cursor: 'pointer',
            lineHeight: 1.4,
            padding: '4px 6px',
            borderRadius: 6,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {value || 'Add notes...'}
        </div>
        {isLong && (
          <div
            onClick={() => setShowModal(true)}
            style={{ fontSize: '0.72rem', color: '#1B4F8A', fontWeight: 800, cursor: 'pointer', marginTop: 2, display: 'inline-block' }}
          >
            Read More
          </div>
        )}
      </div>

      {showModal && (
        <NoteModal
          value={value}
          onSave={(v) => { onChange(v); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

/* ─── Exercise Details — Helper to show non-empty, non-payment fields ─── */
const ExerciseExtraInfo = ({ ex, onUpdateField }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingParam, setEditingParam] = useState(null) // { key, label, val }

  const skip = [
    'id', 'therapyExercisesId', 'clinicId', 'branchId', 'name', 'exerciseName',
    'session', 'sessions', 'frequency', 'frequencyCount', 'frequencyUnit',
    'notes', 'pricePerSession', 'discountPercentage', 'discountAmount', 'gst', 'otherTax', 'totalPrice',
    '_checked', 'video', 'videoUrl', 'theraphyId', 'therapyId', 'therapy_id', 'id', 'activityType', 'type',
    'bodyPart', 'duration', 'activityDuration'
  ]

  const labels = {
    sets: 'Sets',
    reps: 'Reps',
    repetitions: 'Reps',
    bodyPart: 'Body Part',
    activityDuration: 'Act. Duration',
    assistanceLevel: 'Assistance',
    duration: 'Duration',
    technique: 'Technique',
    machine: 'Machine/Equip',
    intensity: 'Intensity',
    area: 'Area',
    metric: 'Metric',
    value: 'Value',
    unit: 'Unit'
  }

  const seenLabels = new Set()
  const details = Object.entries(ex)
    .filter(([key, val]) => {
      if (skip.includes(key)) return false
      if (val === null || val === undefined || String(val).trim() === '' || val === 0 || val === '0') return false

      // Deduplicate by label (e.g. 'reps' and 'repetitions' both show as 'Reps')
      const label = labels[key] || key.replace(/([A-Z])/g, ' $1').trim()
      if (seenLabels.has(label)) return false
      seenLabels.add(label)

      return true
    })
    .map(([key, val]) => ({
      key,
      label: labels[key] || key.replace(/([A-Z])/g, ' $1').trim(),
      val: String(val)
    }))

  return (
    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center' }}>
      {(ex.video || ex.videoUrl) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a
            href={(ex.video || ex.videoUrl).startsWith('http') ? (ex.video || ex.videoUrl) : `https://${ex.video || ex.videoUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.68rem', color: '#1B4F8A', textDecoration: 'none', background: '#e0f2fe', padding: '1px 8px', borderRadius: 4, border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
          >
            🎬 Video
          </a>
          <input
            placeholder="Video URL"
            value={ex.video || ex.videoUrl || ''}
            onChange={e => onUpdateField(ex.video ? 'video' : 'videoUrl', e.target.value)}
            style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: 4, border: '1px solid #dceeff', width: 100 }}
          />
        </div>
      )}
      {details.map(d => (
        <div
          key={d.key}
          onClick={() => setEditingParam(d)}
          title={`Click to edit ${d.label}`}
          style={{
            fontSize: '0.68rem', color: '#475569', background: '#f8fafc', padding: '1px 8px', borderRadius: 4, border: '1px solid #e2e8f0',
            display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
          onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
        >
          <span style={{ fontWeight: 700, color: '#1B4F8A', textTransform: 'capitalize', flexShrink: 0 }}>{d.label}:</span>
          <span style={{
            fontSize: '0.68rem', color: '#334155',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180
          }}>{d.val}</span>
        </div>
      ))}
      {editingParam && (
        <ParamModal
          label={editingParam.label}
          value={editingParam.val}
          onSave={(newVal) => { onUpdateField(editingParam.key, newVal); setEditingParam(null) }}
          onClose={() => setEditingParam(null)}
        />
      )}
    </div>
  )
}

const ActivitySelect = ({ value, onChange }) => {
  const types = ['Exercise', 'Manual', 'Modality', 'Electrotherapy', 'Functional Training', 'Supportive', 'Education', 'Assessment']
  const colors = {
    Exercise: '#1B4F8A',
    Manual: '#0d9488',
    Modality: '#0d9488',
    Electrotherapy: '#7c3aed',
    'Functional Training': '#2563eb',
    Supportive: '#db2777',
    Education: '#ea580c',
    Assessment: '#4b5563'
  }

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
        padding: '2px 8px', borderRadius: 4, border: 'none',
        background: colors[value] || '#cbd5e1',
        color: value ? '#fff' : '#475569', cursor: 'pointer',
        letterSpacing: '0.04em', outline: 'none', appearance: 'none',
        textAlign: 'center'
      }}
    >
      <option value="" style={{ color: '#000' }}>Select</option>
      {types.map(t => <option key={t} value={t} style={{ color: '#000', background: '#fff' }}>{t}</option>)}
    </select>
  )
}

/* ─── ExerciseTable Helpers (Defined outside to prevent focus loss) ─── */
const TH = ({ children, center }) => (
  <th style={{ padding: '9px 10px', textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.82rem' }}>{children}</th>
)
const TD = ({ children, style = {} }) => (
  <td style={{ padding: '7px 10px', verticalAlign: 'middle', ...style }}>{children}</td>
)

const ExerciseRow = React.memo(({ ex, idx, setField, toggleExercise }) => {
  return (
    <tr style={{ backgroundColor: idx % 2 === 0 ? '#f0f6ff' : '#FFFFFF', borderBottom: '1px solid #dceeff' }}>
      <TD style={{ textAlign: 'center', width: 32, verticalAlign: 'top', paddingTop: 12 }}>
        <ExerciseCheckbox checked={ex._checked !== false} onChange={() => toggleExercise(idx)} />
      </TD>
      <TD style={{ fontWeight: 700, color: '#1B4F8A', verticalAlign: 'top', paddingTop: 12 }}>{idx + 1}</TD>
      <TD style={{ verticalAlign: 'top', paddingBottom: 12, paddingTop: 12 }}>
        <div
          style={{
            fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', marginBottom: 2,
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}
          title={ex.exerciseName || ex.name || ''}
        >
          {ex.exerciseName || ex.name || 'Unnamed Activity'}
        </div>
        <ExerciseExtraInfo ex={ex} onUpdateField={(field, val) => setField(idx, field, val)} />
      </TD>
      <TD style={{ verticalAlign: 'top', paddingTop: 12 }}>
        <ActivitySelect
          value={ex.activityType || ex.type}
          onChange={val => setField(idx, ex.activityType ? 'activityType' : 'type', val)}
        />
      </TD>
      <TD style={{ verticalAlign: 'top', paddingTop: 8 }}>
        <input
          value={ex.bodyPart || ''}
          onChange={e => setField(idx, 'bodyPart', e.target.value)}
          placeholder="e.g. Back"
          style={{ fontSize: '0.78rem', border: '1px solid #dceeff', borderRadius: 4, width: '80px', padding: '2px 6px', outline: 'none' }}
        />
      </TD>
      <TD style={{ textAlign: 'center' }}>
        <NumCell value={ex.sessions} onChange={v => setField(idx, 'sessions', v)} />
      </TD>
      <TD style={{ textAlign: 'center' }}>
        <input
          value={ex.activityDuration || ex.duration || ''}
          onChange={e => setField(idx, 'activityDuration', e.target.value)}
          style={{ fontSize: '0.78rem', border: '1px solid #dceeff', borderRadius: 4, width: '45px', textAlign: 'center', padding: '2px 4px', outline: 'none' }}
        />
      </TD>
      <TD>
        <FreqCell
          count={ex.frequencyCount} unit={ex.frequencyUnit}
          onCountChange={v => setField(idx, 'frequencyCount', v)}
          onUnitChange={v => setField(idx, 'frequencyUnit', v)}
        />
      </TD>
      <TD style={{ minWidth: 140 }}>
        <NotesCell value={ex.notes} onChange={v => setField(idx, 'notes', v)} />
      </TD>
    </tr>
  )
})

/* ─── ExerciseTable ──────────────────────────────────────────────────────── */
const ExerciseTable = ({ exercises, onUpdate }) => {
  const setField = useCallback((idx, field, val) =>
    onUpdate(exercises.map((ex, i) => i === idx ? { ...ex, [field]: val } : ex)), [exercises, onUpdate])

  const toggleExercise = useCallback((idx) =>
    onUpdate(exercises.map((ex, i) => i === idx ? { ...ex, _checked: ex._checked === false ? true : false } : ex)), [exercises, onUpdate])

  const allChecked = exercises.length > 0 && exercises.every(ex => ex._checked !== false)
  const toggleAll = () => onUpdate(exercises.map(ex => ({ ...ex, _checked: !allChecked })))

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return (
      <div style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.83rem', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', marginTop: 8 }}>
        No exercises available
      </div>
    )
  }

  const checkedCount = exercises.filter(ex => ex._checked !== false).length

  return (
    <div style={{ overflowX: 'auto', marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '5px 10px', background: '#f0f6ff', borderRadius: 6, border: '1px solid #d0e4f7' }}>
        <span style={{ fontSize: '0.78rem', color: '#1B4F8A', fontWeight: 600 }}>
          {checkedCount} of {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} selected
        </span>
        <button type="button" onClick={toggleAll} style={{ padding: '3px 12px', borderRadius: 5, border: '1.5px solid #1B4F8A', background: allChecked ? '#1B4F8A' : '#FFFFFF', color: allChecked ? '#fff' : '#1B4F8A', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
          {allChecked ? '☑ Deselect All' : '☐ Select All'}
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: '#1a3a5c' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)', color: '#fff' }}>
            <TH center>
              <div onClick={toggleAll} style={{ width: 16, height: 16, borderRadius: 3, cursor: 'pointer', border: `2px solid ${allChecked ? '#fff' : 'rgba(255,255,255,0.6)'}`, background: allChecked ? 'rgba(255,255,255,0.3)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
                {allChecked && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
              </div>
            </TH>
            <TH>#</TH>
            <TH>Activity / Exercise</TH>
            <TH>Type</TH>
            <TH>Body Part</TH>
            <TH center>Sessions</TH>
            <TH center>Dur(min)</TH>
            <TH>Frequency</TH>
            <TH>Notes</TH>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, idx) => (
            <ExerciseRow
              key={ex.therapyExercisesId || ex.therapyExerciseId || ex.id || idx}
              ex={ex}
              idx={idx}
              setField={setField}
              toggleExercise={toggleExercise}
            />
          ))}
        </tbody>
      </table>
      {exercises.some(ex => ex._checked === false) && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#fdf4f4', border: '1px dashed #f5c6c6', borderRadius: 8 }}>
          <span style={{ fontSize: '0.75rem', color: '#9b5555', fontWeight: 700 }}>Hidden exercises:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {exercises.map((ex, idx) => ex._checked === false ? (
              <button key={idx} type="button" onClick={() => toggleExercise(idx)}
                style={{ padding: '3px 10px', borderRadius: 12, border: '1.5px solid #f5c6c6', background: '#fff0f0', color: '#9b5555', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                ＋ {ex.exerciseName || ex.name || `Exercise ${idx + 1}`}
              </button>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── TherapyBlock ───────────────────────────────────────────────────────── */
const TherapyBlock = ({ therapyKey, therapy, checked, onToggle, exercises, onUpdateExercises, loading, programName }) => (
  <div style={{ border: `2px solid ${checked ? '#1B4F8A' : '#dde8f2'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.18s', marginBottom: 12 }}>
    <div
      onClick={(e) => { e.stopPropagation(); onToggle(therapyKey) }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: checked ? '#dceeff' : '#f5f8fc', cursor: 'pointer', userSelect: 'none', borderBottom: checked ? '1.5px solid #b6cfe8' : 'none' }}>
      <div
        onClick={(e) => { e.stopPropagation(); onToggle(therapyKey) }}
        style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? '#1B4F8A' : '#a0bcda'}`, background: checked ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <span style={{ color: '#fff', fontSize: '0.72rem', lineHeight: 1, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {programName && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4a7abf', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: -2 }}>
            {programName}
          </span>
        )}
        <span style={{ fontWeight: 700, fontSize: '0.93rem', color: '#1B4F8A' }}>{therapy}</span>
      </div>
      {loading
        ? <span style={{ fontSize: '0.78rem', color: '#4a7abf', fontWeight: 500 }}>Loading exercises...</span>
        : <span style={{ fontSize: '0.78rem', color: checked ? '#1B4F8A' : '#8fa8c0', fontWeight: 600 }}>
          {checked ? (() => {
            const total = exercises.length
            const active = exercises.filter(ex => ex._checked !== false).length
            return `${active} / ${total} exercise${total !== 1 ? 's' : ''}`
          })() : 'Hidden'}
        </span>
      }
      <span style={{ fontSize: '0.8rem', color: checked ? '#1B4F8A' : '#b0c4d8', transform: checked ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
    </div>
    {checked && (
      <div style={{ padding: '4px 18px 16px' }}>
        {loading
          ? <div style={{ padding: '16px', textAlign: 'center', color: '#4a7abf', fontSize: '0.85rem' }}>⏳ Loading exercises...</div>
          : <ExerciseTable exercises={exercises} onUpdate={onUpdateExercises} />
        }
      </div>
    )}
  </div>
)

/* ─── restoreTherophyDataState ───────────────────────────────────────────── */
const restoreTherophyDataState = (sessions) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return {}
  const mapped = {}

  sessions.forEach((sess) => {
    // Handle Package
    if (sess.serviceType === 'package' && (Array.isArray(sess.programs) || Array.isArray(sess.programList))) {
      const pkgId = sess.packageId || ''
      const programs = Array.isArray(sess.programs) ? sess.programs : sess.programList
      programs.forEach((prog) => {
        const progName = prog.programName || prog.name || ''

        // Handle both 'therapyData' and 'therophyData' or 'activities' or 'programActivities'
        const therapies = Array.isArray(prog.therapyData)
          ? prog.therapyData
          : (Array.isArray(prog.therophyData)
            ? prog.therophyData
            : (Array.isArray(prog.activities)
              ? prog.activities
              : (Array.isArray(prog.programActivities)
                ? prog.programActivities
                : (Array.isArray(prog.program_activities) ? prog.program_activities : []))))

        therapies.forEach((therapy, tIdx) => {
          const key = `${pkgId}__${progName}__${therapy.therapyName || therapy.name || ''}__${tIdx}`
          mapped[key] = {
            checked: true,
            packageId: pkgId, packageName: sess.packageName || sess.name || '',
            programId: prog.id || prog.programId || '', programName: progName,
            therapyId: therapy.id || therapy.therapyId || '', therapyName: therapy.therapyName || therapy.name || '',
            exercises: (therapy.exercises || therapy.activities || []).map(ex => ({
              ...ex, exerciseName: ex.name || ex.exerciseName || '',
              sessions: ex.noOfSessions ?? ex.session ?? ex.sessions ?? '',
              sets: ex.sets ?? '', reps: ex.repetitions ?? ex.reps ?? '',
              frequencyCount: parseFrequency(ex.frequency || ex.frequencyCount).count,
              frequencyUnit: parseFrequency(ex.frequency || ex.frequencyCount).unit,
              notes: ex.notes ?? '',
              duration: ex.duration || ex.activityDuration || '',
              video: ex.video || ex.videoUrl || '',
              _checked: true,
            }))
          }
        })
      })
    }
    // Handle Program
    else if (sess.serviceType === 'program' && (Array.isArray(sess.therapyData) || Array.isArray(sess.therophyData) || Array.isArray(sess.activities) || Array.isArray(sess.programActivities))) {
      const progId = sess.programId || sess.id || ''
      const therapies = Array.isArray(sess.therapyData)
        ? sess.therapyData
        : (Array.isArray(sess.therophyData)
          ? sess.therophyData
          : (Array.isArray(sess.activities)
            ? sess.activities
            : (Array.isArray(sess.programActivities)
              ? sess.programActivities
              : (Array.isArray(sess.program_activities) ? sess.program_activities : []))))

      therapies.forEach((therapy, tIdx) => {
        const key = `${progId}__${therapy.therapyName || therapy.name || ''}__${tIdx}`
        mapped[key] = {
          checked: true,
          programId: progId, programName: sess.programName || sess.name || '',
          therapyId: therapy.id || therapy.therapyId || '', therapyName: therapy.therapyName || therapy.name || '',
          exercises: (therapy.exercises || therapy.activities || []).map(ex => ({
            ...ex, exerciseName: ex.name || ex.exerciseName || '',
            sessions: ex.noOfSessions ?? ex.session ?? ex.sessions ?? '',
            sets: ex.sets ?? '', reps: ex.repetitions ?? ex.reps ?? '',
            frequencyCount: parseFrequency(ex.frequency || ex.frequencyCount).count,
            frequencyUnit: parseFrequency(ex.frequency || ex.frequencyCount).unit,
            notes: ex.notes ?? '',
            duration: ex.duration || ex.activityDuration || '',
            video: ex.video || ex.videoUrl || '',
            _checked: true,
          }))
        }
      })
    }
    // Handle Therapy
    else if (sess.serviceType === 'therapy' && (Array.isArray(sess.exercises) || Array.isArray(sess.activities))) {
      const therapyName = sess.therapyName || sess.name || ''
      const therapyId = sess.therapyId || sess.id || ''
      const key = `${therapyId}__${therapyName}__0`
      mapped[key] = {
        checked: true, therapyId, therapyName,
        exercises: (sess.exercises || sess.activities || []).map(ex => ({
          ...ex, exerciseName: ex.name || ex.exerciseName || '',
          sessions: ex.noOfSessions ?? ex.session ?? ex.sessions ?? '',
          sets: ex.sets ?? '', reps: ex.repetitions ?? ex.reps ?? '',
          frequencyCount: parseFrequency(ex.frequency || ex.frequencyCount).count,
          frequencyUnit: parseFrequency(ex.frequency || ex.frequencyCount).unit,
          notes: ex.notes ?? '', _checked: true,
        }))
      }
    }
    // Handle Exercise
    else if (sess.serviceType === 'exercise' && Array.isArray(sess.exercises)) {
      const exId = sess.exerciseId || sess.id || 'exercise'
      const key = `${exId}__exercise__0`
      mapped[key] = {
        checked: true, therapyName: sess.exerciseName || sess.name || 'Exercise',
        exercises: sess.exercises.map(ex => ({
          ...ex, exerciseName: ex.exerciseName || ex.name || '',
          sessions: ex.noOfSessions ?? ex.session ?? ex.sessions ?? '',
          sets: ex.sets ?? '', reps: ex.repetitions ?? ex.reps ?? '',
          frequencyCount: parseFrequency(ex.frequency || ex.frequencyCount).count,
          frequencyUnit: parseFrequency(ex.frequency || ex.frequencyCount).unit,
          notes: ex.notes ?? '', _checked: true,
        }))
      }
    }
  })

  return mapped
}

const restoreSelectedItems = (sessions) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return new Map()
  const map = new Map()
  sessions.forEach(sess => {
    if (sess.serviceType === 'package') {
      const id = sess.packageId || ''
      if (id) map.set(id, { packageId: id, packageName: sess.packageName || '', _restored: true })
    } else if (sess.serviceType === 'program') {
      const id = sess.programId || ''
      if (id) map.set(id, { programId: id, programName: sess.programName || '', _restored: true })
    } else if (sess.serviceType === 'therapy') {
      const id = sess.therapyId || ''
      if (id) map.set(id, { therapyId: id, therapyName: sess.therapyName || '', _restored: true })
    } else if (sess.serviceType === 'exercise') {
      const id = sess.exerciseId || ''
      if (id) map.set(id, { therapyExercisesId: id, name: sess.exerciseName || '', _restored: true })
    }
  })
  return map
}

/* ─── BrowsePanel ────────────────────────────────────────────────────────── */
const BrowsePanel = ({ mode, programs, loading, selectedIds, onToggle, onConfirm, onClose, search, onSearch }) => {
  const emoji = getModeEmoji(mode)
  const filtered = programs.filter(p => getName(p, mode).toLowerCase().includes(search.toLowerCase()))
  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(getId(p, mode)))

  const toggleAll = () => {
    if (allSelected) {
      filtered.forEach(p => { if (selectedIds.has(getId(p, mode))) onToggle(getId(p, mode), p) })
    } else {
      filtered.forEach(p => { if (!selectedIds.has(getId(p, mode))) onToggle(getId(p, mode), p) })
    }
  }

  return (
    <div style={{ marginBottom: 20, border: '1.5px solid #b6cfe8', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0f6ff', borderBottom: '1px solid #b6cfe8', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={`Search ${mode}s...`}
          style={{ ...inputStyle, width: 220, height: 34 }}
        />
        <button
          type="button"
          onClick={toggleAll}
          style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #1B4F8A', background: '#FFFFFF', color: '#1B4F8A', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          {allSelected ? '☑ Deselect All' : '☐ Select All'}
        </button>
        <span style={{ fontSize: '0.8rem', color: '#1B4F8A', fontWeight: 600 }}>
          {selectedIds.size} selected
        </span>
        <button
          type="button"
          onClick={onConfirm}
          disabled={selectedIds.size === 0}
          style={{
            marginLeft: 'auto', padding: '6px 20px', borderRadius: 8, border: 'none',
            background: selectedIds.size > 0 ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#b6cfe8',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          ➕ Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}{mode}{selectedIds.size !== 1 ? 's' : ''}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#4a7abf', fontSize: '0.875rem' }}>
          ⏳ Loading {mode}s…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#8aaac8', fontSize: '0.875rem' }}>
          No {mode}s found.
        </div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map((p, i) => {
            const id = getId(p, mode)
            const label = getName(p, mode)
            const isChecked = selectedIds.has(id)
            return (
              <label
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', cursor: 'pointer',
                  borderBottom: '1px solid #dceeff',
                  background: isChecked ? '#dceeff' : i % 2 === 0 ? '#f0f6ff' : '#FFFFFF',
                  transition: 'background 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(id, p)}
                  style={{ width: 16, height: 16, accentColor: '#1B4F8A', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a3a5c' }}>
                    {emoji} {label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7a9fc0', marginTop: 2 }}>
                    ID: {id}
                  </div>
                </div>
                {isChecked && <span style={{ color: '#1B4F8A', fontWeight: 700, fontSize: '1rem' }}>✓</span>}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── SelectedChips ──────────────────────────────────────────────────────── */
const SelectedChips = ({ items, mode, onRemove }) => {
  if (!items.length) return null
  const emoji = getModeEmoji(mode)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {items.map(item => {
        const id = getId(item, mode)
        const label = getName(item, mode)
        return (
          <div key={id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#dceeff', border: '1.5px solid #b6cfe8',
            borderRadius: 20, padding: '4px 12px',
            fontSize: '0.8rem', color: '#1B4F8A', fontWeight: 600,
          }}>
            {emoji} {label}
            <button
              type="button"
              onClick={() => onRemove(id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1B4F8A', fontWeight: 700, fontSize: 13, padding: '0 2px', lineHeight: 1 }}
            >✕</button>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const TherapySession = ({ seed = {}, onNext, patientData }) => {
  console.log('💊 TherapySession seed:', seed)

  const savedSessions = Array.isArray(seed?.sessions) ? seed.sessions : []
  const savedSession = savedSessions[0] ?? {}

  const { toasts, toastError, toastSuccess, toastWarning } = useToast()
  const [errors, setErrors] = useState({})

  const inferredMode = savedSession.serviceType || seed.serviceType || 'package'
  const [mode, setMode] = useState(inferredMode)

  const { doctorDetails } = useDoctorContext()
  const clinicId = localStorage.getItem('hospitalId')
  // Try to find branchId from patient record, then context, then localStorage
  const branchId = patientData?.branchId || doctorDetails?.branches?.[0]?.branchId || localStorage.getItem('branchId')
  const idsReady = !!(clinicId && branchId)

  const [therapists, setTherapists] = useState([])
  const [loadingTherapists, setLoadingTherapists] = useState(false)

  // ── Multi-therapist: array of { therapistId, fullName } ──
  // Restore priority: seed.therapists (full array) → single back-compat fields
  const [selectedTherapists, setSelectedTherapists] = useState(() => {
    if (Array.isArray(seed.therapists) && seed.therapists.length > 0) {
      return seed.therapists.map(t => ({ therapistId: t.therapistId || '', fullName: t.fullName || '' }))
    }
    if (seed.therapistId && seed.therapistName) {
      return [{ therapistId: seed.therapistId, fullName: seed.therapistName }]
    }
    return []
  })

  const [programs, setPrograms] = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)

  const [allExercises, setAllExercises] = useState([])
  const [loadingAllExercises, setLoadingAllExercises] = useState(false)
  const exercisesFetchedRef = useRef(false)

  const [selectedItems, setSelectedItems] = useState(() => restoreSelectedItems(savedSessions))
  const [showBrowsePanel, setShowBrowsePanel] = useState(false)
  const [browseSearch, setBrowseSearch] = useState('')
  const [bulkPending, setBulkPending] = useState(new Set())

  const [therophyDataState, setTherophyDataState] = useState(() => {
    const restored = restoreTherophyDataState(savedSessions)
    console.log('🔄 Restored therophyDataState:', restored)
    return restored
  })

  const [therapyLibrary, setTherapyLibrary] = useState([])
  const [therapyState, setTherapyState] = useState(() => {
    if (savedSession.serviceType === 'therapy') {
      const name = savedSession.therapyName || ''
      return name ? {
        [name]: {
          checked: true,
          exercises: (savedSession.exercises || []).map(ex => ({
            ...ex, exerciseName: ex.exerciseName || ex.name || '',
            sessions: ex.noOfSessions ?? ex.sessions ?? '',
            sets: ex.sets ?? '', reps: ex.repetitions ?? ex.reps ?? '',
            frequencyCount: parseFrequency(ex.frequency).count,
            frequencyUnit: parseFrequency(ex.frequency).unit,
            notes: ex.notes ?? '', _checked: true,
          }))
        }
      } : {}
    }
    return {}
  })

  const [loadingByItemId, setLoadingByItemId] = useState({})
  const restoredFromSeedRef = useRef(savedSessions.length > 0)

  // ── Refs for validate() to read latest state ──
  const therophyDataStateRef = useRef(therophyDataState)
  useEffect(() => { therophyDataStateRef.current = therophyDataState }, [therophyDataState])
  const therapyStateRef = useRef(therapyState)
  useEffect(() => { therapyStateRef.current = therapyState }, [therapyState])
  const therapyLibraryRef = useRef(therapyLibrary)
  useEffect(() => { therapyLibraryRef.current = therapyLibrary }, [therapyLibrary])
  const selectedItemsRef = useRef(selectedItems)
  useEffect(() => { selectedItemsRef.current = selectedItems }, [selectedItems])
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])
  const selectedTherapistsRef = useRef(selectedTherapists)
  useEffect(() => { selectedTherapistsRef.current = selectedTherapists }, [selectedTherapists])

  useEffect(() => {
    if (savedSession.serviceType === 'therapy' && savedSession.therapyName) {
      setTherapyLibrary([{ therapyId: savedSession.therapyId || '', therapyName: savedSession.therapyName }])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!idsReady) {
      console.warn('🕒 Skipping fetchDataByMode: clinicId or branchId missing', { clinicId, branchId })
      return
    }
    console.log(`🎬 Triggering fetchDataByMode for mode: ${mode}`)
    fetchDataByMode()
  }, [idsReady, clinicId, branchId, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!idsReady) return
    setLoadingTherapists(true)
    getTherapists(clinicId, branchId)
      .then(data => setTherapists(Array.isArray(data) ? data : []))
      .catch(err => console.error('❌ Error fetching therapists:', err))
      .finally(() => setLoadingTherapists(false))
  }, [idsReady, clinicId, branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  const getServiceByMode = async (m, cId, bId) => {
    switch (m) {
      case 'package': return await getPackagesByBranch(cId, bId)
      case 'program': return await getProgramsByBranch(cId, bId)
      case 'therapy': return await getTherapiesByBranch(cId, bId)
      case 'exercise': return await getExercisesByBranch(cId, bId)
      default: return []
    }
  }

  const fetchDataByMode = async () => {
    console.log(`🌐 fetchDataByMode called. Mode: ${mode}, Clinic: ${clinicId}, Branch: ${branchId}`)
    setPrograms([]) // Clear stale data before fetching new mode
    setLoadingPrograms(true)
    try {
      const serviceRes = await getServiceByMode(mode, clinicId, branchId)
      console.log(`✅ Fetched ${serviceRes?.length || 0} ${mode}(s)`)
      setPrograms(Array.isArray(serviceRes) ? serviceRes : [])
    } catch (err) {
      console.error('❌ fetchDataByMode unexpected error:', err)
      setPrograms([])
    } finally {
      setLoadingPrograms(false)
    }
  }

  const refreshTherapists = useCallback(() => {
    if (!idsReady) return
    setLoadingTherapists(true)
    getTherapists(clinicId, branchId)
      .then(data => {
        setTherapists(Array.isArray(data) ? data : [])
        toastSuccess('Therapist list refreshed')
      })
      .catch(err => {
        console.error('❌ Error refreshing therapists:', err)
        toastError('Failed to refresh therapists.')
      })
      .finally(() => setLoadingTherapists(false))
  }, [idsReady, clinicId, branchId, toastSuccess, toastError])

  useEffect(() => {
    if (!idsReady || exercisesFetchedRef.current) return
    exercisesFetchedRef.current = true
      ; (async () => {
        setLoadingAllExercises(true)
        try {
          const data = await getTherapyExercises(clinicId, branchId)
          setAllExercises(Array.isArray(data) ? data : (data?.data ?? []))
        } catch (err) { setAllExercises([]) }
        finally { setLoadingAllExercises(false) }
      })()
  }, [idsReady, clinicId, branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!therapyLibrary.length || loadingAllExercises) return
    const hasExisting = therapyLibrary.some(({ therapyName }) => Array.isArray(therapyState[therapyName]?.exercises) && therapyState[therapyName].exercises.length > 0)
    if (hasExisting) return
    if (restoredFromSeedRef.current && Object.keys(therophyDataState).length > 0) return

    setTherapyState(prev => {
      const updated = { ...prev }
      therapyLibrary.forEach(({ therapyId, therapyName }) => {
        const matched = allExercises.filter(ex => String(ex?.theraphyId || ex?.therapyId || ex?.therapy_id || '') === String(therapyId))
        updated[therapyName] = {
          ...(updated[therapyName] || { checked: true }),
          exercises: matched.map(ex => {
            const freq = parseFrequency(ex.frequency)
            return { ...ex, exerciseName: ex.name || ex.exerciseName || '', sessions: ex.session ?? ex.sessions ?? '', sets: ex.sets ?? '', reps: ex.repetitions ?? ex.reps ?? '', frequencyCount: freq.count, frequencyUnit: freq.unit, _checked: true }
          }),
        }
      })
      return updated
    })
  }, [therapyLibrary, allExercises, loadingAllExercises]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItemDetail = async (id, obj) => {
    setLoadingByItemId(prev => ({ ...prev, [id]: true }))
    try {
      let data = null

      // Check if we already have programs/activities in the object to avoid failing API calls
      const hasAlreadyNested = (o) => {
        if (!o) return false
        if (mode === 'package') return (Array.isArray(o.programs) && o.programs.length > 0) || (Array.isArray(o.programList) && o.programList.length > 0) || (Array.isArray(o.programIds) && o.programIds.length > 0)
        if (mode === 'program') return (Array.isArray(o.therophyData) && o.therophyData.length > 0) || (Array.isArray(o.therapyData) && o.therapyData.length > 0) || (Array.isArray(o.activities) && o.activities.length > 0)
        return false
      }

      if (hasAlreadyNested(obj)) {
        console.log(`⚡ Using existing nested data for ${mode} ${id}`)
        data = obj
      } else {
        switch (mode) {
          case 'package': data = await getPackagesByBranchAndId(clinicId, branchId, id); break
          case 'program': data = await getProgramsByBranchAndId(clinicId, branchId, id); break
          case 'therapy': data = await getTherapiesByBranchAndId(clinicId, branchId, id); break
          case 'exercise': data = await getExercisesByBranchAndIdAndId(clinicId, branchId, id); break
          default: data = obj
        }
      }
      console.log(`✅ ${mode} detail for ${id}:`, data)
      if (!data) {
        console.error(`❌ No data returned for ${mode} ${id}`)
        toastError(`Failed to load ${mode} details.`)
        return
      }

      if (mode === 'package') {
        // Robust check for programs array (handle both 'programs' and 'programList')
        const programsList = (
          (Array.isArray(data?.programs) && data.programs.length > 0) ? data.programs :
            ((Array.isArray(data?.programList) && data.programList.length > 0) ? data.programList :
              (Array.isArray(data?.programIds) ? data.programIds : []))
        )

        console.log(`📦 Found ${programsList.length} programs/IDs in package ${id}`)

        const mapped = {}

        // ── HYDRATION ──────────────────────────────────────────────────────
        const hydratedPrograms = await Promise.all(programsList.map(async (item) => {
          // item could be an object {id, programName...} or a string ID
          const pId = typeof item === 'string' ? item : (item.id || item.programId)
          if (!pId) return item

          // Check if it's already hydrated (has therapies)
          const therapies = (Array.isArray(item.therophyData) || Array.isArray(item.therapyData) || Array.isArray(item.activities) || Array.isArray(item.programActivities) || Array.isArray(item.therapyDetails))
            ? (item.therophyData ?? item.therapyData ?? item.activities ?? item.programActivities ?? item.therapyDetails)
            : null

          if (therapies && therapies.length > 0) return item

          try {
            console.log(`📡 Fetching details for ${item.programName || 'program'}...`)
            let fullProg = await getProgramsByBranchAndId(clinicId, branchId, pId)
            // Flatten if array
            if (Array.isArray(fullProg)) fullProg = fullProg[0]
            return fullProg || item
          } catch (err) {
            console.error(`❌ Hydration failed for program ${pId}:`, err)
            return item
          }
        }))

        hydratedPrograms.forEach((program, pIdx) => {
          if (!program) return
          const programName = program.programName || program.name || `Program ${pIdx + 1}`
          console.log(`🔎 [Package Hydration] Mapping program: ${programName}`, program)

          const therapiesArr = (
            (Array.isArray(program.therophyData) && program.therophyData.length > 0) ? program.therophyData :
              (Array.isArray(program.therapyData) && program.therapyData.length > 0) ? program.therapyData :
                (Array.isArray(program.activities) && program.activities.length > 0) ? program.activities :
                  (Array.isArray(program.programActivities) && program.programActivities.length > 0) ? program.programActivities :
                    (Array.isArray(program.therapyDetails) && program.therapyDetails.length > 0) ? program.therapyDetails :
                      (Array.isArray(program.therapyList) && program.therapyList.length > 0) ? program.therapyList :
                        (Array.isArray(program.exercises) && program.exercises.length > 0) ? program.exercises : []
          )

          console.log(`   └─ Found ${therapiesArr.length} therapies for ${programName}`)

          therapiesArr.forEach((therapy, tIndex) => {
            if (!therapy) return
            const therapyName = therapy.therapyName || therapy.name || therapy.activityName || 'General Therapy'
            const key = `${id}__${programName}__${therapyName}__${tIndex}`

            const exercisesArr = (
              Array.isArray(therapy.exercises) ? therapy.exercises :
                Array.isArray(therapy.activities) ? therapy.activities :
                  Array.isArray(therapy.activityList) ? therapy.activityList :
                    Array.isArray(therapy.therapyActivities) ? therapy.therapyActivities :
                      (Array.isArray(therapy) ? therapy : [])
            )

            mapped[key] = {
              checked: true,
              packageId: data.packageId || id,
              packageName: data.packageName || data.name || 'Package',
              programId: program.id || program.programId || '',
              programName,
              therapyId: therapy.id || therapy.therapyId || '',
              therapyName,
              exercises: exercisesArr.map(ex => ({
                ...ex,
                exerciseName: ex.name || ex.exerciseName || ex.activityName || 'Exercise',
                sessions: ex.noOfSessions ?? ex.session ?? ex.sessions ?? ex.sessionsCount ?? '',
                sets: ex.sets ?? '',
                reps: ex.repetitions ?? ex.reps ?? '',
                frequencyCount: parseFrequency(ex.frequency || ex.frequencyCount).count,
                frequencyUnit: parseFrequency(ex.frequency || ex.frequencyCount).unit,
                notes: ex.notes ?? '',
                duration: ex.duration || ex.activityDuration || '',
                video: ex.video || ex.videoUrl || '',
                _checked: true,
              }))
            }
          })
        })

        const count = Object.keys(mapped).length
        console.log(`✅ Package ${id} mapped with ${count} therapy/exercise blocks`)
        if (count > 0) toastSuccess(`Loaded package contents successfully.`)
        else toastWarning(`Package "${data.packageName || 'Selected'}" contains no exercise data.`)

        setTherophyDataState(prev => ({ ...prev, ...mapped }))

      } else if (mode === 'program') {
        // Handle 'therophyData', 'therapyData', 'activities', 'programActivities'
        const therapies = Array.isArray(data?.therophyData)
          ? data.therophyData
          : (Array.isArray(data?.therapyData)
            ? data.therapyData
            : (Array.isArray(data?.activities)
              ? data.activities
              : (Array.isArray(data?.programActivities)
                ? data.programActivities
                : (Array.isArray(data?.program_activities) ? data.program_activities : []))))

        const mapped = {}
        therapies.forEach((therapy, tIndex) => {
          const key = `${id}__${therapy.therapyName || therapy.name || ''}__${tIndex}`
          mapped[key] = {
            checked: true,
            programId: id,
            programName: data.programName || data.name || '',
            therapyId: therapy.id || therapy.therapyId || '',
            therapyName: therapy.therapyName || therapy.name || '',
            exercises: (therapy.exercises || therapy.activities || []).map(ex => ({
              ...ex,
              exerciseName: ex.name || ex.exerciseName || '',
              sessions: ex.noOfSessions ?? ex.session ?? ex.sessions ?? '',
              sets: ex.sets ?? '',
              reps: ex.repetitions ?? ex.reps ?? '',
              frequencyCount: parseFrequency(ex.frequency || ex.frequencyCount).count,
              frequencyUnit: parseFrequency(ex.frequency || ex.frequencyCount).unit,
              notes: ex.notes ?? '',
              duration: ex.duration || ex.activityDuration || '',
              video: ex.video || ex.videoUrl || '',
              _checked: true,
            }))
          }
        })
        setTherophyDataState(prev => ({ ...prev, ...mapped }))

      } else if (mode === 'therapy') {
        const res = data?.data || data || {}
        const therapyName = res?.therapyName || res?.name || ''
        const therapyId = res?.therapyId || res?.therpyId || res?.id || id
        setTherapyLibrary(prev => {
          const exists = prev.some(t => String(t.therapyId) === String(therapyId))
          return exists ? prev : [...prev, { therapyId, therapyName }]
        })
        const exercises = Array.isArray(res?.exercises) ? res.exercises : []
        setTherapyState(prev => ({
          ...prev,
          [therapyName]: {
            checked: true,
            exercises: exercises.map(ex => ({
              ...ex, exerciseName: ex.name || ex.exerciseName || '',
              sessions: ex.session ?? ex.sessions ?? '', sets: ex.sets ?? '',
              reps: ex.repetitions ?? ex.reps ?? '',
              frequencyCount: parseFrequency(ex.frequency).count,
              frequencyUnit: parseFrequency(ex.frequency).unit,
              notes: ex.notes ?? '', _checked: true,
            })),
          },
        }))

      } else if (mode === 'exercise') {
        const ex = data || obj
        const exName = ex?.name || ex?.exerciseName || ''
        const key = `${id}__${exName}__0`
        setTherophyDataState(prev => ({
          ...prev,
          [key]: {
            checked: true, therapyName: exName,
            exercises: [{
              ...ex, exerciseName: exName,
              sessions: ex?.session ?? ex?.sessions ?? '', sets: ex?.sets ?? '',
              reps: ex?.repetitions ?? ex?.reps ?? '',
              frequencyCount: parseFrequency(ex?.frequency).count,
              frequencyUnit: parseFrequency(ex?.frequency).unit,
              notes: ex?.notes ?? '', _checked: true,
            }]
          }
        }))
      }

    } catch (err) {
      console.error(`❌ Error fetching ${mode} detail for ${id}:`, err)
    } finally {
      setLoadingByItemId(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleTogglePending = useCallback((id, obj) => {
    setBulkPending(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const handleConfirmBulk = useCallback(async () => {
    const currentSelected = selectedItemsRef.current
    const itemsToAdd = programs.filter(p => {
      const id = getId(p, mode)
      return bulkPending.has(id) && !currentSelected.has(id)
    })
    setSelectedItems(prev => {
      const next = new Map(prev)
      itemsToAdd.forEach(p => { const id = getId(p, mode); next.set(id, p) })
      return next
    })
    setBulkPending(new Set())
    setShowBrowsePanel(false)
    setBrowseSearch('')
    restoredFromSeedRef.current = false
    setErrors(prev => ({ ...prev, service: undefined }))
    for (const p of itemsToAdd) {
      await fetchItemDetail(getId(p, mode), p)
    }
  }, [bulkPending, programs, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveItem = useCallback((id) => {
    setSelectedItems(prev => { const next = new Map(prev); next.delete(id); return next })
    setTherophyDataState(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (k.startsWith(`${id}__`)) delete next[k] })
      return next
    })
    if (mode === 'therapy') {
      setTherapyLibrary(prev => prev.filter(t => String(t.therapyId) !== String(id)))
      setTherapyState(prev => {
        const next = { ...prev }
        const therapy = therapyLibrary.find(t => String(t.therapyId) === String(id))
        if (therapy) delete next[therapy.therapyName]
        return next
      })
    }
  }, [mode, therapyLibrary])

  const toggleTherophyData = useCallback((key) => {
    setTherophyDataState(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }))
    setErrors(prev => ({ ...prev, therapies: undefined }))
  }, [])

  const updateTherophyDataExercises = useCallback((key, updated) => {
    setTherophyDataState(prev => ({ ...prev, [key]: { ...prev[key], exercises: updated } }))
  }, [])

  const toggleTherapy = useCallback((name) => {
    setTherapyState(prev => ({ ...prev, [name]: { ...prev[name], checked: !prev[name].checked } }))
    setErrors(prev => ({ ...prev, therapies: undefined }))
  }, [])

  const updateExercises = useCallback((name, updated) => {
    setTherapyState(prev => ({ ...prev, [name]: { ...prev[name], exercises: updated } }))
  }, [])

  const hasTherophyData = Object.keys(therophyDataState).length > 0
  const tdKeys = Object.keys(therophyDataState)
  const tdCheckedCnt = tdKeys.filter(k => therophyDataState[k]?.checked).length
  const tdAllChecked = tdKeys.length > 0 && tdCheckedCnt === tdKeys.length
  const tlCheckedCnt = therapyLibrary.filter(t => therapyState[t.therapyName]?.checked).length
  const tlAllChecked = therapyLibrary.length > 0 && tlCheckedCnt === therapyLibrary.length
  const checkedCount = hasTherophyData ? tdCheckedCnt : tlCheckedCnt
  const totalCount = hasTherophyData ? tdKeys.length : therapyLibrary.length
  const allChecked = hasTherophyData ? tdAllChecked : tlAllChecked

  const toggleAll = () => {
    const next = !allChecked
    if (hasTherophyData) {
      setTherophyDataState(prev => { const u = { ...prev }; tdKeys.forEach(k => { u[k] = { ...u[k], checked: next } }); return u })
    } else {
      setTherapyState(prev => { const u = { ...prev }; therapyLibrary.forEach(({ therapyName }) => { u[therapyName] = { ...u[therapyName], checked: next } }); return u })
    }
    if (next) setErrors(prev => ({ ...prev, therapies: undefined }))
  }

  const handleModeChange = (val) => {
    console.log(`🔄 Mode manually changed to: ${val}.`)
    setMode(val)
    setSelectedItems(new Map())
    setBulkPending(new Set())
    setShowBrowsePanel(false)
    setBrowseSearch('')
    setTherapyLibrary([])
    setTherapyState({})
    setTherophyDataState({})
    restoredFromSeedRef.current = false
    setErrors({})
    // Removed explicit fetchDataByMode() call here because setMode is asynchronous.
    // The useEffect listening to [mode] will automatically trigger fetchDataByMode
    // with the correct updated mode value exactly once.
  }

  /* ── Validate ── only flag therapies error when user has ZERO checked ── */
  const validate = () => {
    const newErrors = {}
    const curMode = modeRef.current
    const curTDS = therophyDataStateRef.current
    const curTS = therapyStateRef.current
    const curTL = therapyLibraryRef.current
    const curTherapists = selectedTherapistsRef.current
    const curItems = selectedItemsRef.current

    // Must select at least one service item
    if (curItems.size === 0) {
      newErrors.service = `Please select at least one ${curMode}`
    }

    // Must have at least one therapy checked — only if therapies actually exist
    if (curItems.size > 0) {
      const curHasTD = Object.keys(curTDS).length > 0
      if (curHasTD) {
        const anyChecked = Object.keys(curTDS).some(k => curTDS[k]?.checked === true)
        if (!anyChecked) {
          newErrors.therapies = 'Please select at least one therapy'
        }
      } else if (curTL.length > 0) {
        const anyChecked = curTL.some(t => curTS[t.therapyName]?.checked === true)
        if (!anyChecked) {
          newErrors.therapies = 'Please select at least one therapy'
        }
      }
      // If no therapies loaded at all, don't block submission
    }

    // Must have at least one therapist assigned
    if (!curTherapists || curTherapists.length === 0) {
      newErrors.therapist = 'Please assign at least one therapist'
    }

    setErrors(newErrors)
    return { isValid: Object.keys(newErrors).length === 0, newErrors }
  }

  const handleNext = () => {
    const { isValid, newErrors } = validate()
    if (!isValid) {
      if (newErrors.service) toastError(`Please select at least one ${modeRef.current} before proceeding`)
      if (newErrors.therapies) toastError('Please select at least one therapy')
      if (newErrors.therapist) toastError('Therapist assignment is mandatory')
      return
    }

    const latestTDS = therophyDataStateRef.current
    const latestTS = therapyStateRef.current
    const latestTL = therapyLibraryRef.current
    const latestTdKeys = Object.keys(latestTDS)
    const latestMode = modeRef.current
    const latestItems = selectedItemsRef.current
    const latestTherapists = selectedTherapistsRef.current

    const formatExercise = (ex) => {
      // Strip fields that should NOT be sent to the backend
      const {
        // IDs / internal
        id, therapyExercisesId, therapyExerciseId, therapyId, theraphyId, therapy_id,
        _checked,
        // Billing / pricing
        discountPercentageValue,

        // Clinic / branch info
        clinicId, branchId,
        // Raw session / frequency fields (we re-map these below)
        session, sessions, frequencyCount, frequencyUnit,
        // Raw video / duration (empty strings)
        duration,
        // Raw name (we re-map as exerciseName)
        name,
        // eslint-disable-next-line no-unused-vars
        ...cleanEx
      } = ex

      return {
        ...cleanEx,
        exerciseId: ex.therapyExercisesId || ex.therapyExerciseId || ex.id || '',
        exerciseName: ex.exerciseName || ex.name || '',
        noOfSessions: Number(ex.sessions || ex.session || 0),
        frequency: `${ex.frequencyCount || 0} times/${(ex.frequencyUnit || 'day').toLowerCase()}`,
        notes: ex.notes || '',
        sets: Number(ex.sets || 0),
        repetitions: Number(ex.reps || ex.repetitions || 0),
        pricePerSession: Number(ex.pricePerSession || 0),
        // totalPrice: Number(ex.totalPrice || 0),
        ...(ex.video ? { youtubeUrl: ex.video } : {}),
      }
    }

    let therapySessions = []

    if (latestMode === 'package' || latestMode === 'program') {
      const byItemId = {}
      latestTdKeys.forEach(key => {
        const item = latestTDS[key]
        if (!item?.checked) return
        const itemId = key.split('__')[0]
        if (!byItemId[itemId]) byItemId[itemId] = []
        byItemId[itemId].push({ key, item })
      })

      Object.entries(byItemId).forEach(([itemId, entries]) => {
        const serviceObj = latestItems.get(itemId) || {}
        if (latestMode === 'package') {
          const groupedPrograms = {}
          entries.forEach(({ key, item }) => {
            const progKey = item.programId || item.programName || 'default'
            if (!groupedPrograms[progKey]) {
              groupedPrograms[progKey] = { programId: item.programId || '', programName: item.programName || '', therapyData: [] }
            }
            const exercises = (item.exercises || []).filter(ex => ex._checked !== false).map(formatExercise)
            groupedPrograms[progKey].therapyData.push({ therapyId: item.therapyId || '', therapyName: item.therapyName || '', exercises })
          })
          const pkgPrograms = Object.values(groupedPrograms)
          therapySessions.push({ packageId: itemId, packageName: serviceObj.packageName || serviceObj.name || getName(serviceObj, 'package') || '', serviceType: 'package', programs: pkgPrograms })
        } else {
          const selectedTherapies = entries.map(({ key, item }) => {
            const exercises = (item.exercises || []).filter(ex => ex._checked !== false).map(formatExercise)
            return { therapyId: item.therapyId || '', therapyName: item.therapyName || '', exercises }
          })
          therapySessions.push({ programId: itemId, programName: serviceObj.programName || serviceObj.name || getName(serviceObj, 'program') || '', serviceType: 'program', therapyData: selectedTherapies, totalPrice: Number(serviceObj.totalPrice || 0) })
        }
      })

    } else if (latestMode === 'therapy') {
      therapySessions = latestTL.filter(t => latestTS[t.therapyName]?.checked).map(t => {
        const exercises = (latestTS[t.therapyName]?.exercises || []).filter(ex => ex._checked !== false).map(formatExercise)
        const serviceObj = latestItems.get(t.therapyId) || {}
        return { therapyId: t.therapyId || '', therapyName: t.therapyName || '', serviceType: 'therapy', exercises, totalPrice: Number(serviceObj.totalPrice || 0) }
      })

    } else if (latestMode === 'exercise') {
      latestTdKeys.forEach(key => {
        const item = latestTDS[key]
        if (!item?.checked) return
        const exercises = (item.exercises || []).filter(ex => ex._checked !== false).map(formatExercise)
        therapySessions.push({ serviceType: 'exercise', exercises })
      })
    }

    console.log('🚀 TherapySession payload:', therapySessions)
    toastSuccess('Plan saved successfully!')

    onNext({
      therapySessions,
      // Pass array of therapist IDs and names
      therapistIds: latestTherapists.map(t => t.therapistId),
      therapistNames: latestTherapists.map(t => t.fullName),
      // Keep single for backward compat (first selected)
      therapistId: latestTherapists[0]?.therapistId || '',
      therapistName: latestTherapists[0]?.fullName || '',
      therapists: latestTherapists,
      modalitiesUsed: [],
      patientResponse: '',
      manualTherapy: '',
      precautions: [],
    })
  }

  const anyLoading = Object.values(loadingByItemId).some(Boolean)
  const loadingAnything = loadingPrograms || loadingAllExercises || anyLoading
  const hasSelectedItems = selectedItems.size > 0 || restoredFromSeedRef.current
  const showTherapies = !loadingAnything && hasSelectedItems && (
    Object.keys(therophyDataState).length > 0 || therapyLibrary.length > 0
  )
  const availablePrograms = programs.filter(p => !selectedItems.has(getId(p, mode)))

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="pb-5"
      style={{  backgroundColor: '#FFFFFF', minHeight: '100vh' }}
    >
      <style>{`@keyframes toastSlide { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }`}</style>
      <ToastContainer toasts={toasts} />
      <CContainer fluid className="p-1">

        {!clinicId && (
          <div style={{ marginBottom: 16, padding: '10px 18px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, fontSize: '0.85rem', color: '#856404' }}>
            ⏳ Resolving clinic & branch info…
          </div>
        )}

        {/* ── Error summary — only show if errors exist ── */}
        {Object.keys(errors).length > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 18px', background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: '0.85rem', color: '#991b1b' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Please fix the following before proceeding:</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.service && <li>{errors.service}</li>}
              {errors.therapies && <li>{errors.therapies}</li>}
              {errors.therapist && <li>{errors.therapist}</li>}
            </ul>
          </div>
        )}

        {/* ══ 1. SESSION TYPE ══ */}
        <CCard style={cardStyle}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader emoji="⚙️" title="Session Type" />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <RadioBtn label="Package" emoji="📦" value="package" active={mode === 'package'} onClick={handleModeChange} />
              <RadioBtn label="Program" emoji="🎯" value="program" active={mode === 'program'} onClick={handleModeChange} />
              <RadioBtn label="Therapy" emoji="💆" value="therapy" active={mode === 'therapy'} onClick={handleModeChange} />
              <RadioBtn label="Activity" emoji="🏋️" value="exercise" active={mode === 'exercise'} onClick={handleModeChange} />
            </div>

            {/* Multi-select area */}
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '2px solid #dceeff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={labelStyle}>
                  Select {mode === 'exercise' ? 'Activity' : mode.charAt(0).toUpperCase() + mode.slice(1)}(s)
                  <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>
                  <span style={{ marginLeft: 8, fontWeight: 400, fontSize: '0.78rem', color: '#4a7abf', textTransform: 'none', letterSpacing: 0 }}>
                    (multiple selection allowed)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    console.log('📚 Browse button clicked')
                    setShowBrowsePanel(v => !v)
                    setBrowseSearch('')
                    setBulkPending(new Set())
                    // If list is empty, try to fetch again
                    if (programs.length === 0) {
                      console.log('Empty list detected on Browse click. Refreshing...')
                      fetchDataByMode()
                    }
                  }}
                  style={{
                    padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
                    border: '1.5px solid #1B4F8A',
                    background: showBrowsePanel ? 'linear-gradient(135deg,#1B4F8A,#2A6DB5)' : '#FFFFFF',
                    color: showBrowsePanel ? '#fff' : '#1B4F8A',
                    fontWeight: 700, fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: showBrowsePanel ? '0 2px 8px rgba(27,79,138,0.25)' : 'none',
                  }}
                >
                  📚 {showBrowsePanel ? '✕ Close' : (loadingPrograms ? 'Loading...' : `Browse ${mode === 'exercise' ? 'Activity' : mode.charAt(0).toUpperCase() + mode.slice(1)}s`)}
                </button>
              </div>

              {errors.service && (
                <div style={{ marginBottom: 8, fontSize: '0.78rem', color: '#e53e3e', fontWeight: 600 }}>
                  ⚠️ {errors.service}
                </div>
              )}

              {showBrowsePanel && (
                <BrowsePanel
                  mode={mode}
                  programs={availablePrograms}
                  loading={loadingPrograms}
                  selectedIds={bulkPending}
                  onToggle={handleTogglePending}
                  onConfirm={handleConfirmBulk}
                  onClose={() => { setShowBrowsePanel(false); setBulkPending(new Set()) }}
                  search={browseSearch}
                  onSearch={setBrowseSearch}
                />
              )}

              {selectedItems.size > 0 ? (
                <SelectedChips items={Array.from(selectedItems.values())} mode={mode} onRemove={handleRemoveItem} />
              ) : !showBrowsePanel && (
                <div style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.83rem', background: '#FFFFFF', borderRadius: 8, border: '1px dashed #b6cfe8' }}>
                  Click <strong>Browse {mode === 'exercise' ? 'Activity' : mode.charAt(0).toUpperCase() + mode.slice(1)}s</strong> to select one or more {mode === 'exercise' ? 'activity' : mode}s
                </div>
              )}

              {!loadingPrograms && !programs.length && clinicId && (
                <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#94a3b8' }}>No {mode}s found for this branch.</p>
              )}
            </div>
          </CCardBody>
        </CCard>

        {/* ══ 2. THERAPIES & EXERCISES ══ */}
        <CCard style={{ ...cardStyle, borderColor: errors.therapies ? '#fecaca' : '#b6cfe8' }}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader
              emoji={mode === 'program' ? '🎯' : '📦'}
              title={mode === 'package' ? 'Package — Therapies & Activities' : mode === 'program' ? 'Program — Therapies & Activities' : mode === 'therapy' ? 'Therapy — Activities' : 'Activity Details'}
              subtitle={
                showTherapies
                  ? `${checkedCount} / ${totalCount} therapies selected`
                  : selectedItems.size > 0 && anyLoading
                    ? 'Loading details…'
                    : `Select ${mode === 'exercise' ? 'activity' : mode}(s) above to view therapies`
              }
            />

            {errors.therapies && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 8, fontSize: '0.83rem', color: '#991b1b', fontWeight: 600 }}>
                ⚠️ {errors.therapies}
              </div>
            )}

            {selectedItems.size === 0 && !restoredFromSeedRef.current && !anyLoading && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', background: '#FFFFFF', borderRadius: 10, border: '1px dashed #b6cfe8' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{getModeEmoji(mode)}</div>
                Please select one or more {mode === 'exercise' ? 'activity' : mode}s above to load their therapies and exercises.
              </div>
            )}

            {(loadingPrograms || anyLoading) && selectedItems.size === 0 && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#4a7abf', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>⏳</div>
                Loading…
              </div>
            )}

            {anyLoading && selectedItems.size > 0 && (
              <div style={{ marginBottom: 12, padding: '8px 14px', background: '#f0f6ff', borderRadius: 8, border: '1px solid #d0e4f7', fontSize: '0.82rem', color: '#1B4F8A', fontWeight: 600 }}>
                ⏳ Loading details for {Object.keys(loadingByItemId).filter(k => loadingByItemId[k]).length} item(s)…
              </div>
            )}

            {showTherapies && (
              <>
                {/* ── Summary bar — no error hint, just informational ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '8px 14px', background: '#f0f6ff', borderRadius: 8, border: '1px solid #d0e4f7' }}>
                  <span style={{ fontSize: '0.83rem', color: '#1B4F8A', fontWeight: 600 }}>
                    {checkedCount} of {totalCount} ther{totalCount !== 1 ? 'apies' : 'apy'} selected
                    {checkedCount === 0 && (
                      <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#e53e3e', fontWeight: 700 }}>(select at least 1)</span>
                    )}
                  </span>
                  <button type="button" onClick={toggleAll} style={{ padding: '4px 14px', borderRadius: 6, border: '1.5px solid #1B4F8A', background: allChecked ? '#1B4F8A' : '#FFFFFF', color: allChecked ? '#fff' : '#1B4F8A', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    {allChecked ? '☑ Deselect All' : '☐ Select All'}
                  </button>
                </div>

                {hasTherophyData && (() => {
                  const groups = {}
                  tdKeys.forEach(key => {
                    const itemId = key.split('__')[0]
                    if (!groups[itemId]) groups[itemId] = []
                    groups[itemId].push(key)
                  })

                  return Object.entries(groups).map(([itemId, keys]) => {
                    const itemObj = selectedItems.get(itemId) || {}
                    const groupLabel = itemObj.packageName || itemObj.programName || getName(itemObj, mode) || itemId
                    const groupChecked = keys.filter(k => therophyDataState[k]?.checked).length

                    return (
                      <div key={itemId} style={{ marginBottom: 20 }}>
                        {selectedItems.size > 1 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 14px', marginBottom: 8,
                            background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
                            borderRadius: 8, color: '#fff',
                          }}>
                            <span style={{ fontSize: 15 }}>{getModeEmoji(mode)}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>{groupLabel}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>
                              {groupChecked}/{keys.length} therapies
                            </span>
                          </div>
                        )}
                        {keys.map(key => {
                          const ts = therophyDataState[key]
                          return (
                            <TherapyBlock
                              key={key} therapyKey={key} therapy={ts.therapyName || key}
                              programName={ts.programName}
                              checked={ts.checked} onToggle={toggleTherophyData}
                              exercises={ts.exercises || []}
                              onUpdateExercises={updated => updateTherophyDataExercises(key, updated)}
                              loading={false}
                            />
                          )
                        })}
                      </div>
                    )
                  })
                })()}

                {!hasTherophyData && therapyLibrary.map((t, index) => (
                  <TherapyBlock
                    key={t.therapyId || index}
                    therapyKey={t.therapyName}
                    therapy={t.therapyName}
                    checked={therapyState[t.therapyName]?.checked ?? true}
                    onToggle={toggleTherapy}
                    exercises={therapyState[t.therapyName]?.exercises || []}
                    onUpdateExercises={updated => updateExercises(t.therapyName, updated)}
                    loading={loadingAllExercises}
                  />
                ))}
              </>
            )}

            {selectedItems.size > 0 && !anyLoading && !showTherapies && (
              <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', background: '#FFFFFF', borderRadius: 10, border: '1px dashed #b6cfe8' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🔍</div>
                No therapies found in the selected {mode}(s).
              </div>
            )}
          </CCardBody>
        </CCard>

        {/* ══ 3. ASSIGN THERAPIST — moved to bottom ══ */}
        <CCard style={{ ...cardStyle, borderColor: errors.therapist ? '#fecaca' : '#b6cfe8' }}>
          <CCardBody style={{ padding: '22px 28px' }}>
            <SectionHeader emoji="👤" title="Assign Therapist" subtitle="Required *" />
            <TherapistMultiSearch
              therapists={therapists}
              loading={loadingTherapists}
              selectedTherapists={selectedTherapists}
              hasError={!!errors.therapist}
              onRefresh={refreshTherapists}
              onChange={(updated) => {
                setSelectedTherapists(updated)
                if (updated.length > 0) setErrors(prev => ({ ...prev, therapist: undefined }))
              }}
            />
          </CCardBody>
        </CCard>

      </CContainer>

      {/* Sticky bottom bar */}
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

export default TherapySession