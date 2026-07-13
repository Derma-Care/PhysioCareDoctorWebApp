import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer, CAlert } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/CustomButton/CustomButton'
import CreatableSelect from 'react-select/creatable'
import { addLabTest, getLabTests, updateAppointmentBasedOnBookingId, SavePatientPrescription, UpdatePatientPrescription } from '../../src/Auth/Auth'
import { COLORS } from '../Themes'
import { useDoctorContext } from '../Context/DoctorContext'
import PrescriptionPDF from '../utils/PdfGenerator'
import InvestigationPDF from '../utils/InvestigationPDF'
import { uploadPrescriptionPdf } from '../utils/S3UploadServices'
import { pdf } from '@react-pdf/renderer'
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
const Investigation = ({ seed = {}, onNext, setFormData, formData, patientData: patientDataProp }) => {
  const navigate = useNavigate()
  const [selectedTests, setSelectedTests] = useState(seed.selectedTests ?? [])
  const [selectedTestOption, setSelectedTestOption] = useState(null)
  const [notes, setNotes] = useState(seed.notes ?? '')
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [availableTests, setAvailableTests] = useState([])
  const [sending, setSending] = useState(false)

  const seedRef = useRef(null)

  const context = useDoctorContext()
  const patientData = patientDataProp || context?.patientData
  const clinicDetails = context?.clinicDetails
  const doctorDetails = context?.doctorDetails

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

  const buildPhysioRecordPayload = (prescriptionPdf = '') => {
    const record = formData ?? {}
    const existingRecordId = record.id || record._id || record.therapyRecordId || record.therapyrecordid || (record.therapistRecordId !== 'TR001' ? record.therapistRecordId : null)
    
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
     const partImageKey = comp.partImageKey || comp.partImage || ''
    
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
    if (diag.physioDiagnosis) {
      firstDiag = diag
    } else if (Array.isArray(diag.diagnosisRows) && diag.diagnosisRows.length) {
      const first = diag.diagnosisRows[0] || {}
      if (first.physioDiagnosis) {
        firstDiag = first
      } else {
        firstDiag = diag
      }
    } else {
      firstDiag = diag
    }

    return {
      therapistRecordId: existingRecordId || undefined,
      therapyRecordId: existingRecordId || undefined,
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
        painAssessmentImage: partImageKey || partImage || '',
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
      prescription: record.prescription || formData?.prescription || {},
      prescriptionPdf: prescriptionPdf || record.prescriptionPdf || formData?.prescriptionPdf || '',
    }
  }

  // ── updateStatus helper ────────────────────────────────────────────────
  const updateStatus = (status) => {
    const bookingId = formData?.bookingId || patientData?.bookingId
    console.log(`[Investigation.jsx] updateStatus called: status="${status}", bookingId="${bookingId}"`)
    if (!bookingId) {
      console.warn('[Investigation.jsx] Skipping status update because bookingId is missing!', { formData, patientData })
      return Promise.resolve()
    }
    const setPatientData = context?.setPatientData
    return updateAppointmentBasedOnBookingId({ data: { bookingId, status } })
      .then((res) => {
        if (patientData && setPatientData) {
          console.log(`[Investigation.jsx] updateStatus success, updating context patientData status to: "${status}"`)
          setPatientData({ ...patientData, status })
        }
        return res
      })
  }

  const handleNext = () => {
    const payload = { investigation: { selectedTests, notes } }
    setFormData?.((prev) => ({ ...prev, investigation: { selectedTests, notes } }))
        onNext?.(payload)

    // const nextStatus = 'On-Going'
    // console.log(`[Investigation.jsx] handleNext triggered: nextStatus="${nextStatus}", selectedTestsCount=${selectedTests.length}`)
    // // updateStatus(nextStatus)
    //   .then(() => {
    //     console.log('[Investigation.jsx] handleNext status update succeeded. Navigating...')
    //     onNext?.(payload)
    //   })
    //   .catch(err => {
    //     console.error('[Investigation.jsx] handleNext status update failed:', err)
    //     onNext?.(payload) // still navigate even if status update fails
    //   })
  }

  // ── handleSend ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (selectedTests.length === 0) {
      showSnackbar('Please select at least one test before sending.', 'error')
      return
    }

    setSending(true)
    let savedId = null
    try {
      const response = await updateStatus('Due for Investigation')
      console.log('Appointment status updated to Due for Investigation:', response)

      // ── API call to SavePatientPrescription ──
      const payloadRecord = buildPhysioRecordPayload()
      const createPayload = { ...payloadRecord }
      delete createPayload.therapyRecordId
      delete createPayload.status
      delete createPayload.therapistRecordId

      console.log('Sending investigation payload to create record:', createPayload)
      if(response.status == 200) {
              const res = await SavePatientPrescription(createPayload)
      console.log('SavePatientPrescription response:', res)
       const savedRecord = res?.data || res
        if (savedRecord) {
        savedId = savedRecord.therapistRecordId || savedRecord.therapyRecordId || savedRecord.id || savedRecord._id || savedRecord.therapyrecordid
      }
     else
      showSnackbar(response.message||'Failed to save prescription record. Investigation not sent.', 'error')



      }
    

      // MOCK: simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 900))

      showSnackbar('Investigation sent to Lab Technician successfully! ✉️', 'success')
      
      const payload = {
        uptoInvestigation: true,
        therapyRecordId: savedId || undefined,
        investigation: { selectedTests, notes }
      }

      setFormData?.((prev) => {
        const nextFormData = {
          ...prev,
          uptoInvestigation: true,
          investigation: { selectedTests, notes }
        }
        if (savedId) {
          nextFormData.therapyRecordId = savedId
          nextFormData.id = savedId
        }
        return nextFormData
      })

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
    const patientName = patientData?.name || patientData?.fullName || 'Record'
    const safeName = patientName.replace(/[^\w\-]+/g, '_')
    
    // We should make sure the generated PDF has the updated investigation tests and notes.
    const updatedFormData = {
      ...formData,
      investigation: {
        tests: selectedTests,
        reason: notes,
      }
    }

    let savedId = null
    try {
      // 1. Generate PDF blob using InvestigationPDF
      const blob = await pdf(
        <InvestigationPDF
          doctorData={doctorDetails}
          clicniData={clinicDetails}
          formData={updatedFormData}
          patientData={patientData}
        />
      ).toBlob()

      // 2. Upload PDF to S3
      const pdfFile = new File([blob], `${safeName}_Investigation.pdf`, { type: 'application/pdf' })
      const prescriptionPdfKey = await uploadPrescriptionPdf(pdfFile)

      // 3. Update status
      const response = await updateStatus('Due for Investigation')
      console.log('Appointment status updated to Due for Investigation:', response)

      // 4. Build payload with S3 key and save/update record
      const payloadRecord = buildPhysioRecordPayload(prescriptionPdfKey)
      const record = formData ?? {}
      const existingRecordId = record.id || record._id || record.therapyRecordId || record.therapyrecordid || (record.therapistRecordId !== 'TR001' ? record.therapistRecordId : null)
      const shouldUpdate = !!existingRecordId

      let res
      if (shouldUpdate) {
        console.log('Calling Update API in handlePrint with S3 key:', payloadRecord)
        res = await UpdatePatientPrescription(payloadRecord)
      } else {
        const createPayload = { ...payloadRecord }
        delete createPayload.therapyRecordId
        delete createPayload.status
        delete createPayload.therapistRecordId
        console.log('Calling Save API in handlePrint with S3 key:', createPayload)
        res = await SavePatientPrescription(createPayload)
      }

      console.log('Save/Update response:', res)
      const savedRecord = res?.data || res
      if (savedRecord) {
        savedId = savedRecord.therapistRecordId || savedRecord.therapyRecordId || savedRecord.id || savedRecord._id || savedRecord.therapyrecordid
      }

      // 5. Open PDF in new tab for viewing in browser
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')

      // 6. Update local form data
      setFormData?.((prev) => {
        const nextFormData = {
          ...prev,
          uptoInvestigation: true,
          investigation: { selectedTests, notes }
        }
        if (savedId) {
          nextFormData.therapyRecordId = savedId
          nextFormData.id = savedId
        }
        return nextFormData
      })

      // 7. Navigate back to dashboard after delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1000)
    } catch (e) {
      console.error('Failed to generate/save/print record:', e)
      showSnackbar('Failed to generate PDF. Please try again.', 'error')
    }
  }

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="container pb-5"
      style={{
        
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
                          padding: 0, lineHeight: 1,
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
        {/* <Button
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
        </Button> */}

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