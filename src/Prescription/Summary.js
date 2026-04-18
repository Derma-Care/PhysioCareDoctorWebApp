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

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const P = '#1a3a5c'
const A = '#1a5fa8'
const LIGHT = '#f5f9ff'
const BORDER = '#d8e8f5'

/* ─── Tiny helpers ───────────────────────────────────────────────────────── */
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
  chronicPain: 'Chronic Pain',
  sportsRehab: 'Sports Rehab',
  neuroRehab: 'Neuro Rehab',
  acutePain: 'Acute Pain',
  neuropathicPain: 'Neuropathic Pain',
  referredPain: 'Referred Pain',
  inflammatoryPain: 'Inflammatory Pain',
}

const Section = ({ icon, title, children }) => (
  <div style={{
    background: '#fff', border: `1px solid ${BORDER}`,
    borderRadius: 14, marginBottom: 20, overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(26,90,168,0.06)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 20px', backgroundColor: COLORS.bgcolor,
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: COLORS.black, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.03em' }}>{title}</span>
    </div>
    <div style={{ padding: '18px 20px' }}>{children}</div>
  </div>
)

const Row = ({ label, value, full = false, highlight = false }) => (
  <div style={{
    display: full ? 'block' : 'flex',
    gap: 8, marginBottom: 10,
    padding: highlight ? '8px 12px' : 0,
    background: highlight ? '#f0f7ff' : 'transparent',
    borderRadius: highlight ? 8 : 0,
    borderLeft: highlight ? '3px solid #a5c4d4ff' : 'none',
  }}>
    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
      {label}:
    </span>
    <span style={{ fontSize: '0.9rem', color: P, wordBreak: 'break-word' }}>{dash(value)}</span>
  </div>
)

const Grid = ({ children, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px 28px' }}>
    {children}
  </div>
)

const Chip = ({ label, color = A, bg = '#dbeafe' }) => (
  <span style={{
    background: bg, color, borderRadius: 20,
    padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700,
    border: `1px solid ${color}33`, display: 'inline-block', margin: '2px 4px 2px 0',
  }}>{label}</span>
)

const CheckChip = ({ label, checked }) => (
  <span style={{
    background: checked ? '#dbeafe' : '#f3f4f6',
    color: checked ? A : '#94a3b8',
    borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700,
    border: `1px solid ${checked ? A + '44' : '#e2e8f0'}`,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    margin: '2px 4px 2px 0',
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
    'In Progress': ['#dbeafe', '#1e40af', '#93c5fd'],
  }
  const [bg, fg, border] = map[status] || ['#f3f4f6', '#374151', '#d1d5db']
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 20, padding: '3px 14px', fontSize: '0.8rem', fontWeight: 700 }}>
      {status}
    </span>
  )
}

const AnswerBadge = ({ answer }) => {
  const up = String(answer).toUpperCase()
  const [bg, color, border] =
    up === 'YES' ? ['#d1fae5', '#065f46', '#6ee7b7'] :
      up === 'NO' ? ['#fee2e2', '#991b1b', '#fecaca'] :
        ['#eff6ff', '#1d4ed8', '#bfdbfe']
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
      {answer}
    </span>
  )
}

const FOLLOWUP_STATUS_STYLE = {
  Active: { bg: '#f0fff4', border: '#68d391', color: '#276749', icon: '🟢' },
  'On Hold': { bg: '#fffbeb', border: '#f6ad55', color: '#7b341e', icon: '🟡' },
  Completed: { bg: '#ebf8ff', border: '#63b3ed', color: '#2a4365', icon: '🔵' },
  Discharged: { bg: '#fff5f5', border: '#fc8181', color: '#742a2a', icon: '🔴' },
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

/* ══════════════════════════════════════════════════════════════════════════
   EXERCISE TABLE (read-only for summary display)
══════════════════════════════════════════════════════════════════════════ */
const ExerciseTableDisplay = ({ exercises }) => {
  if (!exercises || exercises.length === 0) return (
    <div style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>No exercises</div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: P }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
            {['#', 'Exercise Name', 'Session', 'Sets', 'Reps', 'Frequency', 'Notes'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
              <td style={{ padding: '7px 10px', fontWeight: 700, color: '#3a8fd4' }}>{i + 1}</td>
              <td style={{ padding: '7px 10px', fontWeight: 600 }}>{ex.name || ex.exerciseName || '—'}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center' }}>{dash(ex.session)}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                {ex.sets ? <span style={{ background: '#dbeafe', color: A, borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem' }}>🔁 {ex.sets}</span> : '—'}
              </td>
              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                {(ex.repetitions || ex.reps) ? <span style={{ background: '#dbeafe', color: A, borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem' }}>🔄 {ex.repetitions || ex.reps}</span> : '—'}
              </td>
              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                {ex.frequency ? <span style={{ background: '#f0f7ff', color: P, borderRadius: 8, padding: '2px 8px', fontWeight: 600, fontSize: '0.78rem' }}>📆 {ex.frequency}</span> : '—'}
              </td>
              <td style={{ padding: '7px 10px', maxWidth: 160 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.notes}>{ex.notes || '—'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   THERAPY BLOCK
────────────────────────────────────────────────────────────────────────── */
const TherapyBlock = ({ therapyName, exercises, totalPrice, accentColor = A, accentBg = '#eef5ff', borderColor = BORDER }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 14px',
      background: accentBg,
      borderRadius: '8px 8px 0 0',
      border: `1px solid ${borderColor}`,
      borderBottom: 'none',
    }}>
      <span style={{ fontWeight: 700, color: accentColor, fontSize: '0.9rem' }}>
        💊 {therapyName || 'Therapy'}
      </span>
      {totalPrice > 0 && (
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>₹ {totalPrice}</span>
      )}
    </div>
    <div style={{ border: `1px solid ${borderColor}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
      <ExerciseTableDisplay exercises={exercises} />
    </div>
  </div>
)

/* ──────────────────────────────────────────────────────────────────────────
   SESSION META BAR
────────────────────────────────────────────────────────────────────────── */
const SessionMetaBar = ({ sess }) => {
  const serviceType = (sess.serviceType || '').toLowerCase()
  const typeStyle = {
    package: { bg: '#fef3c7', color: '#92400e', icon: '📦' },
    program: { bg: '#dbeafe', color: '#1e40af', icon: '🎯' },
    therapy: { bg: '#ede9fe', color: '#5b21b6', icon: '💊' },
    exercise: { bg: '#d1fae5', color: '#065f46', icon: '🏋️' },
  }
  const ts = typeStyle[serviceType] || { bg: '#f3f4f6', color: '#374151', icon: '📋' }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      marginBottom: 14, padding: '10px 16px',
      background: '#f8fbff', borderRadius: 10,
      border: `1px solid ${BORDER}`, alignItems: 'center',
    }}>
      {sess.serviceType && (
        <span style={{
          background: ts.bg, color: ts.color,
          borderRadius: 20, padding: '3px 12px',
          fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize',
        }}>
          {ts.icon} {sess.serviceType}
        </span>
      )}
      {sess.therapistName && <Chip label={`👤 ${sess.therapistName}`} color={P} bg="#f0f7ff" />}
      {sess.therapistId && <Chip label={`ID: ${sess.therapistId}`} color="#64748b" bg="#f3f4f6" />}
      {Array.isArray(sess.modalitiesUsed) && sess.modalitiesUsed.map(m => (
        <Chip key={m} label={m} color={A} bg="#dbeafe" />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   SESSION DETAILS ROW
────────────────────────────────────────────────────────────────────────── */
const SessionDetailsRow = ({ sess }) => {
  if (!sess.manualTherapy && !sess.precautions && !sess.patientResponse) return null
  return (
    <div style={{ marginBottom: 14, padding: '10px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
      <Grid cols={3}>
        {sess.manualTherapy && <Row label="Manual Therapy" value={sess.manualTherapy} />}
        {sess.precautions && <Row label="Precautions" value={Array.isArray(sess.precautions) ? sess.precautions.join(', ') : sess.precautions} />}
        {sess.patientResponse && <Row label="Patient Response" value={sess.patientResponse} />}
      </Grid>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   THERAPY SESSIONS DISPLAY
══════════════════════════════════════════════════════════════════════════ */
const TherapySessionsDisplay = ({ sessionsList }) => {
  if (!sessionsList || sessionsList.length === 0) return (
    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
      No therapy session data found.
    </div>
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
                padding: '12px 18px',
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                borderRadius: '12px 12px 0 0', color: '#fff',
                fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>📦 {sess.packageName || 'Package'}</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: '2px solid #c4b5fd', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} />
                <SessionDetailsRow sess={sess} />
                {Array.isArray(sess.programs) && sess.programs.length > 0 && sess.programs.map((prog, pIdx) => (
                  <div key={pIdx} style={{ marginBottom: pIdx < sess.programs.length - 1 ? 18 : 0 }}>
                    <div style={{
                      padding: '9px 16px',
                      background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                      borderRadius: '8px 8px 0 0', color: '#fff',
                      fontWeight: 700, fontSize: '0.9rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>🎯 {prog.programName || `Program ${pIdx + 1}`}</span>
                      {prog.totalPrice > 0 && <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>₹ {prog.totalPrice}</span>}
                    </div>
                    <div style={{ border: '1.5px solid #c8ddf0', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px 14px' }}>
                      {Array.isArray(prog.therapyData ?? prog.therophyData) &&
                        (prog.therapyData ?? prog.therophyData ?? []).map((therapy, tIdx) => (
                          <TherapyBlock
                            key={tIdx}
                            therapyName={therapy.therapyName}
                            exercises={therapy.exercises || []}
                            totalPrice={therapy.totalPrice}
                          />
                        ))
                      }
                      {!Array.isArray(prog.therapyData ?? prog.therophyData) && (
                        <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic', padding: '8px 12px' }}>
                          No therapy data for this program.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!Array.isArray(sess.programs) || sess.programs.length === 0) &&
                  Array.isArray(sess.therapyData ?? sess.therophyData) &&
                  (sess.therapyData ?? sess.therophyData ?? []).map((therapy, tIdx) => (
                    <TherapyBlock
                      key={tIdx}
                      therapyName={therapy.therapyName}
                      exercises={therapy.exercises || []}
                      totalPrice={therapy.totalPrice}
                    />
                  ))
                }
                {(!Array.isArray(sess.programs) || sess.programs.length === 0) &&
                  !Array.isArray(sess.therapyData ?? sess.therophyData) && (
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic', padding: '8px 12px' }}>
                      No program or therapy data found in this package.
                    </div>
                  )}
              </div>
            </div>
          )
        }

        if (serviceType === 'program') {
          const therapies = sess.therapyData ?? sess.therophyData ?? []
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{
                padding: '12px 18px',
                background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                borderRadius: '12px 12px 0 0', color: '#fff',
                fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>🎯 {sess.programName || 'Program'}</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: '2px solid #c8ddf0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} />
                <SessionDetailsRow sess={sess} />
                {Array.isArray(therapies) && therapies.length > 0
                  ? therapies.map((therapy, tIdx) => (
                    <TherapyBlock
                      key={tIdx}
                      therapyName={therapy.therapyName}
                      exercises={therapy.exercises || []}
                      totalPrice={therapy.totalPrice}
                    />
                  ))
                  : (
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic', padding: '8px 12px' }}>
                      No therapies found for this program.
                    </div>
                  )
                }
              </div>
            </div>
          )
        }

        if (serviceType === 'therapy') {
          const therapies = sess.therapyData ?? []
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{
                padding: '12px 18px',
                background: 'linear-gradient(135deg,#5b21b6,#7c3aed)',
                borderRadius: '12px 12px 0 0', color: '#fff',
                fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>💊 Therapy Session</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: '2px solid #c4b5fd', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} />
                <SessionDetailsRow sess={sess} />
                {Array.isArray(therapies) && therapies.length > 0
                  ? therapies.map((t, tIdx) => (
                    <TherapyBlock
                      key={tIdx}
                      therapyName={t.therapyName}
                      exercises={t.exercises || []}
                      totalPrice={t.totalPrice}
                      accentColor="#5b21b6"
                      accentBg="#f5f3ff"
                      borderColor="#c4b5fd"
                    />
                  ))
                  : (
                    Array.isArray(sess.exercises) && sess.exercises.length > 0
                      ? (
                        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                          <ExerciseTableDisplay exercises={sess.exercises} />
                        </div>
                      )
                      : (
                        <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic', padding: '8px 12px' }}>
                          No therapy data found.
                        </div>
                      )
                  )
                }
              </div>
            </div>
          )
        }

        if (serviceType === 'exercise') {
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 28 }}>
              <div style={{
                padding: '12px 18px',
                background: 'linear-gradient(135deg,#065f46,#10b981)',
                borderRadius: '12px 12px 0 0', color: '#fff',
                fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>🏋️ Exercise Session</span>
                {sess.totalPrice > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>₹ {sess.totalPrice}</span>}
              </div>
              <div style={{ border: '2px solid #6ee7b7', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px' }}>
                <SessionMetaBar sess={sess} />
                <SessionDetailsRow sess={sess} />
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                  <ExerciseTableDisplay exercises={sess.exercises || []} />
                </div>
              </div>
            </div>
          )
        }

        /* ════ UNKNOWN / LEGACY fallback ════ */
        return (
          <div key={si} style={{ marginBottom: isLast ? 0 : 24 }}>
            <SessionMetaBar sess={sess} />
            <SessionDetailsRow sess={sess} />
            {Array.isArray(sess.therapyData) && sess.therapyData.length > 0 && (
              sess.therapyData.map((therapy, tIdx) => (
                <TherapyBlock
                  key={tIdx}
                  therapyName={therapy.therapyName}
                  exercises={therapy.exercises || []}
                  totalPrice={therapy.totalPrice}
                />
              ))
            )}
            {Array.isArray(sess.exercises) && sess.exercises.length > 0 && (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                <ExerciseTableDisplay exercises={sess.exercises} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN SUMMARY COMPONENT
══════════════════════════════════════════════════════════════════════════ */
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
  console.log('🚀 ~ file: Summary.js ~ line 78 ~ Summary ~ record', record)
  console.log('🚀 ~ file: Summary.js ~ line 78 ~ Summary ~ record', patientData?.bookingId)
  /* ── Booking-level IDs ── */
  const bookingId = record.bookingId ?? patientData?.bookingId ?? ''
  const clinicId = record.clinicId ?? patientData?.clinicId ?? clinicDetails?.hospitalId ?? ''
  const branchId = record.branchId ?? patientData?.branchId ?? ''
  const clinicName = clinicDetails?.name ?? patientData?.clinicName ?? ''
  const doctorId = doctorDetails?.doctorId ?? patientData?.doctorId ?? ''
  const doctorName = doctorDetails?.name ?? doctorDetails?.fullName ?? patientData?.doctorName ?? ''

  /* ── patientInfo ── */
  const patientInfo = record.patientInfo ?? {}
  const patientId = patientInfo.patientId ?? patientData?.patientId ?? ''
  const patientName =
    patientInfo.patientName ??
    patientData?.patientName ??
    patientData?.name ??
    patientData?.fullName ?? ''
  const patientMobile = patientInfo.mobileNumber ?? patientData?.mobileNumber ?? patientData?.patientMobileNumber ?? ''
  const patientAge = patientInfo.age ?? patientData?.age ?? ''
  const patientSex = patientInfo.sex ?? patientData?.sex ?? patientData?.gender ?? ''

  /* ── complaints ── */
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

  const complaintDetails = complaintsObj.complaintDetails
  const complaintDuration = complaintsObj.duration
  const selectedTherapy = complaintsObj.selectedTherapy
  const selectedTherapyID = complaintsObj.selectedTherapyID
  const partImage = complaintsObj.painAssessmentImage
  const reportImages = complaintsObj.reportImages
  const therapyAnswers = complaintsObj.theraphyAnswers

  const finalComplaints = {
    complaintDetails,
    duration: complaintDuration,
    selectedTherapy,
    selectedTherapyID,
    painAssessmentImage: partImage,
    reportImages,
    theraphyAnswers: therapyAnswers,
  }

  const therapyGroups = Object.entries(therapyAnswers).map(([cat, qs]) => ({
    category: cat, questions: Array.isArray(qs) ? qs : [],
  }))

  const attachments = [
    ...(partImage ? [{ url: toImageSrc(partImage), name: 'Pain Assessment' }] : []),
    ...reportImages.map((img, i) => ({ url: toImageSrc(img), name: `Report ${i + 1}` })),
  ]

  /* ── patient background fields ── */
  const previousInjuries = record.previousInjuries ?? formData?.previousInjuries ?? patientData?.previousInjuries ?? ''
  const currentMedications = record.currentMedications ?? formData?.currentMedications ?? patientData?.currentMedications ?? ''
  const allergies = record.allergies ?? formData?.allergies ?? patientData?.allergies ?? ''
  const occupation = record.occupation ?? formData?.occupation ?? patientData?.occupation ?? ''
  const insuranceProvider = record.insuranceProvider ?? formData?.insuranceProvider ?? patientData?.insuranceProvider ?? ''
  const activityLevels = Array.isArray(record.activityLevels)
    ? record.activityLevels
    : Array.isArray(formData?.activityLevels)
      ? formData.activityLevels
      : Array.isArray(patientData?.activityLevels)
        ? patientData.activityLevels
        : []
  const patientPain = record.patientPain ?? formData?.patientPain ?? formData?.assessment?.patientPain ?? patientData?.patientPain ?? ''

  /* ── investigation ── */
  // ✅ FIX: Investigation component saves as { selectedTests, notes }
  // Support both old shape { tests, reason } and new shape { selectedTests, notes }
  const investigationObj = record.investigation ?? formData?.investigation ?? {}
  const investigationTests =
    investigationObj.selectedTests ??   // ← new shape from Investigation component
    investigationObj.tests ??           // ← old/API shape
    []
  const investigationReason =
    investigationObj.notes ??           // ← new shape from Investigation component
    investigationObj.reason ??          // ← old shape
    ''

  // Normalize to array for display
  const investigationTestsArray = Array.isArray(investigationTests)
    ? investigationTests
    : investigationTests
      ? [investigationTests]
      : []

  /* ── assessment ── */
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

  /* ── diagnosis ── */
  const diagnosisObj = record.diagnosis ?? formData?.diagnosis ?? {}
  const diagnosisRows = Array.isArray(diagnosisObj.diagnosisRows)
    ? diagnosisObj.diagnosisRows
    : diagnosisObj.physioDiagnosis ? [diagnosisObj] : []

  /* ── therapy sessions resolution ── */
  const therapySessionsRaw =
    formData?.therapySessions ??
    record?.therapySessions ??
    {}

  const overallStatus = (!Array.isArray(therapySessionsRaw) && therapySessionsRaw?.overallStatus)
    ? therapySessionsRaw.overallStatus
    : ''

  let sessionsList = []
  if (Array.isArray(therapySessionsRaw)) {
    sessionsList = therapySessionsRaw
  } else if (Array.isArray(therapySessionsRaw?.sessions)) {
    sessionsList = therapySessionsRaw.sessions
  }

  if (sessionsList.length === 1 && Array.isArray(sessionsList[0])) {
    sessionsList = sessionsList[0]
  }

  /* ── treatmentPlan ── */
  const firstSession = sessionsList[0] ?? {}
  const treatmentPlanDisplay = {
    doctorId, doctorName,
    therapistId: firstSession.therapistId ?? therapySessionsRaw?.therapistId ?? '',
    therapistName: firstSession.therapistName ?? therapySessionsRaw?.therapistName ?? '',
    manualTherapy: firstSession.manualTherapy ?? therapySessionsRaw?.manualTherapy ?? '',
    precautions: firstSession.precautions ?? therapySessionsRaw?.precautions ?? '',
    frequency: firstSession.frequency ?? therapySessionsRaw?.frequency ?? '',
  }

  /* ── exercisePlan ── */
  const exercisePlanObj = record.exercisePlan ?? formData?.exercisePlan ?? {}
  const homeExercises = Array.isArray(exercisePlanObj.homeExercises)
    ? exercisePlanObj.homeExercises
    : Array.isArray(exercisePlanObj.exercises)
      ? exercisePlanObj.exercises
      : []
  const homeAdvice = exercisePlanObj.homeAdvice ?? ''

  /* ── followUp ── */
  const followUpObj = record.followUp ?? formData?.followUp ?? {}
  const followUpEntry = Array.isArray(followUpObj)
    ? (followUpObj[0] ?? {})
    : (typeof followUpObj === 'object' ? followUpObj : {})

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

  /* ── PDF helpers ── */
  const renderPdfBlob = async () =>
    await pdf(<PrescriptionPDF doctorData={doctorDetails} clicniData={clinicDetails} formData={formData} patientData={patientData} />).toBlob()
  // ✅ Add this function
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onloadend = () => {
        const result = reader.result || ""
        const base64 = String(result).split(",")[1] || ""
        resolve(base64)
      }

      reader.onerror = reject
      reader.readAsDataURL(blob)
    })


  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  /* ══════════════════════════════════════════════════════════════════════
     BUILD FINAL PAYLOAD
  ══════════════════════════════════════════════════════════════════════ */
  const buildPayload = (prescriptionPdf = "") => {
    const firstDiag = diagnosisRows[0] ?? {}
    console.log('Therapy Sessions to be saved:', formData);


    const followUpPayload = Array.isArray(followUpObj)
      ? (followUpObj[0] ?? {})
      : (followUpObj ?? {})

    return {
      bookingId,
      clinicId,
      branchId,
      patientInfo: {
        patientId,
        patientName,
        mobileNumber: patientMobile,
        age: Number(patientAge) || 0,
        sex: patientSex,
      },
      complaints: {
        complaintDetails: finalComplaints.complaintDetails || '',
        painAssessmentImage: finalComplaints.painAssessmentImage || '',
        reportImages: finalComplaints.reportImages || [],
        selectedTherapy: finalComplaints.selectedTherapy || '',
        selectedTherapyId: finalComplaints.selectedTherapyID || '',
        duration: finalComplaints.duration || '',
        therapyAnswers: Object.values(finalComplaints.theraphyAnswers ?? {}).flat().map(q => ({
          questionKey: q.questionKey ?? '',
          questionId: q.questionId ?? '',
          question: q.question ?? '',
          answer: q.answer ?? '',
        })),
      },
      // ✅ FIX: Use investigationTestsArray (normalized) and investigationReason
      investigation: {
        tests: investigationTestsArray,
        reason: investigationReason || '',
      },
      assessment: {
        subjectiveAssessment: {
          chiefComplaint: assessment.chiefComplaint ?? '',
          painScale: Number(assessment.painScale) || 0,
          painType: assessment.painType ?? '',
          duration: assessment.duration ?? '',
          onset: assessment.onset ?? '',
          aggravatingFactors: assessment.aggravatingFactors ?? '',
          relievingFactors: assessment.relievingFactors ?? '',
          observations: assessment.observations ?? '',
        },
        functionalAssessment: {
          difficultiesIn: difficultiesIn,
          otherDifficulty: otherDifficulty,
          dailyLivingAffected: dailyLivingAffected,
        },
        physicalExamination: {
          postureAssessment: postureAssessment,
          postureDeviations: postureDeviations,
          rangeOfMotion: romStatus,
          romRestricted: romRestricted,
          romJoints: romJoints,
          muscleStrength: muscleStrength,
          muscleWeakness: muscleWeakness,
          neurologicalSigns: neurologicalSigns,
        },
        ...(effectivePain === 'chronicPain' ? {
          chronicPainPatients: {
            painTriggers: painTriggers,
            relievingFactors: chronicRelieving,
          }
        } : {}),
        ...(effectivePain === 'sportsRehab' ? {
          sportsRehabPatients: {
            typeOfSport: typeOfSport,
            recurringInjuries: recurringInjuries,
            returnToSportGoals: returnToSportGoals,
          }
        } : {}),
        ...(effectivePain === 'neuroRehab' ? {
          neuroRehabPatients: {
            neuroDiagnosis: neuroDiagnosis,
            neuroOnset: neuroOnset,
            mobilityStatus: mobilityStatus,
            cognitiveStatus: cognitiveStatus,
          }
        } : {}),
      },
      diagnosis: {
        physioDiagnosis: firstDiag.physioDiagnosis ?? '',
        affectedArea: firstDiag.affectedArea ?? '',
        severity: firstDiag.severity ?? '',
        stage: firstDiag.stage ?? '',
        notes: firstDiag.notes ?? '',
      },
      treatmentPlan: {
        doctorId,
        doctorName,
        therapistId: formData?.therapySessions?.therapistId,
        therapistName: formData?.therapySessions?.therapistName,
        manualTherapy: treatmentPlanDisplay.manualTherapy,
        precautions: Array.isArray(formData?.therapySessions?.precautions)
          ? treatmentPlanDisplay.precautions
          : treatmentPlanDisplay.precautions
            ? [treatmentPlanDisplay.precautions]
            : [],
        modalitiesUsed: formData?.therapySessions?.modalitiesUsed || [],
        patientResponse: formData?.therapySessions?.patientResponse || '',
      },

      therapySessions: formData?.therapySessions?.sessions || [],
      exercisePlan: {
        homeAdvice,
        homeExercises: homeExercises.map(ex => ({
          id: ex.id ?? '',
          name: ex.name ?? '',
          sets: Number(ex.sets) || 0,
          reps: Number(ex.reps) || 0,
          duration: ex.duration || '10 mins',
          instructions: ex.instructions ?? '',
          videoUrl: ex.videoUrl ?? '',
          thumbnail: ex.thumbnail ?? '',
        })),
      },
      followUp: {
        nextVisitDate: followUpPayload.nextVisitDate ?? '',
        reviewNotes: followUpPayload.reviewNotes ?? '',
        modifications: followUpPayload.modifications ?? '',
      },
      treatmentTemplates,
      createdAt: todayStr(),
      prescriptionPdf,
    }
  }

  /* ── Save ── */
  const doSave = async ({ downloadAfter = false } = {}) => {
    if (!finalComplaints.complaintDetails?.trim()) {
      warning('"Complaint Details" is required to save.', { title: 'Warning' })
      return false
    }
    setSaving(true)
    try {

      const safeName = (patientName || 'Record').replace(/[^\w\-]+/g, '_')
      const blob = await renderPdfBlob();
      const pdfBase64 = await blobToBase64(blob);
      const payload = buildPayload(pdfBase64);
      console.log('🚀 FINAL SAVE PAYLOAD 👉', payload)
      console.log('🚀 FINAL SAVE PAYLOAD 👉', JSON.stringify(payload, null, 2))
      const resp = await SavePatientPrescription(payload)
      if (resp) {
        success('Record saved successfully!', { title: 'Success' })
        if (downloadAfter) downloadBlob(blob, `${safeName}.pdf`)
        navigate('/dashboard', { replace: true })
        return true
      } else {
        warning('Saved, but got an unexpected response.')
        return false
      }
    } catch (e) {
      console.error('Save error:', e)
      error('Failed to save record.', { title: 'Error' })
      return false
    } finally {
      setSaving(false)
    }
  }

  const confirmSaveAsTemplate = async () => {
    setShowTemplateModal(false)
    await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT })
    setPendingAction(null)
  }

  const skipTemplate = async () => {
    setShowTemplateModal(false)
    await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT })
    setPendingAction(null)
  }

  /* ════════════════ RENDER ════════════════ */
  return (
    <div style={{ background: LIGHT, minHeight: '100vh', paddingBottom: 100, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ backgroundColor: COLORS.bgcolor, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(26,90,168,0.2)', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.black, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Review Before Saving</div>
          <div style={{ color: COLORS.black, fontSize: 18, fontWeight: 700 }}>Physiotherapy Summary</div>
        </div>
        {patientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: '6px 16px', color: COLORS.black, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              {capitalizeEachWord(patientName)} · {patientAge}yr {patientSex?.charAt(0)}
            </div>
            <StatusDot status={overallStatus || patientData?.status || 'Pending'} />
          </div>
        )}
      </div>

      <CContainer fluid style={{ maxWidth: 1100, padding: '0 20px' }}>

        {/* ══ 1. PATIENT & BOOKING INFO ══ */}
        <Section icon="👤" title="Patient & Booking Information">
          <Grid cols={3}>
            <Row label="Patient ID" value={patientId} />
            <Row label="Booking ID" value={bookingId} />
            <Row label="Name" value={capitalizeEachWord(patientName)} />
            <Row label="Age / Sex" value={patientAge ? `${patientAge} yrs / ${patientSex}` : ''} />
            <Row label="Mobile" value={patientMobile} />
            <Row label="Clinic ID" value={clinicId} />
            <Row label="Clinic" value={clinicName} />
            <Row label="Branch ID" value={branchId} />
            <Row label="Doctor" value={doctorName} />
            <Row label="Doctor ID" value={doctorId} />
            <Row label="Therapy Type" value={patientData?.subServiceName} />
            <Row label="Overall Status" value={overallStatus || 'Pending'} />
          </Grid>
        </Section>

        {/* ══ 2. COMPLAINTS & SYMPTOMS ══ */}
        <Section icon="🩺" title="Complaints & Symptoms">
          <Grid cols={2}>
            <Row label="Complaint Details" value={complaintDetails} highlight />
            <Row label="Duration" value={complaintDuration} highlight />
            <Row label="Selected Therapy" value={selectedTherapy} />
            <Row label="Report Images" value={reportImages.length > 0 ? `${reportImages.length} image(s)` : 'None'} />
          </Grid>
          {parts.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Affected Parts: </span>
              {parts.map(p => <Chip key={p} label={p} color="#5b21b6" bg="#ede9fe" />)}
            </div>
          )}
          {toImageSrc(partImage) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Body Part Diagram</div>
              <div style={{ background: '#f0f7ff', borderRadius: 10, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${BORDER}`, padding: 8, maxWidth: 360 }}>
                <img src={toImageSrc(partImage)} alt="Body Part Diagram" style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 8 }} />
              </div>
            </div>
          )}
          {attachments.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Attachments</div>
              <FileUploader attachments={attachments} accept=".pdf,image/*" />
            </div>
          )}
        </Section>

        {/* ══ 3. PATIENT BACKGROUND ══ */}
        <Section icon="📋" title="Patient Background">
          <Grid cols={3}>
            <Row label="Previous Injuries" value={previousInjuries} highlight />
            <Row label="Current Medications" value={currentMedications} highlight />
            <Row label="Allergies" value={allergies} />
            <Row label="Occupation" value={occupation} />
            <Row label="Insurance Provider" value={insuranceProvider} />
            <Row label="Patient Pain Type" value={PAIN_LABEL_MAP[effectivePain] || effectivePain} highlight />
          </Grid>
          {activityLevels.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Levels: </span>
              {activityLevels.map(lvl => <Chip key={lvl} label={lvl} color="#5b21b6" bg="#ede9fe" />)}
            </div>
          )}
        </Section>

        {/* ══ 4. THERAPY QUESTIONNAIRE ══ */}
        {therapyGroups.length > 0 && (
          <Section icon="📝" title="Therapy Questionnaire">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {therapyGroups.map(({ category, questions }) => (
                <div key={category} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  <div style={{ background: 'linear-gradient(90deg,#f0f7ff,#e8f0fe)', padding: '7px 14px', fontWeight: 700, fontSize: '0.78rem', color: A, textTransform: 'capitalize', letterSpacing: '0.06em', borderBottom: `1px solid ${BORDER}` }}>{category}</div>
                  {questions.map((q, i) => (
                    <div key={q.questionId ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: i < questions.length - 1 ? `1px solid #eef3fa` : 'none' }}>
                      <span style={{ fontSize: '0.85rem', color: P, flex: 1, marginRight: 12 }}>{q.question ?? `Question ${q.questionId}`}</span>
                      <AnswerBadge answer={q.answer} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ══ 5. INVESTIGATION ══ */}
        {/* ✅ FIX: Show section if tests array has items OR reason has content */}
        {(investigationTestsArray.length > 0 || investigationReason) && (
          <Section icon="🔬" title="Investigation">
            {/* ✅ FIX: Render tests as chips, not a plain string */}
            {investigationTestsArray.length > 0 && (
              <div style={{ marginBottom: investigationReason ? 14 : 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recommended Tests:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {investigationTestsArray.map((test, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#dbeafe', color: A,
                        borderRadius: 20, padding: '4px 14px',
                        fontSize: '0.82rem', fontWeight: 700,
                        border: `1px solid ${A}33`,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      🔬 {test}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {investigationReason && (
              <Row label="Notes / Reason" value={investigationReason} full highlight />
            )}
          </Section>
        )}

        {/* ══ 6. ASSESSMENT ══ */}
        {Object.keys(assessment).length > 0 && (
          <Section icon="📊" title="Assessment">

            {/* 6a. Subjective */}
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>📋 Subjective Assessment</div>
              <Grid cols={2}>
                <Row label="Chief Complaint" value={assessment.chiefComplaint} highlight />
                <Row label="Pain Scale" value={assessment.painScale} highlight />
                <Row label="Pain Type" value={assessment.painType} />
                <Row label="Duration" value={assessment.duration} />
                <Row label="Onset" value={assessment.onset} />
                <Row label="Aggravating Factors" value={assessment.aggravatingFactors} />
                <Row label="Relieving Factors" value={assessment.relievingFactors} />
                <Row label="Posture Notes" value={assessment.posture} />
                <Row label="Range of Motion" value={assessment.rangeOfMotion} />
                <Row label="Special Tests" value={assessment.specialTests} />
              </Grid>
              {assessment.observations && <Row label="Observations" value={assessment.observations} full />}
            </div>

            {/* 6b. Functional Assessment */}
            {(difficultiesIn.length > 0 || otherDifficulty || dailyLivingAffected) && (
              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🏃 Functional Assessment</div>
                {difficultiesIn.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulties in: </span>
                    {difficultiesIn.map(d => <Chip key={d} label={d} color={A} bg="#dbeafe" />)}
                    {otherDifficulty && <Chip label={`Other: ${otherDifficulty}`} color={A} bg="#dbeafe" />}
                  </div>
                )}
                {dailyLivingAffected && <Row label="Daily Living Affected" value={dailyLivingAffected} full highlight />}
              </div>
            )}

            {/* 6c. Physical Examination */}
            {(postureAssessment.length > 0 || romStatus.length > 0 || muscleStrength.length > 0 || neurologicalSigns.length > 0) && (
              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔬 Physical Examination</div>
                <div style={{ background: '#f8f9ff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: P, minWidth: 160 }}>Posture Assessment:</span>
                    {['Normal', 'Deviations'].map(opt => <CheckChip key={opt} label={opt} checked={postureAssessment.includes(opt)} />)}
                    {postureDeviations && <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>— {postureDeviations}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: P, minWidth: 160 }}>Range of Motion:</span>
                    {['Normal', 'Restricted'].map(opt => <CheckChip key={opt} label={opt} checked={romStatus.includes(opt)} />)}
                    {romRestricted && <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>— {romRestricted}</span>}
                    {romJoints && <span style={{ fontSize: '0.82rem', color: P }}>Joints: <strong>{romJoints}</strong></span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: P, minWidth: 160 }}>Muscle Strength:</span>
                    {['Normal', 'Weakness in'].map(opt => <CheckChip key={opt} label={opt} checked={muscleStrength.includes(opt)} />)}
                    {muscleWeakness && <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>— {muscleWeakness}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: P, minWidth: 160 }}>Neurological Signs:</span>
                    {['Normal', 'Balance', 'Coordination', 'Sensation issues'].map(opt => <CheckChip key={opt} label={opt} checked={neurologicalSigns.includes(opt)} />)}
                  </div>
                </div>
              </div>
            )}

            {/* 6d. Chronic Pain */}
            {effectivePain === 'chronicPain' && (painTriggers || chronicRelieving) && (
              <div style={{ marginBottom: 16, background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🔴 Chronic Pain Assessment</div>
                <Grid cols={2}>
                  <Row label="Pain Triggers" value={painTriggers} highlight />
                  <Row label="Relieving Factors" value={chronicRelieving} highlight />
                </Grid>
              </div>
            )}

            {/* 6e. Sports Rehab */}
            {effectivePain === 'sportsRehab' && (typeOfSport || recurringInjuries || returnToSportGoals) && (
              <div style={{ marginBottom: 16, background: '#f0fff4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🟢 Sports Rehab Assessment</div>
                <Grid cols={2}>
                  <Row label="Type of Sport" value={typeOfSport} highlight />
                  <Row label="Recurring Injuries" value={recurringInjuries} highlight />
                  <Row label="Return-to-Sport Goals" value={returnToSportGoals} full />
                </Grid>
              </div>
            )}

            {/* 6f. Neuro Rehab */}
            {effectivePain === 'neuroRehab' && (neuroDiagnosis || neuroOnset || mobilityStatus || cognitiveStatus) && (
              <div style={{ marginBottom: 16, background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>🟣 Neuro Rehab Assessment</div>
                <Grid cols={2}>
                  <Row label="Diagnosis" value={neuroDiagnosis} highlight />
                  <Row label="Onset" value={neuroOnset} highlight />
                  <Row label="Mobility Status" value={mobilityStatus} />
                  <Row label="Cognitive / Communication" value={cognitiveStatus} />
                </Grid>
              </div>
            )}

          </Section>
        )}

        {/* ══ 7. DIAGNOSIS ══ */}
        {diagnosisRows.length > 0 && (
          <Section icon="🔍" title="Diagnosis">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                    {['#', 'Physio Diagnosis', 'Affected Area', 'Severity', 'Stage', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
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
                      <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#3a8fd4' }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{d.physioDiagnosis || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>{d.affectedArea || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {d.severity ? <span style={{ background: sBg, color: sFg, borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.78rem' }}>{d.severity}</span> : '—'}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {d.stage ? <span style={{ background: tBg, color: tFg, borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.78rem' }}>{d.stage}</span> : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{d.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ══ 8. TREATMENT PLAN ══ */}
        {(treatmentPlanDisplay.therapistId || treatmentPlanDisplay.therapistName) && (
          <Section icon="🧑‍⚕️" title="Treatment Plan">
            <Grid cols={2}>
              <Row label="Doctor ID" value={treatmentPlanDisplay.doctorId} />
              <Row label="Doctor Name" value={treatmentPlanDisplay.doctorName} />
              <Row label="Therapist ID" value={treatmentPlanDisplay.therapistId} />
              <Row label="Therapist Name" value={treatmentPlanDisplay.therapistName} highlight />
              <Row label="Manual Therapy" value={treatmentPlanDisplay.manualTherapy} />
              <Row label="Frequency" value={treatmentPlanDisplay.frequency} />
              <Row label="Precautions" value={Array.isArray(treatmentPlanDisplay.precautions) ? treatmentPlanDisplay.precautions.join(', ') : treatmentPlanDisplay.precautions} />
            </Grid>
          </Section>
        )}

        {/* ══ 9. THERAPY SESSIONS ══ */}
        <Section icon="🏥" title="Therapy Sessions">
          {overallStatus && (
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Status:</span>
              <StatusDot status={overallStatus} />
            </div>
          )}
          {process.env.NODE_ENV === 'development' && sessionsList.length === 0 && (
            <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fff8e1', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.78rem', color: '#92400e' }}>
              ⚠️ Dev: No sessions found. formData.therapySessions type: {typeof formData?.therapySessions} | isArray: {String(Array.isArray(formData?.therapySessions))} | length: {Array.isArray(formData?.therapySessions) ? formData.therapySessions.length : 'N/A'}
            </div>
          )}
          <TherapySessionsDisplay sessionsList={sessionsList} />
        </Section>

        {/* ══ 10. EXERCISE PLAN ══ */}
        {(homeExercises.length > 0 || homeAdvice) && (
          <Section icon="🏋️" title="Exercise Plan">
            {homeExercises.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: homeAdvice ? 16 : 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Exercise', 'Sets', 'Reps', 'Frequency', 'Instructions', 'Thumbnail'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {homeExercises.map((ex, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{ex.name || '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          {ex.sets ? <span style={{ background: '#dbeafe', color: A, borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: '0.78rem' }}>🔁 {ex.sets}</span> : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          {ex.reps ? <span style={{ background: '#dbeafe', color: A, borderRadius: 10, padding: '2px 9px', fontWeight: 700, fontSize: '0.78rem' }}>🔄 {ex.reps}</span> : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          {ex.frequency ? <span style={{ background: '#f0f7ff', color: P, borderRadius: 8, padding: '2px 9px', fontWeight: 600, fontSize: '0.78rem' }}>📆 {ex.frequency}</span> : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>{ex.instructions || '—'}</div>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {ex.thumbnail
                            ? <img src={ex.thumbnail} alt={ex.name} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: `1px solid ${BORDER}` }} onError={e => { e.target.style.display = 'none' }} />
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {homeAdvice && <Row label="Home Advice" value={homeAdvice} full highlight />}
          </Section>
        )}

        {/* ══ 11. FOLLOW UP ══ */}
        {(followUpEntry.nextVisitDate || followUpEntry.reviewNotes) && (
          <Section icon="📅" title="Follow Up">
            <Grid cols={2}>
              <Row label="Next Visit Date" value={followUpEntry.nextVisitDate} highlight />
              <Row label="Treatment Status" value={followUpEntry.treatmentStatus} />
              <Row label="Review Notes" value={followUpEntry.reviewNotes} highlight />
              <Row label="Modifications" value={followUpEntry.modifications} />
            </Grid>
            {followUpEntry.nextVisitDate && (() => {
              const urgency = getVisitUrgency(followUpEntry.nextVisitDate)
              const st = FOLLOWUP_STATUS_STYLE[followUpEntry.treatmentStatus]
              return urgency ? (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}`, borderRadius: 12, padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700 }}>
                    {urgency.icon} {urgency.label}
                  </span>
                  {st && (
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 12, padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700 }}>
                      {st.icon} {followUpEntry.treatmentStatus}
                    </span>
                  )}
                </div>
              ) : null
            })()}
          </Section>
        )}

        {/* ══ 12. TREATMENT TEMPLATES ══ */}
        {treatmentTemplates.length > 0 && (
          <Section icon="📁" title="Treatment Templates">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                    {['#', 'Condition', 'Modalities', 'Manual Therapy', 'Exercises', 'Duration', 'Frequency'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {treatmentTemplates.map((t, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '9px 12px', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{t.condition || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {Array.isArray(t.modalities) && t.modalities.length > 0
                          ? t.modalities.map(m => <Chip key={m} label={m} color={A} bg="#dbeafe" />)
                          : '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>{t.manualTherapy || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {Array.isArray(t.exercises) && t.exercises.length > 0
                          ? t.exercises.map(e => <Chip key={e} label={e} color="#065f46" bg="#d1fae5" />)
                          : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{t.duration || '—'}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{t.frequency || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

      </CContainer>

      {/* ══ STICKY BOTTOM BAR ══ */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: sidebarWidth ? `${sidebarWidth}px` : 0,
        width: sidebarWidth ? `calc(100vw - ${sidebarWidth}px)` : '100vw',
        background: '#a5c4d4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', zIndex: 999,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
      }}>
        <Button
          customColor="#ffffff" color="#7e3a93"
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
          onClick={() => {
            setClickedSaveTemplate(true)
            onSaveTemplate?.()
            info('Template saved!', { title: 'Template' })
          }}
        >
          {!updateTemplate ? '💾 Save as Template' : '🔄 Update Template'}
        </Button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saving && <CSpinner size="sm" style={{ color: '#7e3a93' }} />}
          <Button
            customColor="#ffffff" color="#7e3a93"
            style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
            onClick={() => { setPendingAction(ACTIONS.SAVE); clickedSaveTemplate ? doSave() : setShowTemplateModal(true) }}
            disabled={saving}
          >
            ✅ Save
          </Button>
          <Button
            customColor="#ffffff" color="#7e3a93"
            style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
            onClick={() => { setPendingAction(ACTIONS.SAVE_PRINT); clickedSaveTemplate ? doSave({ downloadAfter: true }) : setShowTemplateModal(true) }}
            disabled={saving}
          >
            📄 Save & Download PDF
          </Button>
        </div>
      </div>

      {/* ══ TEMPLATE MODAL ══ */}
      {showTemplateModal && !clickedSaveTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,58,92,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: '0 8px 40px rgba(26,90,168,0.2)', border: `1px solid ${BORDER}`, position: 'relative' }}>
            <button onClick={() => setShowTemplateModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>📋</div>
            <h6 style={{ margin: '0 0 8px', color: P, fontWeight: 700, textAlign: 'center' }}>Save as Template?</h6>
            <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', marginBottom: 20 }}>Reuse this layout later for faster entry.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={skipTemplate} style={{ padding: '9px 22px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${BORDER}`, background: LIGHT, color: P, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>No, just save</button>
              <button onClick={confirmSaveAsTemplate} style={{ padding: '9px 22px', borderRadius: 8, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg,${P},${A})`, color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit' }}>Yes, save template</button>
            </div>
          </div>
        </div>
      )}

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default Summary