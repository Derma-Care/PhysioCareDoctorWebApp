// ─── KEY FIXES IN THIS FILE ───────────────────────────────────────────────
// 1. record resolution: handles BOTH API response shape AND internal formData shape
// 2. symptomsObj: reads from record.complaints (API) OR record.symptoms (internal)
// 3. diagnosisRows: reads diagnosisObj.diagnosisRows array first, falls back to flat
// 4. effectivePain: reads from complaints.patientPain OR symptoms.patientPain
// 5. investigationTests: reads selectedTests first then tests
// 6. therapyAnswers: handles both flat array (API) and object-keyed (internal) forms
// 7. buildPayload: always sends the exact shape the API expects
// ─────────────────────────────────────────────────────────────────────────────

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

const T = {
  bgcolor:      '#1B4F8A',
  orange:       '#f9c571',
  orangeLight:  '#fff8ec',
  orangeMid:    '#fde2a3',
  white:        '#FFFFFF',
  bgLight:      '#F0F6FF',
  border:       '#c2d8f0',
  borderLight:  '#deeaf7',
  text:         '#1B4F8A',
  textMid:      '#4a6fa5',
  textLight:    '#7a9ec2',
  teal:         '#0d9488',
  tealLight:    '#ccfbf1',
  purple:       '#7c3aed',
  purpleLight:  '#ede9fe',
  rose:         '#e11d48',
  roseLight:    '#ffe4e6',
  amber:        '#d97706',
  amberLight:   '#fef3c7',
  green:        '#16a34a',
  greenLight:   '#dcfce7',
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
  chronicPain:      'Chronic Pain',
  sportsRehab:      'Sports Rehab',
  neuroRehab:       'Neuro Rehab',
  acutePain:        'Acute Pain',
  neuropathicPain:  'Neuropathic Pain',
  referredPain:     'Referred Pain',
  inflammatoryPain: 'Inflammatory Pain',
}

const getVisitUrgency = (dateStr) => {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const visit = new Date(dateStr); visit.setHours(0, 0, 0, 0)
  const diffDays = Math.round((visit - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0)   return { label: 'Overdue',   bg: '#fff5f5', color: '#c53030', border: '#fc8181', icon: '⚠️' }
  if (diffDays === 0) return { label: 'Today',     bg: '#f0fff4', color: '#276749', border: '#68d391', icon: '📍' }
  if (diffDays <= 3)  return { label: 'Very Soon', bg: '#fffbeb', color: '#7b341e', border: '#f6ad55', icon: '🔔' }
  if (diffDays <= 7)  return { label: 'This Week', bg: '#ebf8ff', color: '#2a4365', border: '#63b3ed', icon: '📅' }
  return { label: 'Upcoming', bg: '#f5f0ff', color: '#44337a', border: '#b794f4', icon: '🗓️' }
}

// ─── UI primitives ────────────────────────────────────────────────────────────
const Section = ({ icon, title, children, badge = null }) => (
  <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(27,79,138,0.07), 0 4px 16px rgba(27,79,138,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: T.bgcolor, borderBottom: `2px solid ${T.orange}` }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(249,197,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: T.white, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.01em', flex: 1 }}>{title}</span>
      {badge && <span style={{ background: T.orange, color: T.bgcolor, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
    </div>
    <div style={{ padding: '12px 16px' }}>{children}</div>
  </div>
)

const Row = ({ label, value, full = false, highlight = false }) => {
  if (!isValid(value) && value !== 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: full ? 'column' : 'row', gap: full ? 2 : 6, marginBottom: 7, padding: highlight ? '5px 10px' : 0, background: highlight ? T.orangeLight : 'transparent', borderRadius: highlight ? 6 : 0, borderLeft: highlight ? `3px solid ${T.orange}` : 'none', paddingLeft: highlight ? 10 : 0, alignItems: 'flex-start' }}>
      <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.5, minWidth: full ? 'auto' : 110 }}>{label}:</span>
      <span style={{ fontSize: '0.82rem', color: T.text, wordBreak: 'break-word', lineHeight: 1.5, flex: 1 }}>{dash(value)}</span>
    </div>
  )
}

const Grid = ({ children, cols = 2 }) => {
  const validChildren = React.Children.toArray(children).filter(Boolean)
  if (validChildren.length === 0) return null
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px 20px' }}>{validChildren}</div>
}

const Chip = ({ label, color = T.bgcolor, bg = T.bgLight }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${color}33`, display: 'inline-block', margin: '2px 3px 2px 0' }}>{label}</span>
)

const CheckChip = ({ label, checked }) => (
  <span style={{ background: checked ? T.orangeLight : '#f3f4f6', color: checked ? T.bgcolor : '#94a3b8', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${checked ? T.orange : '#e2e8f0'}`, display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 3px 2px 0', opacity: checked ? 1 : 0.5 }}>
    {checked ? '✓' : '○'} {label}
  </span>
)

const StatusDot = ({ status }) => {
  const map = {
    Confirmed:     ['#d1fae5', '#065f46', '#6ee7b7'],
    Completed:     ['#d1fae5', '#065f46', '#6ee7b7'],
    Pending:       ['#fef3c7', '#92400e', '#fcd34d'],
    Cancelled:     ['#fee2e2', '#991b1b', '#fecaca'],
    'In Progress': [T.bgLight, T.bgcolor, T.border],
    'in-progress': [T.bgLight, T.bgcolor, T.border],
  }
  const [bg, fg, border] = map[status] || ['#f3f4f6', '#374151', '#d1d5db']
  return <span style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{status}</span>
}

const AnswerBadge = ({ answer }) => {
  const display = String(answer ?? '').trim()
  if (!display || display.toLowerCase() === 'undefined' || display.toLowerCase() === 'na') {
    return <span style={{ color: T.textLight, fontSize: 11, fontStyle: 'italic' }}>Not answered</span>
  }
  const up = display.toUpperCase()
  const [bg, color, border] = up === 'YES' ? ['#d1fae5', '#065f46', '#6ee7b7'] : up === 'NO' ? ['#fee2e2', '#991b1b', '#fecaca'] : [T.bgLight, T.bgcolor, T.border]
  return <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{display}</span>
}

// ─── Therapy Tables ───────────────────────────────────────────────────────────
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: T.text }
const thStyle    = { padding: '6px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.72rem', background: T.bgcolor, color: T.white }
const tdStyle    = (i) => ({ padding: '5px 10px', borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.bgLight : T.white })

const ExerciseTableDisplay = ({ exercises }) => {
  if (!exercises || exercises.length === 0) return <div style={{ padding: '8px 12px', color: T.textLight, fontStyle: 'italic', fontSize: '0.78rem' }}>No exercises</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead><tr>{['#', 'Exercise Name', 'Sessions', 'Sets', 'Reps', 'Frequency', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {exercises.map((ex, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle(i), fontWeight: 700, color: T.bgcolor }}>{i + 1}</td>
              <td style={{ ...tdStyle(i), fontWeight: 600 }}>{ex.exerciseName || ex.name || '—'}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{dash(ex.noOfSessions ?? ex.session ?? ex.sessions)}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.sets ? <Chip label={`🔁 ${ex.sets}`} color={T.bgcolor} bg={T.bgLight} /> : '—'}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{(ex.repetitions || ex.reps) ? <Chip label={`🔄 ${ex.repetitions || ex.reps}`} color={T.teal} bg={T.tealLight} /> : '—'}</td>
              <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{ex.frequency ? <span style={{ fontSize: '0.72rem', fontWeight: 600, color: T.bgcolor }}>📆 {ex.frequency}</span> : '—'}</td>
              <td style={{ ...tdStyle(i), maxWidth: 140 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.notes}>{ex.notes || '—'}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TherapyBlock = ({ therapyName, exercises }) => (
  <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: T.bgLight, borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontWeight: 700, color: T.bgcolor, fontSize: '0.8rem' }}>💊 {therapyName || 'Therapy'}</span>
    </div>
    <ExerciseTableDisplay exercises={exercises} />
  </div>
)

const SessionMetaBar = ({ sess, therapistId, therapistName }) => {
  const tName = sess.therapistName || therapistName || ''
  const tId   = sess.therapistId   || therapistId   || ''
  if (!sess.serviceType && !tName && !tId) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, padding: '8px 12px', background: T.bgLight, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
      {sess.serviceType && <Chip label={`📋 ${sess.serviceType}`} color={T.bgcolor} bg={T.bgLight} />}
      {tName && <Chip label={`👤 ${tName}`} color={T.bgcolor} bg={T.orangeLight} />}
      {tId   && <Chip label={`ID: ${tId}`}  color={T.textMid}  bg="#f3f4f6" />}
    </div>
  )
}

const TherapySessionsDisplay = ({ sessionsList, therapistId, therapistName }) => {
  if (!sessionsList || sessionsList.length === 0) return <div style={{ padding: '12px', textAlign: 'center', color: T.textLight, fontSize: '0.8rem' }}>No therapy session data found.</div>
  return (
    <>
      {sessionsList.map((sess, si) => {
        const serviceType = (sess.serviceType || '').toLowerCase()
        const isLast = si === sessionsList.length - 1

        if (serviceType === 'package') return (
          <div key={si} style={{ marginBottom: isLast ? 0 : 20 }}>
            <div style={{ padding: '8px 14px', background: T.bgcolor, borderRadius: '10px 10px 0 0', color: T.white, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.orange}` }}>
              <span>📦 {sess.packageName || 'Package'}</span>
            </div>
            <div style={{ border: `2px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px' }}>
              <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
              {Array.isArray(sess.programs) && sess.programs.map((prog, pIdx) => (
                <div key={pIdx} style={{ marginBottom: pIdx < sess.programs.length - 1 ? 14 : 0 }}>
                  <div style={{ padding: '7px 12px', background: T.bgcolor, borderRadius: '7px 7px 0 0', color: T.white, fontWeight: 700, fontSize: '0.8rem' }}>🎯 {prog.programName || `Program ${pIdx + 1}`}</div>
                  <div style={{ border: `1.5px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 7px 7px', padding: '10px' }}>
                    {Array.isArray(prog.therapyData ?? prog.therophyData) && (prog.therapyData ?? prog.therophyData ?? []).map((therapy, tIdx) => (
                      <TherapyBlock key={tIdx} therapyName={therapy.therapyName} exercises={therapy.exercises || []} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

        if (serviceType === 'program') {
          const therapies = sess.therapyData ?? sess.therophyData ?? []
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 20 }}>
              <div style={{ padding: '8px 14px', background: T.bgcolor, borderRadius: '10px 10px 0 0', color: T.white, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.orange}` }}>
                <span>🎯 {sess.programName || 'Program'}</span>
              </div>
              <div style={{ border: `2px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px' }}>
                <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
                {Array.isArray(therapies) && therapies.length > 0
                  ? therapies.map((t, tIdx) => <TherapyBlock key={tIdx} therapyName={t.therapyName} exercises={t.exercises || []} />)
                  : <div style={{ color: T.textLight, fontSize: '0.78rem', fontStyle: 'italic', padding: '6px' }}>No therapies found.</div>}
              </div>
            </div>
          )
        }

        if (serviceType === 'therapy') return (
          <div key={si} style={{ marginBottom: isLast ? 0 : 20 }}>
            <div style={{ padding: '8px 14px', background: T.bgcolor, borderRadius: '10px 10px 0 0', color: T.white, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.orange}` }}>
              <span>💊 {sess.therapyName || 'Therapy Session'}</span>
            </div>
            <div style={{ border: `2px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px' }}>
              <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
              {Array.isArray(sess.exercises) && sess.exercises.length > 0
                ? <div style={{ border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden' }}><ExerciseTableDisplay exercises={sess.exercises} /></div>
                : <div style={{ color: T.textLight, fontSize: '0.78rem', fontStyle: 'italic', padding: '6px' }}>No exercises found.</div>}
            </div>
          </div>
        )

        if (serviceType === 'exercise') return (
          <div key={si} style={{ marginBottom: isLast ? 0 : 20 }}>
            <div style={{ padding: '8px 14px', background: T.bgcolor, borderRadius: '10px 10px 0 0', color: T.white, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.orange}` }}>
              <span>🏋️ Exercise Session</span>
            </div>
            <div style={{ border: `2px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px' }}>
              <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
              <ExerciseTableDisplay exercises={sess.exercises || []} />
            </div>
          </div>
        )

        return (
          <div key={si} style={{ marginBottom: isLast ? 0 : 18 }}>
            <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
            {Array.isArray(sess.therapyData) && sess.therapyData.map((t, tIdx) => (
              <TherapyBlock key={tIdx} therapyName={t.therapyName} exercises={t.exercises || []} />
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
  const validGroups = therapyGroups.filter(({ questions }) => questions.filter(q => isValid(q.question)).length > 0)
  if (validGroups.length === 0) return null

  const { questions } = validGroups[activeTab] ?? validGroups[0]
  const validQs = questions.filter(q => isValid(q.question))

  return (
    <Section icon="📝" title="Therapy Questionnaire" badge={`${validGroups.length} categories`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {validGroups.map(({ category, questions: qs }, idx) => {
          const vqs   = qs.filter(q => isValid(q.question))
          const ans   = vqs.filter(q => isValid(q.answer) && q.answer.toLowerCase() !== 'undefined').length
          const isAct = activeTab === idx
          return (
            <button key={category} onClick={() => setActiveTab(idx)} style={{ border: `2px solid ${isAct ? T.orange : T.border}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', background: isAct ? T.bgcolor : T.white, color: isAct ? T.white : T.textMid, fontWeight: 700, fontSize: 11, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
              {category}
              <span style={{ background: isAct ? T.orange : T.bgLight, color: T.bgcolor, borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>{ans}/{vqs.length}</span>
            </button>
          )
        })}
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        {validQs.map((q, idx) => {
          const hasAns = isValid(q.answer) && q.answer.toLowerCase() !== 'undefined'
          return (
            <div key={q.questionId ?? idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '9px 14px', borderBottom: idx < validQs.length - 1 ? `1px solid ${T.borderLight}` : 'none', background: idx % 2 === 0 ? T.bgLight : T.white }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, borderRadius: '50%', background: hasAns ? T.bgcolor : T.border, color: hasAns ? T.white : T.textLight, fontSize: 9, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{idx + 1}</span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 500, lineHeight: 1.4 }}>{q.question || `Question ${q.questionId}`}</span>
              </div>
              <div style={{ flexShrink: 0 }}><AnswerBadge answer={q.answer} /></div>
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
  const [snackbar,            setSnackbar]            = useState({ show: false, message: '', type: '' })
  const [saving,              setSaving]              = useState(false)
  const [showTemplateModal,   setShowTemplateModal]   = useState(false)
  const [pendingAction,       setPendingAction]       = useState(null)
  const [clickedSaveTemplate, setClickedSaveTemplate] = useState(false)
  const navigate = useNavigate()
  const { success, error, info, warning } = useToast()
  const ACTIONS = { SAVE: 'save', SAVE_PRINT: 'savePrint' }

  // ─── FIX: Unified record resolution ───────────────────────────────────────
  // The API response has a flat shape: { bookingId, complaints, assessment, ... }
  // The internal formData has: { symptoms, assessment, diagnosis, ... }
  // We need to handle BOTH so the summary and payload always work correctly.
  const record = formData?.physiotherapyRecord ?? formData ?? {}

  // Top-level IDs — same in both shapes
  const bookingId  = record.bookingId  ?? patientData?.bookingId  ?? ''
  const clinicId   = record.clinicId   ?? patientData?.clinicId   ?? clinicDetails?.hospitalId ?? ''
  const branchId   = record.branchId   ?? patientData?.branchId   ?? ''
  const clinicName = clinicDetails?.name ?? patientData?.clinicName ?? ''
  const doctorId   = doctorDetails?.doctorId ?? patientData?.doctorId ?? ''
  const doctorName = doctorDetails?.name ?? doctorDetails?.fullName ?? patientData?.doctorName ?? ''

  // ─── patientInfo ──────────────────────────────────────────────────────────
  // API shape: record.patientInfo   Internal shape: also record.patientInfo
  const patientInfo   = record.patientInfo ?? {}
  const patientId     = patientInfo.patientId    ?? patientData?.patientId    ?? ''
  const patientName   = patientInfo.patientName  ?? patientData?.patientName  ?? patientData?.name ?? patientData?.fullName ?? ''
  const patientMobile = patientInfo.mobileNumber ?? patientData?.mobileNumber ?? patientData?.patientMobileNumber ?? ''
  const patientAge    = patientInfo.age           ?? patientData?.age          ?? ''
  const patientSex    = patientInfo.sex           ?? patientData?.sex          ?? patientData?.gender ?? ''

  // ─── FIX: Complaints / Symptoms resolution ────────────────────────────────
  // API shape  : record.complaints  → { complaintDetails, duration, selectedTherapy, selectedTherapyId, painAssessmentImage, reportImages, therapyAnswers[] }
  // Internal   : record.symptoms    → { symptomDetails, duration, selectedTherapy, selectedTherapyID, partImage, attachmentImages, theraphyAnswers{} }
  const complaintsAPI = record.complaints ?? {}   // from API response
  const symptomsInternal = record.symptoms ?? {}  // from internal formData

  // Merge: API fields take priority when present; fall back to internal keys
  const complaintDetails =
    complaintsAPI.complaintDetails     ||
    symptomsInternal.symptomDetails    ||
    patientData?.problem               || ''

  const complaintDuration =
    complaintsAPI.duration             ||
    symptomsInternal.duration          ||
    patientData?.symptomsDuration      || ''

  const selectedTherapy =
    complaintsAPI.selectedTherapy      ||
    symptomsInternal.selectedTherapy   ||
    patientData?.subServiceName        || ''

  const selectedTherapyID =
    complaintsAPI.selectedTherapyId    ||   // API key (no capital D)
    complaintsAPI.selectedTherapyID    ||   // just in case
    symptomsInternal.selectedTherapyID ||
    patientData?.subServiceId          || ''

  const partImage =
    complaintsAPI.painAssessmentImage  ||
    symptomsInternal.partImage         || ''

  const reportImages = (() => {
    const apiImgs = complaintsAPI.reportImages
    const intImgs = symptomsInternal.attachmentImages
    if (Array.isArray(apiImgs) && apiImgs.length) return apiImgs
    if (Array.isArray(intImgs) && intImgs.length)  return intImgs
    return []
  })()

  // ─── FIX: therapyAnswers — handle both shapes ─────────────────────────────
  // API shape    : therapyAnswers is a flat ARRAY → [{ questionId, question, answer, questionKey }]
  // Internal     : theraphyAnswers is an OBJECT  → { category: [{ questionId, question, answer }] }
  const rawApiAnswers      = complaintsAPI.therapyAnswers    // flat array or undefined
  const rawInternalAnswers = symptomsInternal.theraphyAnswers ?? symptomsInternal.therapyAnswers  // object or undefined

  // Build therapyGroups for display in QuestionnaireSection
  // and flatTherapyAnswers for the payload
  let therapyGroups        = []
  let flatTherapyAnswers   = []

  if (Array.isArray(rawApiAnswers) && rawApiAnswers.length) {
    // API shape: flat array — group by questionKey for display (or show as single group)
    flatTherapyAnswers = rawApiAnswers.map(q => ({
      questionKey: q.questionKey ?? '',
      questionId:  String(q.questionId  ?? ''),
      question:    q.question    ?? '',
      answer:      q.answer      ?? '',
    }))
    // Group by questionKey for display; if no key, put all in one group
    const grouped = {}
    rawApiAnswers.forEach(q => {
      const cat = q.questionKey || 'General'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(q)
    })
    therapyGroups = Object.entries(grouped).map(([category, questions]) => ({ category, questions }))
  } else if (rawInternalAnswers && typeof rawInternalAnswers === 'object' && !Array.isArray(rawInternalAnswers)) {
    // Internal shape: object keyed by category
    therapyGroups = Object.entries(rawInternalAnswers).map(([cat, qs]) => ({
      category:  cat,
      questions: Array.isArray(qs) ? qs : [],
    }))
    // Flatten for payload
    flatTherapyAnswers = Object.values(rawInternalAnswers)
      .flat()
      .map(q => ({
        questionKey: q.questionKey ?? '',
        questionId:  String(q.questionId  ?? ''),
        question:    q.question    ?? '',
        answer:      q.answer      ?? '',
      }))
  }

  const attachments = [
    ...(partImage ? [{ url: toImageSrc(partImage), name: 'Pain Assessment' }] : []),
    ...reportImages.map((img, i) => ({ url: toImageSrc(img), name: `Report ${i + 1}` })),
  ]

  // ─── Background patient fields ────────────────────────────────────────────
  const previousInjuries =
    isValid(complaintsAPI.previousInjuries)    ? complaintsAPI.previousInjuries    :
    isValid(symptomsInternal.previousInjuries) ? symptomsInternal.previousInjuries :
    isValid(record.previousInjuries)           ? record.previousInjuries           :
    isValid(formData?.previousInjuries)        ? formData.previousInjuries         :
    isValid(patientData?.previousInjuries)     ? patientData.previousInjuries      : ''

  const currentMedications =
    complaintsAPI.currentMedications    ??
    symptomsInternal.currentMedications ??
    record.currentMedications           ??
    formData?.currentMedications        ??
    patientData?.currentMedications     ?? ''

  const allergies =
    complaintsAPI.allergies    ??
    symptomsInternal.allergies ??
    record.allergies           ??
    formData?.allergies        ??
    patientData?.allergies     ?? ''

  const occupation =
    complaintsAPI.occupation    ??
    symptomsInternal.occupation ??
    record.occupation           ??
    formData?.occupation        ??
    patientData?.occupation     ?? ''

  const insuranceProvider =
    complaintsAPI.insuranceProvider    ??
    symptomsInternal.insuranceProvider ??
    record.insuranceProvider           ??
    formData?.insuranceProvider        ??
    patientData?.insuranceProvider     ?? ''

  const activityLevels = (() => {
    const candidates = [
      complaintsAPI.activityLevels,
      symptomsInternal.activityLevels,
      record.activityLevels,
      formData?.activityLevels,
    ]
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) return c
    }
    return []
  })()

  // ─── FIX: effectivePain — check all possible locations ───────────────────
  const effectivePain =
    symptomsInternal.patientPain     ||
    symptomsInternal.reasonforVisit  ||
    complaintsAPI.patientPain        ||
    record.patientPain               ||
    formData?.patientPain            ||
    patientData?.patientPain         || ''

  // ─── FIX: Investigation ───────────────────────────────────────────────────
  // API shape  : record.investigation → { tests[], reason }
  // Internal   : formData.investigation → { selectedTests[], tests[], notes, reason }
  const investigationObj =
    record.investigation     ??
    formData?.investigation  ?? {}

  const investigationTests =
    investigationObj.selectedTests ??  // internal key
    investigationObj.tests         ?? []  // API key

  const investigationReason =
    investigationObj.notes   ??
    investigationObj.reason  ?? ''

  const investigationTestsArray = Array.isArray(investigationTests)
    ? investigationTests
    : investigationTests ? [investigationTests] : []

  // ─── FIX: Assessment ─────────────────────────────────────────────────────
  // API shape  : record.assessment → { subjectiveAssessment{}, functionalAssessment{}, physicalExamination{} }
  // Internal   : formData.assessment → flat object with all fields
  const assessmentRaw = record.assessment ?? formData?.assessment ?? {}

  // Support both nested (API) and flat (internal) shapes
  const subjectiveAssessment  = assessmentRaw.subjectiveAssessment  ?? assessmentRaw
  const functionalAssessment  = assessmentRaw.functionalAssessment  ?? assessmentRaw
  const physicalExamination   = assessmentRaw.physicalExamination   ?? assessmentRaw

  const assessment = {
    chiefComplaint:     subjectiveAssessment.chiefComplaint     ?? assessmentRaw.chiefComplaint     ?? '',
    painScale:          subjectiveAssessment.painScale          ?? assessmentRaw.painScale          ?? 0,
    painType:           subjectiveAssessment.painType           ?? assessmentRaw.painType           ?? '',
    duration:           subjectiveAssessment.duration           ?? assessmentRaw.duration           ?? '',
    onset:              subjectiveAssessment.onset              ?? assessmentRaw.onset              ?? '',
    aggravatingFactors: subjectiveAssessment.aggravatingFactors ?? assessmentRaw.aggravatingFactors ?? '',
    relievingFactors:   subjectiveAssessment.relievingFactors   ?? assessmentRaw.relievingFactors   ?? '',
    observations:       subjectiveAssessment.observations       ?? assessmentRaw.observations       ?? '',
    difficultiesIn:     Array.isArray(functionalAssessment.difficultiesIn)    ? functionalAssessment.difficultiesIn    : Array.isArray(assessmentRaw.difficultiesIn)    ? assessmentRaw.difficultiesIn    : [],
    otherDifficulty:    functionalAssessment.otherDifficulty    ?? assessmentRaw.otherDifficulty    ?? '',
    dailyLivingAffected: functionalAssessment.dailyLivingAffected ?? assessmentRaw.dailyLivingAffected ?? '',
    postureAssessment:  Array.isArray(physicalExamination.postureAssessment)  ? physicalExamination.postureAssessment  : Array.isArray(assessmentRaw.postureAssessment)  ? assessmentRaw.postureAssessment  : [],
    postureDeviations:  physicalExamination.postureDeviations  ?? assessmentRaw.postureDeviations  ?? '',
    romStatus:          Array.isArray(physicalExamination.rangeOfMotion)      ? physicalExamination.rangeOfMotion      : Array.isArray(physicalExamination.romStatus)     ? physicalExamination.romStatus     : Array.isArray(assessmentRaw.romStatus)         ? assessmentRaw.romStatus         : [],
    romRestricted:      physicalExamination.romRestricted       ?? assessmentRaw.romRestricted      ?? '',
    romJoints:          physicalExamination.romJoints           ?? assessmentRaw.romJoints          ?? '',
    muscleStrength:     Array.isArray(physicalExamination.muscleStrength)     ? physicalExamination.muscleStrength     : Array.isArray(assessmentRaw.muscleStrength)     ? assessmentRaw.muscleStrength     : [],
    muscleWeakness:     physicalExamination.muscleWeakness      ?? assessmentRaw.muscleWeakness     ?? '',
    neurologicalSigns:  Array.isArray(physicalExamination.neurologicalSigns)  ? physicalExamination.neurologicalSigns  : Array.isArray(assessmentRaw.neurologicalSigns)  ? assessmentRaw.neurologicalSigns  : [],
    patientPain:        assessmentRaw.patientPain ?? '',
    painTriggers:       assessmentRaw.painTriggers       ?? assessmentRaw.chronicPainPatients?.painTriggers    ?? '',
    chronicRelieving:   assessmentRaw.chronicRelieving   ?? assessmentRaw.chronicPainPatients?.relievingFactors ?? '',
    typeOfSport:        assessmentRaw.typeOfSport         ?? assessmentRaw.sportsRehabPatients?.typeOfSport     ?? '',
    recurringInjuries:  assessmentRaw.recurringInjuries   ?? assessmentRaw.sportsRehabPatients?.recurringInjuries ?? '',
    returnToSportGoals: assessmentRaw.returnToSportGoals  ?? assessmentRaw.sportsRehabPatients?.returnToSportGoals ?? '',
    neuroDiagnosis:     assessmentRaw.neuroDiagnosis      ?? assessmentRaw.neuroRehabPatients?.neuroDiagnosis   ?? '',
    neuroOnset:         assessmentRaw.neuroOnset          ?? assessmentRaw.neuroRehabPatients?.neuroOnset        ?? '',
    mobilityStatus:     assessmentRaw.mobilityStatus      ?? assessmentRaw.neuroRehabPatients?.mobilityStatus   ?? '',
    cognitiveStatus:    assessmentRaw.cognitiveStatus     ?? assessmentRaw.neuroRehabPatients?.cognitiveStatus  ?? '',
  }

  const {
    difficultiesIn, otherDifficulty, dailyLivingAffected,
    postureAssessment, postureDeviations,
    romStatus, romRestricted, romJoints,
    muscleStrength, muscleWeakness, neurologicalSigns,
    painTriggers, chronicRelieving,
    typeOfSport, recurringInjuries, returnToSportGoals,
    neuroDiagnosis, neuroOnset, mobilityStatus, cognitiveStatus,
  } = assessment

  // ─── FIX: Diagnosis ───────────────────────────────────────────────────────
  // API shape  : record.diagnosis → { physioDiagnosis, affectedArea, severity, stage, notes }
  // Internal   : formData.diagnosis → { diagnosisRows[] } OR flat
  const diagnosisObj = record.diagnosis ?? formData?.diagnosis ?? {}

  const diagnosisRows = (() => {
    // 1. Internal shape: array of rows
    if (Array.isArray(diagnosisObj.diagnosisRows) && diagnosisObj.diagnosisRows.length) {
      return diagnosisObj.diagnosisRows
    }
    // 2. API shape: flat object with physioDiagnosis
    if (isValid(diagnosisObj.physioDiagnosis)) {
      return [{
        physioDiagnosis: diagnosisObj.physioDiagnosis ?? '',
        affectedArea:    diagnosisObj.affectedArea    ?? '',
        severity:        diagnosisObj.severity        ?? '',
        stage:           diagnosisObj.stage           ?? '',
        notes:           diagnosisObj.notes           ?? '',
      }]
    }
    return []
  })()

  // ─── FIX: Treatment Plan ─────────────────────────────────────────────────
  // API shape  : record.treatmentPlan → { doctorId, doctorName, therapistId, therapistName, manualTherapy, modalitiesUsed[], patientResponse, precautions[] }
  const treatmentPlanObj = record.treatmentPlan ?? {}

  const topTherapistId   = treatmentPlanObj.therapistId   ?? formData?.therapySessions?.therapistId   ?? ''
  const topTherapistName = treatmentPlanObj.therapistName ?? formData?.therapySessions?.therapistName ?? ''
  const manualTherapy    = treatmentPlanObj.manualTherapy ?? formData?.therapySessions?.manualTherapy ?? ''
  const precautionsArr   = Array.isArray(treatmentPlanObj.precautions)    ? treatmentPlanObj.precautions    : Array.isArray(formData?.therapySessions?.precautions) ? formData.therapySessions.precautions : []
  const modalitiesArr    = Array.isArray(treatmentPlanObj.modalitiesUsed) ? treatmentPlanObj.modalitiesUsed : Array.isArray(formData?.therapySessions?.modalitiesUsed) ? formData.therapySessions.modalitiesUsed : []
  const patientResponse  = treatmentPlanObj.patientResponse ?? formData?.therapySessions?.patientResponse ?? ''

  const treatmentPlanDisplay = {
    doctorId,    doctorName,
    therapistId:   topTherapistId,
    therapistName: topTherapistName,
    manualTherapy,
  }

  // ─── Therapy Sessions ─────────────────────────────────────────────────────
  // API shape  : record.therapySessions → array of package/program/therapy objects
  // Internal   : formData.therapySessions → { sessions[], therapistId, ... }
  const therapySessionsRaw = record.therapySessions ?? formData?.therapySessions ?? {}
  const overallStatus = record.overallStatus ?? ((!Array.isArray(therapySessionsRaw) && therapySessionsRaw?.overallStatus) ? therapySessionsRaw.overallStatus : '') ?? ''

  let sessionsList = []
  if (Array.isArray(therapySessionsRaw))                     sessionsList = therapySessionsRaw
  else if (Array.isArray(therapySessionsRaw?.sessions))      sessionsList = therapySessionsRaw.sessions
  if (sessionsList.length === 1 && Array.isArray(sessionsList[0])) sessionsList = sessionsList[0]

  // ─── Exercise Plan ────────────────────────────────────────────────────────
  // API shape  : record.exercisePlan → { homeAdvice, homeExercises[] }
  // Internal   : formData.exercisePlan → { homeAdvice, exercises[], homeExercises[] }
  const exercisePlanObj = record.exercisePlan ?? formData?.exercisePlan ?? {}
  const homeExercises = (() => {
    if (Array.isArray(exercisePlanObj.homeExercises) && exercisePlanObj.homeExercises.length) return exercisePlanObj.homeExercises
    if (Array.isArray(exercisePlanObj.exercises)     && exercisePlanObj.exercises.length)     return exercisePlanObj.exercises
    return []
  })()
  const homeAdvice = exercisePlanObj.homeAdvice ?? ''

  // ─── Follow Up ────────────────────────────────────────────────────────────
  // API shape  : record.followUp → { nextVisitDate, reviewNotes, modifications }
  // Internal   : formData.followUp → array OR object
  const followUpRaw = record.followUp ?? formData?.followUp ?? {}
  const followUpEntry = Array.isArray(followUpRaw)
    ? (followUpRaw[0] ?? {})
    : (typeof followUpRaw === 'object' ? followUpRaw : {})

  const parts              = formData?.parts ?? symptomsInternal?.parts ?? patientData?.parts ?? []
  const treatmentTemplates = Array.isArray(record.treatmentTemplates) ? record.treatmentTemplates : []
  const todayStr           = () => new Date().toISOString().split('T')[0]

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
  const blobToBase64  = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => { const r = reader.result || ''; resolve(String(r).split(',')[1] || '') }
    reader.onerror   = reject
    reader.readAsDataURL(blob)
  })
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  // ─── FIX: buildPayload — always sends the correct API-expected shape ──────
  const buildPayload = (prescriptionPdf = '') => {
    const firstDiag       = diagnosisRows[0] ?? {}
    const followUpPayload = Array.isArray(followUpRaw) ? (followUpRaw[0] ?? {}) : (followUpRaw ?? {})

    return {
      // ── Top-level IDs ──────────────────────────────────────────────────
      bookingId,
      clinicId,
      branchId,
      patientId,

      // ── Patient Info ───────────────────────────────────────────────────
      patientInfo: {
        patientId,
        patientName,
        mobileNumber: patientMobile,
        age:          Number(patientAge) || 0,
        sex:          patientSex,
      },

      // ── Complaints ─────────────────────────────────────────────────────
      // Always match the API expected shape exactly
      complaints: {
        complaintDetails:    complaintDetails    || '',
        painAssessmentImage: partImage           || '',
        reportImages:        reportImages        || [],
        selectedTherapy:     selectedTherapy     || '',
        selectedTherapyId:   selectedTherapyID   || '',   // API uses Id (no capital D)
        duration:            complaintDuration   || '',
        previousInjuries:    previousInjuries    || null,
        currentMedications:  currentMedications  || null,
        allergies:           allergies           || null,
        occupation:          occupation          || null,
        activityLevels:      activityLevels.length ? activityLevels : null,
        patientPain:         effectivePain       || null,
        therapyAnswers:      flatTherapyAnswers,          // flat array for API
      },

      // ── Investigation ──────────────────────────────────────────────────
      investigation: {
        tests:         investigationTestsArray,
        selectedTests: investigationTestsArray,
        reason:        investigationReason || '',
        notes:         investigationReason || '',
      },

      // ── Assessment ─────────────────────────────────────────────────────
      // Matches API response shape: nested subjectiveAssessment, functionalAssessment, physicalExamination
      assessment: {
        subjectiveAssessment: {
          chiefComplaint:     assessment.chiefComplaint     ?? '',
          painScale:          Number(assessment.painScale)  || 0,
          painType:           assessment.painType           ?? '',
          duration:           assessment.duration           ?? '',
          onset:              assessment.onset              ?? '',
          aggravatingFactors: assessment.aggravatingFactors ?? '',
          relievingFactors:   assessment.relievingFactors   ?? '',
          observations:       assessment.observations       ?? '',
        },
        functionalAssessment: {
          difficultiesIn:      difficultiesIn,
          otherDifficulty:     otherDifficulty     || '',
          dailyLivingAffected: dailyLivingAffected || '',
        },
        physicalExamination: {
          postureAssessment: postureAssessment,
          postureDeviations: postureDeviations  || '',
          rangeOfMotion:     romStatus,
          romRestricted:     romRestricted      || '',
          romJoints:         romJoints          || '',
          muscleStrength:    muscleStrength,
          muscleWeakness:    muscleWeakness     || '',
          neurologicalSigns: neurologicalSigns,
        },
        // Pain-type specific sections
        chronicPainPatients:
          effectivePain === 'chronicPain'
            ? { painTriggers, relievingFactors: chronicRelieving }
            : null,
        sportsRehabPatients:
          effectivePain === 'sportsRehab'
            ? { typeOfSport, recurringInjuries, returnToSportGoals }
            : null,
        neuroRehabPatients:
          effectivePain === 'neuroRehab'
            ? { neuroDiagnosis, neuroOnset, mobilityStatus, cognitiveStatus }
            : null,
      },

      // ── Diagnosis ──────────────────────────────────────────────────────
      // API expects flat shape; send diagnosisRows only if multiple rows
      diagnosis: {
        physioDiagnosis: firstDiag.physioDiagnosis ?? '',
        affectedArea:    firstDiag.affectedArea    ?? '',
        severity:        firstDiag.severity        ?? '',
        stage:           firstDiag.stage           ?? '',
        notes:           firstDiag.notes           ?? '',
        ...(diagnosisRows.length > 1 ? { diagnosisRows } : {}),
      },

      // ── Treatment Plan ─────────────────────────────────────────────────
      treatmentPlan: {
        doctorId,
        doctorName,
        therapistId:     topTherapistId,
        therapistName:   topTherapistName,
        manualTherapy:   manualTherapy || '',
        modalitiesUsed:  modalitiesArr,
        patientResponse: patientResponse || '',
        precautions:     precautionsArr,
      },

      // ── Therapy Sessions ───────────────────────────────────────────────
      // Send the raw sessions array as-is (already in API shape)
      therapySessions: sessionsList,

      // ── Exercise Plan ──────────────────────────────────────────────────
      exercisePlan: {
        homeAdvice,
        homeExercises: homeExercises.map(ex => ({
          id:           ex.id           ?? '',
          name:         ex.name         ?? ex.exerciseName ?? '',
          sets:         String(ex.sets  ?? ''),
          reps:         String(ex.reps  ?? ex.repetitions ?? ''),
          duration:     ex.duration     || '10 mins',
          frequency:    ex.frequency    ?? null,
          instructions: ex.instructions ?? ex.notes ?? '',
          videoUrl:     ex.videoUrl     ?? ex.youtubeUrl ?? '',
          thumbnail:    ex.thumbnail    ?? '',
        })),
      },

      // ── Follow Up ──────────────────────────────────────────────────────
      followUp: {
        nextVisitDate: followUpPayload.nextVisitDate ?? '',
        reviewNotes:   followUpPayload.reviewNotes   ?? '',
        modifications: followUpPayload.modifications ?? null,
      },

      treatmentTemplates,
      createdAt:       todayStr(),
      prescriptionPdf,
    }
  }

  const doSave = async ({ downloadAfter = false } = {}) => {
    if (!complaintDetails?.trim()) { warning('"Complaint Details" is required to save.', { title: 'Warning' }); return false }
    setSaving(true)
    try {
      const safeName  = (patientName || 'Record').replace(/[^\w\-]+/g, '_')
      const blob      = await renderPdfBlob()
      const pdfBase64 = await blobToBase64(blob)
      const payload   = buildPayload(pdfBase64)

      console.group('📤 FINAL SAVE PAYLOAD')
      console.log(JSON.stringify(payload, null, 2))
      console.groupEnd()

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
  const skipTemplate          = async () => { setShowTemplateModal(false); await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT }); setPendingAction(null) }

  const hasAssessmentData = (
    assessment.chiefComplaint || assessment.painScale || assessment.painType ||
    difficultiesIn.length > 0 || postureAssessment.length > 0 || romStatus.length > 0
  )

  const hasBackgroundData =
    isValid(previousInjuries) || isValid(currentMedications) ||
    isValid(allergies) || isValid(occupation) || isValid(insuranceProvider) ||
    isValid(effectivePain) || activityLevels.length > 0

  const displayName = patientName ? capitalizeEachWord(patientName) : ''
  const displayAge  = patientAge  ? `${patientAge}yr` : ''
  const displaySex  = patientSex  ? patientSex.charAt(0).toUpperCase() : ''
  const patientTag  = [displayName, [displayAge, displaySex].filter(Boolean).join(' ')].filter(Boolean).join(' · ')

  return (
    <div style={{ background: T.bgLight, minHeight: '100vh', paddingBottom: 100, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ background: T.bgcolor, padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(27,79,138,0.18)', marginBottom: 16, borderBottom: `2px solid ${T.orange}`, minHeight: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(249,197,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid rgba(249,197,113,0.3)' }}>📋</div>
          <div>
            <div style={{ color: T.white, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>Physiotherapy Summary</div>
            <div style={{ fontSize: 9, color: T.orange, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2 }}>Review Before Saving</div>
          </div>
        </div>
        {patientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: T.white, borderRadius: 20, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 1px 6px rgba(0,0,0,0.12)', maxWidth: 320 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.orange, flexShrink: 0 }} />
              <span style={{ color: T.bgcolor, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{patientTag}</span>
            </div>
            <StatusDot status={overallStatus || patientData?.status || 'Pending'} />
          </div>
        )}
      </div>

      <CContainer fluid style={{ maxWidth: 1100, padding: '0 16px' }}>

        {/* 1. Patient Info */}
        <Section icon="👤" title="Patient & Booking Information">
          <Grid cols={3}>
            {isValid(patientId)     && <Row label="Patient ID"     value={patientId} />}
            {isValid(bookingId)     && <Row label="Booking ID"     value={bookingId} />}
            {isValid(patientName)   && <Row label="Name"           value={capitalizeEachWord(patientName)} />}
            {isValid(patientAge)    && <Row label="Age / Gender"   value={`${patientAge} yrs / ${patientSex}`} />}
            {isValid(patientMobile) && <Row label="Mobile"         value={patientMobile} />}
            {isValid(clinicId)      && <Row label="Clinic ID"      value={clinicId} />}
            {isValid(clinicName)    && <Row label="Clinic"         value={clinicName} />}
            {isValid(branchId)      && <Row label="Branch ID"      value={branchId} />}
            {isValid(doctorName)    && <Row label="Doctor"         value={doctorName} />}
            {isValid(doctorId)      && <Row label="Doctor ID"      value={doctorId} />}
            {isValid(patientData?.subServiceName) && <Row label="Therapy Type"    value={patientData?.subServiceName} />}
            {isValid(overallStatus) && <Row label="Overall Status" value={overallStatus} />}
          </Grid>
        </Section>

        {/* 2. Complaints */}
        {isValid(complaintDetails) && (
          <Section icon="🩺" title="Complaints & Symptoms">
            <Grid cols={2}>
              <Row label="Complaint Details"  value={complaintDetails}  highlight />
              {isValid(complaintDuration) && <Row label="Duration"         value={complaintDuration} highlight />}
              {isValid(selectedTherapy)   && <Row label="Selected Therapy" value={selectedTherapy} />}
              {reportImages.length > 0    && <Row label="Report Images"    value={`${reportImages.length} image(s)`} />}
            </Grid>
            {parts.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Affected Parts: </span>
                {parts.map(p => <Chip key={p} label={p} color={T.bgcolor} bg={T.bgLight} />)}
              </div>
            )}
            {toImageSrc(partImage) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Body Part Diagram</div>
                <div style={{ background: T.bgLight, borderRadius: 8, overflow: 'hidden', display: 'flex', justifyContent: 'center', border: `1px solid ${T.border}`, padding: 6, maxWidth: 320 }}>
                  <img src={toImageSrc(partImage)} alt="Body Part Diagram" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 6 }} />
                </div>
              </div>
            )}
            {attachments.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Attachments</div>
                <FileUploader attachments={attachments} accept=".pdf,image/*" />
              </div>
            )}
          </Section>
        )}

        {/* 3. Patient Background */}
        {hasBackgroundData && (
          <Section icon="📋" title="Patient Background">
            <Grid cols={3}>
              {isValid(previousInjuries)   && <Row label="Previous Injuries"   value={previousInjuries}   highlight />}
              {isValid(currentMedications) && <Row label="Current Medications" value={currentMedications} highlight />}
              {isValid(allergies)          && <Row label="Allergies"           value={allergies} />}
              {isValid(occupation)         && <Row label="Occupation"          value={occupation} />}
              {isValid(insuranceProvider)  && <Row label="Insurance Provider"  value={insuranceProvider} />}
              {isValid(effectivePain)      && <Row label="Pain Type"           value={PAIN_LABEL_MAP[effectivePain] || effectivePain} highlight />}
            </Grid>
            {activityLevels.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Levels: </span>
                {activityLevels.map(lvl => <Chip key={lvl} label={lvl} color={T.bgcolor} bg={T.bgLight} />)}
              </div>
            )}
          </Section>
        )}

        {/* 4. Therapy Questionnaire */}
        <QuestionnaireSection therapyGroups={therapyGroups} />

        {/* 5. Investigation */}
        {(investigationTestsArray.length > 0 || isValid(investigationReason)) && (
          <Section icon="🔬" title="Investigation">
            {investigationTestsArray.length > 0 && (
              <div style={{ marginBottom: investigationReason ? 10 : 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommended Tests:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {investigationTestsArray.map((test, i) => (
                    <span key={i} style={{ background: T.tealLight, color: T.teal, borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700, border: `1px solid #5eead4`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>🔬 {test}</span>
                  ))}
                </div>
              </div>
            )}
            {isValid(investigationReason) && <Row label="Notes / Reason" value={investigationReason} full highlight />}
          </Section>
        )}

        {/* 6. Assessment */}
        {hasAssessmentData && (
          <Section icon="📊" title="Assessment">
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.bgcolor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>📋 Subjective Assessment</div>
              <Grid cols={2}>
                {isValid(assessment.chiefComplaint)     && <Row label="Chief Complaint"     value={assessment.chiefComplaint}     highlight />}
                {isValid(assessment.painScale)          && <Row label="Pain Scale"          value={assessment.painScale}          highlight />}
                {isValid(assessment.painType)           && <Row label="Pain Type"           value={assessment.painType} />}
                {isValid(assessment.duration)           && <Row label="Duration"            value={assessment.duration} />}
                {isValid(assessment.onset)              && <Row label="Onset"               value={assessment.onset} />}
                {isValid(assessment.aggravatingFactors) && <Row label="Aggravating Factors" value={assessment.aggravatingFactors} />}
                {isValid(assessment.relievingFactors)   && <Row label="Relieving Factors"   value={assessment.relievingFactors} />}
              </Grid>
              {isValid(assessment.observations) && <Row label="Observations" value={assessment.observations} full />}
            </div>

            {(difficultiesIn.length > 0 || isValid(otherDifficulty) || isValid(dailyLivingAffected)) && (
              <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🏃 Functional Assessment</div>
                {difficultiesIn.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulties in: </span>
                    {difficultiesIn.map(d => <Chip key={d} label={d} color={T.bgcolor} bg={T.bgLight} />)}
                    {isValid(otherDifficulty) && <Chip label={`Other: ${otherDifficulty}`} color={T.bgcolor} bg={T.bgLight} />}
                  </div>
                )}
                {isValid(dailyLivingAffected) && <Row label="Daily Living Affected" value={dailyLivingAffected} full highlight />}
              </div>
            )}

            {(postureAssessment.length > 0 || romStatus.length > 0 || muscleStrength.length > 0 || neurologicalSigns.length > 0) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🔬 Physical Examination</div>
                <div style={{ background: T.bgLight, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  {[
                    { label: 'Posture Assessment', opts: ['Normal', 'Deviations'],                                          sel: postureAssessment, note: postureDeviations },
                    { label: 'Range of Motion',    opts: ['Normal', 'Restricted'],                                          sel: romStatus,         note: romRestricted     },
                    { label: 'Muscle Strength',    opts: ['Normal', 'Weakness in'],                                         sel: muscleStrength,    note: muscleWeakness    },
                    { label: 'Neurological Signs', opts: ['Normal', 'Balance', 'Coordination', 'Sensation issues'],         sel: neurologicalSigns, note: ''                },
                  ].map((row, ri, arr) => (
                    <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderBottom: ri < arr.length - 1 ? `1px solid ${T.border}` : 'none', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: T.text, minWidth: 140 }}>{row.label}:</span>
                      {row.opts.map(opt => <CheckChip key={opt} label={opt} checked={row.sel.includes(opt)} />)}
                      {isValid(row.note) && <span style={{ fontSize: '0.75rem', color: T.textMid, fontStyle: 'italic' }}>— {row.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {effectivePain === 'chronicPain' && (isValid(painTriggers) || isValid(chronicRelieving)) && (
              <div style={{ marginBottom: 12, background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.rose, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🔴 Chronic Pain Assessment</div>
                <Grid cols={2}>
                  {isValid(painTriggers)     && <Row label="Pain Triggers"     value={painTriggers}     highlight />}
                  {isValid(chronicRelieving) && <Row label="Relieving Factors" value={chronicRelieving} highlight />}
                </Grid>
              </div>
            )}
            {effectivePain === 'sportsRehab' && (isValid(typeOfSport) || isValid(recurringInjuries) || isValid(returnToSportGoals)) && (
              <div style={{ marginBottom: 12, background: '#f0fff4', border: '1.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🟢 Sports Rehab Assessment</div>
                <Grid cols={2}>
                  {isValid(typeOfSport)        && <Row label="Type of Sport"         value={typeOfSport}        highlight />}
                  {isValid(recurringInjuries)  && <Row label="Recurring Injuries"    value={recurringInjuries}  highlight />}
                  {isValid(returnToSportGoals) && <Row label="Return-to-Sport Goals" value={returnToSportGoals} full />}
                </Grid>
              </div>
            )}
            {effectivePain === 'neuroRehab' && (isValid(neuroDiagnosis) || isValid(neuroOnset) || isValid(mobilityStatus) || isValid(cognitiveStatus)) && (
              <div style={{ marginBottom: 12, background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🟣 Neuro Rehab Assessment</div>
                <Grid cols={2}>
                  {isValid(neuroDiagnosis)  && <Row label="Diagnosis"                 value={neuroDiagnosis}  highlight />}
                  {isValid(neuroOnset)      && <Row label="Onset"                     value={neuroOnset}      highlight />}
                  {isValid(mobilityStatus)  && <Row label="Mobility Status"           value={mobilityStatus} />}
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
                  <tr>{['#', 'Physio Diagnosis', 'Affected Area', 'Severity', 'Stage', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {diagnosisRows.map((d, i) => {
                    const sevColor  = { Mild: ['#e6f4ea', '#2e7d32'], Moderate: ['#fff3e0', '#e65100'], Severe: ['#fdecea', '#c62828'] }
                    const stagColor = { Acute: ['#fdecea', '#c62828'], 'Sub-acute': ['#fff8e1', '#f57f17'], Chronic: ['#e8eaf6', '#283593'] }
                    const [sBg, sFg] = sevColor[d.severity]  || ['#f3f4f6', '#374151']
                    const [tBg, tFg] = stagColor[d.stage]    || ['#f3f4f6', '#374151']
                    return (
                      <tr key={i}>
                        <td style={{ ...tdStyle(i), fontWeight: 700, color: T.bgcolor }}>{i + 1}</td>
                        <td style={{ ...tdStyle(i), fontWeight: 600 }}>{d.physioDiagnosis || '—'}</td>
                        <td style={tdStyle(i)}>{d.affectedArea || '—'}</td>
                        <td style={tdStyle(i)}>{d.severity ? <span style={{ background: sBg, color: sFg, borderRadius: 20, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem' }}>{d.severity}</span> : '—'}</td>
                        <td style={tdStyle(i)}>{d.stage    ? <span style={{ background: tBg, color: tFg, borderRadius: 20, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem' }}>{d.stage}</span>    : '—'}</td>
                        <td style={{ ...tdStyle(i), maxWidth: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{d.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 8. Treatment Plan */}
        {(isValid(treatmentPlanDisplay.therapistId) || isValid(treatmentPlanDisplay.therapistName)) && (
          <Section icon="🧑‍⚕️" title="Treatment Plan">
            <Grid cols={2}>
              {isValid(treatmentPlanDisplay.doctorId)      && <Row label="Doctor ID"      value={treatmentPlanDisplay.doctorId} />}
              {isValid(treatmentPlanDisplay.doctorName)    && <Row label="Doctor Name"    value={treatmentPlanDisplay.doctorName} />}
              {isValid(treatmentPlanDisplay.therapistId)   && <Row label="Therapist ID"   value={treatmentPlanDisplay.therapistId} />}
              {isValid(treatmentPlanDisplay.therapistName) && <Row label="Therapist Name" value={treatmentPlanDisplay.therapistName} highlight />}
              {isValid(manualTherapy)                      && <Row label="Manual Therapy" value={manualTherapy} />}
              {isValid(patientResponse)                    && <Row label="Patient Response" value={patientResponse} />}
            </Grid>
            {precautionsArr.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Precautions: </span>
                {precautionsArr.map((p, i) => <Chip key={i} label={p} color={T.amber} bg={T.amberLight} />)}
              </div>
            )}
            {modalitiesArr.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Modalities Used: </span>
                {modalitiesArr.map((m, i) => <Chip key={i} label={m} color={T.teal} bg={T.tealLight} />)}
              </div>
            )}
          </Section>
        )}

        {/* 9. Therapy Sessions */}
        <Section icon="🏥" title="Therapy Sessions" badge={sessionsList.length ? `${sessionsList.length} session(s)` : null}>
          {isValid(overallStatus) && (
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Status:</span>
              <StatusDot status={overallStatus} />
            </div>
          )}
          <TherapySessionsDisplay sessionsList={sessionsList} therapistId={topTherapistId} therapistName={topTherapistName} />
        </Section>

        {/* 10. Exercise Plan */}
        {(homeExercises.length > 0 || isValid(homeAdvice)) && (
          <Section icon="🏋️" title="Exercise Plan">
            {homeExercises.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: isValid(homeAdvice) ? 12 : 0 }}>
                <table style={tableStyle}>
                  <thead><tr>{['#', 'Exercise', 'Sets', 'Reps', 'Frequency', 'Instructions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {homeExercises.map((ex, i) => (
                      <tr key={i}>
                        <td style={{ ...tdStyle(i), fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ ...tdStyle(i), fontWeight: 600 }}>{ex.name || ex.exerciseName || '—'}</td>
                        <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.sets ? <Chip label={`🔁 ${ex.sets}`}  color={T.bgcolor} bg={T.bgLight}  /> : '—'}</td>
                        <td style={{ ...tdStyle(i), textAlign: 'center' }}>{(ex.reps || ex.repetitions) ? <Chip label={`🔄 ${ex.reps || ex.repetitions}`} color={T.teal} bg={T.tealLight} /> : '—'}</td>
                        <td style={tdStyle(i)}>{ex.frequency ? <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>📆 {ex.frequency}</span> : '—'}</td>
                        <td style={{ ...tdStyle(i), maxWidth: 220 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions || ex.notes}>{ex.instructions || ex.notes || '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isValid(homeAdvice) && <Row label="Home Advice" value={homeAdvice} full highlight />}
          </Section>
        )}

        {/* 11. Follow Up */}
        {(isValid(followUpEntry.nextVisitDate) || isValid(followUpEntry.reviewNotes)) && (
          <Section icon="📅" title="Follow Up">
            <Grid cols={2}>
              {isValid(followUpEntry.nextVisitDate) && <Row label="Next Visit Date" value={followUpEntry.nextVisitDate} highlight />}
              {isValid(followUpEntry.reviewNotes)   && <Row label="Review Notes"    value={followUpEntry.reviewNotes}   highlight />}
            </Grid>
            {isValid(followUpEntry.nextVisitDate) && (() => {
              const urgency = getVisitUrgency(followUpEntry.nextVisitDate)
              return urgency ? (
                <div style={{ marginTop: 6 }}>
                  <span style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}`, borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{urgency.icon} {urgency.label}</span>
                </div>
              ) : null
            })()}
          </Section>
        )}

        {/* 12. Treatment Templates */}
        {treatmentTemplates.length > 0 && (
          <Section icon="📁" title="Treatment Templates">
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr>{['#', 'Condition', 'Modalities', 'Manual Therapy', 'Exercises', 'Duration', 'Frequency'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {treatmentTemplates.map((t, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle(i), fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ ...tdStyle(i), fontWeight: 600 }}>{t.condition || '—'}</td>
                      <td style={tdStyle(i)}>{Array.isArray(t.modalities) && t.modalities.length ? t.modalities.map(m => <Chip key={m} label={m} color={T.bgcolor} bg={T.bgLight} />) : '—'}</td>
                      <td style={tdStyle(i)}>{t.manualTherapy || '—'}</td>
                      <td style={tdStyle(i)}>{Array.isArray(t.exercises) && t.exercises.length ? t.exercises.map(e => <Chip key={e} label={e} color={T.green} bg={T.greenLight} />) : '—'}</td>
                      <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{t.duration  || '—'}</td>
                      <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{t.frequency || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

      </CContainer>

      {/* ── Sticky Bottom Bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: sidebarWidth ? `${sidebarWidth}px` : 0, width: sidebarWidth ? `calc(100vw - ${sidebarWidth}px)` : '100vw', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 24px', zIndex: 999, boxShadow: '0 -2px 10px rgba(27,79,138,0.12)', borderTop: '2px solid #1B4F8A' }}>
        <Button customColor="#1B4F8A" color="#FFFFFF" style={{ borderRadius: '20px', fontWeight: 700, padding: '5px 20px', fontSize: 12, boxShadow: '0 2px 8px rgba(27,79,138,0.30)', border: '1.5px solid #1B4F8A' }}
          onClick={() => { setClickedSaveTemplate(true); onSaveTemplate?.(); info('Template saved!', { title: 'Template' }) }}>
          {!updateTemplate ? '💾 Save as Template' : '🔄 Update Template'}
        </Button>
        {saving && <CSpinner size="sm" style={{ color: '#1B4F8A' }} />}
        <Button customColor="#1B4F8A" color="#FFFFFF" style={{ borderRadius: '20px', fontWeight: 700, padding: '5px 20px', fontSize: 12, boxShadow: '0 2px 8px rgba(27,79,138,0.30)', border: '1.5px solid #1B4F8A' }}
          onClick={() => { setPendingAction(ACTIONS.SAVE); clickedSaveTemplate ? doSave() : setShowTemplateModal(true) }} disabled={saving}>
          ✅ Save
        </Button>
        <Button customColor="#1B4F8A" color="#FFFFFF" style={{ borderRadius: '20px', fontWeight: 700, padding: '5px 20px', fontSize: 12, boxShadow: '0 2px 8px rgba(27,79,138,0.30)', border: '1.5px solid #1B4F8A' }}
          onClick={() => { setPendingAction(ACTIONS.SAVE_PRINT); clickedSaveTemplate ? doSave({ downloadAfter: true }) : setShowTemplateModal(true) }} disabled={saving}>
          📄 Save & Download PDF
        </Button>
      </div>

      {/* ── Template modal ── */}
      {showTemplateModal && !clickedSaveTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,79,138,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: T.white, borderRadius: 16, padding: '24px 28px', maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(27,79,138,0.25)', border: `2px solid ${T.orange}`, position: 'relative' }}>
            <button onClick={() => setShowTemplateModal(false)} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.textLight, lineHeight: 1 }}>✕</button>
            <div style={{ fontSize: 30, marginBottom: 10, textAlign: 'center' }}>📋</div>
            <h6 style={{ margin: '0 0 6px', color: T.bgcolor, fontWeight: 800, textAlign: 'center', fontSize: 16 }}>Save as Template?</h6>
            <p style={{ color: T.textMid, fontSize: '0.82rem', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>Reuse this layout for faster entry next time.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={skipTemplate} style={{ padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${T.border}`, background: T.bgLight, color: T.text, fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit' }}>No, just save</button>
              <button onClick={confirmSaveAsTemplate} style={{ padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: 'none', background: T.bgcolor, color: T.white, fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit', boxShadow: `0 2px 8px rgba(249,197,113,0.3)`, outline: `2px solid ${T.orange}`, outlineOffset: 2 }}>Yes, save template</button>
            </div>
          </div>
        </div>
      )}

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default Summary