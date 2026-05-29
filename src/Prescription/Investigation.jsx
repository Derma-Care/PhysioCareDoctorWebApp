import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer, CAlert } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import CreatableSelect from 'react-select/creatable'
import { addLabTest, getLabTests, updateAppointmentBasedOnBookingId, SavePatientPrescription } from '../../src/Auth/Auth'
import { COLORS } from '../Themes'
import { useDoctorContext } from '../Context/DoctorContext'

/* ─── Styles ──────────────────────────────────────────────────────────────── */
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
  fontFamily: 'inherit',
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
}

const gridTwo = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px 28px',
  marginBottom: 16,
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const CardHeader = ({ emoji, title }) => (
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
      fontSize: 17,
      boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
    }}>{emoji}</div>
    <h5 style={{
      margin: 0,
      color: '#1B4F8A',
      fontWeight: 700,
      fontSize: '1.05rem',
    }}>{title}</h5>
  </div>
)

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const Investigation = ({ seed = {}, onNext, setFormData, formData }) => {
  const [selectedTests, setSelectedTests] = useState(seed.selectedTests ?? [])
  const [selectedTestOption, setSelectedTestOption] = useState(null)
  const [notes, setNotes] = useState(seed.notes ?? '')
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [availableTests, setAvailableTests] = useState([])
  const [sending, setSending] = useState(false)

  const seedRef = useRef(null)

  const { patientData, clinicDetails, doctorDetails } = useDoctorContext()

  // ── Seed sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (seed === seedRef.current) return
    seedRef.current = seed
    if (!seed || (!seed.selectedTests && !seed.notes)) return
    setSelectedTests(seed.selectedTests ?? [])
    setNotes(seed.notes ?? '')
  }, [seed])

  // ── Fetch available tests ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const tests = await getLabTests()
        if (Array.isArray(tests)) setAvailableTests(tests)
      } catch (err) {
        console.error('Error fetching lab tests:', err)
      }
    }
    fetchTests()
  }, [])

  // ── Snackbar helper ────────────────────────────────────────────────────
  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ show: true, message, type })
    setTimeout(() => setSnackbar({ show: false, message: '', type: '' }), 3000)
  }

  // ── Chip helpers ───────────────────────────────────────────────────────
  const handleRemoveTest = (item) =>
    setSelectedTests((prev) => prev.filter((t) => t !== item))

  const clearAllTests = () => {
    setSelectedTests([])
    setSelectedTestOption(null)
  }

  const buildPhysioRecordPayload = () => {
    const record = formData ?? {}
    
    // Top-level IDs
    const bookingId = record.bookingId || patientData?.bookingId || ''
    const clinicId = record.clinicId || patientData?.clinicId || clinicDetails?.hospitalId || ''
    const branchId = record.branchId || patientData?.branchId || ''
    const doctorId = doctorDetails?.doctorId || patientData?.doctorId || ''
    const doctorName = doctorDetails?.name || doctorDetails?.fullName || patientData?.doctorName || ''

    // Patient Info
    const patientId = record.patientInfo?.patientId || patientData?.patientId || ''
    const patientName = record.patientInfo?.patientName || patientData?.patientName || patientData?.name || patientData?.fullName || ''
    const patientMobile = record.patientInfo?.mobileNumber || 
                         patientData?.patientMobileNumber || 
                         patientData?.mobileNumber || 
                         patientData?.contactNumber || 
                         patientData?.phone || 
                         patientData?.phoneNumber || ''
    const patientAge = record.patientInfo?.age || patientData?.age || ''
    const patientSex = record.patientInfo?.sex || patientData?.sex || patientData?.gender || ''

    // Complaints / Symptoms
    const comp = record.complaints || record.symptoms || {}
    
    const complaintDetails = comp.complaintDetails || comp.symptomDetails || patientData?.problem || ''
    const complaintDuration = comp.duration || patientData?.symptomsDuration || ''
    const selectedTherapy = comp.selectedTherapy || patientData?.subServiceName || ''
    const selectedTherapyID = comp.selectedTherapyId || comp.selectedTherapyID || patientData?.subServiceId || ''
    const partImage = comp.painAssessmentImage || comp.partImage || ''
    
    const reportImages = (() => {
      const apiImgs = comp.reportImages
      const intImgs = comp.attachmentImages
      if (Array.isArray(apiImgs) && apiImgs.length) return apiImgs
      if (Array.isArray(intImgs) && intImgs.length) return intImgs
      return []
    })()

    const previousInjuries = comp.previousInjuries || record.previousInjuries || patientData?.previousInjuries || ''
    const currentMedications = comp.currentMedications || record.currentMedications || patientData?.currentMedications || ''
    const allergies = comp.allergies || record.allergies || patientData?.allergies || ''
    const occupation = comp.occupation || record.occupation || patientData?.occupation || ''
    const insuranceProvider = comp.insuranceProvider || record.insuranceProvider || patientData?.insuranceProvider || ''
    
    const activityLevels = Array.isArray(comp.activityLevels) ? comp.activityLevels : (Array.isArray(record.activityLevels) ? record.activityLevels : [])
    
    const effectivePain = comp.patientPain || comp.reasonforVisit || record.patientPain || patientData?.patientPain || ''

    // Flat therapyAnswers
    let flatTherapyAnswers = []
    const rawApiAnswers = comp.therapyAnswers
    const rawInternalAnswers = comp.theraphyAnswers ?? comp.therapyAnswers
    if (Array.isArray(rawApiAnswers)) {
      flatTherapyAnswers = rawApiAnswers.map(q => ({
        questionKey: q.questionKey ?? '',
        questionId: String(q.questionId ?? ''),
        question: q.question ?? '',
        answer: q.answer ?? '',
      }))
    } else if (rawInternalAnswers && typeof rawInternalAnswers === 'object') {
      flatTherapyAnswers = Object.values(rawInternalAnswers)
        .flat()
        .map(q => ({
          questionKey: q.questionKey ?? '',
          questionId: String(q.questionId ?? ''),
          question: q.question ?? '',
          answer: q.answer ?? '',
        }))
    }

    // Assessment
    const assRaw = record.assessment || {}
    const subjective = assRaw.subjectiveAssessment || assRaw
    const functional = assRaw.functionalAssessment || assRaw
    const physical = assRaw.physicalExamination || assRaw

    const assessment = {
      chiefComplaint: subjective.chiefComplaint ?? assRaw.chiefComplaint ?? '',
      painScale: Number(subjective.painScale ?? assRaw.painScale) || 0,
      painType: subjective.painType ?? assRaw.painType ?? '',
      duration: subjective.duration ?? assRaw.duration ?? '',
      onset: subjective.onset ?? assRaw.onset ?? '',
      aggravatingFactors: subjective.aggravatingFactors ?? assRaw.aggravatingFactors ?? '',
      relievingFactors: subjective.relievingFactors ?? assRaw.relievingFactors ?? '',
      observations: subjective.observations ?? assRaw.observations ?? '',
      difficultiesIn: Array.isArray(functional.difficultiesIn) ? functional.difficultiesIn : (Array.isArray(assRaw.difficultiesIn) ? assRaw.difficultiesIn : []),
      postureAssessment: Array.isArray(physical.postureAssessment) ? physical.postureAssessment : (Array.isArray(assRaw.postureAssessment) ? assRaw.postureAssessment : []),
      rangeOfMotion: Array.isArray(physical.rangeOfMotion) ? physical.rangeOfMotion : (Array.isArray(physical.romStatus) ? physical.romStatus : (Array.isArray(assRaw.romStatus) ? assRaw.romStatus : [])),
      muscleStrength: Array.isArray(physical.muscleStrength) ? physical.muscleStrength : (Array.isArray(assRaw.muscleStrength) ? assRaw.muscleStrength : []),
      neurologicalSigns: Array.isArray(physical.neurologicalSigns) ? physical.neurologicalSigns : (Array.isArray(assRaw.neurologicalSigns) ? assRaw.neurologicalSigns : []),
      painTriggers: assRaw.chronicPainPatients?.painDuration || assRaw.painTriggers || '',
      chronicRelieving: assRaw.chronicRelieving || '',
      typeOfSport: assRaw.sportsRehabPatients?.sportName || assRaw.typeOfSport || '',
      recurringInjuries: assRaw.sportsRehabPatients?.injuryType || assRaw.recurringInjuries || '',
      neuroDiagnosis: assRaw.neuroRehabPatients?.balanceIssue ? 'Balance Issues' : (assRaw.neuroDiagnosis || ''),
      mobilityStatus: assRaw.neuroRehabPatients?.walkingSupport || assRaw.mobilityStatus || '',
    }

    // Diagnosis
    const diag = record.diagnosis || {}
    let firstDiag = {}
    if (Array.isArray(diag.diagnosisRows) && diag.diagnosisRows.length) {
      firstDiag = diag.diagnosisRows[0] || {}
    } else {
      firstDiag = diag
    }

    return {
      therapistRecordId: record.therapistRecordId || "TR001",
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
        complaintDetails: complaintDetails || '',
        painAssessmentImage: partImage || '',
        reportImages: reportImages || [],
        selectedTherapy: selectedTherapy || '',
        selectedTherapyId: selectedTherapyID || '',
        duration: complaintDuration || '',
        previousInjuries: previousInjuries || '',
        currentMedications: currentMedications || '',
        allergies: allergies || '',
        occupation: occupation || '',
        activityLevels: activityLevels || [],
        patientPain: effectivePain || '',
        therapyAnswers: flatTherapyAnswers,
      },
      investigation: {
        tests: selectedTests,
        reason: notes || '',
      },
      assessment: {
        subjectiveAssessment: {
          chiefComplaint: assessment.chiefComplaint,
          painScale: assessment.painScale,
          painType: assessment.painType,
          duration: assessment.duration,
          onset: assessment.onset,
          aggravatingFactors: assessment.aggravatingFactors,
          relievingFactors: assessment.relievingFactors,
          observations: assessment.observations,
        },
        functionalAssessment: {
          difficultiesIn: assessment.difficultiesIn
        },
        physicalExamination: {
          postureAssessment: assessment.postureAssessment,
          rangeOfMotion: assessment.rangeOfMotion,
          muscleStrength: assessment.muscleStrength,
          neurologicalSigns: assessment.neurologicalSigns
        },
        chronicPainPatients: effectivePain === 'chronicPain' ? {
          painDuration: assessment.painTriggers,
          sleepDisturbance: !!(assessment.chronicRelieving && assessment.chronicRelieving.toLowerCase().includes('yes'))
        } : null,
        sportsRehabPatients: effectivePain === 'sportsRehab' ? {
          sportName: assessment.typeOfSport,
          injuryType: assessment.recurringInjuries
        } : null,
        neuroRehabPatients: effectivePain === 'neuroRehab' ? {
          balanceIssue: !!(assessment.neuroDiagnosis && assessment.neuroDiagnosis.toLowerCase().includes('balance')),
          walkingSupport: assessment.mobilityStatus
        } : null,
        redFlags: {
          trauma: (assRaw.redFlags || record.redFlags)?.trauma ?? false,
          weightLoss: (assRaw.redFlags || record.redFlags)?.weightLoss ?? false,
          fever: (assRaw.redFlags || record.redFlags)?.fever ?? false,
          cancer: (assRaw.redFlags || record.redFlags)?.cancer ?? false,
          nightPain: (assRaw.redFlags || record.redFlags)?.nightPain ?? false,
          swallowing: (assRaw.redFlags || record.redFlags)?.swallowing ?? false,
        },
        radiationNeuro: {
          radiating: (assRaw.radiationNeuro || record.radiationNeuro)?.radiating ?? false,
          numbness: (assRaw.radiationNeuro || record.radiationNeuro)?.numbness ?? false,
          weakness: (assRaw.radiationNeuro || record.radiationNeuro)?.weakness ?? false,
          gripDifficulty: (assRaw.radiationNeuro || record.radiationNeuro)?.gripDifficulty ?? false,
        },
        psychosocial: {
          stressLevel: (assRaw.psychosocial || record.psychosocial)?.stressLevel ?? 'Low',
          workSatisfaction: (assRaw.psychosocial || record.psychosocial)?.workSatisfaction ?? false,
          fearOfMovement: (assRaw.psychosocial || record.psychosocial)?.fearOfMovement ?? false,
        },
        specialSymptoms: {
          headache: (assRaw.specialSymptoms || record.specialSymptoms)?.headache ?? false,
          dizziness: (assRaw.specialSymptoms || record.specialSymptoms)?.dizziness ?? false,
        },
      },
      diagnosis: {
        physioDiagnosis: firstDiag.physioDiagnosis ?? '',
        differentialDiagnosis: firstDiag.differentialDiagnosis ?? '',
        affectedArea: firstDiag.affectedArea ?? '',
        severity: firstDiag.severity ?? '',
        stage: firstDiag.stage ?? '',
        notes: firstDiag.notes ?? '',
      },
      treatmentPlan: {
        doctorId,
        doctorName,
        therapistId: '',
        therapistName: '',
        manualTherapy: '',
        modalitiesUsed: [],
        patientResponse: '',
        precautions: [],
      },
      therapySessions: [],
      exercisePlan: {
        homeAdvice: '',
        homeExercises: [],
      },
      followUp: {
        nextVisitDate: '',
        reviewNotes: '',
        modifications: '',
      },
      prescriptionPdf: '',
    }
  }

  // ── updateStatus helper ────────────────────────────────────────────────
  const updateStatus = (status) => {
    const bookingId = patientData?.bookingId
    if (!bookingId) return Promise.resolve()
    return updateAppointmentBasedOnBookingId({ data: { bookingId, status } })
  }

  const handleNext = () => {
    const payload = { investigation: { selectedTests, notes } }
    setFormData?.((prev) => ({ ...prev, investigation: { selectedTests, notes } }))
    const nextStatus = selectedTests.length > 0 ? 'Due for Investigation' : 'On-Going'
    updateStatus(nextStatus)
      .then(() => onNext?.(payload))
      .catch(err => {
        console.error('Failed to update appointment status:', err)
        onNext?.(payload) // still navigate even if status update fails
      })
  }

  // ── handleSend ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (selectedTests.length === 0) {
      showSnackbar('Please select at least one test before sending.', 'error')
      return
    }

    setSending(true)
    try {
      // ── API call to SavePatientPrescription ──
      const payloadRecord = buildPhysioRecordPayload()
      console.log('Sending investigation payload to create record:', payloadRecord)
      await SavePatientPrescription(payloadRecord)

      // MOCK: simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 900))

      showSnackbar('Investigation sent to Lab Technician successfully! ✉️', 'success')
      const payload = { investigation: { selectedTests, notes } }
      setFormData?.((prev) => ({ ...prev, investigation: { selectedTests, notes } }))
      await updateStatus('Due for Investigation')
      onNext?.(payload)
    } catch (err) {
      console.error('Failed to send investigation:', err)
      showSnackbar('Failed to send. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  // ── handlePrint ────────────────────────────────────────────────────────
  const handlePrint = async () => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const testsHtml = selectedTests.length > 0
      ? selectedTests.map(t => `
          <div style="display:inline-flex;align-items:center;background:#dbeafe;border:1px solid #b6cfe8;
            border-radius:20px;padding:4px 12px;font-size:13px;color:#1a3a5c;font-weight:600;margin:3px;">
            ${escapeHtml(t)}
          </div>`).join('')
      : '<span style="color:#8aaac8;font-size:13px;">No tests selected.</span>'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Investigation – ${escapeHtml(patientData?.name ?? '')}</title>
<style>
:root{--ink:#0f172a;--muted:#6b7280;--line:#e5e7eb;--accent:#1B4F8A;--bg:#fff;}
*{box-sizing:border-box;}html,body{margin:0;padding:0;}
body{font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial;color:var(--ink);background:var(--bg);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:A4;margin:12mm;}
.page{padding:20px 24px;border:1px solid var(--line);border-radius:10px;}
header{display:flex;align-items:center;gap:16px;padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid var(--line);}
.logo{width:110px;height:72px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.logo img{max-width:100%;max-height:100%;object-fit:contain;}
.clinic-name{font-size:20px;font-weight:700;}.clinic-meta{font-size:13px;color:var(--muted);margin-top:4px;}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:16px;}
.kv{display:flex;flex-direction:column;margin-bottom:10px;}.kv .label{font-size:12px;color:var(--muted);}.kv .value{font-size:14px;font-weight:600;padding-top:2px;}
.section-card{border:1px solid var(--line);border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;}
.section-title{font-size:14px;font-weight:700;margin:0 0 12px 0;color:#1B4F8A;padding-bottom:8px;border-bottom:1px solid var(--line);}
.notes-box{background:#f5f9ff;border:1px solid #b6cfe8;border-radius:8px;padding:10px 14px;font-size:14px;line-height:1.6;color:#1a3a5c;white-space:pre-wrap;}
.footer{margin-top:22px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12px;color:var(--muted);}
@media print{.no-print{display:none!important;}.page{border:none;padding:0;}}
</style></head><body><div class="page">

<header>
  <div class="logo">${clinicDetails?.hospitalLogo ? `<img src="data:image/png;base64,${clinicDetails.hospitalLogo}" alt="Logo"/>` : ''}</div>
  <div>
    <div class="clinic-name">${escapeHtml(clinicDetails?.name ?? '')}</div>
    <div class="clinic-meta">${escapeHtml(clinicDetails?.address ?? '')} • ${escapeHtml(clinicDetails?.contactNumber ?? '')}</div>
  </div>
</header>

<div class="meta-grid">
  <div class="kv"><div class="label">Patient Name</div><div class="value">${escapeHtml(patientData?.name ?? '-')}</div></div>
  <div class="kv"><div class="label">Date</div><div class="value">${escapeHtml(dateStr)}</div></div>
  <div class="kv"><div class="label">Doctor</div><div class="value">${escapeHtml(doctorDetails?.doctorName ?? '-')}</div></div>
  <div class="kv"><div class="label">Licence No</div><div class="value">${escapeHtml(doctorDetails?.doctorLicence ?? '-')}</div></div>
</div>

<div class="section-card">
  <div class="section-title">🔬 Recommended Investigations</div>
  <div style="margin-bottom:${notes ? '16px' : '0'};display:flex;flex-wrap:wrap;gap:4px;">
    ${testsHtml}
  </div>
  ${notes ? `
  <div style="margin-top:12px;">
    <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Notes / Reason for Recommendation</div>
    <div class="notes-box">${escapeHtml(notes)}</div>
  </div>` : ''}
</div>

<div class="footer">
  <div>Generated on ${escapeHtml(dateStr)}</div>
  <div>${escapeHtml(clinicDetails?.name ?? '')}</div>
</div>

<div style="text-align:right;margin-top:40px;">
  ${doctorDetails?.doctorSignature ? `<img src="${doctorDetails.doctorSignature}" alt="Signature" style="max-height:60px;"/>` : ''}
  <div style="font-size:12px;color:#374151;margin-top:4px;">Doctor's Signature</div>
</div>

<div class="no-print" style="margin-top:12px;text-align:right;">
  <button onclick="window.print()" style="background:#1B4F8A;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer;">Print</button>
</div>

</div></body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Please allow pop-ups to print.'); return }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }

    try {
      const payloadRecord = buildPhysioRecordPayload()
      console.log('Printing investigation payload to create record:', payloadRecord)
      await SavePatientPrescription(payloadRecord)
    } catch (e) {
      console.error('Failed to save record during print:', e)
    }

    const payload = { investigation: { selectedTests, notes } }
    setFormData?.((prev) => ({ ...prev, investigation: { selectedTests, notes } }))
    updateStatus('Due for Investigation')
      .then(() => onNext?.(payload))
      .catch(err => {
        console.error('Failed to update appointment status:', err)
        onNext?.(payload) // still navigate even if status update fails
      })
  }

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="container pb-5"
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}
    >

      {snackbar.show && (
        <CAlert color={snackbar.type === 'error' ? 'danger' : snackbar.type || 'info'} className="mb-2">
          {snackbar.message}
        </CAlert>
      )}

      <CCard className="mb-4" style={cardStyle}>
        <CCardBody>
          <CardHeader emoji="🔬" title="Investigation" />

          {/* Row 1: Recommended Test | Selected Tests */}
          <div style={gridTwo}>

            {/* Recommended Test */}
            <Field label="Recommended Test (Optional)">
              <CreatableSelect
                options={availableTests.map((t) => ({ label: t.testName, value: t.testName }))}
                placeholder="Select or add tests…"
                value={selectedTestOption}
                isClearable
                isSearchable
                formatCreateLabel={(v) => `Add "${v}"`}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    border: state.isFocused ? '1.5px solid #1B4F8A' : '1.5px solid #b6cfe8',
                    borderRadius: 7,
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.875rem',
                    color: '#1a3a5c',
                    minHeight: 38,
                    height: 38,
                    boxShadow: 'none',
                    transition: 'border-color 0.18s ease',
                    '&:hover': { borderColor: '#1B4F8A' },
                  }),
                  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                  placeholder: (base) => ({ ...base, color: '#8aaac8', fontSize: '0.875rem' }),
                  indicatorSeparator: () => ({ display: 'none' }),
                  dropdownIndicator: (base) => ({ ...base, padding: '0 6px', color: '#8aaac8' }),
                  menu: (base) => ({
                    ...base, borderRadius: 8,
                    border: '1px solid #b6cfe8',
                    boxShadow: '0 4px 16px rgba(27,79,138,0.12)',
                    zIndex: 1000,
                  }),
                  option: (base, state) => ({
                    ...base, fontSize: '0.875rem', color: '#1a3a5c',
                    backgroundColor: state.isFocused ? '#dceeff' : '#fff',
                    cursor: 'pointer',
                  }),
                }}
                onChange={(selected) => {
                  if (!selected) { setSelectedTestOption(null); return }
                  if (!selectedTests.includes(selected.value)) {
                    setSelectedTests((prev) => [...prev, selected.value])
                  }
                  setSelectedTestOption(null)
                }}
                onCreateOption={async (inputValue) => {
                  if (!inputValue) return
                  const added = await addLabTest(inputValue)
                  setAvailableTests((prev) => [...prev, { testName: added }])
                  setSelectedTests((prev) => [...prev, added])
                  setSelectedTestOption(null)
                  showSnackbar(`Added new test: ${added}`, 'success')
                }}
              />
            </Field>

            {/* Selected Tests chips */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={labelStyle}>Selected Tests</label>
                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllTests}
                    style={{
                      background: 'none',
                      border: '1.5px solid #1B4F8A',
                      color: '#1B4F8A',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      padding: '2px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedTests.length === 0 ? (
                <div style={{
                  border: '1.5px dashed #b6cfe8',
                  borderRadius: 7,
                  background: '#FFFFFF',
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 11,
                  fontSize: '0.875rem',
                  color: '#8aaac8',
                }}>
                  No tests selected yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedTests.map((test) => (
                    <div
                      key={test}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#dceeff',
                        border: '1px solid #b6cfe8',
                        borderRadius: 20, padding: '3px 10px',
                        fontSize: '0.78rem', color: '#1B4F8A', fontWeight: 600,
                      }}
                    >
                      {test}
                      <button
                        type="button"
                        aria-label={`Remove ${test}`}
                        onClick={() => handleRemoveTest(test)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#1B4F8A', fontWeight: 700, fontSize: 14,
                          padding: 0, lineHeight: 1, fontFamily: 'inherit',
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Notes — full width */}
          <div style={{ marginBottom: 16 }}>
            <Field label="Notes / Reason for Recommendation (Optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Evaluate for suspected infection or fracture"
                rows={4}
                style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
                onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
                onBlur={e => (e.target.style.borderColor = '#b6cfe8')}
              />
            </Field>
          </div>

        </CCardBody>
      </CCard>

      {/* Sticky bottom bar */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0, right: 0,
          background: '#FFFFFF',
          borderTop: '2px solid #1B4F8A',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(27,79,138,0.12)',
        }}
      >
        {/* Print */}
        <Button
          style={{
            background: '#FFFFFF',
            color: '#1B4F8A',
            borderRadius: '20px',
            padding: '6px 24px',
            fontWeight: 700,
            border: '1.5px solid #1B4F8A',
          }}
          onClick={handlePrint}
        >
          🖨️ Print
        </Button>

        {/* Send to Lab Technician */}
        <Button
          style={{
            background: sending ? '#e8f0fb' : '#FFFFFF',
            color: sending ? '#8aaac8' : '#1B4F8A',
            borderRadius: '20px',
            padding: '6px 24px',
            fontWeight: 700,
            border: `1.5px solid ${sending ? '#b6cfe8' : '#1B4F8A'}`,
            cursor: sending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid #b6cfe8',
                borderTop: '2px solid #1B4F8A', borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Sending…
            </>
          ) : (
            '✉️ Send'
          )}
        </Button>

        {/* Next */}
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

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Investigation