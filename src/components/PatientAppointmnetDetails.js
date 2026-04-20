import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import TabContent from '../Prescription/TabContent'
import Snackbar from '../components/Snackbar'
import AppSidebar from './AppSidebar'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CNav, CNavItem, CNavLink, CContainer } from '@coreui/react'
import { useLocation, useParams } from 'react-router-dom'
import { useDoctorContext } from '../Context/DoctorContext'
import { SavePatientPrescription, getInProgressDetails } from '../Auth/Auth'
import { useToast } from '../utils/Toaster'

/* ─── deepMerge ──────────────────────────────────────────────────────────── */
const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target
  const result = { ...target }
  Object.keys(source).forEach(key => {
    const srcVal = source[key]
    const tgtVal = target[key]
    if (
      srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal) &&
      tgtVal !== null && typeof tgtVal === 'object' && !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal)
    } else {
      result[key] = srcVal
    }
  })
  return result
}

const PatientAppointmentDetails = ({ defaultTab, tabs, fromDoctorTemplate = false }) => {
  const { id } = useParams()
  const { state } = useLocation()
  const { patientData } = useDoctorContext()

  const [patient, setPatient] = useState(patientData || state?.patient || null)
  const [details, setDetails] = useState(state?.details || null)

  const [formData, setFormData] = useState(state?.formData || {
    symptoms: {},
    assessment: {},
    diagnosis: {},
    investigation: {},
    therapySessions: {},
    exercisePlan: { exercises: [], homeAdvice: '' },
    followUp: [],
    prescription: {},
    history: {},
    ClinicImages: {},
    summary: {},
    previousInjuries: '',
    currentMedications: '',
    allergies: '',
    occupation: '',
    insuranceProvider: '',
    activityLevels: [],
    patientPain: '',
  })

  // Keep a ref always in sync so tab handlers never read stale formData
  const formDataRef = useRef(formData)
  useEffect(() => { formDataRef.current = formData }, [formData])

  const { success, info } = useToast()

  const ALL_TABS = tabs || [
    'Complaints', 'Assessment', 'Diagnosis', 'Investigation',
    'Plan', 'HomePlan', 'FollowUp', 'Prescription', 'History', 'Reports',
  ]

  const [activeTab, setActiveTab] = useState(defaultTab || ALL_TABS[0])
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  /* ── Fetch in-progress ── */
  useEffect(() => {
    if (state?.fromTab === 'In-Progress' && patient && !details) {
      ;(async () => {
        try {
          const data = await getInProgressDetails(patient.patientId, patient.bookingId)
          setDetails(data)
          const saved = data?.savedDetails?.[0] || {}
          setFormData({ ...saved, followUp: Array.isArray(saved.followUp) ? saved.followUp : [] })
        } catch (err) { console.error('❌ Failed to fetch in-progress details:', err) }
      })()
    }
  }, [state?.fromTab, patient, details])

  /* ── Go to next tab ── */
  const goToNext = useCallback((current) => {
    const i = ALL_TABS.indexOf(current)
    if (i > -1 && i < ALL_TABS.length - 1) setActiveTab(ALL_TABS[i + 1])
  }, [ALL_TABS])

  /* ── mergeAndLog ── */
  const mergeAndLog = useCallback((tabName, patch) => {
    setFormData(prev => {
      const next = deepMerge(prev, patch)
      console.group(`📦 [${tabName}] formData update:`)
      console.log('patch  ➜', patch)
      console.log('result ➜', next)
      console.groupEnd()
      return next
    })
  }, [])

  /* ── onNextMap ── */
  const onNextMap = {

    Complaints: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Complaints'); return }
      const patch = {
        symptoms: {
          symptomDetails: data.symptomDetails ?? '',
          doctorObs: data.doctorObs ?? '',
          complaints: data.complaints ?? '',
          duration: data.duration ?? '',
          attachments: data.attachments ?? [],
          partImage: data.partImage ?? '',
          parts: data.parts ?? [],
          selectedTherapy: data.selectedTherapy ?? '',
          selectedTherapyID: data.selectedTherapyID ?? '',
          theraphyAnswers: data.theraphyAnswers ?? {},
          attachmentImages: data.attachmentImages ?? [],
          previousInjuries: data.previousInjuries ?? '',
          currentMedications: data.currentMedications ?? '',
          allergies: data.allergies ?? '',
          occupation: data.occupation ?? '',
          insuranceProvider: data.insuranceProvider ?? '',
          activityLevels: Array.isArray(data.activityLevels) ? data.activityLevels : [],
          patientPain: data.patientPain ?? '',
        },
        previousInjuries:   data.previousInjuries   ?? '',
        currentMedications: data.currentMedications ?? '',
        allergies:          data.allergies          ?? '',
        occupation:         data.occupation         ?? '',
        insuranceProvider:  data.insuranceProvider  ?? '',
        activityLevels: Array.isArray(data.activityLevels) ? data.activityLevels : [],
        patientPain:        data.patientPain        ?? '',
      }
      if (data.prescription?.medicines?.length) patch.prescription = { medicines: data.prescription.medicines }
      if (data.tests?.selectedTests?.length || data.tests?.testReason) patch.tests = { selectedTests: data.tests?.selectedTests ?? [], testReason: data.tests?.testReason ?? '' }
      if (data.treatments?.selectedTestTreatments?.length || data.treatments?.treatmentReason) patch.treatments = { generatedData: data.treatments?.generatedData ?? {}, selectedTestTreatments: data.treatments?.selectedTestTreatments ?? [], treatmentReason: data.treatments?.treatmentReason ?? '' }
      if (data.followUp?.durationValue || data.followUp?.followUpNote) patch.followUp = { durationValue: data.followUp?.durationValue ?? '', durationUnit: data.followUp?.durationUnit ?? '', nextFollowUpDate: data.followUp?.nextFollowUpDate ?? '', followUpNote: data.followUp?.followUpNote ?? '' }
      if (data.exercise && Object.keys(data.exercise).length) patch.exercise = data.exercise
      if (data.summary?.complaints) patch.summary = { ...(data.summary ?? {}) }
      mergeAndLog('Complaints', patch)
      goToNext('Complaints')
    },

    Assessment: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Assessment'); return }
      const patch = {
        assessment: {
          chiefComplaint: data.chiefComplaint ?? '', painScale: data.painScale ?? '',
          painType: data.painType ?? '', duration: data.duration ?? '', onset: data.onset ?? '',
          aggravatingFactors: data.aggravatingFactors ?? '', relievingFactors: data.relievingFactors ?? '',
          observations: data.observations ?? '',
          difficultiesIn: Array.isArray(data.difficultiesIn) ? data.difficultiesIn : [],
          otherDifficulty: data.otherDifficulty ?? '', dailyLivingAffected: data.dailyLivingAffected ?? '',
          postureAssessment: Array.isArray(data.postureAssessment) ? data.postureAssessment : [],
          postureDeviations: data.postureDeviations ?? '',
          romStatus: Array.isArray(data.romStatus) ? data.romStatus : [],
          romRestricted: data.romRestricted ?? '', romJoints: data.romJoints ?? '',
          muscleStrength: Array.isArray(data.muscleStrength) ? data.muscleStrength : [],
          muscleWeakness: data.muscleWeakness ?? '',
          neurologicalSigns: Array.isArray(data.neurologicalSigns) ? data.neurologicalSigns : [],
          posture: data.posture ?? '', rangeOfMotion: data.rangeOfMotion ?? '', specialTests: data.specialTests ?? '',
          patientPain: data.patientPain ?? '', painTriggers: data.painTriggers ?? '',
          chronicRelieving: data.chronicRelieving ?? '', typeOfSport: data.typeOfSport ?? '',
          recurringInjuries: data.recurringInjuries ?? '', returnToSportGoals: data.returnToSportGoals ?? '',
          neuroDiagnosis: data.neuroDiagnosis ?? '', neuroOnset: data.neuroOnset ?? '',
          mobilityStatus: data.mobilityStatus ?? '', cognitiveStatus: data.cognitiveStatus ?? '',
        },
        ...(data.patientPain ? { patientPain: data.patientPain } : {}),
      }
      mergeAndLog('Assessment', patch)
      goToNext('Assessment')
    },

    Diagnosis: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Diagnosis'); return }
      const patch = {
        diagnosis: {
          diagnosisRows: Array.isArray(data.diagnosis?.diagnosisRows)
            ? data.diagnosis.diagnosisRows
            : [{ physioDiagnosis: data.diagnosis?.physioDiagnosis ?? '', affectedArea: data.diagnosis?.affectedArea ?? '', severity: data.diagnosis?.severity ?? '', stage: data.diagnosis?.stage ?? '', notes: data.diagnosis?.notes ?? '' }],
        },
      }
      mergeAndLog('Diagnosis', patch)
      goToNext('Diagnosis')
    },

    Investigation: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Investigation'); return }
      const patch = { investigation: { selectedTests: data.investigation?.selectedTests ?? [], notes: data.investigation?.notes ?? '' } }
      mergeAndLog('Investigation', patch)
      goToNext('Investigation')
    },

    /* ── Plan ──────────────────────────────────────────────────────────────
       KEY FIX: TherapySession calls onNext({ therapySessions, therapistId, ... })
       We store it as formData.therapySessions = { sessions, therapistId, ... }
       The sessions array IS data.therapySessions (the array from TreatmentPlan).
       We must NOT nest it again.
    ────────────────────────────────────────────────────────────────────── */
    Plan: (data = {}) => {
      console.log('🔄 [Plan] onNext data:', data)

      // data.therapySessions is the sessions ARRAY from TreatmentPlan
      // data.therapistId, data.therapistName etc are top-level
      const patch = {
        therapySessions: {
          sessions:       Array.isArray(data.therapySessions) ? data.therapySessions : [],
          therapistId:    data.therapistId    ?? '',
          therapistName:  data.therapistName  ?? '',
          manualTherapy:  data.manualTherapy  ?? '',
          precautions:    data.precautions    ?? [],
          modalitiesUsed: data.modalitiesUsed ?? [],
          patientResponse: data.patientResponse ?? '',
        },
      }

      mergeAndLog('Plan', patch)
      goToNext('Plan')
    },

    HomePlan: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('HomePlan'); return }
      const rawExercises = Array.isArray(data.exercisePlan?.exercises) ? data.exercisePlan.exercises : []
      const patch = {
        exercisePlan: {
          homeAdvice: data.exercisePlan?.homeAdvice ?? data.homeAdvice ?? '',
          exercises: rawExercises,
          homeExercises: rawExercises.map(ex => ({
            id: ex.id ?? ex._id ?? '', name: ex.name ?? '', sets: String(ex.sets ?? ''), reps: String(ex.reps ?? ''),
            frequency: ex.frequency ?? '', instructions: ex.instructions ?? '', videoUrl: ex.videoUrl ?? '', thumbnail: ex.thumbnail ?? '',
          })),
        },
      }
      mergeAndLog('HomePlan', patch)
      goToNext('HomePlan')
    },

    FollowUp: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('FollowUp'); return }
      const entries = Array.isArray(data.followUp) ? data.followUp : []
      mergeAndLog('FollowUp', { followUp: entries, followUpEntries: entries })
      goToNext('FollowUp')
    },

    Prescription: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Prescription'); return }
      const patch = { prescription: { medicines: Array.isArray(data.medicines) ? data.medicines : Array.isArray(data.prescription?.medicines) ? data.prescription.medicines : [] } }
      mergeAndLog('Prescription', patch)
      goToNext('Prescription')
    },

    History: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('History'); return }
      mergeAndLog('History', { history: { ...data } })
      goToNext('History')
    },

    Reports: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Reports'); return }
      mergeAndLog('Reports', { ClinicImages: { ...data } })
      goToNext('Reports')
    },

    Images: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Images'); return }
      mergeAndLog('Images', { ClinicImages: { ...data } })
      goToNext('Images')
    },

    Summary: (data = {}) => {
      setFormData(prev => {
        const finalPayload = { ...prev, summary: { ...prev.summary, ...(data ?? {}) } }
        console.group('🏁 FINAL PAYLOAD')
        console.log(finalPayload)
        console.groupEnd()
        return finalPayload
      })
      goToNext('Summary')
    },
  }

  /* ── Template mode ── */
  const TABS = useMemo(() => {
    if (!fromDoctorTemplate) return ALL_TABS
    return formData?.symptoms?.complaints?.trim() ? ALL_TABS : ['Complaints']
  }, [ALL_TABS, fromDoctorTemplate, formData?.symptoms?.complaints])

  useEffect(() => { if (fromDoctorTemplate) setActiveTab('Complaints') }, [fromDoctorTemplate])

  /* ── Save template ── */
  const savePrescriptionTemplate = async () => {
    try {
      const complaints = formData.symptoms?.complaints?.trim() || ''
      const clinicId = localStorage.getItem('hospitalId')
      const template = { clinicId, title: complaints, symptoms: complaints, tests: formData.tests || [], prescription: formData.prescription || [], treatments: formData.treatments || [], followUp: formData.followUp || [], exercisePlan: formData.exercisePlan || {}, investigation: formData.investigation || {} }
      const res = await SavePatientPrescription(template)
      if (res.status === 200) success(res.message || 'Saved successfully!', { title: 'Success' })
      else info(res.message || 'Updated successfully', { title: 'Info' })
    } catch (error) {
      console.error('❌ Error saving template:', error)
      alert('Failed to save prescription template.')
    }
  }

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [activeTab])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppSidebar />

      {/* Tabs */}
      <div className="w-100" style={{ position: 'sticky', top: 110, zIndex: 10 }}>
        <CContainer fluid className="p-0">
          <CCard style={{ border: 0, borderRadius: 0, backgroundColor: COLORS.theme }}>
            <CCardBody className="p-0 pt-3">
              <CNav variant="tabs" role="tablist" style={{ whiteSpace: 'nowrap' }}>
                {TABS.map((t) => {
                  const active = t === activeTab
                  return (
                    <CNavItem key={t}>
                      <CNavLink active={active} onClick={() => setActiveTab(t)}
                        style={{ padding: '.5rem .85rem', cursor: 'pointer', borderRadius: '6px 6px 0 0', color: active ? '#000' : '#7e3a93' }}>
                        <span style={{ fontSize: 16, fontWeight: active ? 700 : 500 }}>{t}</span>
                      </CNavLink>
                    </CNavItem>
                  )
                })}
              </CNav>
            </CCardBody>
          </CCard>
        </CContainer>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1 }}>
        <TabContent
          activeTab={activeTab}
          formData={formData}
          onNext={onNextMap[activeTab] || (() => console.warn('⚠️ No handler for tab:', activeTab))}
          setActiveTab={setActiveTab}
          onSaveTemplate={savePrescriptionTemplate}
          patientData={patient}
          setFormData={setFormData}
          fromDoctorTemplate={fromDoctorTemplate}
          setImage={true}
        />
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default PatientAppointmentDetails