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
const P      = '#1a3a5c'
const A      = '#1a5fa8'
const LIGHT  = '#f5f9ff'
const BORDER = '#d8e8f5'

/* ─── Tiny helpers ───────────────────────────────────────────────────────── */
const dash = (v) => (v && v !== 'NA' && String(v).trim() !== '' ? v : '—')

const toImageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return null
  if (raw.startsWith('http') || raw.startsWith('blob:') || raw.startsWith('/')) return raw
  if (raw.startsWith('data:')) return raw
  if (raw.startsWith('/9j/'))  return `data:image/jpeg;base64,${raw}`
  if (raw.startsWith('iVBOR')) return `data:image/png;base64,${raw}`
  if (raw.startsWith('R0lGO')) return `data:image/gif;base64,${raw}`
  return `data:image/jpeg;base64,${raw}`
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

const StatusDot = ({ status }) => {
  const map = {
    Confirmed:     ['#d1fae5', '#065f46', '#6ee7b7'],
    Completed:     ['#d1fae5', '#065f46', '#6ee7b7'],
    Pending:       ['#fef3c7', '#92400e', '#fcd34d'],
    Cancelled:     ['#fee2e2', '#991b1b', '#fecaca'],
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
    up === 'NO'  ? ['#fee2e2', '#991b1b', '#fecaca'] :
                   ['#eff6ff', '#1d4ed8', '#bfdbfe']
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
      {answer}
    </span>
  )
}

/* ─── Visit urgency ─────────────────────────────────────────────────────── */
const FOLLOWUP_STATUS_STYLE = {
  Active:     { bg: '#f0fff4', border: '#68d391', color: '#276749', icon: '🟢' },
  'On Hold':  { bg: '#fffbeb', border: '#f6ad55', color: '#7b341e', icon: '🟡' },
  Completed:  { bg: '#ebf8ff', border: '#63b3ed', color: '#2a4365', icon: '🔵' },
  Discharged: { bg: '#fff5f5', border: '#fc8181', color: '#742a2a', icon: '🔴' },
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
  return                     { label: 'Upcoming',  bg: '#f5f0ff', color: '#44337a', border: '#b794f4', icon: '🗓️' }
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const Summary = ({ onNext, sidebarWidth = 0, onSaveTemplate, patientData, formData = {}, fromPage }) => {
  const { doctorDetails, setDoctorDetails, setClinicDetails, clinicDetails, updateTemplate } = useDoctorContext()
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [saving, setSaving]     = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [pendingAction, setPendingAction]         = useState(null)
  const [clickedSaveTemplate, setClickedSaveTemplate] = useState(false)
  const navigate = useNavigate()
  const { success, error, info, warning } = useToast()
  const ACTIONS = { SAVE: 'save', SAVE_PRINT: 'savePrint' }

  const record = formData?.physiotherapyRecord ?? formData ?? {}

  /* ── Booking-level IDs ── */
  const bookingId  = record.bookingId  ?? patientData?.bookingId  ?? ''
  const clinicId   = record.clinicId   ?? patientData?.clinicId   ?? clinicDetails?.hospitalId ?? ''
  const branchId   = record.branchId   ?? patientData?.branchId   ?? ''
  const clinicName = clinicDetails?.name ?? patientData?.clinicName ?? ''
  const doctorId   = doctorDetails?.doctorId ?? patientData?.doctorId ?? ''
  const doctorName = doctorDetails?.name ?? doctorDetails?.fullName ?? patientData?.doctorName ?? ''

  /* ── patientInfo — resolve from multiple possible locations ── */
  const patientInfo   = record.patientInfo ?? {}
  const patientId     = patientInfo.patientId    ?? patientData?.patientId    ?? ''
  // ✅ patientName: check patientInfo first, then patientData (multiple field names)
  const patientName   =
    patientInfo.patientName  ??
    patientData?.patientName ??
    patientData?.name        ??
    patientData?.fullName    ??
    ''
  const patientMobile = patientInfo.mobileNumber ?? patientData?.mobileNumber ?? patientData?.patientMobileNumber ?? ''
  const patientAge    = patientInfo.age  ?? patientData?.age  ?? ''
  const patientSex    = patientInfo.sex  ?? patientData?.sex  ?? patientData?.gender ?? ''

  /* ── complaints ── */
  const complaintsObj     = record.complaints ?? record.symptoms ?? {}
  const complaintDetails  = complaintsObj.complaintDetails  ?? complaintsObj.symptomDetails ?? patientData?.problem ?? ''
  const complaintDuration = complaintsObj.duration          ?? patientData?.symptomsDuration ?? ''
  const selectedTherapy   = patientData?.subServiceName     ?? complaintsObj.selectedTherapy ?? ''
  const selectedTherapyID = patientData?.subServiceId       ?? complaintsObj.selectedTherapyID ?? ''
  const painAssessmentImage = complaintsObj.partImage ?? complaintsObj.painAssessmentImage ?? formData?.partImage ?? patientData?.partImage ?? ''
  const partImage           = complaintsObj.partImage ?? complaintsObj.painAssessmentImage ?? formData?.partImage ?? patientData?.partImage ?? ''
  const reportImages        = Array.isArray(complaintsObj.reportImages)      ? complaintsObj.reportImages
                            : Array.isArray(complaintsObj.attachmentImages) ? complaintsObj.attachmentImages
                            : []
  const therapyAnswers = complaintsObj.theraphyAnswers ?? formData?.theraphyAnswers ?? patientData?.theraphyAnswers ?? {}

  const finalComplaints = {
    complaintDetails,
    duration:          complaintDuration,
    selectedTherapy,
    selectedTherapyID,
    painAssessmentImage,
    reportImages,
    theraphyAnswers:   therapyAnswers,
  }

  const therapyGroups = Object.entries(therapyAnswers).map(([cat, qs]) => ({
    category: cat, questions: Array.isArray(qs) ? qs : [],
  }))

  const attachments = [
    ...(painAssessmentImage ? [{ url: toImageSrc(painAssessmentImage), name: 'Pain Assessment' }] : []),
    ...reportImages.map((img, i) => ({ url: toImageSrc(img), name: `Report ${i + 1}` })),
  ]

  /* ── assessment ── */
  const assessment = record.assessment ?? formData?.assessment ?? {}

  /* ── diagnosis ── */
  const diagnosisObj  = record.diagnosis ?? formData?.diagnosis ?? {}
  const diagnosisRows = Array.isArray(diagnosisObj.diagnosisRows)
    ? diagnosisObj.diagnosisRows
    : diagnosisObj.physioDiagnosis
      ? [diagnosisObj]
      : []

  /* ── therapySessions ── */
  const therapySessionsObj = record.therapySessions ?? formData?.therapySessions ?? {}
  const overallStatus      = therapySessionsObj.overallStatus ?? ''
  const sessionsList       = Array.isArray(therapySessionsObj.sessions) ? therapySessionsObj.sessions : []

  /* ── treatmentPlan ── */
  const firstSession = sessionsList[0] ?? {}
  const treatmentPlanDisplay = {
    doctorId:      doctorId,
    doctorName:    doctorName,
    therapistId:   firstSession.therapistId   ?? therapySessionsObj.therapistId   ?? '',
    therapistName: firstSession.therapistName ?? therapySessionsObj.therapistName ?? '',
    manualTherapy: firstSession.manualTherapy ?? therapySessionsObj.manualTherapy ?? '',
    precautions:   firstSession.precautions   ?? therapySessionsObj.precautions   ?? '',
  }

  /* ── exercisePlan ──
     PatientAppointmentDetails saves both `exercises` (for seed) and
     `homeExercises` (for payload). Prefer homeExercises, fall back to exercises.
  ── */
  const exercisePlanObj = record.exercisePlan ?? formData?.exercisePlan ?? {}
  const homeExercises   = Array.isArray(exercisePlanObj.homeExercises) ? exercisePlanObj.homeExercises
                        : Array.isArray(exercisePlanObj.exercises)     ? exercisePlanObj.exercises
                        : []
  const homeAdvice      = exercisePlanObj.homeAdvice ?? ''

  /* ── followUp ── */
  const followUpObj = record.followUp ?? formData?.followUp ?? {}
  const followUpEntry = Array.isArray(followUpObj)
    ? (followUpObj[0] ?? {})
    : (typeof followUpObj === 'object' ? followUpObj : {})

  const parts              = formData?.parts ?? record.symptoms?.parts ?? patientData?.parts ?? []
  const treatmentTemplates = Array.isArray(record.treatmentTemplates) ? record.treatmentTemplates : []

  /* ── Today's date helper ── */
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

  /* ── Build final payload ── */
  const buildPayload = () => {
    const firstDiag = diagnosisRows[0] ?? {}

    return {
      bookingId,
      clinicId,
      branchId,
      overallStatus: overallStatus || 'Pending',
      createdAt:     todayStr(),
      updatedAt:     '',

      patientInfo: {
        patientId,
        patientName,
        mobileNumber: patientMobile,
        age:          patientAge,
        sex:          patientSex,
      },

      complaints: {
        complaintDetails:     finalComplaints.complaintDetails,
        painAssessmentImage:  finalComplaints.painAssessmentImage,
        reportImages:         finalComplaints.reportImages,
        selectedTherapy:      finalComplaints.selectedTherapy,
        selectedTherapyID:    finalComplaints.selectedTherapyID,
        duration:             finalComplaints.duration,
        theraphyAnswers:      finalComplaints.theraphyAnswers,
      },

      assessment: {
        chiefComplaint:     assessment.chiefComplaint     ?? '',
        painScale:          assessment.painScale          ?? '',
        painType:           assessment.painType           ?? '',
        duration:           assessment.duration           ?? '',
        onset:              assessment.onset              ?? '',
        aggravatingFactors: assessment.aggravatingFactors ?? '',
        relievingFactors:   assessment.relievingFactors   ?? '',
        posture:            assessment.posture            ?? '',
        rangeOfMotion:      assessment.rangeOfMotion      ?? '',
        specialTests:       assessment.specialTests       ?? '',
        observations:       assessment.observations       ?? '',
      },

      diagnosis: {
        physioDiagnosis: firstDiag.physioDiagnosis ?? '',
        affectedArea:    firstDiag.affectedArea    ?? '',
        severity:        firstDiag.severity        ?? '',
        stage:           firstDiag.stage           ?? '',
        notes:           firstDiag.notes           ?? '',
      },

      treatmentPlan: {
        doctorId,
        doctorName,
        therapistId:   treatmentPlanDisplay.therapistId,
        therapistName: treatmentPlanDisplay.therapistName,
        manualTherapy: treatmentPlanDisplay.manualTherapy,
        precautions:   treatmentPlanDisplay.precautions,
      },

      therapySessions: sessionsList,

      exercisePlan: {
        homeAdvice,
        homeExercises,
      },

      followUp: {
        nextVisitDate: followUpEntry.nextVisitDate ?? '',
        reviewNotes:   followUpEntry.reviewNotes   ?? '',
        modifications: followUpEntry.modifications ?? '',
      },

      treatmentTemplates,
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
      const blob      = await renderPdfBlob()
      const base64    = await blobToBase64(blob)
      const safeName  = (patientName || 'Record').replace(/[^\w\-]+/g, '_')
      const payload   = buildPayload()

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

  /* ══════════════ RENDER ══════════════ */
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
            <Row label="Patient ID"      value={patientId} />
            <Row label="Booking ID"      value={bookingId} />
            <Row label="Name"            value={capitalizeEachWord(patientName)} />
            <Row label="Age / Sex"       value={patientAge ? `${patientAge} yrs / ${patientSex}` : ''} />
            <Row label="Mobile"          value={patientMobile} />
            <Row label="Clinic ID"       value={clinicId} />
            <Row label="Clinic"          value={clinicName} />
            <Row label="Branch ID"       value={branchId} />
            <Row label="Doctor"          value={doctorName} />
            <Row label="Doctor ID"       value={doctorId} />
            <Row label="Therapy Type"    value={patientData?.subServiceName} />
            <Row label="Overall Status"  value={overallStatus || 'Pending'} />
          </Grid>
        </Section>

        {/* ══ 2. COMPLAINTS & SYMPTOMS ══ */}
        <Section icon="🩺" title="Complaints & Symptoms">
          <Grid cols={2}>
            <Row label="Complaint Details" value={complaintDetails} highlight />
            <Row label="Duration"          value={complaintDuration} highlight />
            <Row label="Selected Therapy"  value={selectedTherapy} />
            <Row label="Report Images"     value={reportImages.length > 0 ? `${reportImages.length} image(s)` : 'None'} />
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

        {/* ══ 3. THERAPY QUESTIONNAIRE ══ */}
        {therapyGroups.length > 0 && (
          <Section icon="📋" title="Therapy Questionnaire">
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

        {/* ══ 4. ASSESSMENT ══ */}
        {Object.keys(assessment).length > 0 && (
          <Section icon="📊" title="Assessment">
            <Grid cols={2}>
              <Row label="Chief Complaint"     value={assessment.chiefComplaint}     highlight />
              <Row label="Pain Scale"          value={assessment.painScale}          highlight />
              <Row label="Pain Type"           value={assessment.painType} />
              <Row label="Duration"            value={assessment.duration} />
              <Row label="Onset"               value={assessment.onset} />
              <Row label="Aggravating Factors" value={assessment.aggravatingFactors} />
              <Row label="Relieving Factors"   value={assessment.relievingFactors} />
              <Row label="Posture"             value={assessment.posture} />
              <Row label="Range of Motion"     value={assessment.rangeOfMotion} />
              <Row label="Special Tests"       value={assessment.specialTests} />
            </Grid>
            {assessment.observations && <Row label="Observations" value={assessment.observations} full />}
          </Section>
        )}

        {/* ══ 5. DIAGNOSIS ══ */}
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
                    const sevColor  = { Mild: ['#e6f4ea','#2e7d32'], Moderate: ['#fff3e0','#e65100'], Severe: ['#fdecea','#c62828'] }
                    const stagColor = { Acute: ['#fdecea','#c62828'], 'Sub-acute': ['#fff8e1','#f57f17'], Chronic: ['#e8eaf6','#283593'] }
                    const [sBg, sFg] = sevColor[d.severity]  || ['#f3f4f6','#374151']
                    const [tBg, tFg] = stagColor[d.stage]    || ['#f3f4f6','#374151']
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

        {/* ══ 6. TREATMENT PLAN ══ */}
        {(treatmentPlanDisplay.therapistId || treatmentPlanDisplay.therapistName) && (
          <Section icon="🧑‍⚕️" title="Treatment Plan">
            <Grid cols={2}>
              <Row label="Doctor ID"      value={treatmentPlanDisplay.doctorId} />
              <Row label="Doctor Name"    value={treatmentPlanDisplay.doctorName} />
              <Row label="Therapist ID"   value={treatmentPlanDisplay.therapistId} />
              <Row label="Therapist Name" value={treatmentPlanDisplay.therapistName} highlight />
              <Row label="Manual Therapy" value={treatmentPlanDisplay.manualTherapy} />
              <Row label="Precautions"    value={treatmentPlanDisplay.precautions} />
            </Grid>
          </Section>
        )}

        {/* ══ 7. THERAPY SESSIONS — Video column REMOVED ══ */}
        {sessionsList.length > 0 && (
          <Section icon="🏥" title="Therapy Sessions">
            {overallStatus && (
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Status:</span>
                <StatusDot status={overallStatus} />
              </div>
            )}
            {sessionsList.map((sess, si) => (
              <div key={si} style={{ marginBottom: si < sessionsList.length - 1 ? 24 : 0 }}>
                {/* Session header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '10px 16px', background: '#f0f7ff', borderRadius: 10, border: `1px solid ${BORDER}`, alignItems: 'center' }}>
                  {sess.programName && (
                    <span style={{ background: '#dbeafe', color: A, borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {sess.serviceType === 'package' ? '📦' : '🎯'} {sess.programName}
                    </span>
                  )}
                  {sess.serviceType && (
                    <span style={{ background: sess.serviceType === 'package' ? '#fef3c7' : '#d1fae5', color: sess.serviceType === 'package' ? '#92400e' : '#065f46', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {sess.serviceType}
                    </span>
                  )}
                  {sess.therapistName && <Chip label={`👤 ${sess.therapistName}`} color={P} bg="#f0f7ff" />}
                  {sess.totalTherapyIds > 0 && <Chip label={`${sess.totalTherapyIds} therapies`} color="#065f46" bg="#d1fae5" />}
                </div>

                {/* Modalities */}
                {Array.isArray(sess.modalitiesUsed) && sess.modalitiesUsed.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 8 }}>Modalities:</span>
                    {sess.modalitiesUsed.map(m => <Chip key={m} label={m} color={A} bg="#dbeafe" />)}
                  </div>
                )}

                {/* therapyData table — NO Video column */}
                {Array.isArray(sess.therapyData) && sess.therapyData.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                          {['Therapy', 'Exercise Name', 'Session', 'Sets', 'Reps', 'Frequency', 'Notes'].map(h => (
                            <th key={h} style={{ padding: '9px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sess.therapyData.flatMap((therapy, ti) =>
                          Array.isArray(therapy.exercises) && therapy.exercises.length > 0
                            ? therapy.exercises.map((ex, ei) => (
                                <tr key={`${ti}-${ei}`} style={{ background: (ti + ei) % 2 === 0 ? LIGHT : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                                  {ei === 0 ? (
                                    <td rowSpan={therapy.exercises.length} style={{ padding: '9px 12px', fontWeight: 700, color: A, verticalAlign: 'middle', borderRight: `1px solid ${BORDER}`, background: '#f0f7ff' }}>
                                      {therapy.therapyName || '—'}
                                    </td>
                                  ) : null}
                                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{ex.name || '—'}</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center' }}>{dash(ex.session)}</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                                    {ex.sets ? <span style={{ background: '#dbeafe', color: A, borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem' }}>🔁 {ex.sets}</span> : '—'}
                                  </td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                                    {ex.repetitions ? <span style={{ background: '#dbeafe', color: A, borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem' }}>🔄 {ex.repetitions}</span> : '—'}
                                  </td>
                                  {/* ── Frequency (was video) ── */}
                                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                                    {ex.frequency
                                      ? <span style={{ background: '#f0f7ff', color: P, borderRadius: 8, padding: '2px 8px', fontWeight: 600, fontSize: '0.78rem' }}>📆 {ex.frequency}</span>
                                      : '—'}
                                  </td>
                                  <td style={{ padding: '9px 12px', maxWidth: 160 }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.notes}>{ex.notes || '—'}</div>
                                  </td>
                                </tr>
                              ))
                            : [(
                                <tr key={`${ti}-empty`} style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                                  <td style={{ padding: '9px 12px', fontWeight: 700, color: A }}>{therapy.therapyName || '—'}</td>
                                  <td colSpan={6} style={{ padding: '9px 12px', color: '#94a3b8', fontStyle: 'italic' }}>No exercises</td>
                                </tr>
                              )]
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Extra session details */}
                <Grid cols={2} style={{ marginTop: 12 }}>
                  {sess.patientResponse && <Row label="Patient Response" value={sess.patientResponse} />}
                  {sess.manualTherapy   && <Row label="Manual Therapy"   value={sess.manualTherapy} />}
                  {sess.precautions     && <Row label="Precautions"       value={sess.precautions} />}
                </Grid>
              </div>
            ))}
          </Section>
        )}

        {/* ══ 8. EXERCISE PLAN ══ */}
        {(homeExercises.length > 0 || homeAdvice) && (
          <Section icon="🏋️" title="Exercise Plan">
            {homeExercises.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: homeAdvice ? 16 : 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: P }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', color: '#fff' }}>
                      {/* ── No Video column, Frequency replaces Duration ── */}
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
                        {/* ── Frequency ── */}
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          {ex.frequency
                            ? <span style={{ background: '#f0f7ff', color: P, borderRadius: 8, padding: '2px 9px', fontWeight: 600, fontSize: '0.78rem' }}>📆 {ex.frequency}</span>
                            : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.instructions}>
                            {ex.instructions || '—'}
                          </div>
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

        {/* ══ 9. FOLLOW UP ══ */}
        {(followUpEntry.nextVisitDate || followUpEntry.reviewNotes) && (
          <Section icon="📅" title="Follow Up">
            <Grid cols={2}>
              <Row label="Next Visit Date"  value={followUpEntry.nextVisitDate} highlight />
              <Row label="Treatment Status" value={followUpEntry.treatmentStatus} />
              <Row label="Review Notes"     value={followUpEntry.reviewNotes} highlight />
              <Row label="Modifications"    value={followUpEntry.modifications} />
            </Grid>
            {followUpEntry.nextVisitDate && (() => {
              const urgency = getVisitUrgency(followUpEntry.nextVisitDate)
              const st      = FOLLOWUP_STATUS_STYLE[followUpEntry.treatmentStatus]
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
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{t.duration  || '—'}</td>
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