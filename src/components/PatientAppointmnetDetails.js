import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import TabContent from '../Prescription/TabContent'
import Snackbar from '../components/Snackbar'
import AppSidebar from './AppSidebar'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CContainer } from '@coreui/react'
import { useLocation, useParams } from 'react-router-dom'
import { useDoctorContext } from '../Context/DoctorContext'
import { SavePatientPrescription, getInProgressDetails, getFollowUpRecord, SavePrescriptionTemplate } from '../Auth/Auth'
import { useToast } from '../utils/Toaster'
import { normalizeSavedData } from '../utils/normalizeData'

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
  const { patientData, isPatientLoading, setPatientData } = useDoctorContext()

  // Clear patient context on unmount so sidebar reverts to doctor profile
  useEffect(() => {
    return () => {
      setPatientData(null)
    }
  }, [setPatientData])

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
    uptoInvestigation: false,
  })

  // Keep a ref always in sync so tab handlers never read stale formData
  const formDataRef = useRef(formData)
  useEffect(() => { formDataRef.current = formData }, [formData])

  useEffect(() => {
    if (patientData) {
      setPatient(patientData)
    }
  }, [patientData])

  const { success, info, error } = useToast()

  const ALL_TABS = tabs || [
    'Complaints', 'Assessment', 'Diagnosis', 'Investigation',
    'Plan', 'HomePlan', 'FollowUp', 'Prescription', 'History', 'Reports',
  ]

  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  /* ── Fetch in-progress ── */
  useEffect(() => {
    const visitType = patient?.visitType || patientData?.visitType || ''
    const isFollowUp = visitType.toLowerCase().replace(/[\s_-]+/g, '') === 'followup'
    if (state?.fromTab === 'In-Progress' && patient && !details && !isFollowUp) {
      ; (async () => {
        try {
          const data = await getInProgressDetails(patient.patientId, patient.bookingId)
          if (data) {
            setDetails(data)
            setFormData(prev => {
              const normalized = normalizeSavedData(data?.savedDetails?.[0] || {})
              const currentStatusNorm = (patient?.status || patientData?.status || '').toLowerCase().replace(/[\s_]/g, '')
              const isDueOrDone = ['dueforinvestigation', 'duetoinvestigation', 'investigationdone', 'doneforinvestigation'].includes(currentStatusNorm)
              return {
                ...prev,
                ...normalized,
                uptoInvestigation: isDueOrDone ? true : !!normalized.uptoInvestigation
              }
            })
          }
        } catch (err) { console.error('❌ Failed to fetch in-progress details:', err) }
      })()
    }
  }, [state?.fromTab, patient, details])

  useEffect(() => {
    const currentStatusNorm = (patientData?.status || patient?.status || '').toLowerCase().replace(/[\s_]/g, '')
    const isDueOrDone = ['dueforinvestigation', 'duetoinvestigation', 'investigationdone', 'doneforinvestigation'].includes(currentStatusNorm)
    if (isDueOrDone && !formData.uptoInvestigation) {
      setFormData(prev => ({ ...prev, uptoInvestigation: true }))
    }
  }, [patientData?.status, patient?.status, formData.uptoInvestigation])



  const TABS = useMemo(() => {
    let list = ALL_TABS
    if (fromDoctorTemplate) {
      list = formData?.diagnosis?.physioDiagnosis?.trim() ? ALL_TABS : ['Diagnosis']
    }

    const currentStatus = (patientData?.status || patient?.status || '').toLowerCase()
    if (currentStatus === 'completed') {
      list = ['History', 'Reports']
    } else if (currentStatus === 'confirmed') {
      // status confirmed means history reports has to be disabled EXCEPT for follow-ups
      const visitType = patient?.visitType || patientData?.visitType || ''
      const isFollowUp = visitType.toLowerCase().replace(/[\s_-]+/g, '') === 'followup'
      if (!isFollowUp) {
        list = list.filter(t => t !== 'History' && t !== 'Reports')
      }
    }

    return list
  }, [ALL_TABS, fromDoctorTemplate, formData?.symptoms?.complaints, patientData?.status, patient?.status, patient?.visitType, patientData?.visitType])

  const [activeTab, setActiveTab] = useState(defaultTab || TABS[0])

  useEffect(() => {
    if (!TABS.includes(activeTab) && TABS.length > 0) {
      setActiveTab(TABS[0])
    }
  }, [TABS, activeTab])

  /* ── Go to next tab ── */
  const goToNext = useCallback((current) => {
    const i = TABS.indexOf(current)
    if (i > -1 && i < TABS.length - 1) setActiveTab(TABS[i + 1])
  }, [TABS])

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
    'Red Flags': (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Red Flags'); return }
      const rf = data.redFlags ?? data
      mergeAndLog('Red Flags', { redFlags: rf })
      goToNext('Red Flags')
    },

    Assessment: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Assessment'); return }
      // The incoming data is already the assessment payload, so we wrap it ourselves
      const assessmentData = data.assessment ?? data
      mergeAndLog('Assessment', { assessment: assessmentData })
      goToNext('Assessment')
    },

    'Neuro Info': (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Neuro Info'); return }
      const patch = {
        radiationNeuro: data.radiationNeuro ?? data,
        psychosocial: data.psychosocial ?? data,
        specialSymptoms: data.specialSymptoms ?? data,
      }
      mergeAndLog('Neuro Info', patch)
      goToNext('Neuro Info')
    },

    Diagnosis: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Diagnosis'); return }
      const d = data.diagnosis ?? data
      const patch = {
        diagnosis: {
          physioDiagnosis: d.physioDiagnosis ?? '',
          affectedArea: d.affectedArea ?? '',
          severity: d.severity ?? '',
          stage: d.stage ?? '',
          differentialDiagnosis: d.differentialDiagnosis ?? '',
          notes: d.notes ?? '',
          diagnosisRows: Array.isArray(d.diagnosisRows)
            ? d.diagnosisRows
            : [{
              physioDiagnosis: d.physioDiagnosis ?? '',
              affectedArea: d.affectedArea ?? '',
              severity: d.severity ?? '',
              stage: d.stage ?? '',
              differentialDiagnosis: d.differentialDiagnosis ?? '',
              notes: d.notes ?? ''
            }],
        },
      }
      mergeAndLog('Diagnosis', patch)
      goToNext('Diagnosis')
    },

    // FIX: store investigation with BOTH key names (selectedTests for internal use, tests for API compat)
    Investigation: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Investigation'); return }
      const inv = data.investigation ?? data
      const tests = inv.selectedTests ?? inv.tests ?? []
      const notes = inv.notes ?? inv.reason ?? ''
      const patch = {
        investigation: {
          selectedTests: tests,
          tests: tests,
          notes: notes,
          reason: notes,
        },
      }
      if (data.uptoInvestigation !== undefined) {
        patch.uptoInvestigation = data.uptoInvestigation
      }
      if (data.therapyRecordId) {
        patch.therapyRecordId = data.therapyRecordId
        patch.id = data.therapyRecordId
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
        recoverySupport: (data.recoverySupport || []).map(item => ({
          id: item.id || item.recoverySupportId || '',
          
          name: item.name || item.recoverySupportName || '',
          category: item.category || item.recoverySupportCategory || item.categoryName || '',
          description: item.description || item.recoverySupportDescription || '',
        })),
        exercisePlan: {
          homeAdvice: data.exercisePlan?.homeAdvice ?? data.homeAdvice ?? '',
          exercises: rawExercises,
          homeExercises: rawExercises.map(ex => {
            const exId = ex.therapyExercisesId ?? ex.exerciseId ?? ex.id ?? ex._id ?? ''
            return {
              id: exId,
              therapyExercisesId: exId,
              exerciseId: exId,
              name: ex.name ?? '',
              sets: String(ex.sets ?? ''),
              reps: String(ex.reps ?? ''),
              frequency: ex.frequency ?? '',
              instructions: ex.instructions ?? '',
              videoUrl: ex.videoUrl ?? '',
              sessions: ex.sessions,
              thumbnail: ex.thumbnail ?? '',
            }
          }),
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

  useEffect(() => { if (fromDoctorTemplate) setActiveTab('Diagnosis') }, [fromDoctorTemplate])

  /* ── Save template ── */
  const savePrescriptionTemplate = async () => {
    try {
      const physioDiagnosis = formData.diagnosis?.physioDiagnosis?.trim() || ''
      if (!physioDiagnosis) {
        error?.('Primary Diagnosis is mandatory to save a template.', { title: 'Required Field' })
        return false
      }
      const clinicId = localStorage.getItem('hospitalId')
      const branchId = localStorage.getItem('branchId') || ''
      const doctorId = localStorage.getItem('doctorId') || ''

      const followUpRaw = formData.followUp
      const followUpPayload = Array.isArray(followUpRaw) ? (followUpRaw[0] ?? {}) : (followUpRaw ?? {})

      const template = {
        clinicId,
        branchId,
        
        // ── Diagnosis ──────────────────────────────────────────────────────
        diagnosis: {
          physioDiagnosis: formData.diagnosis?.physioDiagnosis || '',
          differentialDiagnosis: formData.diagnosis?.differentialDiagnosis || '',
          affectedArea: formData.diagnosis?.affectedArea || '',
          severity: formData.diagnosis?.severity || '',
          stage: formData.diagnosis?.stage || '',
          notes: formData.diagnosis?.notes || '',
        },
        recoverySupport: (formData.recoverySupport || formData.exercisePlan?.recoverySupport || []).map(item => ({
          id: item.id || item.recoverySupportId || '',
          recoverySupportId: item.recoverySupportId || item.id || '',
          recoverySupportName: item.name || item.recoverySupportName || '',
          name: item.name || item.recoverySupportName || '',
          category: item.category || item.recoverySupportCategory || item.categoryName || '',
          description: item.description || item.recoverySupportDescription || '',
        })),
        // ── Exercise Plan ──────────────────────────────────────────────────
        exercisePlan: {
          homeAdvice: formData.exercisePlan?.homeAdvice || '',
          homeExercises: (formData.exercisePlan?.exercises || formData.exercisePlan?.homeExercises || []).map(ex => {
            const exId = ex.therapyExercisesId || ex.id || ex.exerciseId || ''
            return {
              id: exId,
              therapyExercisesId: exId,
              exerciseId: exId,
              name: ex.name ?? ex.exerciseName ?? '',
              sets: String(ex.sets ?? ''),
              reps: String(ex.reps ?? ex.repetitions ?? ''),
              duration: ex.activityDuration || ex.activityduration || ex.duration || '',
              frequency: ex.frequency ?? null,
              instructions: ex.instructions ?? ex.notes ?? '',
              videoUrl: ex.videoUrl ?? ex.youtubeUrl ?? '',
              session: ex.sessions || ex.session || '',
            }
          }),
        },

        // ── Follow Up ──────────────────────────────────────────────────────
        followUp: {
          nextVisitDate: followUpPayload.nextVisitDate ?? '',
          reviewNotes: followUpPayload.reviewNotes ?? '',
          modifications: followUpPayload.modifications ?? '',
        },

        // ── Investigation ──────────────────────────────────────────────────
        investigation: {
          tests: Array.isArray(formData.investigation?.tests)
            ? formData.investigation.tests
            : Array.isArray(formData.investigation?.selectedTests)
              ? formData.investigation.selectedTests
              : [],
          reason: formData.investigation?.reason || formData.investigation?.notes || '',
        },

        // ── Therapy Sessions ───────────────────────────────────────────────
        therapySessions: Array.isArray(formData.therapySessions)
          ? formData.therapySessions
          : Array.isArray(formData.therapySessions?.sessions)
            ? formData.therapySessions.sessions
            : [],

        // ── Treatment Plan ─────────────────────────────────────────────────
        treatmentPlan: {
          doctorId,
          doctorName: formData.treatmentPlan?.doctorName || formData.therapySessions?.doctorName || '',
          therapistId: formData.treatmentPlan?.therapistId || formData.therapySessions?.therapistId || '',
          therapistName: formData.treatmentPlan?.therapistName || formData.therapySessions?.therapistName || '',
          manualTherapy: formData.treatmentPlan?.manualTherapy || formData.therapySessions?.manualTherapy || '',
          modalitiesUsed: Array.isArray(formData.treatmentPlan?.modalitiesUsed)
            ? formData.treatmentPlan.modalitiesUsed
            : Array.isArray(formData.therapySessions?.modalitiesUsed)
              ? formData.therapySessions.modalitiesUsed
              : [],
          patientResponse: formData.treatmentPlan?.patientResponse || formData.therapySessions?.patientResponse || '',
          precautions: Array.isArray(formData.treatmentPlan?.precautions)
            ? formData.treatmentPlan.precautions
            : Array.isArray(formData.therapySessions?.precautions)
              ? formData.therapySessions.precautions
              : [],
        }
      }

      const res = await SavePrescriptionTemplate(template)
      if (res?.success || res?.status === 200) {
        success(res?.message || 'Template saved successfully!', { title: 'Success' })
        return true
      } else {
        info(res?.message || 'Template updated successfully', { title: 'Info' })
        return true
      }
    } catch (error) {
      console.error('❌ Error saving template:', error)
      alert('Failed to save prescription template.')
      return false
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