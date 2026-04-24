import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import TabContent from '../Prescription/TabContent'
import Snackbar from '../components/Snackbar'
import AppSidebar from './AppSidebar'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CContainer } from '@coreui/react'
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
      ; (async () => {
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

    // FIX: Complaints handler now also stores patientPain INSIDE symptoms{}
    // so that when seed = formData.symptoms is passed back to SymptomsDiseases,
    // seed.patientPain is defined and re-hydration works correctly.
Complaints: (data = {}) => {
  if (!data || typeof data !== 'object') {
    goToNext('Complaints')
    return
  }

  const patch = {
    symptoms: {
      ...(data.symptomDetails !== undefined && { symptomDetails: data.symptomDetails }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.attachments !== undefined && { attachments: data.attachments }),
      ...(data.partImage !== undefined && { partImage: data.partImage }),
      ...(data.parts !== undefined && { parts: data.parts }),
      ...(data.selectedTherapy !== undefined && { selectedTherapy: data.selectedTherapy }),
      ...(data.selectedTherapyID !== undefined && { selectedTherapyID: data.selectedTherapyID }),
      ...(data.theraphyAnswers !== undefined && { theraphyAnswers: data.theraphyAnswers }),
      ...(data.attachmentImages !== undefined && { attachmentImages: data.attachmentImages }),
      ...(data.previousInjuries !== undefined && { previousInjuries: data.previousInjuries }),
      ...(data.currentMedications !== undefined && { currentMedications: data.currentMedications }),
      ...(data.allergies !== undefined && { allergies: data.allergies }),
      ...(data.occupation !== undefined && { occupation: data.occupation }),
      ...(data.insuranceProvider !== undefined && { insuranceProvider: data.insuranceProvider }),
      ...(data.activityLevels !== undefined && { activityLevels: data.activityLevels }),
      ...(data.patientPain !== undefined && { patientPain: data.patientPain }),
      ...(data.reasonforVisit !== undefined && { reasonforVisit: data.reasonforVisit }),
    },

    ...(data.patientPain !== undefined && { patientPain: data.patientPain }),
  }

  mergeAndLog('Complaints', patch)
  goToNext('Complaints')
},
    Assessment: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Assessment'); return }
      const patch = {
        assessment: {
          chiefComplaint: data.chiefComplaint ?? '',
          painScale: data.painScale ?? '',
          painType: data.painType ?? '',
          duration: data.duration ?? '',
          onset: data.onset ?? '',
          aggravatingFactors: data.aggravatingFactors ?? '',
          relievingFactors: data.relievingFactors ?? '',
          observations: data.observations ?? '',
          difficultiesIn: Array.isArray(data.difficultiesIn) ? data.difficultiesIn : [],
          otherDifficulty: data.otherDifficulty ?? '',
          dailyLivingAffected: data.dailyLivingAffected ?? '',
          postureAssessment: Array.isArray(data.postureAssessment) ? data.postureAssessment : [],
          postureDeviations: data.postureDeviations ?? '',
          romStatus: Array.isArray(data.romStatus) ? data.romStatus : [],
          romRestricted: data.romRestricted ?? '',
          romJoints: data.romJoints ?? '',
          muscleStrength: Array.isArray(data.muscleStrength) ? data.muscleStrength : [],
          muscleWeakness: data.muscleWeakness ?? '',
          neurologicalSigns: Array.isArray(data.neurologicalSigns) ? data.neurologicalSigns : [],
          posture: data.posture ?? '',
          rangeOfMotion: data.rangeOfMotion ?? '',
          specialTests: data.specialTests ?? '',
          patientPain: data.patientPain ?? '',
          painTriggers: data.painTriggers ?? '',
          chronicRelieving: data.chronicRelieving ?? '',
          typeOfSport: data.typeOfSport ?? '',
          recurringInjuries: data.recurringInjuries ?? '',
          returnToSportGoals: data.returnToSportGoals ?? '',
          neuroDiagnosis: data.neuroDiagnosis ?? '',
          neuroOnset: data.neuroOnset ?? '',
          mobilityStatus: data.mobilityStatus ?? '',
          cognitiveStatus: data.cognitiveStatus ?? '',
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
          // FIX: preserve full diagnosisRows array — not just first row
          diagnosisRows: Array.isArray(data.diagnosis?.diagnosisRows)
            ? data.diagnosis.diagnosisRows
            : [{ physioDiagnosis: data.diagnosis?.physioDiagnosis ?? '', affectedArea: data.diagnosis?.affectedArea ?? '', severity: data.diagnosis?.severity ?? '', stage: data.diagnosis?.stage ?? '', notes: data.diagnosis?.notes ?? '' }],
        },
      }
      mergeAndLog('Diagnosis', patch)
      goToNext('Diagnosis')
    },

    // FIX: store investigation with BOTH key names (selectedTests for internal use, tests for API compat)
    Investigation: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Investigation'); return }
      const tests = data.investigation?.selectedTests ?? data.investigation?.tests ?? []
      const notes = data.investigation?.notes ?? data.investigation?.reason ?? ''
      const patch = {
        investigation: {
          selectedTests: tests,
          tests: tests,   // duplicate so buildPayload finds it either way
          notes: notes,
          reason: notes,   // duplicate for same reason
        },
      }
      mergeAndLog('Investigation', patch)
      goToNext('Investigation')
    },

    // ── Plan: preserve the full multi-therapist payload ──────────────────────
    Plan: (data = {}) => {
      console.log('🔄 [Plan] onNext data:', data)
      const patch = {
        therapySessions: {
          sessions: Array.isArray(data.therapySessions) ? data.therapySessions : [],
          therapists: Array.isArray(data.therapists) ? data.therapists : [],
          therapistIds: Array.isArray(data.therapistIds) ? data.therapistIds : [],
          therapistNames: Array.isArray(data.therapistNames) ? data.therapistNames : [],
          therapistId: data.therapistId ?? (data.therapists?.[0]?.therapistId ?? ''),
          therapistName: data.therapistName ?? (data.therapists?.[0]?.fullName ?? ''),
          manualTherapy: data.manualTherapy ?? '',
          precautions: Array.isArray(data.precautions) ? data.precautions : [],
          modalitiesUsed: Array.isArray(data.modalitiesUsed) ? data.modalitiesUsed : [],
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
            id: ex.id ?? ex._id ?? '',
            name: ex.name ?? '',
            sets: String(ex.sets ?? ''),
            reps: String(ex.reps ?? ''),
            frequency: ex.frequency ?? '',
            instructions: ex.instructions ?? '',
            videoUrl: ex.videoUrl ?? '',
            thumbnail: ex.thumbnail ?? '',
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

  // FIX: Build a richer seed for SymptomsDiseases so top-level fields
  // (patientPain, previousInjuries, etc.) are visible inside seed when user
  // navigates back to the Complaints tab.
  const complaintsSeed = useMemo(() => ({
    ...formData.symptoms,
    // Merge top-level fields into seed — symptoms sub-object takes priority
    // if both exist; otherwise fall back to top-level formData value.
    patientPain: formData.symptoms?.patientPain ?? formData.patientPain ?? '',
    previousInjuries: formData.symptoms?.previousInjuries ?? formData.previousInjuries ?? '',
    currentMedications: formData.symptoms?.currentMedications ?? formData.currentMedications ?? '',
    allergies: formData.symptoms?.allergies ?? formData.allergies ?? '',
    occupation: formData.symptoms?.occupation ?? formData.occupation ?? '',
    insuranceProvider: formData.symptoms?.insuranceProvider ?? formData.insuranceProvider ?? '',
    activityLevels: (formData.symptoms?.activityLevels?.length
      ? formData.symptoms.activityLevels
      : formData.activityLevels) ?? [],
  }), [formData.symptoms, formData.patientPain, formData.previousInjuries,
  formData.currentMedications, formData.allergies, formData.occupation,
  formData.insuranceProvider, formData.activityLevels])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppSidebar />

      {/* ── Tabs ── */}
      <div className="w-100" style={{ position: 'sticky', top: 110, zIndex: 10 }}>
        <CContainer fluid className="p-0">
          <CCard style={{ border: 0, borderRadius: 0, backgroundColor: COLORS.bgcolor }}>
            <CCardBody className="p-0" style={{ paddingLeft: '8px', paddingTop: '8px', paddingRight: '8px' }}>
              <div
                role="tablist"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
                  gap: '4px',
                  width: '100%',
                }}
              >
                {TABS.map((t) => {
                  const active = t === activeTab
                  return (
                    <div
                      key={t}
                      role="tab"
                      onClick={() => setActiveTab(t)}
                      style={{
                        padding: '10px 6px',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        backgroundColor: active ? COLORS.orange : 'rgba(255,255,255,0.13)',
                        color: active ? COLORS.bgcolor : COLORS.white,
                        transition: 'background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
                        boxShadow: active ? '0 -3px 10px rgba(249,197,113,0.45)' : 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'rgba(249,197,113,0.22)'
                          e.currentTarget.style.color = COLORS.orange
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.13)'
                          e.currentTarget.style.color = COLORS.white
                        }
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: active ? 700 : 500, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                        {t}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CCardBody>
          </CCard>
        </CContainer>
      </div>

      {/* Tab content — pass complaintsSeed so SymptomsDiseases gets all fields */}
      <div style={{ flex: 1 }}>
        <TabContent
          activeTab={activeTab}
          formData={formData}
          // FIX: pass complaintsSeed as a separate prop so TabContent can
          // forward it to SymptomsDiseases instead of raw formData.symptoms
          complaintsSeed={complaintsSeed}
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