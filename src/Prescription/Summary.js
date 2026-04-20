import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import Snackbar from '../components/Snackbar'
import { COLORS } from '../Themes'
import { useToast } from '../utils/Toaster'
import FileUploader from './FileUploader'
import { createDoctorSaveDetails, getClinicDetails, getDoctorDetails, SavePatientPrescription } from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'
import PrescriptionPDF from '../utils/PdfGenerator'
import { pdf } from '@react-pdf/renderer'
import { capitalizeEachWord } from '../utils/CaptalZeWord'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#1a3c5e',
  accent: '#2563eb',
  accentLight: '#dbeafe',
  accentMid: '#93c5fd',
  teal: '#0d9488',
  tealLight: '#ccfbf1',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
  rose: '#e11d48',
  roseLight: '#ffe4e6',
  amber: '#d97706',
  amberLight: '#fef3c7',
  green: '#16a34a',
  greenLight: '#dcfce7',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textMid: '#475569',
  textLight: '#94a3b8',
  bg: '#f8fafc',
  white: '#ffffff',
  headerBg: '#a5c4d4ff',
}

const isValid = (v) =>
  v !== undefined && v !== null && v !== '' && v !== 'NA' &&
  !(typeof v === 'string' && v.trim().toLowerCase() === 'undefined') &&
  !(typeof v === 'string' && v.trim() === '—')

const dash = (v) => (v && v !== 'NA' && String(v).trim() !== '' ? v : '—')

const toImageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return null
  if (raw.startsWith('http') || raw.startsWith('blob:') || raw.startsWith('/')) return raw
  if (raw.startsWith('data:')) return raw
  if (raw.startsWith('/9j/')) return `data:image/jpeg;base64,${raw}`
  if (raw.startsWith('iVBOR')) return `data:image/png;base64,${raw}`
  if (raw.startsWith('R0lGO')) return `data:image/gif;base64,${raw}`
  return `data:image/jpeg;base64,${raw}`
}

const PAIN_LABEL_MAP = {
  chronicPain: 'Chronic Pain', sportsRehab: 'Sports Rehab', neuroRehab: 'Neuro Rehab',
  acutePain: 'Acute Pain', neuropathicPain: 'Neuropathic Pain',
  referredPain: 'Referred Pain', inflammatoryPain: 'Inflammatory Pain',
}

const getVisitUrgency = (dateStr) => {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const visit = new Date(dateStr); visit.setHours(0, 0, 0, 0)
  const diffDays = Math.round((visit - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Overdue', bg: '#fff5f5', color: '#c53030', border: '#fc8181', icon: '⚠️' }
  if (diffDays === 0) return { label: 'Today', bg: '#f0fff4', color: '#276749', border: '#68d391', icon: '📍' }
  if (diffDays <= 3) return { label: 'Very Soon', bg: '#fffbeb', color: '#7b341e', border: '#f6ad55', icon: '🔔' }
  if (diffDays <= 7) return { label: 'This Week', bg: '#ebf8ff', color: '#2a4365', border: '#63b3ed', icon: '📅' }
  return { label: 'Upcoming', bg: '#f5f0ff', color: '#44337a', border: '#b794f4', icon: '🗓️' }
}

// ─── Section Component ────────────────────────────────────────────────────────
const Section = ({ icon, title, children, accent = T.accent, badge = null }) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 16,
    marginBottom: 20, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 22px',
      background: T.headerBg,
      borderBottom: `1px solid rgba(255,255,255,0.2)`,
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ color: T.text, fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', flex: 1 }}>{title}</span>
      {badge && (
        <span style={{
          background: 'rgba(255,255,255,0.4)', color: T.primary,
          borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700,
        }}>{badge}</span>
      )}
    </div>
    <div style={{ padding: '18px 22px' }}>{children}</div>
  </div>
)

// ─── Row Component ────────────────────────────────────────────────────────────
const Row = ({ label, value, full = false, highlight = false }) => {
  if (!isValid(value) && value !== 0) return null
  return (
    <div style={{
      display: full ? 'block' : 'flex', gap: 8, marginBottom: 10,
      padding: highlight ? '8px 12px' : 0,
      background: highlight ? T.accentLight + '55' : 'transparent',
      borderRadius: highlight ? 8 : 0,
      borderLeft: highlight ? `3px solid ${T.accent}` : 'none',
      paddingLeft: highlight ? 12 : 0,
    }}>
      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}:</span>
      <span style={{ fontSize: '0.9rem', color: T.text, wordBreak: 'break-word', marginLeft: full ? 0 : 4 }}>{dash(value)}</span>
    </div>
  )
}

// ─── Grid Component ───────────────────────────────────────────────────────────
const Grid = ({ children, cols = 2 }) => {
  const validChildren = React.Children.toArray(children).filter(Boolean)
  if (validChildren.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px 24px' }}>
      {validChildren}
    </div>
  )
}

// ─── Chip Components ──────────────────────────────────────────────────────────
const Chip = ({ label, color = T.accent, bg = T.accentLight }) => (
  <span style={{
    background: bg, color, borderRadius: 20, padding: '3px 12px',
    fontSize: '0.78rem', fontWeight: 700, border: `1px solid ${color}33`,
    display: 'inline-block', margin: '2px 4px 2px 0',
  }}>{label}</span>
)

const CheckChip = ({ label, checked }) => (
  <span style={{
    background: checked ? T.accentLight : '#f3f4f6',
    color: checked ? T.accent : '#94a3b8',
    borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700,
    border: `1px solid ${checked ? T.accent + '44' : '#e2e8f0'}`,
    display: 'inline-flex', alignItems: 'center', gap: 5, margin: '2px 4px 2px 0',
    opacity: checked ? 1 : 0.5,
  }}>
    {checked ? '✓' : '○'} {label}
  </span>
)

const StatusDot = ({ status }) => {
  const map = {
    Confirmed: ['#d1fae5', '#065f46', '#6ee7b7'],
    Completed: ['#d1fae5', '#065f46', '#6ee7b7'],
    Pending: ['#fef3c7', '#92400e', '#fcd34d'],
    Cancelled: ['#fee2e2', '#991b1b', '#fecaca'],
    'In Progress': [T.accentLight, '#1e40af', T.accentMid],
  }
  const [bg, fg, border] = map[status] || ['#f3f4f6', '#374151', '#d1d5db']
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 20, padding: '3px 14px', fontSize: '0.8rem', fontWeight: 700 }}>{status}</span>
  )
}

const AnswerBadge = ({ answer }) => {
  const display = String(answer ?? '').trim()
  if (!display || display.toLowerCase() === 'undefined' || display.toLowerCase() === 'na') {
    return <span style={{ color: T.textLight, fontSize: 12, fontStyle: 'italic' }}>Not answered</span>
  }
  const up = display.toUpperCase()
  const [bg, color, border] = up === 'YES' ? ['#d1fae5', '#065f46', '#6ee7b7'] : up === 'NO' ? ['#fee2e2', '#991b1b', '#fecaca'] : [T.accentLight, T.accent, T.accentMid]
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 12px', fontSize: '0.78rem', fontWeight: 700 }}>{display}</span>
  )
}

// ─── Therapy Tables ───────────────────────────────────────────────────────────
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: T.text }
const thStyle = { padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.79rem', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, color: T.white }
const tdStyle = (i) => ({ padding: '7px 12px', borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.bg : T.white })

const ExerciseTableDisplay = ({ exercises }) => {
  if (!exercises || exercises.length === 0) return (
    <div style={{ padding: '10px 14px', color: T.textLight, fontStyle: 'italic', fontSize: '0.82rem' }}>No exercises</div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {['#', 'Exercise Name', 'Sessions', 'Sets', 'Reps', 'Frequency', 'Notes'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle(i), fontWeight: 700, color: T.accent }}>{i + 1}</td>
              <td style={{ ...tdStyle(i), fontWeight: 600 }}>{ex.exerciseName || ex.name || '—'}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{dash(ex.noOfSessions ?? ex.session ?? ex.sessions)}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>
                {ex.sets ? <Chip label={`🔁 ${ex.sets}`} color={T.accent} bg={T.accentLight} /> : '—'}
              </td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>
                {(ex.repetitions || ex.reps) ? <Chip label={`🔄 ${ex.repetitions || ex.reps}`} color={T.teal} bg={T.tealLight} /> : '—'}
              </td>
              <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>
                {ex.frequency ? <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.primary }}>📆 {ex.frequency}</span> : '—'}
              </td>
              <td style={{ ...tdStyle(i), maxWidth: 160 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.notes}>{ex.notes || '—'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TherapyBlock = ({ therapyName, exercises, totalPrice, accentColor = T.accent, accentBg = T.accentLight }) => (
  <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 14px', background: accentBg, borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontWeight: 700, color: accentColor, fontSize: '0.88rem' }}>💊 {therapyName || 'Therapy'}</span>
      {totalPrice > 0 && <span style={{ fontSize: '0.78rem', color: T.textMid, fontWeight: 600 }}>₹ {totalPrice}</span>}
    </div>
    <ExerciseTableDisplay exercises={exercises} />
  </div>
)

const SessionMetaBar = ({ sess, therapistId, therapistName }) => {
  const tName = sess.therapistName || therapistName || ''
  const tId = sess.therapistId || therapistId || ''
  if (!sess.serviceType && !tName && !tId) return null
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14,
      padding: '10px 14px', background: T.bg, borderRadius: 10,
      border: `1px solid ${T.border}`, alignItems: 'center',
    }}>
      {sess.serviceType && <Chip label={`📋 ${sess.serviceType}`} color={T.primary} bg={T.accentLight} />}
      {tName && <Chip label={`👤 ${tName}`} color={T.primary} bg="#f0f7ff" />}
      {tId && <Chip label={`ID: ${tId}`} color={T.textMid} bg="#f3f4f6" />}
    </div>
  )
}

const TherapySessionsDisplay = ({ sessionsList, therapistId, therapistName }) => {
  if (!sessionsList || sessionsList.length === 0) return (
    <div style={{ padding: '16px', textAlign: 'center', color: T.textLight, fontSize: '0.85rem' }}>No therapy session data found.</div>
  )
  return (
    <>
      {sessionsList.map((sess, si) => {
        const serviceType = (sess.serviceType || '').toLowerCase()
        const isLast = si === sessionsList.length - 1

        if (serviceType === 'package') {
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{
                padding: '12px 18px', background: `linear-gradient(135deg, ${T.purple}, #a855f7)`,
                borderRadius: '12px 12px 0 0', color: T.white, fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>📦 {sess.packageName || 'Package'}</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: `2px solid #c4b5fd`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
                {Array.isArray(sess.programs) && sess.programs.length > 0 && sess.programs.map((prog, pIdx) => (
                  <div key={pIdx} style={{ marginBottom: pIdx < sess.programs.length - 1 ? 18 : 0 }}>
                    <div style={{ padding: '9px 14px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '8px 8px 0 0', color: T.white, fontWeight: 700 }}>
                      🎯 {prog.programName || `Program ${pIdx + 1}`}
                      {prog.totalPrice > 0 && <span style={{ marginLeft: 8, opacity: 0.8, fontSize: '0.8rem' }}>₹ {prog.totalPrice}</span>}
                    </div>
                    <div style={{ border: `1.5px solid ${T.accentMid}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px' }}>
                      {Array.isArray(prog.therapyData ?? prog.therophyData) && (prog.therapyData ?? prog.therophyData ?? []).map((therapy, tIdx) => (
                        <TherapyBlock key={tIdx} therapyName={therapy.therapyName} exercises={therapy.exercises || []} totalPrice={therapy.totalPrice} />
                      ))}
                    </div>
                  </div>
                ))}
                {(!Array.isArray(sess.programs) || sess.programs.length === 0) && Array.isArray(sess.therapyData ?? sess.therophyData) &&
                  (sess.therapyData ?? sess.therophyData ?? []).map((t, tIdx) => (
                    <TherapyBlock key={tIdx} therapyName={t.therapyName} exercises={t.exercises || []} totalPrice={t.totalPrice} />
                  ))}
              </div>
            </div>
          )
        }

        if (serviceType === 'program') {
          const therapies = sess.therapyData ?? sess.therophyData ?? []
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{ padding: '12px 18px', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, borderRadius: '12px 12px 0 0', color: T.white, fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🎯 {sess.programName || 'Program'}</span>
                {(sess.totalPrice || sess.totalTherapyPrice) > 0 && <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>₹ {sess.totalPrice || sess.totalTherapyPrice}</span>}
              </div>
              <div style={{ border: `2px solid ${T.accentMid}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
                {Array.isArray(therapies) && therapies.length > 0
                  ? therapies.map((t, tIdx) => <TherapyBlock key={tIdx} therapyName={t.therapyName} exercises={t.exercises || []} totalPrice={t.totalPrice} />)
                  : <div style={{ color: T.textLight, fontSize: '0.82rem', fontStyle: 'italic', padding: '8px' }}>No therapies found.</div>}
              </div>
            </div>
          )
        }

        if (serviceType === 'therapy') {
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{ padding: '12px 18px', background: `linear-gradient(135deg, #5b21b6, ${T.purple})`, borderRadius: '12px 12px 0 0', color: T.white, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>💊 {sess.therapyName || 'Therapy Session'}</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: '2px solid #c4b5fd', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
                {Array.isArray(sess.exercises) && sess.exercises.length > 0
                  ? <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}><ExerciseTableDisplay exercises={sess.exercises} /></div>
                  : <div style={{ color: T.textLight, fontSize: '0.82rem', fontStyle: 'italic', padding: '8px' }}>No exercises found.</div>}
              </div>
            </div>
          )
        }

        if (serviceType === 'exercise') {
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{ padding: '12px 18px', background: 'linear-gradient(135deg,#065f46,#10b981)', borderRadius: '12px 12px 0 0', color: T.white, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🏋️ Exercise Session</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: '2px solid #6ee7b7', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
                <ExerciseTableDisplay exercises={sess.exercises || []} />
              </div>
            </div>
          )
        }

        return (
          <div key={si} style={{ marginBottom: isLast ? 0 : 24 }}>
            <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
            {Array.isArray(sess.therapyData) && sess.therapyData.map((t, tIdx) => (
              <TherapyBlock key={tIdx} therapyName={t.therapyName} exercises={t.exercises || []} totalPrice={t.totalPrice} />
            ))}
          </div>
        )
      })}
    </>
  )
}

// ─── Questionnaire Section ────────────────────────────────────────────────────
const QuestionnaireSection = ({ therapyGroups }) => {
  const [activeTab, setActiveTab] = useState(0)
  const validGroups = therapyGroups.filter(({ questions }) =>
    questions.filter(q => isValid(q.question)).length > 0
  )
  if (validGroups.length === 0) return null

  const { questions } = validGroups[activeTab] ?? validGroups[0]
  const validQs = questions.filter(q => isValid(q.question))

  return (
    <Section icon="📝" title="Therapy Questionnaire" badge={`${validGroups.length} categories`}>
      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {validGroups.map(({ category, questions: qs }, idx) => {
          const vqs = qs.filter(q => isValid(q.question))
          const ans = vqs.filter(q => isValid(q.answer) && q.answer.toLowerCase() !== 'undefined').length
          const isActive = activeTab === idx
          return (
            <button
              key={category}
              onClick={() => setActiveTab(idx)}
              style={{
                border: `2px solid ${isActive ? T.accent : T.border}`,
                borderRadius: 12, padding: '7px 16px', cursor: 'pointer',
                background: isActive ? T.accent : T.white,
                color: isActive ? T.white : T.textMid,
                fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
                textTransform: 'capitalize',
              }}
            >
              {category}
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.3)' : T.accentLight,
                color: isActive ? T.white : T.accent,
                borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 800,
              }}>{ans}/{vqs.length}</span>
            </button>
          )
        })}
      </div>

      {/* Questions */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        {validQs.map((q, idx) => {
          const hasAns = isValid(q.answer) && q.answer.toLowerCase() !== 'undefined'
          return (
            <div
              key={q.questionId ?? idx}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                padding: '12px 18px',
                borderBottom: idx < validQs.length - 1 ? `1px solid ${T.borderLight}` : 'none',
                background: idx % 2 === 0 ? T.bg : T.white,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 22, height: 22, borderRadius: '50%',
                  background: hasAns ? T.accent : T.border,
                  color: hasAns ? T.white : T.textLight,
                  fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1,
                }}>{idx + 1}</span>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500, lineHeight: 1.5 }}>
                  {q.question || `Question ${q.questionId}`}
                </span>
              </div>
              <div style={{ flexShrink: 0 }}>
                <AnswerBadge answer={q.answer} />
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SUMMARY COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Summary = ({ onNext, sidebarWidth = 0, onSaveTemplate, patientData, formData = {}, fromPage }) => {
  const { doctorDetails, setDoctorDetails, setClinicDetails, clinicDetails, updateTemplate } = useDoctorContext()
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [saving, setSaving] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [clickedSaveTemplate, setClickedSaveTemplate] = useState(false)
  const navigate = useNavigate()
  const { success, error, info, warning } = useToast()
  const ACTIONS = { SAVE: 'save', SAVE_PRINT: 'savePrint' }

  const record = formData?.physiotherapyRecord ?? formData ?? {}

  const bookingId = record.bookingId ?? patientData?.bookingId ?? ''
  const clinicId = record.clinicId ?? patientData?.clinicId ?? clinicDetails?.hospitalId ?? ''
  const branchId = record.branchId ?? patientData?.branchId ?? ''
  const clinicName = clinicDetails?.name ?? patientData?.clinicName ?? ''
  const doctorId = doctorDetails?.doctorId ?? patientData?.doctorId ?? ''
  const doctorName = doctorDetails?.name ?? doctorDetails?.fullName ?? patientData?.doctorName ?? ''

  const patientInfo = record.patientInfo ?? {}
  const patientId = patientInfo.patientId ?? patientData?.patientId ?? ''
  const patientName = patientInfo.patientName ?? patientData?.patientName ?? patientData?.name ?? patientData?.fullName ?? ''
  const patientMobile = patientInfo.mobileNumber ?? patientData?.mobileNumber ?? patientData?.patientMobileNumber ?? ''
  const patientAge = patientInfo.age ?? patientData?.age ?? ''
  const patientSex = patientInfo.sex ?? patientData?.sex ?? patientData?.gender ?? ''

  const symptomsObj = record.symptoms ?? {}
  const complaintsObj = {
    complaintDetails: symptomsObj.symptomDetails ?? patientData?.problem ?? '',
    duration: symptomsObj.duration ?? patientData?.symptomsDuration ?? '',
    selectedTherapy: symptomsObj.selectedTherapy ?? patientData?.subServiceName ?? '',
    selectedTherapyID: symptomsObj.selectedTherapyID ?? patientData?.subServiceId ?? '',
    painAssessmentImage: symptomsObj.partImage ?? '',
    reportImages: Array.isArray(symptomsObj.attachmentImages) ? symptomsObj.attachmentImages : [],
    theraphyAnswers: symptomsObj.theraphyAnswers ?? {},
  }
  const { complaintDetails, duration: complaintDuration, selectedTherapy, selectedTherapyID, painAssessmentImage: partImage, reportImages, theraphyAnswers: therapyAnswers } = complaintsObj
  const finalComplaints = { complaintDetails, duration: complaintDuration, selectedTherapy, selectedTherapyID, painAssessmentImage: partImage, reportImages, theraphyAnswers: therapyAnswers }
  const therapyGroups = Object.entries(therapyAnswers).map(([cat, qs]) => ({ category: cat, questions: Array.isArray(qs) ? qs : [] }))
  const attachments = [
    ...(partImage ? [{ url: toImageSrc(partImage), name: 'Pain Assessment' }] : []),
    ...reportImages.map((img, i) => ({ url: toImageSrc(img), name: `Report ${i + 1}` })),
  ]

  const previousInjuries = record.previousInjuries ?? formData?.previousInjuries ?? patientData?.previousInjuries ?? ''
  const currentMedications = record.currentMedications ?? formData?.currentMedications ?? patientData?.currentMedications ?? ''
  const allergies = record.allergies ?? formData?.allergies ?? patientData?.allergies ?? ''
  const occupation = record.occupation ?? formData?.occupation ?? patientData?.occupation ?? ''
  const insuranceProvider = record.insuranceProvider ?? formData?.insuranceProvider ?? patientData?.insuranceProvider ?? ''
  const activityLevels = Array.isArray(record.activityLevels) ? record.activityLevels : Array.isArray(formData?.activityLevels) ? formData.activityLevels : []
  const patientPain = record.patientPain ?? formData?.patientPain ?? formData?.assessment?.patientPain ?? patientData?.patientPain ?? ''

  const investigationObj = record.investigation ?? formData?.investigation ?? {}
  const investigationTests = investigationObj.selectedTests ?? investigationObj.tests ?? []
  const investigationReason = investigationObj.notes ?? investigationObj.reason ?? ''
  const investigationTestsArray = Array.isArray(investigationTests) ? investigationTests : investigationTests ? [investigationTests] : []

  const assessment = record.assessment ?? formData?.assessment ?? {}
  const difficultiesIn = Array.isArray(assessment.difficultiesIn) ? assessment.difficultiesIn : []
  const otherDifficulty = assessment.otherDifficulty ?? ''
  const dailyLivingAffected = assessment.dailyLivingAffected ?? ''
  const postureAssessment = Array.isArray(assessment.postureAssessment) ? assessment.postureAssessment : []
  const postureDeviations = assessment.postureDeviations ?? ''
  const romStatus = Array.isArray(assessment.romStatus) ? assessment.romStatus : []
  const romRestricted = assessment.romRestricted ?? ''
  const romJoints = assessment.romJoints ?? ''
  const muscleStrength = Array.isArray(assessment.muscleStrength) ? assessment.muscleStrength : []
  const muscleWeakness = assessment.muscleWeakness ?? ''
  const neurologicalSigns = Array.isArray(assessment.neurologicalSigns) ? assessment.neurologicalSigns : []
  const effectivePain = patientPain || assessment.patientPain || ''
  const painTriggers = assessment.painTriggers ?? ''
  const chronicRelieving = assessment.chronicRelieving ?? ''
  const typeOfSport = assessment.typeOfSport ?? ''
  const recurringInjuries = assessment.recurringInjuries ?? ''
  const returnToSportGoals = assessment.returnToSportGoals ?? ''
  const neuroDiagnosis = assessment.neuroDiagnosis ?? ''
  const neuroOnset = assessment.neuroOnset ?? ''
  const mobilityStatus = assessment.mobilityStatus ?? ''
  const cognitiveStatus = assessment.cognitiveStatus ?? ''

  const diagnosisObj = record.diagnosis ?? formData?.diagnosis ?? {}
  const diagnosisRows = Array.isArray(diagnosisObj.diagnosisRows) ? diagnosisObj.diagnosisRows : diagnosisObj.physioDiagnosis ? [diagnosisObj] : []

  const therapySessionsRaw = formData?.therapySessions ?? record?.therapySessions ?? {}
  const overallStatus = (!Array.isArray(therapySessionsRaw) && therapySessionsRaw?.overallStatus) ? therapySessionsRaw.overallStatus : ''
  let sessionsList = []
  if (Array.isArray(therapySessionsRaw)) sessionsList = therapySessionsRaw
  else if (Array.isArray(therapySessionsRaw?.sessions)) sessionsList = therapySessionsRaw.sessions
  if (sessionsList.length === 1 && Array.isArray(sessionsList[0])) sessionsList = sessionsList[0]

  const topTherapistId = therapySessionsRaw?.therapistId ?? ''
  const topTherapistName = therapySessionsRaw?.therapistName ?? ''

  const treatmentPlanDisplay = {
    doctorId, doctorName,
    therapistId: topTherapistId, therapistName: topTherapistName,
    manualTherapy: therapySessionsRaw?.manualTherapy ?? '',
    precautions: therapySessionsRaw?.precautions ?? '',
    frequency: therapySessionsRaw?.frequency ?? '',
  }

  const exercisePlanObj = record.exercisePlan ?? formData?.exercisePlan ?? {}
  const homeExercises = Array.isArray(exercisePlanObj.homeExercises) ? exercisePlanObj.homeExercises : Array.isArray(exercisePlanObj.exercises) ? exercisePlanObj.exercises : []
  const homeAdvice = exercisePlanObj.homeAdvice ?? ''

  const followUpObj = record.followUp ?? formData?.followUp ?? {}
  const followUpEntry = Array.isArray(followUpObj) ? (followUpObj[0] ?? {}) : (typeof followUpObj === 'object' ? followUpObj : {})

  const parts = formData?.parts ?? record.symptoms?.parts ?? patientData?.parts ?? []
  const treatmentTemplates = Array.isArray(record.treatmentTemplates) ? record.treatmentTemplates : []
  const todayStr = () => new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const doctor = await getDoctorDetails()
        const clinic = await getClinicDetails()
        if (doctor) setDoctorDetails(doctor)
        if (clinic) setClinicDetails(clinic)
      } catch (e) { console.error('Failed to load doctor/clinic details', e) }
    }
    fetchDetails()
  }, [])

  const renderPdfBlob = async () => await pdf(<PrescriptionPDF doctorData={doctorDetails} clicniData={clinicDetails} formData={formData} patientData={patientData} />).toBlob()
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => { const r = reader.result || ''; resolve(String(r).split(',')[1] || '') }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const buildPayload = (prescriptionPdf = '') => {
    const firstDiag = diagnosisRows[0] ?? {}
    const followUpPayload = Array.isArray(followUpObj) ? (followUpObj[0] ?? {}) : (followUpObj ?? {})
    return {
      bookingId, clinicId, branchId,
      patientInfo: { patientId, patientName, mobileNumber: patientMobile, age: Number(patientAge) || 0, sex: patientSex },
      complaints: {
        complaintDetails: finalComplaints.complaintDetails || '',
        painAssessmentImage: finalComplaints.painAssessmentImage || '',
        reportImages: finalComplaints.reportImages || [],
        selectedTherapy: finalComplaints.selectedTherapy || '',
        selectedTherapyId: finalComplaints.selectedTherapyID || '',
        duration: finalComplaints.duration || '',
        therapyAnswers: Object.values(finalComplaints.theraphyAnswers ?? {}).flat().map(q => ({ questionKey: q.questionKey ?? '', questionId: q.questionId ?? '', question: q.question ?? '', answer: q.answer ?? '' })),
      },
      investigation: { tests: investigationTestsArray, reason: investigationReason || '' },
      assessment: {
        subjectiveAssessment: { chiefComplaint: assessment.chiefComplaint ?? '', painScale: Number(assessment.painScale) || 0, painType: assessment.painType ?? '', duration: assessment.duration ?? '', onset: assessment.onset ?? '', aggravatingFactors: assessment.aggravatingFactors ?? '', relievingFactors: assessment.relievingFactors ?? '', observations: assessment.observations ?? '' },
        functionalAssessment: { difficultiesIn, otherDifficulty, dailyLivingAffected },
        physicalExamination: { postureAssessment, postureDeviations, rangeOfMotion: romStatus, romRestricted, romJoints, muscleStrength, muscleWeakness, neurologicalSigns },
        ...(effectivePain === 'chronicPain' ? { chronicPainPatients: { painTriggers, relievingFactors: chronicRelieving } } : {}),
        ...(effectivePain === 'sportsRehab' ? { sportsRehabPatients: { typeOfSport, recurringInjuries, returnToSportGoals } } : {}),
        ...(effectivePain === 'neuroRehab' ? { neuroRehabPatients: { neuroDiagnosis, neuroOnset, mobilityStatus, cognitiveStatus } } : {}),
      },
      diagnosis: { physioDiagnosis: firstDiag.physioDiagnosis ?? '', affectedArea: firstDiag.affectedArea ?? '', severity: firstDiag.severity ?? '', stage: firstDiag.stage ?? '', notes: firstDiag.notes ?? '' },
      treatmentPlan: {
        doctorId, doctorName, therapistId: topTherapistId, therapistName: topTherapistName,
        manualTherapy: treatmentPlanDisplay.manualTherapy,
        precautions: Array.isArray(treatmentPlanDisplay.precautions) ? treatmentPlanDisplay.precautions : treatmentPlanDisplay.precautions ? [treatmentPlanDisplay.precautions] : [],
        modalitiesUsed: formData?.therapySessions?.modalitiesUsed || [],
        patientResponse: formData?.therapySessions?.patientResponse || '',
      },
      therapySessions: sessionsList,
      exercisePlan: {
        homeAdvice,
        homeExercises: homeExercises.map(ex => ({ id: ex.id ?? '', name: ex.name ?? '', sets: Number(ex.sets) || 0, reps: Number(ex.reps) || 0, duration: ex.duration || '10 mins', instructions: ex.instructions ?? '', videoUrl: ex.videoUrl ?? '', thumbnail: ex.thumbnail ?? '' })),
      },
      followUp: { nextVisitDate: followUpPayload.nextVisitDate ?? '', reviewNotes: followUpPayload.reviewNotes ?? '' },
      treatmentTemplates, createdAt: todayStr(), prescriptionPdf,
    }
  }

  const doSave = async ({ downloadAfter = false } = {}) => {
    if (!finalComplaints.complaintDetails?.trim()) { warning('"Complaint Details" is required to save.', { title: 'Warning' }); return false }
    setSaving(true)
    try {
      const safeName = (patientName || 'Record').replace(/[^\w\-]+/g, '_')
      const blob = await renderPdfBlob()
      const pdfBase64 = await blobToBase64(blob)
      const payload = buildPayload(pdfBase64)
      const resp = await SavePatientPrescription(payload)
      if (resp) {
        success('Record saved successfully!', { title: 'Success' })
        if (downloadAfter) downloadBlob(blob, `${safeName}.pdf`)
        navigate('/dashboard', { replace: true })
        return true
      } else { warning('Saved, but got an unexpected response.'); return false }
    } catch (e) {
      console.error('Save error:', e); error('Failed to save record.', { title: 'Error' }); return false
    } finally { setSaving(false) }
  }

  const confirmSaveAsTemplate = async () => { setShowTemplateModal(false); await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT }); setPendingAction(null) }
  const skipTemplate = async () => { setShowTemplateModal(false); await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT }); setPendingAction(null) }

  const hasAssessmentData = Object.keys(assessment).length > 0 && (
    assessment.chiefComplaint || assessment.painScale || assessment.painType ||
    difficultiesIn.length > 0 || postureAssessment.length > 0 || romStatus.length > 0
  )

  const hasBackgroundData = isValid(previousInjuries) || isValid(currentMedications) ||
    isValid(allergies) || isValid(occupation) || isValid(insuranceProvider) ||
    isValid(effectivePain) || activityLevels.length > 0

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 100, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: T.headerBg, padding: '16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 24,
        borderBottom: '1px solid rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📋</div>
          <div>
            <div style={{ fontSize: 11, color: T.text, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Review Before Saving</div>
            <div style={{ color: T.primary, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Physiotherapy Summary</div>
          </div>
        </div>
        {patientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: T.white, borderRadius: 24, padding: '7px 18px', color: T.text, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              {capitalizeEachWord(patientName)} · {patientAge}yr {patientSex?.charAt(0)}
            </div>
            <StatusDot status={overallStatus || patientData?.status || 'Pending'} />
          </div>
        )}
      </div>

      <CContainer fluid style={{ maxWidth: 1100, padding: '0 20px' }}>

        {/* 1. Patient Info */}
        <Section icon="👤" title="Patient & Booking Information">
          <Grid cols={3}>
            {isValid(patientId) && <Row label="Patient ID" value={patientId} />}
            {isValid(bookingId) && <Row label="Booking ID" value={bookingId} />}
            {isValid(patientName) && <Row label="Name" value={capitalizeEachWord(patientName)} />}
            {isValid(patientAge) && <Row label="Age / Sex" value={`${patientAge} yrs / ${patientSex}`} />}
            {isValid(patientMobile) && <Row label="Mobile" value={patientMobile} />}
            {isValid(clinicId) && <Row label="Clinic ID" value={clinicId} />}
            {isValid(clinicName) && <Row label="Clinic" value={clinicName} />}
            {isValid(branchId) && <Row label="Branch ID" value={branchId} />}
            {isValid(doctorName) && <Row label="Doctor" value={doctorName} />}
            {isValid(doctorId) && <Row label="Doctor ID" value={doctorId} />}
            {isValid(patientData?.subServiceName) && <Row label="Therapy Type" value={patientData?.subServiceName} />}
            {isValid(overallStatus) && <Row label="Overall Status" value={overallStatus} />}
          </Grid>
        </Section>

        {/* 2. Complaints — only if data exists */}
        {isValid(complaintDetails) && (
          <Section icon="🩺" title="Complaints & Symptoms">
            <Grid cols={2}>
              <Row label="Complaint Details" value={complaintDetails} highlight />
              {isValid(complaintDuration) && <Row label="Duration" value={complaintDuration} highlight />}
              {isValid(selectedTherapy) && <Row label="Selected Therapy" value={selectedTherapy} />}
              {reportImages.length > 0 && <Row label="Report Images" value={`${reportImages.length} image(s)`} />}
            </Grid>
            {parts.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Affected Parts: </span>
                {parts.map(p => <Chip key={p} label={p} color="#5b21b6" bg="#ede9fe" />)}
              </div>
            )}
            {toImageSrc(partImage) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Body Part Diagram</div>
                <div style={{ background: T.accentLight + '55', borderRadius: 10, overflow: 'hidden', display: 'flex', justifyContent: 'center', border: `1px solid ${T.border}`, padding: 8, maxWidth: 360 }}>
                  <img src={toImageSrc(partImage)} alt="Body Part Diagram" style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 8 }} />
                </div>
              </div>
            )}
            {attachments.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Attachments</div>
                <FileUploader attachments={attachments} accept=".pdf,image/*" />
              </div>
            )}
          </Section>
        )}

        {/* 3. Patient Background — only if any data */}
        {hasBackgroundData && (
          <Section icon="📋" title="Patient Background">
            <Grid cols={3}>
              {isValid(previousInjuries) && <Row label="Previous Injuries" value={previousInjuries} highlight />}
              {isValid(currentMedications) && <Row label="Current Medications" value={currentMedications} highlight />}
              {isValid(allergies) && <Row label="Allergies" value={allergies} />}
              {isValid(occupation) && <Row label="Occupation" value={occupation} />}
              {isValid(insuranceProvider) && <Row label="Insurance Provider" value={insuranceProvider} />}
              {isValid(effectivePain) && <Row label="Pain Type" value={PAIN_LABEL_MAP[effectivePain] || effectivePain} highlight />}
            </Grid>
            {activityLevels.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Levels: </span>
                {activityLevels.map(lvl => <Chip key={lvl} label={lvl} color="#5b21b6" bg="#ede9fe" />)}
              </div>
            )}
          </Section>
        )}

        {/* 4. Therapy Questionnaire — only if data exists */}
        <QuestionnaireSection therapyGroups={therapyGroups} />

        {/* 5. Investigation — only if has data */}
        {(investigationTestsArray.length > 0 || isValid(investigationReason)) && (
          <Section icon="🔬" title="Investigation">
            {investigationTestsArray.length > 0 && (
              <div style={{ marginBottom: investigationReason ? 14 : 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommended Tests:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {investigationTestsArray.map((test, i) => (
                    <span key={i} style={{ background: T.tealLight, color: T.teal, borderRadius: 20, padding: '4px 14px', fontSize: '0.82rem', fontWeight: 700, border: `1px solid #5eead4`, display: 'inline-flex', alignItems: 'center', gap: 6 }}>🔬 {test}</span>
                  ))}
                </div>
              </div>
            )}
            {isValid(investigationReason) && <Row label="Notes / Reason" value={investigationReason} full highlight />}
          </Section>
        )}

        {/* 6. Assessment — only if has data */}
        {hasAssessmentData && (
          <Section icon="📊" title="Assessment">
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>📋 Subjective Assessment</div>
              <Grid cols={2}>
                {isValid(assessment.chiefComplaint) && <Row label="Chief Complaint" value={assessment.chiefComplaint} highlight />}
                {isValid(assessment.painScale) && <Row label="Pain Scale" value={assessment.painScale} highlight />}
                {isValid(assessment.painType) && <Row label="Pain Type" value={assessment.painType} />}
                {isValid(assessment.duration) && <Row label="Duration" value={assessment.duration} />}
                {isValid(assessment.onset) && <Row label="Onset" value={assessment.onset} />}
                {isValid(assessment.aggravatingFactors) && <Row label="Aggravating Factors" value={assessment.aggravatingFactors} />}
                {isValid(assessment.relievingFactors) && <Row label="Relieving Factors" value={assessment.relievingFactors} />}
              </Grid>
              {isValid(assessment.observations) && <Row label="Observations" value={assessment.observations} full />}
            </div>

            {(difficultiesIn.length > 0 || isValid(otherDifficulty) || isValid(dailyLivingAffected)) && (
              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🏃 Functional Assessment</div>
                {difficultiesIn.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulties in: </span>
                    {difficultiesIn.map(d => <Chip key={d} label={d} color={T.accent} bg={T.accentLight} />)}
                    {isValid(otherDifficulty) && <Chip label={`Other: ${otherDifficulty}`} color={T.accent} bg={T.accentLight} />}
                  </div>
                )}
                {isValid(dailyLivingAffected) && <Row label="Daily Living Affected" value={dailyLivingAffected} full highlight />}
              </div>
            )}

            {(postureAssessment.length > 0 || romStatus.length > 0 || muscleStrength.length > 0 || neurologicalSigns.length > 0) && (
              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔬 Physical Examination</div>
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  {[
                    { label: 'Posture Assessment', opts: ['Normal', 'Deviations'], sel: postureAssessment, note: postureDeviations },
                    { label: 'Range of Motion', opts: ['Normal', 'Restricted'], sel: romStatus, note: romRestricted },
                    { label: 'Muscle Strength', opts: ['Normal', 'Weakness in'], sel: muscleStrength, note: muscleWeakness },
                    { label: 'Neurological Signs', opts: ['Normal', 'Balance', 'Coordination', 'Sensation issues'], sel: neurologicalSigns, note: '' },
                  ].map((row, ri, arr) => (
                    <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: ri < arr.length - 1 ? `1px solid ${T.border}` : 'none', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: T.text, minWidth: 160 }}>{row.label}:</span>
                      {row.opts.map(opt => <CheckChip key={opt} label={opt} checked={row.sel.includes(opt)} />)}
                      {isValid(row.note) && <span style={{ fontSize: '0.82rem', color: T.textMid, fontStyle: 'italic' }}>— {row.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {effectivePain === 'chronicPain' && (isValid(painTriggers) || isValid(chronicRelieving)) && (
              <div style={{ marginBottom: 16, background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.rose, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔴 Chronic Pain Assessment</div>
                <Grid cols={2}>
                  {isValid(painTriggers) && <Row label="Pain Triggers" value={painTriggers} highlight />}
                  {isValid(chronicRelieving) && <Row label="Relieving Factors" value={chronicRelieving} highlight />}
                </Grid>
              </div>
            )}
            {effectivePain === 'sportsRehab' && (isValid(typeOfSport) || isValid(recurringInjuries) || isValid(returnToSportGoals)) && (
              <div style={{ marginBottom: 16, background: '#f0fff4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🟢 Sports Rehab Assessment</div>
                <Grid cols={2}>
                  {isValid(typeOfSport) && <Row label="Type of Sport" value={typeOfSport} highlight />}
                  {isValid(recurringInjuries) && <Row label="Recurring Injuries" value={recurringInjuries} highlight />}
                  {isValid(returnToSportGoals) && <Row label="Return-to-Sport Goals" value={returnToSportGoals} full />}
                </Grid>
              </div>
            )}
            {effectivePain === 'neuroRehab' && (isValid(neuroDiagnosis) || isValid(neuroOnset) || isValid(mobilityStatus) || isValid(cognitiveStatus)) && (
              <div style={{ marginBottom: 16, background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🟣 Neuro Rehab Assessment</div>
                <Grid cols={2}>
                  {isValid(neuroDiagnosis) && <Row label="Diagnosis" value={neuroDiagnosis} highlight />}
                  {isValid(neuroOnset) && <Row label="Onset" value={neuroOnset} highlight />}
                  {isValid(mobilityStatus) && <Row label="Mobility Status" value={mobilityStatus} />}
                  {isValid(cognitiveStatus) && <Row label="Cognitive / Communication" value={cognitiveStatus} />}
                </Grid>
              </div>
            )}
          </Section>
        )}

        {/* 7. Diagnosis */}
        {diagnosisRows.length > 0 && (
          <Section icon="🔍" title="Diagnosis">
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['#', 'Physio Diagnosis', 'Affected Area', 'Severity', 'Stage', 'Notes'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {diagnosisRows.map((d, i) => {
                    const sevColor = { Mild: ['#e6f4ea', '#2e7d32'], Moderate: ['#fff3e0', '#e65100'], Severe: ['#fdecea', '#c62828'] }
                    const stagColor = { Acute: ['#fdecea', '#c62828'], 'Sub-acute': ['#fff8e1', '#f57f17'], Chronic: ['#e8eaf6', '#283593'] }
                    const [sBg, sFg] = sevColor[d.severity] || ['#f3f4f6', '#374151']
                    const [tBg, tFg] = stagColor[d.stage] || ['#f3f4f6', '#374151']
                    return (
                      <tr key={i}>
                        <td style={{ ...tdStyle(i), fontWeight: 700, color: T.accent }}>{i + 1}</td>
                        <td style={{ ...tdStyle(i), fontWeight: 600 }}>{d.physioDiagnosis || '—'}</td>
                        <td style={tdStyle(i)}>{d.affectedArea || '—'}</td>
                        <td style={tdStyle(i)}>{d.severity ? <span style={{ background: sBg, color: sFg, borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.78rem' }}>{d.severity}</span> : '—'}</td>
                        <td style={tdStyle(i)}>{d.stage ? <span style={{ background: tBg, color: tFg, borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.78rem' }}>{d.stage}</span> : '—'}</td>
                        <td style={{ ...tdStyle(i), maxWidth: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{d.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 8. Treatment Plan — only if therapist info present */}
        {(isValid(treatmentPlanDisplay.therapistId) || isValid(treatmentPlanDisplay.therapistName)) && (
          <Section icon="🧑‍⚕️" title="Treatment Plan">
            <Grid cols={2}>
              {isValid(treatmentPlanDisplay.doctorId) && <Row label="Doctor ID" value={treatmentPlanDisplay.doctorId} />}
              {isValid(treatmentPlanDisplay.doctorName) && <Row label="Doctor Name" value={treatmentPlanDisplay.doctorName} />}
              {isValid(treatmentPlanDisplay.therapistId) && <Row label="Therapist ID" value={treatmentPlanDisplay.therapistId} />}
              {isValid(treatmentPlanDisplay.therapistName) && <Row label="Therapist Name" value={treatmentPlanDisplay.therapistName} highlight />}
            </Grid>
          </Section>
        )}

        {/* 9. Therapy Sessions */}
        <Section icon="🏥" title="Therapy Sessions" badge={sessionsList.length ? `${sessionsList.length} session(s)` : null}>
          {isValid(overallStatus) && (
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Status:</span>
              <StatusDot status={overallStatus} />
            </div>
          )}
          <TherapySessionsDisplay sessionsList={sessionsList} therapistId={topTherapistId} therapistName={topTherapistName} />
        </Section>

        {/* 10. Exercise Plan — only if has data */}
        {(homeExercises.length > 0 || isValid(homeAdvice)) && (
          <Section icon="🏋️" title="Exercise Plan">
            {homeExercises.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: isValid(homeAdvice) ? 16 : 0 }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>{['#', 'Exercise', 'Sets', 'Reps', 'Frequency', 'Instructions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {homeExercises.map((ex, i) => (
                      <tr key={i}>
                        <td style={{ ...tdStyle(i), fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ ...tdStyle(i), fontWeight: 600 }}>{ex.name || '—'}</td>
                        <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.sets ? <Chip label={`🔁 ${ex.sets}`} color={T.accent} bg={T.accentLight} /> : '—'}</td>
                        <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.reps ? <Chip label={`🔄 ${ex.reps}`} color={T.teal} bg={T.tealLight} /> : '—'}</td>
                        <td style={tdStyle(i)}>{ex.frequency ? <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>📆 {ex.frequency}</span> : '—'}</td>
                        <td style={{ ...tdStyle(i), maxWidth: 260 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>{ex.instructions || '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isValid(homeAdvice) && <Row label="Home Advice" value={homeAdvice} full highlight />}
          </Section>
        )}

        {/* 11. Follow Up — only if has data */}
        {(isValid(followUpEntry.nextVisitDate) || isValid(followUpEntry.reviewNotes)) && (
          <Section icon="📅" title="Follow Up">
            <Grid cols={2}>
              {isValid(followUpEntry.nextVisitDate) && <Row label="Next Visit Date" value={followUpEntry.nextVisitDate} highlight />}
              {isValid(followUpEntry.reviewNotes) && <Row label="Review Notes" value={followUpEntry.reviewNotes} highlight />}
            </Grid>
            {isValid(followUpEntry.nextVisitDate) && (() => {
              const urgency = getVisitUrgency(followUpEntry.nextVisitDate)
              return urgency ? (
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}`, borderRadius: 12, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700 }}>{urgency.icon} {urgency.label}</span>
                </div>
              ) : null
            })()}
          </Section>
        )}

        {/* 12. Treatment Templates — only if has data */}
        {treatmentTemplates.length > 0 && (
          <Section icon="📁" title="Treatment Templates">
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['#', 'Condition', 'Modalities', 'Manual Therapy', 'Exercises', 'Duration', 'Frequency'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {treatmentTemplates.map((t, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle(i), fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ ...tdStyle(i), fontWeight: 600 }}>{t.condition || '—'}</td>
                      <td style={tdStyle(i)}>{Array.isArray(t.modalities) && t.modalities.length ? t.modalities.map(m => <Chip key={m} label={m} color={T.accent} bg={T.accentLight} />) : '—'}</td>
                      <td style={tdStyle(i)}>{t.manualTherapy || '—'}</td>
                      <td style={tdStyle(i)}>{Array.isArray(t.exercises) && t.exercises.length ? t.exercises.map(e => <Chip key={e} label={e} color={T.green} bg={T.greenLight} />) : '—'}</td>
                      <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{t.duration || '—'}</td>
                      <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{t.frequency || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

      </CContainer>

      {/* Sticky bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: sidebarWidth ? `${sidebarWidth}px` : 0,
        width: sidebarWidth ? `calc(100vw - ${sidebarWidth}px)` : '100vw',
        background: T.headerBg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px', zIndex: 999, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
      }}>
        <Button customColor={T.white} color={T.primary}
          style={{ borderRadius: '20px', fontWeight: 700, padding: '7px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          onClick={() => { setClickedSaveTemplate(true); onSaveTemplate?.(); info('Template saved!', { title: 'Template' }) }}>
          {!updateTemplate ? '💾 Save as Template' : '🔄 Update Template'}
        </Button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saving && <CSpinner size="sm" style={{ color: T.primary }} />}
          <Button customColor={T.white} color={T.primary}
            style={{ borderRadius: '20px', fontWeight: 700, padding: '7px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            onClick={() => { setPendingAction(ACTIONS.SAVE); clickedSaveTemplate ? doSave() : setShowTemplateModal(true) }} disabled={saving}>
            ✅ Save
          </Button>
          <Button customColor={T.white} color={T.primary}
            style={{ borderRadius: '20px', fontWeight: 700, padding: '7px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            onClick={() => { setPendingAction(ACTIONS.SAVE_PRINT); clickedSaveTemplate ? doSave({ downloadAfter: true }) : setShowTemplateModal(true) }} disabled={saving}>
            📄 Save & Download PDF
          </Button>
        </div>
      </div>

      {/* Template modal */}
      {showTemplateModal && !clickedSaveTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: T.white, borderRadius: 20, padding: '32px 36px', maxWidth: 420, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, position: 'relative' }}>
            <button onClick={() => setShowTemplateModal(false)} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.textLight, lineHeight: 1 }}>✕</button>
            <div style={{ fontSize: 36, marginBottom: 14, textAlign: 'center' }}>📋</div>
            <h6 style={{ margin: '0 0 8px', color: T.text, fontWeight: 800, textAlign: 'center', fontSize: 18 }}>Save as Template?</h6>
            <p style={{ color: T.textMid, fontSize: '0.88rem', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>Reuse this layout for faster entry next time.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={skipTemplate} style={{ padding: '10px 24px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${T.border}`, background: T.bg, color: T.text, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>No, just save</button>
              <button onClick={confirmSaveAsTemplate} style={{ padding: '10px 24px', borderRadius: 10, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, color: T.white, fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit' }}>Yes, save template</button>
            </div>
          </div>
        </div>
      )}

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default Summary