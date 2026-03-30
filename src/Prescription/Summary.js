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
import { color } from 'framer-motion'

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
const Section = ({ icon, title, children, accent = false }) => (
  <div style={{
    background: '#fff',
    border: `1px solid ${accent ? '#c3dafe' : BORDER}`,
    borderRadius: 14, marginBottom: 20, overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(26,90,168,0.06)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 20px',
      backgroundColor: COLORS.bgcolor,
      color: COLORS.black,
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: COLORS.black, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.03em' }}>
        {title}
      </span>
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
    borderLeft: highlight ? '3px solid #a5c4d4ff ' : 'none',
  }}>
    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
      {label}:
    </span>
    <span style={{ fontSize: '0.9rem', color: P, wordBreak: 'break-word' }}>{dash(value)}</span>
  </div>
)

const Grid = ({ children, cols = 2 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '10px 28px',
  }}>{children}</div>
)

const Chip = ({ label, color = A, bg = '#dbeafe' }) => (
  <span style={{
    background: bg, color, borderRadius: 20,
    padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700,
    border: `1px solid ${color}33`, display: 'inline-block', margin: '2px 4px 2px 0',
  }}>{label}</span>
)

const StatusDot = ({ status }) => {
  const map = {
    Confirmed: ['#d1fae5', '#065f46', '#6ee7b7'],
    Completed: ['#d1fae5', '#065f46', '#6ee7b7'],
    Pending: ['#fef3c7', '#92400e', '#fcd34d'],
    Cancelled: ['#fee2e2', '#991b1b', '#fecaca'],
  }
  const [bg, fg, border] = map[status] || ['#f3f4f6', '#374151', '#d1d5db']
  return (
    <span style={{
      background: bg, color: fg, border: `1px solid ${border}`,
      borderRadius: 20, padding: '3px 14px', fontSize: '0.8rem', fontWeight: 700,
    }}>{status}</span>
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

/* ─── Main component ─────────────────────────────────────────────────────── */
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

  /* ── Booking-level IDs ── */
  const bookingId = record.bookingId ?? patientData?.bookingId ?? ''
  const clinicId = record.clinicId ?? patientData?.clinicId ?? clinicDetails?.hospitalId ?? ''
  const branchId = record.branchId ?? patientData?.branchId ?? ''
  const clinicName = clinicDetails?.name ?? patientData?.clinicName ?? ''
  const customerId = patientData?.customerId ?? ''
  const subServiceId = patientData?.subServiceId ?? ''
  const doctorId = doctorDetails?.doctorId ?? patientData?.doctorId ?? ''

  /* ── patientInfo ── */
  const patientInfo = record.patientInfo ?? {}
  const patientId = patientInfo.patientId ?? patientData?.patientId ?? ''
  const patientName = patientInfo.name ?? patientData?.name ?? ''
  const patientMobile = patientInfo.mobileNumber ?? patientData?.mobileNumber ?? patientData?.patientMobileNumber ?? ''
  const patientAge = patientInfo.age ?? patientData?.age ?? ''
  const patientSex = patientInfo.sex ?? patientData?.sex ?? patientData?.gender ?? ''

  /* ── complaints ── */
  // ── complaints ──
  const complaintsObj = record.complaints ?? {}
  console.log("COMPLAINTS OBJECT 👉", complaintsObj)
  const complaintDetails =
    complaintsObj.complaintDetails ?? patientData?.problem ?? ''

  const complaintDuration =
    complaintsObj.duration ?? patientData?.symptomsDuration ?? ''

  const selectedTherapy = patientData?.subServiceName ?? complaintsObj.selectedTherapy ?? ''
  const selectedTherapyId = patientData?.subServiceId ?? complaintsObj.selectedTherapyID ?? ''
  console.log("COMPLAINTS selectedTherapy 👉", selectedTherapy)

  const painAssessmentImage = complaintsObj.partImage ?? complaintsObj.painAssessmentImage ?? formData?.partImage ?? patientData?.partImage ?? ''
  const painAssessmentImages = complaintsObj.painAssessmentImage
  const partImage = complaintsObj.partImage ?? complaintsObj.painAssessmentImage ?? formData?.partImage ?? patientData?.partImage ?? ''
  const reportImages = Array.isArray(complaintsObj.reportImages)
    ? complaintsObj.reportImages
    : []


  // ✅ ALWAYS USE BACKEND KEY (theraphyAnswers)
  const therapyAnswers =
    complaintsObj.theraphyAnswers ??
    formData?.theraphyAnswers ??
    patientData?.theraphyAnswers ??
    {}

  // ✅ FINAL COMPLAINTS (ONLY ONE KEY)
  const finalComplaints = {
    ...complaintsObj,
    complaintDetails,
    duration: complaintDuration,
    theraphyAnswers: therapyAnswers,
    selectedTherapy,
    selectedTherapyID: selectedTherapyId || '',
    painAssessmentImage,
    reportImages,
  }
  const therapyGroups = Object.entries(therapyAnswers).map(([cat, qs]) => ({
    category: cat, questions: Array.isArray(qs) ? qs : [],
  }))
 const attachments = [
  ...(painAssessmentImage
    ? [{
        url: toImageSrc(painAssessmentImage),
        name: 'Pain Assessment',
      }]
    : []),

  ...reportImages.map((img, i) => ({
    url: toImageSrc(img),
    name: `Report ${i + 1}`,
  })),
]

  /* ── assessment ── */
  const assessment = record.assessment ?? formData?.assessment ?? {}

  /* ── diagnosis ── */
  const diagnosis = record.diagnosis ?? formData?.diagnosis ?? {}

  /* ── treatmentPlan ── */
  const treatmentPlanRaw = record.treatmentPlan ?? {}
  const treatmentPlans = Object.keys(treatmentPlanRaw).length > 0
    ? [treatmentPlanRaw]
    : (formData?.treatmentPlans ?? [])

  /* ── therapySessions ── */
  const therapySessionsObj = record.therapySessions ?? formData?.therapySessions ?? {}
  const overallStatus = therapySessionsObj.overallStatus ?? ''
  const sessions = Array.isArray(therapySessionsObj.sessions) ? therapySessionsObj.sessions : []

  /* ── exercisePlan ── */
  const exercisePlanObj = record.exercisePlan ?? formData?.exercisePlan ?? {}
  const exercises = Array.isArray(exercisePlanObj.exercises) ? exercisePlanObj.exercises : []
  const homeAdvice = exercisePlanObj.homeAdvice ?? ''

  /* ── followUp ────────────────────────────────────────────────────────────
     TWO POSSIBLE SHAPES:
     1. API / record shape  → object:  { nextVisitDate, reviewNotes, continueTreatment, modifications }
     2. Live form shape     → array:   [{ nextVisitDate, reviewNotes, continueTreatment, modifications }, ...]
     We normalise to an array so the render is always the same.
  ──────────────────────────────────────────────────────────────────────── */
  const rawFollowUp = record.followUp ?? formData?.followUp ?? []

  // ✅ Normalise: if it's an object (API shape), wrap it in an array
  const followUpEntries = Array.isArray(rawFollowUp)
    ? rawFollowUp
    : (Object.keys(rawFollowUp).length > 0 ? [rawFollowUp] : [])

  /* ── treatmentTemplates ── */
  const treatmentTemplates = Array.isArray(record.treatmentTemplates) ? record.treatmentTemplates : []

  /* ── affected parts ── */
  const parts = formData?.parts ?? patientData?.parts ?? []

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
    await pdf(
      <PrescriptionPDF doctorData={doctorDetails} clicniData={clinicDetails} formData={formData} patientData={patientData} />
    ).toBlob()

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(typeof r.result === 'string' ? r.result.split(',')[1] : '')
    r.onerror = reject
    r.readAsDataURL(blob)
  })

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  /* ── Save ── */
  const doSave = async ({ downloadAfter = false } = {}) => {
    if (!complaintDetails?.trim()) {
      warning('"Complaint Details" is required to save.', { title: 'Warning' })
      return false
    }
    setSaving(true)
    try {
      const blob = await renderPdfBlob()
      const base64 = await blobToBase64(blob)
      const safeName = (patientName || 'Record').replace(/[^\w\-]+/g, '_')

      const payload = {
        bookingId,
        clinicId,
        branchId,

        patientInfo: {
          patientId,
          name: patientName,
          mobileNumber: patientMobile,
          age: patientAge,
          sex: patientSex,
        },

        complaints: {
          ...finalComplaints,
          therapyAnswers, // ✅ correct spelling
        },

        assessment,
        diagnosis,

        treatmentPlan: treatmentPlans.length ? treatmentPlans[0] : null,

        // ✅ FIXED (ARRAY)
        therapySessions: sessions,

        exercisePlan: exercisePlanObj,

        // ✅ FIXED (OBJECT, not array)
        followUp: followUpEntries[0] || null,
      }
      console.log("FINAL PAYLOAD 👉", JSON.stringify(payload, null, 2))

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
    // await onSaveTemplate?.()
    await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT })
    setPendingAction(null)
  }

  const skipTemplate = async () => {
    setShowTemplateModal(false)
    await doSave({ downloadAfter: pendingAction === ACTIONS.SAVE_PRINT })
    setPendingAction(null)
  }

  /* ══════════════ RENDER ══════════════ */
  return (
    <div style={{ background: LIGHT, minHeight: '100vh', paddingBottom: 100, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{
        backgroundColor: COLORS.bgcolor,
        padding: '16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(26,90,168,0.2)', marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.black, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            Review Before Saving
          </div>
          <div style={{ color: COLORS.black, fontSize: 18, fontWeight: 700 }}>Physiotherapy Summary</div>
        </div>
        {patientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              backgroundColor: "#fff", borderRadius: 24, padding: '6px 16px',
              color: COLORS.black, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              {capitalizeEachWord(patientName)} · {patientAge}yr {patientSex?.charAt(0)}
            </div>
            <StatusDot status={overallStatus || patientData?.status} />
          </div>
        )}
      </div>

      <CContainer fluid style={{ maxWidth: 1100, padding: '0 20px' }}>

        {/* ══ 1. PATIENT & BOOKING INFO ══ */}
        <Section icon="👤" title="Patient & Booking Information" style={{ backgroundColor: COLORS.bgcolor, color: COLORS.black }}>
          <Grid cols={3}>
            <Row label="Patient ID" value={patientId} />
            <Row label="Booking ID" value={bookingId} />
            <Row label="Name" value={capitalizeEachWord(patientName)} />
            <Row label="Age / Sex" value={patientAge ? `${patientAge} yrs / ${patientSex}` : ''} />
            <Row label="Mobile" value={patientMobile} />
            <Row label="Clinic ID" value={clinicId} />
            <Row label="Clinic" value={clinicName} />
            <Row label="Branch ID" value={branchId} />
            <Row label="Doctor" value={treatmentPlanRaw.doctorName ?? patientData?.doctorName} />
            <Row label="Doctor ID" value={treatmentPlanRaw.doctorId ?? doctorId} />
            <Row label="Therapy Type" value={patientData?.subServiceName} />
            {/* <Row label="Sub Service" value={patientData?.subServiceName} /> */}
            <Row label="Overall Status" value={overallStatus ?? 'Pending'} />

          </Grid>
        </Section>

        {/* ══ 2. COMPLAINTS & SYMPTOMS ══ */}
        <Section icon="🩺" title="Complaints & Symptoms">
          <Grid cols={2}>
            <Row label="Complaint Details" value={complaintDetails} highlight />
            <Row label="Duration" value={complaintDuration} highlight />
            {/* <Row label="Pain Assessment Image" value={painAssessmentImages || 'None'} /> */}
            <Row label="Report Images" value={reportImages.length > 0 ? `${reportImages.length} image(s)` : 'None'} />
          </Grid>
          {parts.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Affected Parts:{' '}
              </span>
              {parts.map(p => <Chip key={p} label={p} color="#5b21b6" bg="#ede9fe" />)}
            </div>
          )}

          {/* Body Part Diagram */}
          {toImageSrc(partImage) && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontWeight: 700, fontSize: '0.8rem', color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
              }}>
                Body Part Diagram
              </div>
              <div style={{
                background: '#f0f7ff', borderRadius: 10, overflow: 'hidden',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                border: `1px solid ${BORDER}`, padding: 8, maxWidth: 360,
              }}>
                <img
                  src={toImageSrc(partImage)}
                  alt="Body Part Diagram"
                  style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', display: 'block', borderRadius: 8 }}
                />
              </div>
            </div>
          )}
          {attachments.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Attachments
              </div>
              <FileUploader attachments={attachments} accept=".pdf,image/*" />
            </div>
          )}
        </Section>
    {/* ══ 5. THERAPY QUESTIONNAIRE ══ */}
        {therapyGroups.length > 0 && (
          <Section icon="📋" title="Therapy Questionnaire">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {therapyGroups.map(({ category, questions }) => (
                <div key={category} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  <div style={{
                    background: 'linear-gradient(90deg,#f0f7ff,#e8f0fe)',
                    padding: '7px 14px', fontWeight: 700, fontSize: '0.78rem',
                    color: A, textTransform: 'capitalize', letterSpacing: '0.06em',
                    borderBottom: `1px solid ${BORDER}`,
                  }}>{category}</div>
                  {questions.map((q, i) => (
                    <div key={q.questionId ?? i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 14px', background: i % 2 === 0 ? LIGHT : '#fff',
                      borderBottom: i < questions.length - 1 ? `1px solid #eef3fa` : 'none',
                    }}>
                      <span style={{ fontSize: '0.85rem', color: P, flex: 1, marginRight: 12 }}>
                        {q.question ?? `Question ${q.questionId}`}
                      </span>
                      <AnswerBadge answer={q.answer} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}
        {/* ══ 3. ASSESSMENT ══ */}
        {Object.keys(assessment).length > 0 && (
          <Section icon="📊" title="Assessment">
            <Grid cols={2}>
              <Row label="Chief Complaint" value={assessment.chiefComplaint} highlight />
              <Row label="Pain Scale" value={assessment.painScale} highlight />
              <Row label="Pain Type" value={assessment.painType} />
              <Row label="Duration" value={assessment.duration} />
              <Row label="Onset" value={assessment.onset} />
              <Row label="Aggravating Factors" value={assessment.aggravatingFactors} />
              <Row label="Relieving Factors" value={assessment.relievingFactors} />
              <Row label="Posture" value={assessment.posture} />
              <Row label="Range of Motion" value={assessment.rangeOfMotion} />
              <Row label="Special Tests" value={assessment.specialTests} />
            </Grid>
            {assessment.observations && (
              <Row label="Observations" value={assessment.observations} full />
            )}
          </Section>
        )}

        {/* ══ 4. DIAGNOSIS ══ */}
        {Object.keys(diagnosis).length > 0 && (
          <Section icon="🔍" title="Diagnosis">
            <Grid cols={2}>
              <Row label="Physio Diagnosis" value={diagnosis.physioDiagnosis} highlight />
              <Row label="Affected Area" value={diagnosis.affectedArea} highlight />
              <Row label="Severity" value={diagnosis.severity} />
              <Row label="Stage" value={diagnosis.stage} />
            </Grid>
            {diagnosis.notes && <Row label="Notes" value={diagnosis.notes} full />}
          </Section>
        )}

    

        {/* ══ 6. TREATMENT PLAN ══ */}
        {treatmentPlans.length > 0 && (
          <Section icon="🧑‍⚕️" title="Treatment Plan">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                    {['#',  'Modalities', 'Manual Therapy', 'Duration', 'Frequency', 'Sessions', 'Precautions'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {treatmentPlans.map((tp, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '9px 12px', fontWeight: 700 }}>{i + 1}</td>
             
                      <td style={{ padding: '9px 12px', maxWidth: 180 }}>
                        {Array.isArray(tp.modalities) && tp.modalities.length > 0
                          ? tp.modalities.map(m => <Chip key={m} label={m} color={A} bg="#dbeafe" />)
                          : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{tp.manualTherapy || '—'}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{tp.sessionDuration || '—'}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{tp.frequency || '—'}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>{tp.totalSessions || '—'}</td>
                      <td style={{ padding: '9px 12px', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tp.precautions}>
                          {tp.precautions || '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ══ 7. THERAPY SESSIONS ══ */}
        {sessions.length > 0 && (
          <Section icon="🏥" title="Therapy Sessions">
            {overallStatus && (
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Overall Status:
                </span>
                <StatusDot status={overallStatus} />
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                    {['#', 'Date', 'Status', 'Modalities Used', 'Exercises Done', 'Patient Response'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '9px 12px', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{s.sessionDate || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <Chip
                          label={s.status || 'Pending'}
                          color={s.status === 'Completed' ? '#065f46' : s.status === 'Cancelled' ? '#991b1b' : '#92400e'}
                          bg={s.status === 'Completed' ? '#d1fae5' : s.status === 'Cancelled' ? '#fee2e2' : '#fef3c7'}
                        />
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {Array.isArray(s.modalitiesUsed) && s.modalitiesUsed.length > 0
                          ? s.modalitiesUsed.map(m => <Chip key={m} label={m} color={A} bg="#dbeafe" />)
                          : '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>{s.exercisesDone || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>{s.patientResponse || '—'}</td>
                   
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ══ 8. EXERCISE PLAN ══ */}
        {(exercises.length > 0 || homeAdvice) && (
          <Section icon="🏋️" title="Exercise Plan">
            {exercises.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: homeAdvice ? 16 : 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Exercise', 'Sets', 'Reps', 'Duration', 'Instructions', 'Video'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((ex, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600 }}>{ex.name || '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>{ex.sets || '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>{ex.reps || '—'}</td>
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{ex.duration || '—'}</td>
                        <td style={{ padding: '9px 12px', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>
                            {ex.instructions || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {ex.videoUrl
                            ? <a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{ color: A, fontWeight: 600, fontSize: '0.78rem' }}>▶ Watch</a>
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

        {/* ══ 9. FOLLOW UP ══
            ✅ FIXED: followUpEntries is always an array now (normalised above).
            Renders a table if multiple entries, or a simple grid for a single entry.
        ══ */}
        {followUpEntries.length > 0 && (
          <Section icon="📅" title="Follow Up">
            {followUpEntries.length === 1 ? (
              /* Single entry → clean grid layout */
              <Grid cols={2}>
                <Row label="Next Visit Date" value={followUpEntries[0].nextVisitDate ?? followUpEntries[0].nextFollowUpDate} highlight />
                <Row label="Continue Treatment" value={followUpEntries[0].continueTreatment} highlight />
                <Row label="Review Notes" value={followUpEntries[0].reviewNotes ?? followUpEntries[0].followUpNote} />
                <Row label="Modifications" value={followUpEntries[0].modifications} />
              </Grid>
            ) : (
              /* Multiple entries → table */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {['#', 'Next Visit Date', 'Continue Treatment', 'Review Notes', 'Modifications'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {followUpEntries.map((fu, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{fu.nextVisitDate ?? fu.nextFollowUpDate ?? '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          {fu.continueTreatment
                            ? <Chip
                              label={fu.continueTreatment}
                              color={fu.continueTreatment === 'Yes' ? '#065f46' : '#991b1b'}
                              bg={fu.continueTreatment === 'Yes' ? '#d1fae5' : '#fee2e2'}
                            />
                            : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 240 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fu.reviewNotes ?? fu.followUpNote}>
                            {fu.reviewNotes ?? fu.followUpNote ?? '—'}
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fu.modifications}>
                            {fu.modifications ?? '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}

        {/* ══ 10. TREATMENT TEMPLATES ══ */}
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
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: sidebarWidth ? `${sidebarWidth}px` : 0,
          width: sidebarWidth
            ? `calc(100vw - ${sidebarWidth}px)`
            : '100vw',
          background: '#a5c4d4ff', // ✅ light bg
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          zIndex: 999,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        }}
      >
        {/* Left Side - Template */}
        <Button


          customColor="#ffffff" // ✅ white button bg
          color="#7e3a93"       // ✅ purple text

          style={{
            borderRadius: '20px',
            fontWeight: 600,
            padding: '6px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
          onClick={() => {
            setClickedSaveTemplate(true)
            onSaveTemplate?.()
            info('Template saved!', { title: 'Template' })
          }}
        >
          {!updateTemplate ? '💾 Save as Template' : '🔄 Update Template'}
        </Button>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>

          {saving && (
            <CSpinner size="sm" style={{ color: '#7e3a93' }} /> // ✅ visible on light bg
          )}

          {/* Save Button - Primary */}
          <Button
            customColor="#ffffff" // ✅ white button bg
            color="#7e3a93"       // ✅ purple text

            style={{
              borderRadius: '20px',
              fontWeight: 600,
              padding: '6px 18px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
            onClick={() => {
              setPendingAction(ACTIONS.SAVE)
              clickedSaveTemplate
                ? doSave()
                : setShowTemplateModal(true)
            }}
            disabled={saving}
          >
            ✅ Save
          </Button>

          {/* Save & Download - Secondary */}
          <Button
            customColor="#ffffff" // ✅ white button bg
            color="#7e3a93"       // ✅ purple text

            style={{
              borderRadius: '20px',
              fontWeight: 600,
              padding: '6px 18px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
            onClick={() => {
              setPendingAction(ACTIONS.SAVE_PRINT)
              clickedSaveTemplate
                ? doSave({ downloadAfter: true })
                : setShowTemplateModal(true)
            }}
            disabled={saving}
          >
            📄 Save & Download PDF
          </Button>
        </div>
      </div>

      {/* ══ TEMPLATE MODAL ══ */}
      {showTemplateModal && !clickedSaveTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(26,58,92,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 32px',
            maxWidth: 420, width: '90%',
            boxShadow: '0 8px 40px rgba(26,90,168,0.2)',
            border: `1px solid ${BORDER}`,
          }}>
            <button
              onClick={() => setShowTemplateModal(false)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
            >✕</button>
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>📋</div>
            <h6 style={{ margin: '0 0 8px', color: P, fontWeight: 700, textAlign: 'center' }}>Save as Template?</h6>
            <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', marginBottom: 20 }}>
              Reuse this layout later for faster entry.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={skipTemplate}
                style={{
                  padding: '9px 22px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${BORDER}`, background: LIGHT,
                  color: P, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                }}
              >No, just save</button>
              <button
                onClick={confirmSaveAsTemplate}
                style={{
                  padding: '9px 22px', borderRadius: 8, cursor: 'pointer',
                  border: 'none', background: `linear-gradient(135deg,${P},${A})`,
                  color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
                }}
              >Yes, save template</button>
            </div>
          </div>
        </div>
      )}

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default Summary