import React, { useState, useEffect } from 'react'
import FileUploader from './FileUploader'
import { CSpinner } from '@coreui/react'
import { getVisitHistoryByPatientIdAndBookingId } from '../Auth/Auth'
import ReportDetails from '../components/Reports/Reports'

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bgcolor: '#1B4F8A',
  orange: '#f9c571',
  orangeLight: '#fff8ec',
  orangeMid: '#fde2a3',
  white: '#FFFFFF',
  bgLight: '#F0F6FF',
  border: '#c2d8f0',
  borderLight: '#deeaf7',
  text: '#1B4F8A',
  textMid: '#4a6fa5',
  textLight: '#7a9ec2',
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
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isValid = (v) =>
  v !== undefined && v !== null && v !== '' && v !== 'NA' &&
  !(typeof v === 'string' && v.trim().toLowerCase() === 'undefined') &&
  !(typeof v === 'string' && v.trim() === '—')

const dash = (v) => (v !== undefined && v !== null && String(v).trim() !== '' && v !== 'NA' ? v : '—')

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

const normalizeAttachments = (raw) => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') return raw.split(',').map(s => s && s.trim()).filter(Boolean)
  return []
}

const freqLabel = (f) => {
  switch ((f || '').toLowerCase()) {
    case 'day': return 'Daily'
    case 'week': return 'Weekly'
    case 'month': return 'Monthly'
    default: return f ? f[0].toUpperCase() + f.slice(1) : '—'
  }
}

// ─── Table Styles ──────────────────────────────────────────────────────────────
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: T.text }
const thStyle = {
  padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap',
  fontWeight: 700, fontSize: '0.72rem', background: T.bgcolor,
  color: T.white, letterSpacing: '0.04em',
}
const tdStyle = (i) => ({
  padding: '7px 12px', borderBottom: `1px solid ${T.border}`,
  background: i % 2 === 0 ? T.bgLight : T.white,
  fontSize: '0.8rem', color: T.text,
})

// ─── Section ───────────────────────────────────────────────────────────────────
const Section = ({ icon, title, children, badge = null }) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: 12, marginBottom: 14, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(27,79,138,0.07), 0 4px 16px rgba(27,79,138,0.06)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', background: T.bgcolor,
      borderBottom: `2px solid ${T.orange}`,
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 8,
        background: 'rgba(249,197,113,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ color: T.white, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.01em', flex: 1 }}>{title}</span>
      {badge && (
        <span style={{
          background: T.orange, color: T.bgcolor,
          borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700,
        }}>{badge}</span>
      )}
    </div>
    <div style={{ padding: '12px 16px' }}>{children}</div>
  </div>
)

// ─── AccordionItem ─────────────────────────────────────────────────────────────
const AccordionItem = ({ title, children, defaultOpen = false, badge = null }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 10,
      marginBottom: 10, overflow: 'hidden',
      boxShadow: open ? '0 2px 12px rgba(27,79,138,0.10)' : '0 1px 4px rgba(27,79,138,0.05)',
      transition: 'box-shadow 0.2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '10px 16px',
          background: open ? T.bgcolor : T.bgLight, border: 'none', cursor: 'pointer',
          borderBottom: open ? `2px solid ${T.orange}` : 'none',
          transition: 'background 0.2s', gap: 8,
        }}
      >
        <span style={{ color: open ? T.white : T.text, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.01em', flex: 1, textAlign: 'left' }}>{title}</span>
        {badge && (
          <span style={{ background: open ? T.orange : T.border, color: T.bgcolor, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{badge}</span>
        )}
        <span style={{ color: open ? T.orange : T.textMid, fontWeight: 700, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '14px 16px', background: T.white }}>{children}</div>
      )}
    </div>
  )
}

// ─── Row ───────────────────────────────────────────────────────────────────────
const Row = ({ label, value, full = false, highlight = false }) => {
  if (!isValid(value) && value !== 0) return null
  return (
    <div style={{
      display: 'flex', flexDirection: full ? 'column' : 'row',
      gap: full ? 2 : 6, marginBottom: 7,
      padding: highlight ? '5px 10px' : 0,
      background: highlight ? T.orangeLight : 'transparent',
      borderRadius: highlight ? 6 : 0,
      borderLeft: highlight ? `3px solid ${T.orange}` : 'none',
      paddingLeft: highlight ? 10 : 0,
      alignItems: 'flex-start',
    }}>
      <span style={{
        fontWeight: 700, fontSize: '0.72rem', color: T.textLight,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.5,
        minWidth: full ? 'auto' : 110,
      }}>{label}:</span>
      <span style={{ fontSize: '0.82rem', color: T.text, wordBreak: 'break-word', lineHeight: 1.5, flex: 1 }}>{dash(value)}</span>
    </div>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
const Grid = ({ children, cols = 2 }) => {
  const validChildren = React.Children.toArray(children).filter(Boolean)
  if (validChildren.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px 20px' }}>
      {validChildren}
    </div>
  )
}

// ─── Chip ──────────────────────────────────────────────────────────────────────
const Chip = ({ label, color = T.bgcolor, bg = T.bgLight }) => (
  <span style={{
    background: bg, color, borderRadius: 20, padding: '2px 10px',
    fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${color}33`,
    display: 'inline-block', margin: '2px 3px 2px 0',
  }}>{label}</span>
)

const CheckChip = ({ label, checked }) => (
  <span style={{
    background: checked ? T.orangeLight : '#f3f4f6',
    color: checked ? T.bgcolor : '#94a3b8',
    borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
    border: `1px solid ${checked ? T.orange : '#e2e8f0'}`,
    display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 3px 2px 0',
    opacity: checked ? 1 : 0.5,
  }}>
    {checked ? '✓' : '○'} {label}
  </span>
)

const AnswerBadge = ({ answer }) => {
  const display = String(answer ?? '').trim()
  if (!display || display.toLowerCase() === 'undefined' || display.toLowerCase() === 'na') {
    return <span style={{ color: T.textLight, fontSize: 11, fontStyle: 'italic' }}>Not answered</span>
  }
  const up = display.toUpperCase()
  const [bg, color, border] =
    up === 'YES' ? ['#d1fae5', '#065f46', '#6ee7b7'] :
      up === 'NO' ? ['#fee2e2', '#991b1b', '#fecaca'] :
        [T.bgLight, T.bgcolor, T.border]
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{display}</span>
  )
}

// ─── Exercise Table ────────────────────────────────────────────────────────────
const ExerciseTableDisplay = ({ exercises }) => {
  if (!exercises || exercises.length === 0) return (
    <div style={{ padding: '8px 12px', color: T.textLight, fontStyle: 'italic', fontSize: '0.78rem' }}>No exercises</div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>{['#', 'Exercise Name', 'Sessions', 'Sets', 'Reps', 'Frequency', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {exercises.map((ex, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle(i), fontWeight: 700, color: T.bgcolor }}>{i + 1}</td>
              <td style={{ ...tdStyle(i), fontWeight: 600 }}>{ex.exerciseName || ex.name || '—'}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{dash(ex.noOfSessions ?? ex.session ?? ex.sessions)}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.sets ? <Chip label={`🔁 ${ex.sets}`} color={T.bgcolor} bg={T.bgLight} /> : '—'}</td>
              <td style={{ ...tdStyle(i), textAlign: 'center' }}>{(ex.repetitions || ex.reps) ? <Chip label={`🔄 ${ex.repetitions || ex.reps}`} color={T.teal} bg={T.tealLight} /> : '—'}</td>
              <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{ex.frequency ? <span style={{ fontSize: '0.72rem', fontWeight: 600, color: T.bgcolor }}>📆 {ex.frequency}</span> : '—'}</td>
              <td style={{ ...tdStyle(i), maxWidth: 140 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.notes}>{ex.notes || '—'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Therapy Block ─────────────────────────────────────────────────────────────
const TherapyBlock = ({ therapyName, exercises }) => (
  <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 12px', background: T.bgLight, borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontWeight: 700, color: T.bgcolor, fontSize: '0.8rem' }}>💊 {therapyName || 'Therapy'}</span>
    </div>
    <ExerciseTableDisplay exercises={exercises} />
  </div>
)

// ─── Session Meta Bar ──────────────────────────────────────────────────────────
const SessionMetaBar = ({ sess, therapistId, therapistName }) => {
  const tName = sess.therapistName || therapistName || ''
  const tId = sess.therapistId || therapistId || ''
  if (!sess.serviceType && !tName && !tId) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, padding: '8px 12px', background: T.bgLight, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
      {sess.serviceType && <Chip label={`📋 ${sess.serviceType}`} color={T.bgcolor} bg={T.bgLight} />}
      {tName && <Chip label={`👤 ${tName}`} color={T.bgcolor} bg={T.orangeLight} />}
      {tId && <Chip label={`ID: ${tId}`} color={T.textMid} bg="#f3f4f6" />}
    </div>
  )
}

// ─── Therapy Sessions Display ──────────────────────────────────────────────────
const TherapySessionsDisplay = ({ sessionsList, therapistId, therapistName }) => {
  if (!sessionsList || sessionsList.length === 0) return (
    <div style={{ padding: '12px', textAlign: 'center', color: T.textLight, fontSize: '0.8rem' }}>No therapy session data found.</div>
  )
  return (
    <>
      {sessionsList.map((sess, si) => {
        const serviceType = (sess.serviceType || '').toLowerCase()
        const isLast = si === sessionsList.length - 1

        if (serviceType === 'package') {
          return (
            <div key={si} style={{ marginBottom: isLast ? 0 : 20 }}>
              <div style={{ padding: '8px 14px', background: T.bgcolor, borderRadius: '10px 10px 0 0', color: T.white, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${T.orange}` }}>
                <span>📦 {sess.packageName || 'Package'}</span>
              </div>
              <div style={{ border: `2px solid ${T.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px' }}>
                <SessionMetaBar sess={sess} therapistId={therapistId} therapistName={therapistName} />
                {Array.isArray(sess.programs) && sess.programs.length > 0 && sess.programs.map((prog, pIdx) => (
                  <div key={pIdx} style={{ marginBottom: pIdx < sess.programs.length - 1 ? 14 : 0 }}>
                    <div style={{ padding: '7px 12px', background: T.bgcolor, borderRadius: '7px 7px 0 0', color: T.white, fontWeight: 700, fontSize: '0.8rem' }}>
                      🎯 {prog.programName || `Program ${pIdx + 1}`}
                    </div>
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
        }

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

        if (serviceType === 'therapy') {
          return (
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
        }

        if (serviceType === 'exercise') {
          return (
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
        }

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

// ─── Questionnaire Section ─────────────────────────────────────────────────────
const QuestionnaireSection = ({ therapyGroups }) => {
  const [activeTab, setActiveTab] = useState(0)
  const validGroups = therapyGroups.filter(({ questions }) =>
    questions.filter(q => isValid(q.question)).length > 0
  )
  if (validGroups.length === 0) return null

  const { questions } = validGroups[activeTab] ?? validGroups[0]
  const validQs = questions.filter(q => isValid(q.question))

  return (
  <AccordionItem 
  title="📝 Therapy Questionnaire" 
  badge={`${validGroups.length} categories`}
>
  {/* Category Tabs */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
    {validGroups.map(({ category, questions: qs }, idx) => {
      const vqs = qs.filter(q => isValid(q.question))
      const ans = vqs.filter(q => isValid(q.answer) && q.answer.toLowerCase() !== 'undefined').length
      const isActive = activeTab === idx

      return (
        <button
          key={category}
          onClick={() => setActiveTab(idx)}
          style={{
            border: `2px solid ${isActive ? T.orange : T.border}`,
            borderRadius: 10,
            padding: '5px 12px',
            cursor: 'pointer',
            background: isActive ? T.bgcolor : T.white,
            color: isActive ? T.white : T.textMid,
            fontWeight: 700,
            fontSize: 11,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textTransform: 'capitalize',
          }}
        >
          {category}
          <span
            style={{
              background: isActive ? T.orange : T.bgLight,
              color: T.bgcolor,
              borderRadius: 10,
              padding: '1px 6px',
              fontSize: 10,
              fontWeight: 800
            }}
          >
            {ans}/{vqs.length}
          </span>
        </button>
      )
    })}
  </div>

  {/* Questions List */}
  <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
    {validQs.map((q, idx) => {
      const hasAns = isValid(q.answer) && q.answer.toLowerCase() !== 'undefined'

      return (
        <div
          key={q.questionId ?? idx}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            padding: '9px 14px',
            borderBottom: idx < validQs.length - 1 ? `1px solid ${T.borderLight}` : 'none',
            background: idx % 2 === 0 ? T.bgLight : T.white,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                background: hasAns ? T.bgcolor : T.border,
                color: hasAns ? T.white : T.textLight,
                fontSize: 9,
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {idx + 1}
            </span>

            <span style={{ fontSize: 12, color: T.text, fontWeight: 500, lineHeight: 1.4 }}>
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
</AccordionItem>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  transformVisit — FIXED to match actual API response structure
// ══════════════════════════════════════════════════════════════════════════════
const transformVisit = (visit) => {
  const record = visit?.physiotherapyDoctorData || visit?.physiotherapyRecord || visit || {}

  // ── Complaints ──────────────────────────────────────────────────────────────
  const complaintsObj = record.complaints || record.symptoms || {}

  const complaintDetails = complaintsObj.complaintDetails ?? complaintsObj.symptomDetails ?? ''
  const complaintDuration = complaintsObj.duration ?? ''
  const selectedTherapy = complaintsObj.selectedTherapy ?? ''
  const selectedTherapyID = complaintsObj.selectedTherapyId ?? complaintsObj.selectedTherapyID ?? ''

  // ── Patient Background — READ FROM complaintsObj FIRST ─────────────────────
  // The API puts these fields inside the complaints object
  const previousInjuries =
    complaintsObj.previousInjuries ?? record.previousInjuries ?? visit.previousInjuries ?? ''
  const currentMedications =
    complaintsObj.currentMedications ?? record.currentMedications ?? visit.currentMedications ?? ''
  const allergies =
    complaintsObj.allergies ?? record.allergies ?? visit.allergies ?? ''
  const occupation =
    complaintsObj.occupation ?? record.occupation ?? visit.occupation ?? ''
  const insuranceProvider =
    complaintsObj.insuranceProvider ?? record.insuranceProvider ?? visit.insuranceProvider ?? ''
  const activityLevels =
    Array.isArray(complaintsObj.activityLevels) ? complaintsObj.activityLevels
      : Array.isArray(record.activityLevels) ? record.activityLevels
        : Array.isArray(visit.activityLevels) ? visit.activityLevels
          : []
  const patientPain =
    complaintsObj.patientPain ?? record.patientPain ?? visit.patientPain ?? ''

  // ── Build symptoms display array (AFTER all variables are declared) ─────────
  const symptomsArr = []
  if (complaintDetails) symptomsArr.push(`Complaint Details: ${complaintDetails}`)
  if (complaintsObj.doctorObs) symptomsArr.push(`Doctor Observations: ${complaintsObj.doctorObs}`)
  if (complaintDuration) symptomsArr.push(`Duration: ${complaintDuration}`)
  if (previousInjuries) symptomsArr.push(`Previous Injuries: ${previousInjuries}`)
  if (currentMedications) symptomsArr.push(`Current Medications: ${currentMedications}`)
  if (allergies) symptomsArr.push(`Allergies: ${allergies}`)
  if (occupation) symptomsArr.push(`Occupation: ${occupation}`)

  // ── Pain assessment image ───────────────────────────────────────────────────
  const partImage = complaintsObj.painAssessmentImage ?? complaintsObj.partImage ?? ''

  // ── Report images array ─────────────────────────────────────────────────────
  const reportImages = Array.isArray(complaintsObj.reportImages)
    ? complaintsObj.reportImages
    : Array.isArray(complaintsObj.attachmentImages)
      ? complaintsObj.attachmentImages
      : []

  // ── Image attachments for display ───────────────────────────────────────────
  const imageAttachments = [
    ...(partImage ? [{ url: toImageSrc(partImage), name: 'Pain Assessment' }] : []),
    ...reportImages.map((img, i) => ({ url: toImageSrc(img), name: `Report ${i + 1}` })),
  ]

  // ── Therapy Questionnaire ───────────────────────────────────────────────────
  const rawAnswers = complaintsObj.therapyAnswers ?? complaintsObj.theraphyAnswers ?? []

  let therapyGroups = []
  if (Array.isArray(rawAnswers) && rawAnswers.length > 0) {
    therapyGroups = [{ category: 'General', questions: rawAnswers }]
  } else if (rawAnswers && typeof rawAnswers === 'object') {
    therapyGroups = Object.entries(rawAnswers).map(([cat, qs]) => ({
      category: cat,
      questions: Array.isArray(qs) ? qs : [],
    }))
  }

  // ── Parts (body parts) ─────────────────────────────────────────────────────
  const parts = visit.parts ?? complaintsObj.parts ?? record.symptoms?.parts ?? visit.patientData?.parts ?? []

  // ── Attachments ─────────────────────────────────────────────────────────────
  const attachmentsFromComplaints = normalizeAttachments(complaintsObj.attachments)
  const attachmentsFromReports = complaintsObj.reports ? [complaintsObj.reports] : []
  const attachments = [...attachmentsFromComplaints, ...attachmentsFromReports]

  // ── Investigation / Tests ───────────────────────────────────────────────────
  const investigationObj = record.investigation ?? visit.investigation ?? {}
  const rawTests = investigationObj.selectedTests ?? investigationObj.tests ?? []
  const investigationTestsArray = Array.isArray(rawTests)
    ? rawTests.map(t => (typeof t === 'string' ? t : t.name ?? JSON.stringify(t)))
    : rawTests ? [String(rawTests)] : []
  const investigationReason = investigationObj.reason ?? investigationObj.notes ?? ''
  const testsArr = investigationTestsArray.map(name => ({ name }))

  // ── Assessment ──────────────────────────────────────────────────────────────
  const rawAssessment = record.assessment ?? visit.assessment ?? {}
  const subjective = rawAssessment.subjectiveAssessment ?? {}
  const functional = rawAssessment.functionalAssessment ?? {}
  const physical = rawAssessment.physicalExamination ?? {}
  const chronicPainData = rawAssessment.chronicPainPatients ?? {}
  const sportsRehabData = rawAssessment.sportsRehab ?? {}
  const neuroRehabData = rawAssessment.neuroRehab ?? {}

  const assessment = {
    chiefComplaint: subjective.chiefComplaint ?? rawAssessment.chiefComplaint ?? '',
    painScale: subjective.painScale ?? rawAssessment.painScale ?? '',
    painType: subjective.painType ?? rawAssessment.painType ?? '',
    duration: subjective.duration ?? rawAssessment.duration ?? '',
    onset: subjective.onset ?? rawAssessment.onset ?? '',
    aggravatingFactors: subjective.aggravatingFactors ?? rawAssessment.aggravatingFactors ?? '',
    relievingFactors: subjective.relievingFactors ?? rawAssessment.relievingFactors ?? '',
    observations: subjective.observations ?? rawAssessment.observations ?? '',
    difficultiesIn: Array.isArray(functional.difficultiesIn)
      ? functional.difficultiesIn
      : Array.isArray(rawAssessment.difficultiesIn) ? rawAssessment.difficultiesIn : [],
    otherDifficulty: functional.otherDifficulty ?? rawAssessment.otherDifficulty ?? '',
    dailyLivingAffected: functional.dailyLivingAffected ?? rawAssessment.dailyLivingAffected ?? '',
    postureAssessment: Array.isArray(physical.postureAssessment)
      ? physical.postureAssessment
      : Array.isArray(rawAssessment.postureAssessment) ? rawAssessment.postureAssessment : [],
    postureDeviations: physical.postureDeviations ?? rawAssessment.postureDeviations ?? '',
    romStatus: Array.isArray(physical.rangeOfMotion)
      ? physical.rangeOfMotion
      : Array.isArray(rawAssessment.romStatus) ? rawAssessment.romStatus : [],
    romRestricted: physical.romRestricted ?? rawAssessment.romRestricted ?? '',
    romJoints: physical.romJoints ?? rawAssessment.romJoints ?? '',
    muscleStrength: Array.isArray(physical.muscleStrength)
      ? physical.muscleStrength
      : Array.isArray(rawAssessment.muscleStrength) ? rawAssessment.muscleStrength : [],
    muscleWeakness: physical.muscleWeakness ?? rawAssessment.muscleWeakness ?? '',
    neurologicalSigns: Array.isArray(physical.neurologicalSigns)
      ? physical.neurologicalSigns
      : Array.isArray(rawAssessment.neurologicalSigns) ? rawAssessment.neurologicalSigns : [],
    painTriggers: chronicPainData.painTriggers ?? rawAssessment.painTriggers ?? '',
    chronicRelieving: chronicPainData.relievingFactors ?? rawAssessment.chronicRelieving ?? '',
    patientPain: rawAssessment.patientPain ?? patientPain ?? '',
    typeOfSport: sportsRehabData.typeOfSport ?? rawAssessment.typeOfSport ?? '',
    recurringInjuries: sportsRehabData.recurringInjuries ?? rawAssessment.recurringInjuries ?? '',
    returnToSportGoals: sportsRehabData.returnToSportGoals ?? rawAssessment.returnToSportGoals ?? '',
    neuroDiagnosis: neuroRehabData.neuroDiagnosis ?? rawAssessment.neuroDiagnosis ?? '',
    neuroOnset: neuroRehabData.neuroOnset ?? rawAssessment.neuroOnset ?? '',
    mobilityStatus: neuroRehabData.mobilityStatus ?? rawAssessment.mobilityStatus ?? '',
    cognitiveStatus: neuroRehabData.cognitiveStatus ?? rawAssessment.cognitiveStatus ?? '',
  }

  // Convenience aliases
  const difficultiesIn = assessment.difficultiesIn
  const otherDifficulty = assessment.otherDifficulty
  const dailyLivingAffected = assessment.dailyLivingAffected
  const postureAssessment = assessment.postureAssessment
  const postureDeviations = assessment.postureDeviations
  const romStatus = assessment.romStatus
  const romRestricted = assessment.romRestricted
  const romJoints = assessment.romJoints
  const muscleStrength = assessment.muscleStrength
  const muscleWeakness = assessment.muscleWeakness
  const neurologicalSigns = assessment.neurologicalSigns
  const painTriggers = assessment.painTriggers
  const chronicRelieving = assessment.chronicRelieving
  const typeOfSport = assessment.typeOfSport
  const recurringInjuries = assessment.recurringInjuries
  const returnToSportGoals = assessment.returnToSportGoals
  const neuroDiagnosis = assessment.neuroDiagnosis
  const neuroOnset = assessment.neuroOnset
  const mobilityStatus = assessment.mobilityStatus
  const cognitiveStatus = assessment.cognitiveStatus
  const effectivePain = assessment.patientPain || patientPain || ''

  // ── Diagnosis ──────────────────────────────────────────────────────────────
  const diagnosisRaw = record.diagnosis ?? visit.diagnosis ?? {}
  let diagnosisRows = []
  if (Array.isArray(diagnosisRaw.diagnosisRows)) {
    diagnosisRows = diagnosisRaw.diagnosisRows
  } else if (diagnosisRaw.physioDiagnosis || diagnosisRaw.affectedArea || diagnosisRaw.severity) {
    diagnosisRows = [{
      physioDiagnosis: diagnosisRaw.physioDiagnosis ?? '',
      affectedArea: diagnosisRaw.affectedArea ?? '',
      severity: diagnosisRaw.severity ?? '',
      stage: diagnosisRaw.stage ?? '',
      notes: diagnosisRaw.notes ?? '',
    }]
  }

  // ── Treatment Plan ─────────────────────────────────────────────────────────
  const treatmentPlanRaw = record.treatmentPlan ?? {}
  const treatmentPlanDisplay = {
    doctorId: treatmentPlanRaw.doctorId ?? record.doctorId ?? visit.doctorId ?? '',
    doctorName: treatmentPlanRaw.doctorName ?? record.doctorName ?? visit.doctorName ?? '',
    therapistId: treatmentPlanRaw.therapistId ?? '',
    therapistName: treatmentPlanRaw.therapistName ?? '',
    manualTherapy: treatmentPlanRaw.manualTherapy ?? '',
    precautions: Array.isArray(treatmentPlanRaw.precautions) ? treatmentPlanRaw.precautions : [],
    modalitiesUsed: Array.isArray(treatmentPlanRaw.modalitiesUsed) ? treatmentPlanRaw.modalitiesUsed : [],
    patientResponse: treatmentPlanRaw.patientResponse ?? '',
  }

  // ── Therapy Sessions ────────────────────────────────────────────────────────
  const therapySessionsRaw = record.therapySessions ?? visit.therapySessions ?? []
  const overallStatus = (!Array.isArray(therapySessionsRaw) && therapySessionsRaw?.overallStatus)
    ? therapySessionsRaw.overallStatus : ''

  let sessionsList = []
  if (Array.isArray(therapySessionsRaw)) {
    sessionsList = therapySessionsRaw
  } else if (Array.isArray(therapySessionsRaw?.sessions)) {
    sessionsList = therapySessionsRaw.sessions
  }
  if (sessionsList.length === 1 && Array.isArray(sessionsList[0])) sessionsList = sessionsList[0]

  const topTherapistId = treatmentPlanRaw.therapistId ?? therapySessionsRaw?.therapistId ?? ''
  const topTherapistName = treatmentPlanRaw.therapistName ?? therapySessionsRaw?.therapistName ?? ''

  // ── Legacy Treatments ───────────────────────────────────────────────────────
  const rawSchedules = visit.treatments?.generatedData ?? {}
  const selectedTreatments = visit.treatments?.selectedTestTreatments ?? visit.treatments?.selectedTreatments ?? Object.keys(rawSchedules) ?? []
  const treatmentSchedules = Object.fromEntries(
    Object.entries(rawSchedules).map(([name, meta]) => [
      name,
      {
        reason: meta?.reason || '',
        frequency: meta?.frequency || '',
        sittings: Number(meta?.sittings) || 0,
        startDate: meta?.startDate || '',
        dates: Array.isArray(meta?.dates) ? meta.dates : [],
      },
    ])
  )
  const treatmentsArr = selectedTreatments.filter(Boolean).map(name => ({ name, reason: treatmentSchedules?.[name]?.reason || '' }))

  // ── Prescription ────────────────────────────────────────────────────────────
  const prescriptionArr = (visit.prescription?.medicines ?? []).map(med => ({
    id: med.id, name: med.name, medicineType: med.medicineType,
    dose: med.dose, duration: med.duration, remindWhen: med.remindWhen,
    others: med.others, food: med.food, note: med.note, times: med.times,
  }))

  const prescriptionPdfRaw = record.prescriptionPdf ?? visit.prescriptionPdf ?? []
  const prescriptionPdf = Array.isArray(prescriptionPdfRaw)
    ? prescriptionPdfRaw
    : prescriptionPdfRaw ? [prescriptionPdfRaw] : []

  // ── Exercise Plan ───────────────────────────────────────────────────────────
  const exercisePlanObj = record.exercisePlan ?? visit.exercisePlan ?? {}
  const homeExercises = Array.isArray(exercisePlanObj.homeExercises) ? exercisePlanObj.homeExercises
    : Array.isArray(exercisePlanObj.exercises) ? exercisePlanObj.exercises : []
  const homeAdvice = exercisePlanObj.homeAdvice ?? ''

  // ── Follow Up ───────────────────────────────────────────────────────────────
  const followUpRaw = record.followUp ?? visit.followUp ?? {}
  const followUpEntry = Array.isArray(followUpRaw)
    ? (followUpRaw[0] ?? {})
    : (typeof followUpRaw === 'object' ? followUpRaw : {})

  // ── Treatment Templates ─────────────────────────────────────────────────────
  const treatmentTemplates = Array.isArray(record.treatmentTemplates) ? record.treatmentTemplates : []

  // ── Patient Info & Booking ID ───────────────────────────────────────────────
  const patientInfo = record.patientInfo ?? visit.patientInfo ?? {}
  const bookingId = record.bookingId ?? visit.bookingId ?? visit.appointmentId
    ?? visit.item?.bookingId ?? visit.appointmentInfo?.bookingId ?? visit?.booking?.id ?? ''

  // ── Visit Title ─────────────────────────────────────────────────────────────
  const d = new Date(visit.visitDate || new Date())
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const visitNumTitle = `${visit.visitNumber || visit.visitType?.replace('_', ' ') || 'Visit'} (${day}–${month}–${year})`

  return {
    id: visit.id,
    bookingId,
    title: visitNumTitle,
    overallStatus,
    patientInfo,
    symptoms: symptomsArr,
    complaints: complaintsObj.complaints ?? '',
    complaintDetails,
    complaintDuration,
    selectedTherapy,
    selectedTherapyID,
    partImage,
    reportImages,
    parts,
    imageAttachments,
    therapyGroups,
    previousInjuries,
    currentMedications,
    allergies,
    occupation,
    insuranceProvider,
    activityLevels,
    patientPain,
    effectivePain,
    tests: testsArr,
    testsReason: investigationReason,
    investigationTestsArray,
    assessment,
    difficultiesIn,
    otherDifficulty,
    dailyLivingAffected,
    postureAssessment,
    postureDeviations,
    romStatus,
    romRestricted,
    romJoints,
    muscleStrength,
    muscleWeakness,
    neurologicalSigns,
    painTriggers,
    chronicRelieving,
    typeOfSport,
    recurringInjuries,
    returnToSportGoals,
    neuroDiagnosis,
    neuroOnset,
    mobilityStatus,
    cognitiveStatus,
    diagnosisRows,
    treatments: treatmentsArr,
    treatmentSchedules,
    treatmentPlanDisplay,
    sessionsList,
    topTherapistId,
    topTherapistName,
    prescription: prescriptionArr,
    prescriptionPdf,
    homeExercises,
    homeAdvice,
    followUpEntry,
    treatmentTemplates,
    attachments,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const VisitHistory = ({ formData, patientData, patientId, bookingId }) => {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!patientId || !bookingId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getVisitHistoryByPatientIdAndBookingId(patientId, bookingId)
        console.log('API RESPONSE:', response)

        if (response?.success && Array.isArray(response.data)) {
          const mapped = response.data.map(transformVisit)
          setVisits(mapped)
        } else {
          setError('No visit history available')
          setVisits([])
        }
      } catch (e) {
        console.error('Error:', e)
        setError('Failed to fetch visit history')
        setVisits([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patientId, bookingId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10, color: T.textMid, fontSize: '0.85rem' }}>
      <CSpinner size="sm" style={{ color: T.bgcolor }} />
      <span>Loading visit history...</span>
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 28 }}>📋</span>
      <span style={{ color: T.textMid, fontSize: '0.85rem' }}>{error}</span>
    </div>
  )
  if (!visits.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 28 }}>📋</span>
      <span style={{ color: T.textMid, fontSize: '0.85rem' }}>No visit history available</span>
    </div>
  )

  return (
    <div style={{ background: T.bgLight, minHeight: '100%', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '4px 0' }}>

      {/* Header */}
      <div style={{
        background: T.bgcolor, padding: '8px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 2px 12px rgba(27,79,138,0.18)',
        marginBottom: 16, borderBottom: `2px solid ${T.orange}`,
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(249,197,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid rgba(249,197,113,0.3)' }}>🗂️</div>
        <div>
          <div style={{ color: T.white, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>Visit History</div>
          <div style={{ fontSize: 9, color: T.orange, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2 }}>
            {visits.length} visit{visits.length !== 1 ? 's' : ''} recorded
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', maxWidth: 1100, margin: '0 auto' }}>
        {visits.map((v, idx) => (
          <div key={v.id ?? idx} style={{ marginBottom: 20 }}>
            <AccordionItem title={v.title} defaultOpen={idx === 0} badge={idx === 0 ? 'Latest' : null}>

              {/* 1. Patient Complaints (unified) */}
              <AccordionItem  icon="🩺" title="Patient Complaints">

                {/* Core complaint fields in grid */}
                <Grid cols={3}>
                  {isValid(v.complaintDetails) && <Row label="Complaint Details" value={v.complaintDetails} highlight full />}
                  {isValid(v.complaintDuration) && <Row label="Duration" value={v.complaintDuration} highlight />}
                  {isValid(v.selectedTherapy) && <Row label="Selected Therapy" value={v.selectedTherapy} highlight />}
                  {isValid(v.previousInjuries) && <Row label="Previous Injuries" value={v.previousInjuries} highlight />}
                  {isValid(v.currentMedications) && <Row label="Current Medications" value={v.currentMedications} highlight />}
                  {isValid(v.allergies) && <Row label="Allergies" value={v.allergies} />}
                  {isValid(v.occupation) && <Row label="Occupation" value={v.occupation} />}
                  {isValid(v.insuranceProvider) && <Row label="Insurance Provider" value={v.insuranceProvider} />}
                  {isValid(v.effectivePain) && <Row label="Pain Type" value={PAIN_LABEL_MAP[v.effectivePain] || v.effectivePain} highlight />}
                  {isValid(v.complaints) && <Row label="Probable Disease" value={v.complaints} highlight />}
                </Grid>

                {/* Activity Levels */}
                {Array.isArray(v.activityLevels) && v.activityLevels.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Activity Levels:
                    </span>
                    <div style={{ marginTop: 4 }}>
                      {v.activityLevels.map(lvl => (
                        <Chip key={lvl} label={lvl} color={T.bgcolor} bg={T.bgLight} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Affected Parts — fixed: check both array and string */}
                {(() => {
                  const partsArr = Array.isArray(v.parts)
                    ? v.parts.filter(Boolean)
                    : typeof v.parts === 'string' && v.parts.trim()
                      ? v.parts.split(',').map(p => p.trim()).filter(Boolean)
                      : []
                  return partsArr.length > 0 ? (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Affected Parts:
                      </span>
                      <div style={{ marginTop: 4 }}>
                        {partsArr.map(p => (
                          <Chip key={p} label={p} color={T.bgcolor} bg={T.bgLight} />
                        ))}
                      </div>
                    </div>
                  ) : null
                })()}

                {/* Doctor Observations (if stored separately from symptoms) */}
                {isValid(v.doctorObs) && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: T.orangeLight, borderRadius: 8, borderLeft: `3px solid ${T.orange}` }}>
                    <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Doctor Observations:
                    </span>
                    <div style={{ fontSize: '0.82rem', color: T.text, marginTop: 4, lineHeight: 1.6 }}>{v.doctorObs}</div>
                  </div>
                )}

                {/* Pain Assessment Image */}
                {toImageSrc(v.partImage) && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Pain Assessment Diagram
                    </div>
                    <div style={{
                      background: T.bgLight, borderRadius: 8, overflow: 'hidden',
                      display: 'flex', justifyContent: 'center',
                      border: `1px solid ${T.border}`, padding: 6, maxWidth: 320,
                    }}>
                      <img
                        src={toImageSrc(v.partImage)}
                        alt="Pain Assessment Diagram"
                        style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 6 }}
                      />
                    </div>
                  </div>
                )}

                {/* Report image attachments */}
                {v.imageAttachments?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Report Attachments
                    </div>
                    <FileUploader attachments={v.imageAttachments} accept=".pdf,image/*" />
                  </div>
                )}

              </AccordionItem>

              {/* Inner Accordions */}
              <div style={{ marginTop: 12 }}>

                {/* 4. Therapy Questionnaire */}
                {v.therapyGroups?.length > 0 && <QuestionnaireSection therapyGroups={v.therapyGroups} />}
                {/* 6. Assessment */}
                {Object.keys(v.assessment).length > 0 && (
                  <AccordionItem title="📊 Assessment">

                    {/* Subjective */}
                    {(v.assessment.chiefComplaint || v.assessment.painScale || v.assessment.painType || v.assessment.onset || v.assessment.aggravatingFactors || v.assessment.relievingFactors) && (
                      <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.bgcolor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>📋 Subjective Assessment</div>
                        <Grid cols={2}>
                          {isValid(v.assessment.chiefComplaint) && <Row label="Chief Complaint" value={v.assessment.chiefComplaint} highlight />}
                          {isValid(v.assessment.painScale) && v.assessment.painScale !== 0 && <Row label="Pain Scale" value={v.assessment.painScale} highlight />}
                          {isValid(v.assessment.painType) && <Row label="Pain Type" value={v.assessment.painType} />}
                          {isValid(v.assessment.duration) && <Row label="Duration" value={v.assessment.duration} />}
                          {isValid(v.assessment.onset) && <Row label="Onset" value={v.assessment.onset} />}
                          {isValid(v.assessment.aggravatingFactors) && <Row label="Aggravating Factors" value={v.assessment.aggravatingFactors} />}
                          {isValid(v.assessment.relievingFactors) && <Row label="Relieving Factors" value={v.assessment.relievingFactors} />}
                        </Grid>
                        {isValid(v.assessment.observations) && <Row label="Observations" value={v.assessment.observations} full />}
                      </div>
                    )}

                    {/* Functional */}
                    {(v.difficultiesIn.length > 0 || isValid(v.otherDifficulty) || isValid(v.dailyLivingAffected)) && (
                      <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🏃 Functional Assessment</div>
                        {v.difficultiesIn.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.72rem', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulties in: </span>
                            {v.difficultiesIn.map(d => <Chip key={d} label={d} color={T.bgcolor} bg={T.bgLight} />)}
                            {isValid(v.otherDifficulty) && <Chip label={`Other: ${v.otherDifficulty}`} color={T.bgcolor} bg={T.bgLight} />}
                          </div>
                        )}
                        {isValid(v.dailyLivingAffected) && <Row label="Daily Living Affected" value={v.dailyLivingAffected} full highlight />}
                      </div>
                    )}

                    {/* Physical Examination */}
                    {(v.postureAssessment.length > 0 || v.romStatus.length > 0 || v.muscleStrength.length > 0 || v.neurologicalSigns.length > 0) && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🔬 Physical Examination</div>
                        <div style={{ background: T.bgLight, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                          {[
                            { label: 'Posture Assessment', opts: ['Normal', 'Deviations'], sel: v.postureAssessment, note: v.postureDeviations },
                            { label: 'Range of Motion', opts: ['Normal', 'Restricted'], sel: v.romStatus, note: v.romRestricted },
                            { label: 'Muscle Strength', opts: ['Normal', 'Weakness in'], sel: v.muscleStrength, note: v.muscleWeakness },
                            { label: 'Neurological Signs', opts: ['Normal', 'Balance', 'Coordination', 'Sensation issues'], sel: v.neurologicalSigns, note: '' },
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

                    {/* Pain-type Specific */}
                    {v.effectivePain === 'chronicPain' && (isValid(v.painTriggers) || isValid(v.chronicRelieving)) && (
                      <div style={{ marginBottom: 12, background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.rose, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🔴 Chronic Pain Assessment</div>
                        <Grid cols={2}>
                          {isValid(v.painTriggers) && <Row label="Pain Triggers" value={v.painTriggers} highlight />}
                          {isValid(v.chronicRelieving) && <Row label="Relieving Factors" value={v.chronicRelieving} highlight />}
                        </Grid>
                      </div>
                    )}
                    {v.effectivePain === 'sportsRehab' && (isValid(v.typeOfSport) || isValid(v.recurringInjuries) || isValid(v.returnToSportGoals)) && (
                      <div style={{ marginBottom: 12, background: '#f0fff4', border: '1.5px solid #6ee7b7', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🟢 Sports Rehab Assessment</div>
                        <Grid cols={2}>
                          {isValid(v.typeOfSport) && <Row label="Type of Sport" value={v.typeOfSport} highlight />}
                          {isValid(v.recurringInjuries) && <Row label="Recurring Injuries" value={v.recurringInjuries} highlight />}
                          {isValid(v.returnToSportGoals) && <Row label="Return-to-Sport Goals" value={v.returnToSportGoals} full />}
                        </Grid>
                      </div>
                    )}
                    {v.effectivePain === 'neuroRehab' && (isValid(v.neuroDiagnosis) || isValid(v.neuroOnset) || isValid(v.mobilityStatus) || isValid(v.cognitiveStatus)) && (
                      <div style={{ marginBottom: 12, background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: T.purple, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🟣 Neuro Rehab Assessment</div>
                        <Grid cols={2}>
                          {isValid(v.neuroDiagnosis) && <Row label="Diagnosis" value={v.neuroDiagnosis} highlight />}
                          {isValid(v.neuroOnset) && <Row label="Onset" value={v.neuroOnset} highlight />}
                          {isValid(v.mobilityStatus) && <Row label="Mobility Status" value={v.mobilityStatus} />}
                          {isValid(v.cognitiveStatus) && <Row label="Cognitive / Communication" value={v.cognitiveStatus} />}
                        </Grid>
                      </div>
                    )}
                  </AccordionItem>
                )}

                {/* 7. Diagnosis */}
                {v.diagnosisRows?.length > 0 && (
                  <AccordionItem title="🔍 Diagnosis" badge={`${v.diagnosisRows.length} row(s)`}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>{['#', 'Physio Diagnosis', 'Affected Area', 'Severity', 'Stage', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {v.diagnosisRows.map((d, i) => {
                            const sevColor = { Mild: ['#e6f4ea', '#2e7d32'], Moderate: ['#fff3e0', '#e65100'], Severe: ['#fdecea', '#c62828'] }
                            const stagColor = { Acute: ['#fdecea', '#c62828'], 'Sub-acute': ['#fff8e1', '#f57f17'], Chronic: ['#e8eaf6', '#283593'] }
                            const [sBg, sFg] = sevColor[d.severity] || ['#f3f4f6', '#374151']
                            const [tBg, tFg] = stagColor[d.stage] || ['#f3f4f6', '#374151']
                            return (
                              <tr key={i}>
                                <td style={{ ...tdStyle(i), fontWeight: 700, color: T.bgcolor }}>{i + 1}</td>
                                <td style={{ ...tdStyle(i), fontWeight: 600 }}>{d.physioDiagnosis || '—'}</td>
                                <td style={tdStyle(i)}>{d.affectedArea || '—'}</td>
                                <td style={tdStyle(i)}>{d.severity ? <span style={{ background: sBg, color: sFg, borderRadius: 20, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem' }}>{d.severity}</span> : '—'}</td>
                                <td style={tdStyle(i)}>{d.stage ? <span style={{ background: tBg, color: tFg, borderRadius: 20, padding: '2px 8px', fontWeight: 700, fontSize: '0.7rem' }}>{d.stage}</span> : '—'}</td>
                                <td style={{ ...tdStyle(i), maxWidth: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{d.notes || '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </AccordionItem>
                )}

                {/* Tests / Investigation */}
                <AccordionItem title="🔬 Tests / Investigation">
                  {v.investigationTestsArray?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Label */}
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: T.textSecondary,
                        letterSpacing: 0.5
                      }}>
                        Selected Tests
                      </div>

                      {/* Chips Container */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8
                      }}>
                        {v.investigationTestsArray.map((t, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#ecfeff',
                              color: '#0f766e',
                              borderRadius: 30,
                              padding: '6px 14px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid #99f6e4',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            🔬 {t}
                          </span>
                        ))}
                      </div>

                      {/* Reason Section */}
                      {v.testsReason && (
                        <div style={{ marginTop: 4 }}>
                          <Row
                            label="Notes / Reason"
                            value={v.testsReason}
                            full
                            highlight
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      color: T.textLight,
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      padding: '6px 0'
                    }}>
                      No tests recommended
                    </div>
                  )}
                </AccordionItem>

                {/* 8. Treatment Plan */}
            <AccordionItem title="🧑‍⚕️ Treatment Plan">

  {/* ---------------- PLAN SECTION ---------------- */}
  {(isValid(v.treatmentPlanDisplay?.therapistId) ||
    isValid(v.treatmentPlanDisplay?.therapistName) ||
    isValid(v.treatmentPlanDisplay?.doctorName) ||
    isValid(v.treatmentPlanDisplay?.manualTherapy) ||
    isValid(v.treatmentPlanDisplay?.precautions)) && (
    
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>🧑‍⚕️ Plan</div>

      <Grid cols={2}>
        {isValid(v.treatmentPlanDisplay?.doctorId) && <Row label="Doctor ID" value={v.treatmentPlanDisplay.doctorId} />}
        {isValid(v.treatmentPlanDisplay?.doctorName) && <Row label="Doctor Name" value={v.treatmentPlanDisplay.doctorName} />}
        {isValid(v.treatmentPlanDisplay?.therapistId) && <Row label="Therapist ID" value={v.treatmentPlanDisplay.therapistId} />}
        {isValid(v.treatmentPlanDisplay?.therapistName) && <Row label="Therapist Name" value={v.treatmentPlanDisplay.therapistName} highlight />}
        {isValid(v.treatmentPlanDisplay?.manualTherapy) && <Row label="Manual Therapy" value={v.treatmentPlanDisplay.manualTherapy} />}
        {isValid(v.treatmentPlanDisplay?.patientResponse) && <Row label="Patient Response" value={v.treatmentPlanDisplay.patientResponse} />}
      </Grid>

      {/* Precautions */}
      {Array.isArray(v.treatmentPlanDisplay?.precautions) && v.treatmentPlanDisplay.precautions.filter(Boolean).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span style={labelStyle}>Precautions:</span>
          {v.treatmentPlanDisplay.precautions.map((p, i) => (
            <Chip key={i} label={p} color={T.rose} bg={T.roseLight} />
          ))}
        </div>
      )}

      {/* Modalities */}
      {Array.isArray(v.treatmentPlanDisplay?.modalitiesUsed) && v.treatmentPlanDisplay.modalitiesUsed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span style={labelStyle}>Modalities Used:</span>
          {v.treatmentPlanDisplay.modalitiesUsed.map((m, i) => (
            <Chip key={i} label={m} color={T.bgcolor} bg={T.bgLight} />
          ))}
        </div>
      )}
    </div>
  )}

  {/* ---------------- TREATMENTS SECTION ---------------- */}
  {v.treatments?.length > 0 && (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>💊 Treatments</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {v.treatments.map((t, i) => (
          <Chip key={i} label={t.name} color={T.bgcolor} bg={T.bgLight} />
        ))}
      </div>

      {v.treatmentSchedules &&
        Object.entries(v.treatmentSchedules).map(([name, meta]) => (
          <div key={name} style={cardStyle}>
            <div style={cardHeader}>
              <span>{name}</span>
              <span style={badgeStyle}>
                {freqLabel(meta?.frequency)} · {meta?.sittings ?? 0} sittings
              </span>
            </div>

            <div style={cardBody}>
              <Row label="Start Date" value={meta?.startDate} />

              {meta?.dates?.length > 0 && (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {['S.No', 'Date', 'Sitting'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {meta.dates.map((d, i) => (
                      <tr key={i}>
                        <td style={tdStyle(i)}>{i + 1}</td>
                        <td style={tdStyle(i)}>{d?.date ?? '—'}</td>
                        <td style={tdStyle(i)}>{d?.sitting ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {meta?.reason && (
                <div style={reasonStyle}>
                  <strong>Reason:</strong> {meta.reason}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  )}

  {/* ---------------- THERAPY SESSIONS ---------------- */}
  <div>
    <div style={{ fontWeight: 700, marginBottom: 8 }}>🏥 Therapy Sessions</div>

    {isValid(v.overallStatus) && (
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Overall Status:</span>
        <span style={statusBadge}>{v.overallStatus}</span>
      </div>
    )}

    <TherapySessionsDisplay
      sessionsList={v.sessionsList}
      therapistId={v.topTherapistId}
      therapistName={v.topTherapistName}
    />
  </div>

</AccordionItem>

            

                {/* 12. Home Plan */}
                {(v.homeExercises?.length > 0 || isValid(v.homeAdvice)) && (
                  <AccordionItem title="🏋️ Home Plan" badge={v.homeExercises?.length ? `${v.homeExercises.length} exercise(s)` : null}>
                    {v.homeExercises?.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: isValid(v.homeAdvice) ? 12 : 0 }}>
                        <table style={tableStyle}>
                          <thead>
                            <tr>{['#', 'Exercise', 'Sets', 'Reps', 'Frequency', 'Instructions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {v.homeExercises.map((ex, i) => (
                              <tr key={i}>
                                <td style={{ ...tdStyle(i), fontWeight: 700 }}>{i + 1}</td>
                                <td style={{ ...tdStyle(i), fontWeight: 600 }}>{ex.name || '—'}</td>
                                <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.sets ? <Chip label={`🔁 ${ex.sets}`} color={T.bgcolor} bg={T.bgLight} /> : '—'}</td>
                                <td style={{ ...tdStyle(i), textAlign: 'center' }}>{ex.reps ? <Chip label={`🔄 ${ex.reps}`} color={T.teal} bg={T.tealLight} /> : '—'}</td>
                                <td style={tdStyle(i)}>{ex.frequency ? <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>📆 {ex.frequency}</span> : '—'}</td>
                                <td style={{ ...tdStyle(i), maxWidth: 220 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>{ex.instructions || '—'}</div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {isValid(v.homeAdvice) && <Row label="Home Advice" value={v.homeAdvice} full highlight />}
                  </AccordionItem>
                )}

                {/* 13. Follow Up */}
                {(isValid(v.followUpEntry?.nextVisitDate) || isValid(v.followUpEntry?.reviewNotes)) && (
                  <AccordionItem title="📅 Follow Up">
                    <Grid cols={2}>
                      {isValid(v.followUpEntry.nextVisitDate) && <Row label="Next Visit Date" value={v.followUpEntry.nextVisitDate} highlight />}
                      {isValid(v.followUpEntry.reviewNotes) && <Row label="Review Notes" value={v.followUpEntry.reviewNotes} highlight />}
                    </Grid>
                  </AccordionItem>
                )}

                {/* 14. Treatment Templates */}
                {v.treatmentTemplates?.length > 0 && (
                  <AccordionItem title="📁 Treatment Templates" badge={`${v.treatmentTemplates.length} template(s)`}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>{['#', 'Condition', 'Modalities', 'Manual Therapy', 'Exercises', 'Duration', 'Frequency'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {v.treatmentTemplates.map((t, i) => (
                            <tr key={i}>
                              <td style={{ ...tdStyle(i), fontWeight: 700 }}>{i + 1}</td>
                              <td style={{ ...tdStyle(i), fontWeight: 600 }}>{t.condition || '—'}</td>
                              <td style={tdStyle(i)}>{Array.isArray(t.modalities) && t.modalities.length ? t.modalities.map(m => <Chip key={m} label={m} color={T.bgcolor} bg={T.bgLight} />) : '—'}</td>
                              <td style={tdStyle(i)}>{t.manualTherapy || '—'}</td>
                              <td style={tdStyle(i)}>{Array.isArray(t.exercises) && t.exercises.length ? t.exercises.map(e => <Chip key={e} label={e} color={T.green} bg={T.greenLight} />) : '—'}</td>
                              <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{t.duration || '—'}</td>
                              <td style={{ ...tdStyle(i), whiteSpace: 'nowrap' }}>{t.frequency || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionItem>
                )}

                {/* 15. Reports */}
                <AccordionItem title="📁 Reports">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px', background: T.bgcolor, borderBottom: `2px solid ${T.orange}`, color: T.white, fontWeight: 700, fontSize: '0.8rem' }}>📊 Reports</div>
                      <div style={{ padding: '12px 14px', background: T.white }}>
                        <ReportDetails formData={formData} patientData={patientData} show={false} />
                      </div>
                    </div>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px', background: T.bgcolor, borderBottom: `2px solid ${T.orange}`, color: T.white, fontWeight: 700, fontSize: '0.8rem' }}>📎 Previous Reports Submitted By Patient</div>
                      <div style={{ padding: '12px 14px', background: T.white }}>
                        {v.attachments.length > 0
                          ? <FileUploader attachments={v.attachments} />
                          : <span style={{ color: T.textLight, fontSize: '0.8rem', fontStyle: 'italic' }}>No previous reports available</span>}
                      </div>
                    </div>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 14px', background: T.bgcolor, borderBottom: `2px solid ${T.orange}`, color: T.white, fontWeight: 700, fontSize: '0.8rem' }}>📄 Download Prescription (PDF)</div>
                      <div style={{ padding: '12px 14px', background: T.white }}>
                        {v.prescriptionPdf.length > 0
                          ? <FileUploader attachments={v.prescriptionPdf} />
                          : <span style={{ color: T.textLight, fontSize: '0.8rem', fontStyle: 'italic' }}>No prescription available</span>}
                      </div>
                    </div>
                  </div>
                </AccordionItem>

              </div>
            </AccordionItem>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VisitHistory