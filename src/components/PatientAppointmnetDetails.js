import React, { useCallback, useMemo, useEffect, useState } from 'react'
import TabContent from '../Prescription/TabContent'
import Snackbar from '../components/Snackbar'
import AppSidebar from './AppSidebar'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CNav, CNavItem, CNavLink, CContainer } from '@coreui/react'
import { useLocation, useParams } from 'react-router-dom'
import { useDoctorContext } from '../Context/DoctorContext'
import { SavePatientPrescription, getInProgressDetails } from '../Auth/Auth'
import { useToast } from '../utils/Toaster'

const PatientAppointmentDetails = ({ defaultTab, tabs, fromDoctorTemplate = false }) => {
  const { id }    = useParams()
  const { state } = useLocation()
  const { patientData } = useDoctorContext()

  const [patient,  setPatient]  = useState(patientData || state?.patient || null)
  const [details,  setDetails]  = useState(state?.details || null)

  // ── Single accumulator — every tab ADDS to this, nothing is ever lost ────
  const [formData, setFormData] = useState(state?.formData || {
    symptoms:        {},
    assessment:      {},
    diagnosis:       {},
    investigation:   {},
    therapySessions: {},
    exercisePlan:    { exercises: [], homeAdvice: '' },
    followUp:        {},
    prescription:    {},
    history:         {},
    ClinicImages:    {},
    summary:         {},
    // top-level background fields (from Complaints tab)
    previousInjuries:   '',
    currentMedications: '',
    allergies:          '',
    occupation:         '',
    insuranceProvider:  '',
    activityLevels:     [],
    patientPain:        '',
  })

  const { success, info } = useToast()

  const ALL_TABS = tabs || [
    'Complaints',
    'Assessment',
    'Diagnosis',
    'Investigation',
    'Plan',
    'HomePlan',
    'FollowUp',
    'Prescription',
    'History',
    'Reports',
  ]

  const [activeTab, setActiveTab] = useState(defaultTab || ALL_TABS[0])
  const [snackbar, setSnackbar]   = useState({ show: false, message: '', type: '' })

  // ── Fetch in-progress ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state?.fromTab === 'In-Progress' && patient && !details) {
      ;(async () => {
        try {
          const data = await getInProgressDetails(patient.patientId, patient.bookingId)
          setDetails(data)
          setFormData(data?.savedDetails?.[0] || {})
        } catch (err) {
          console.error('❌ Failed to fetch in-progress details:', err)
        }
      })()
    }
  }, [state?.fromTab, patient, details])

  // ── Go to next tab ────────────────────────────────────────────────────────
  const goToNext = useCallback((current) => {
    const i = ALL_TABS.indexOf(current)
    if (i > -1 && i < ALL_TABS.length - 1) setActiveTab(ALL_TABS[i + 1])
  }, [ALL_TABS])

  // ── deepMerge helper ──────────────────────────────────────────────────────
  const deepMerge = (target, source) => {
    const result = { ...target }
    Object.keys(source).forEach(key => {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key])
      } else {
        result[key] = source[key]
      }
    })
    return result
  }

  // ── mergeAndLog ───────────────────────────────────────────────────────────
  const mergeAndLog = useCallback((tabName, patch) => {
    setFormData(prev => {
      const next = deepMerge(prev, patch)
      console.group(`📦 [${tabName}] Next → accumulated formData:`)
      console.log('This tab patch  ➜', patch)
      console.log('Full formData   ➜', next)
      console.groupEnd()
      return next
    })
  }, [])

  // ── onNextMap ─────────────────────────────────────────────────────────────
  const onNextMap = {

    // ── Complaints ────────────────────────────────────────────────────────
    Complaints: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Complaints'); return }

      const patch = {
        symptoms: {
          symptomDetails:   data.symptomDetails   ?? '',
          doctorObs:        data.doctorObs        ?? '',
          complaints:       data.complaints       ?? '',
          duration:         data.duration         ?? '',
          attachments:      data.attachments      ?? [],
          partImage:        data.partImage        ?? '',
          parts:            data.parts            ?? [],
          selectedTherapy:  data.selectedTherapy  ?? '',
          theraphyAnswers:  data.theraphyAnswers  ?? {},
          attachmentImages: data.attachmentImages ?? [],
        },
        // ── Patient background — stored at TOP LEVEL for Summary payload ──
        previousInjuries:   data.previousInjuries   ?? '',
        currentMedications: data.currentMedications ?? '',
        allergies:          data.allergies           ?? '',
        occupation:         data.occupation          ?? '',
        insuranceProvider:  data.insuranceProvider   ?? '',
        activityLevels:     Array.isArray(data.activityLevels) ? data.activityLevels : [],
        patientPain:        data.patientPain         ?? '',
      }

      if (data.prescription?.medicines?.length)
        patch.prescription = { medicines: data.prescription.medicines }

      if (data.tests?.selectedTests?.length || data.tests?.testReason)
        patch.tests = {
          selectedTests: data.tests?.selectedTests ?? [],
          testReason:    data.tests?.testReason    ?? '',
        }

      if (data.treatments?.selectedTestTreatments?.length || data.treatments?.treatmentReason)
        patch.treatments = {
          generatedData:          data.treatments?.generatedData          ?? {},
          selectedTestTreatments: data.treatments?.selectedTestTreatments ?? [],
          treatmentReason:        data.treatments?.treatmentReason        ?? '',
        }

      if (data.followUp?.durationValue || data.followUp?.followUpNote)
        patch.followUp = {
          durationValue:    data.followUp?.durationValue    ?? '',
          durationUnit:     data.followUp?.durationUnit     ?? '',
          nextFollowUpDate: data.followUp?.nextFollowUpDate ?? '',
          followUpNote:     data.followUp?.followUpNote     ?? '',
        }

      if (data.exercise && Object.keys(data.exercise).length)
        patch.exercise = data.exercise

      if (data.summary?.complaints)
        patch.summary = { ...(data.summary ?? {}) }

      mergeAndLog('Complaints', patch)
      goToNext('Complaints')
    },

    // ── Assessment ────────────────────────────────────────────────────────
    Assessment: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Assessment'); return }

      const patch = {
        assessment: {
          chiefComplaint:     data.chiefComplaint     ?? '',
          painScale:          data.painScale          ?? '',
          painType:           data.painType           ?? '',
          duration:           data.duration           ?? '',
          onset:              data.onset              ?? '',
          aggravatingFactors: data.aggravatingFactors ?? '',
          relievingFactors:   data.relievingFactors   ?? '',
          observations:       data.observations       ?? '',
          difficultiesIn:      Array.isArray(data.difficultiesIn) ? data.difficultiesIn : [],
          otherDifficulty:     data.otherDifficulty     ?? '',
          dailyLivingAffected: data.dailyLivingAffected ?? '',
          postureAssessment: Array.isArray(data.postureAssessment) ? data.postureAssessment : [],
          postureDeviations: data.postureDeviations ?? '',
          romStatus:         Array.isArray(data.romStatus) ? data.romStatus : [],
          romRestricted:     data.romRestricted ?? '',
          romJoints:         data.romJoints     ?? '',
          muscleStrength:    Array.isArray(data.muscleStrength) ? data.muscleStrength : [],
          muscleWeakness:    data.muscleWeakness   ?? '',
          neurologicalSigns: Array.isArray(data.neurologicalSigns) ? data.neurologicalSigns : [],
          posture:            data.posture       ?? '',
          rangeOfMotion:      data.rangeOfMotion ?? '',
          specialTests:       data.specialTests  ?? '',
          patientPain:        data.patientPain   ?? '',
          painTriggers:       data.painTriggers    ?? '',
          chronicRelieving:   data.chronicRelieving ?? '',
          typeOfSport:         data.typeOfSport         ?? '',
          recurringInjuries:   data.recurringInjuries   ?? '',
          returnToSportGoals:  data.returnToSportGoals  ?? '',
          neuroDiagnosis: data.neuroDiagnosis ?? '',
          neuroOnset:     data.neuroOnset     ?? '',
          mobilityStatus: data.mobilityStatus ?? '',
          cognitiveStatus:data.cognitiveStatus ?? '',
        },
        ...(data.patientPain ? { patientPain: data.patientPain } : {}),
      }

      mergeAndLog('Assessment', patch)
      goToNext('Assessment')
    },

    // ── Diagnosis ─────────────────────────────────────────────────────────
    Diagnosis: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Diagnosis'); return }

      const patch = {
        diagnosis: {
          diagnosisRows: Array.isArray(data.diagnosis?.diagnosisRows)
            ? data.diagnosis.diagnosisRows
            : [
                {
                  physioDiagnosis: data.diagnosis?.physioDiagnosis ?? '',
                  affectedArea:    data.diagnosis?.affectedArea    ?? '',
                  severity:        data.diagnosis?.severity        ?? '',
                  stage:           data.diagnosis?.stage           ?? '',
                  notes:           data.diagnosis?.notes           ?? '',
                },
              ],
        },
      }

      mergeAndLog('Diagnosis', patch)
      goToNext('Diagnosis')
    },

    // ── Investigation ─────────────────────────────────────────────────────
    Investigation: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Investigation'); return }

      const patch = {
        investigation: {
          tests: data.investigation?.tests ?? data.tests ?? '',
          notes: data.investigation?.notes ?? data.notes ?? '',
        },
      }

      mergeAndLog('Investigation', patch)
      goToNext('Investigation')
    },

    // ── Plan ──────────────────────────────────────────────────────────────
    // KEY FIX: We now store both the structured sessions payload (for Summary/API)
    // AND the raw _internalState (for TherapySession to restore its local state
    // when the user returns to this tab without losing any edits).
    Plan: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Plan'); return }

      const programObj = data.selectedProgramObj ?? {}

      const sessionEntry = {
        programId:       data.selectedProgramId ?? programObj?.id ?? programObj?._id ?? programObj?.programId ?? '',
        programName:     programObj?.programName ?? programObj?.name ?? programObj?.title ?? '',
        clinicId:        localStorage.getItem('clinicId') || localStorage.getItem('hospitalId') || '',
        branchId:        programObj?.branchId ?? '',
        totalTherapyIds: Array.isArray(data.selectedTherapies) ? data.selectedTherapies.length : 0,
        serviceType:     data.mode ?? 'program',
        therapyData:     Array.isArray(data.selectedTherapies)
          ? data.selectedTherapies.map(t => ({
              therapyId:   t.therapyId   ?? '',
              therapyName: t.therapyName ?? '',
              exercises:   Array.isArray(t.exercises)
                ? t.exercises.map(ex => ({
                    therapyExercisesId: ex.therapyExercisesId ?? ex._id ?? ex.id ?? '',
                    name:               ex.exerciseName ?? ex.name ?? ex.exercise_name ?? '',
                    session:            String(ex.sessions ?? ex.session ?? ''),
                    frequency:          ex.frequencyCount
                      ? `${ex.frequencyCount} times/${(ex.frequencyUnit ?? 'day').toLowerCase()}`
                      : ex.frequency ?? '',
                    notes:              ex.notes ?? ex.instructions ?? '',
                    sets:               Number(ex.sets)        || 0,
                    repetitions:        Number(ex.reps ?? ex.repetitions) || 0,
                    totalPrice:         ex.totalPrice ?? ex.price ?? 0,
                  }))
                : [],
            }))
          : [],
        therapistId:     data.therapistId     ?? '',
        therapistName:   data.therapistName   ?? '',
        modalitiesUsed:  data.modalitiesUsed  ?? [],
        patientResponse: data.patientResponse ?? '',
        manualTherapy:   data.manualTherapy   ?? '',
        precautions:     data.precautions     ?? '',
      }

      // ── KEY: persist _internalState so TherapySession can restore ──────
      // This carries therophyDataState, therapyLibrary, therapyState so that
      // when the component remounts (tab change), it reads these back from
      // seed.sessions and re-derives its local state via restoreTherophyDataState.
      const internalState = data._internalState ?? {}

      const patch = {
        therapySessions: {
          overallStatus: data.overallStatus ?? '',
          sessions:      [sessionEntry],
          therapistId:   data.therapistId   ?? '',
          therapistName: data.therapistName ?? '',
          manualTherapy: data.manualTherapy ?? '',
          precautions:   data.precautions   ?? '',
          // Store internal state for tab-return restoration
          _internalState: internalState,
          // Store the raw selectedProgramId/Obj so ProgramDropdown can show selection
          selectedProgramId:  data.selectedProgramId  ?? '',
          selectedProgramObj: data.selectedProgramObj ?? null,
          serviceType:        data.mode               ?? 'program',
          modalitiesUsed:     data.modalitiesUsed     ?? [],
          patientResponse:    data.patientResponse    ?? '',
        },
      }

      mergeAndLog('Plan', patch)
      goToNext('Plan')
    },

    // ── HomePlan ──────────────────────────────────────────────────────────
    HomePlan: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('HomePlan'); return }

      const rawExercises = Array.isArray(data.exercisePlan?.exercises)
        ? data.exercisePlan.exercises : []

      const patch = {
        exercisePlan: {
          homeAdvice:    data.exercisePlan?.homeAdvice ?? data.homeAdvice ?? '',
          exercises:     rawExercises,
          homeExercises: rawExercises.map(ex => ({
            id:           ex.id           ?? ex._id ?? '',
            name:         ex.name         ?? '',
            sets:         String(ex.sets  ?? ''),
            reps:         String(ex.reps  ?? ''),
            frequency:    ex.frequency    ?? '',
            instructions: ex.instructions ?? '',
            videoUrl:     ex.videoUrl     ?? '',
            thumbnail:    ex.thumbnail    ?? '',
          })),
        },
      }

      mergeAndLog('HomePlan', patch)
      goToNext('HomePlan')
    },

    // ── FollowUp ──────────────────────────────────────────────────────────
    FollowUp: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('FollowUp'); return }

      const entries = Array.isArray(data.followUp) ? data.followUp : []
      const first   = entries[0] ?? {}

      const patch = {
        followUp: {
          nextVisitDate:   first.nextVisitDate   ?? '',
          reviewNotes:     first.reviewNotes     ?? '',
          modifications:   first.modifications   ?? '',
          treatmentStatus: first.treatmentStatus ?? '',
        },
        followUpEntries: entries,
      }

      mergeAndLog('FollowUp', patch)
      goToNext('FollowUp')
    },

    // ── Prescription ──────────────────────────────────────────────────────
    Prescription: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Prescription'); return }

      const patch = {
        prescription: {
          medicines: Array.isArray(data.medicines)
            ? data.medicines
            : Array.isArray(data.prescription?.medicines)
              ? data.prescription.medicines : [],
        },
      }

      mergeAndLog('Prescription', patch)
      goToNext('Prescription')
    },

    // ── History ───────────────────────────────────────────────────────────
    History: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('History'); return }
      mergeAndLog('History', { history: { ...data } })
      goToNext('History')
    },

    // ── Reports / Images ──────────────────────────────────────────────────
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

    // ── Summary ───────────────────────────────────────────────────────────
    Summary: (data = {}) => {
      setFormData(prev => {
        const finalPayload = {
          ...prev,
          summary: { ...prev.summary, ...(data ?? {}) },
        }

        console.group('🏁 ═══════════ FINAL PAYLOAD (Summary) ═══════════')
        console.log('symptoms            :', finalPayload.symptoms)
        console.log('assessment          :', finalPayload.assessment)
        console.log('diagnosis           :', finalPayload.diagnosis)
        console.log('investigation       :', finalPayload.investigation)
        console.log('therapySessions     :', finalPayload.therapySessions)
        console.log('exercisePlan        :', finalPayload.exercisePlan)
        console.log('followUp            :', finalPayload.followUp)
        console.log('prescription        :', finalPayload.prescription)
        console.log('history             :', finalPayload.history)
        console.log('ClinicImages        :', finalPayload.ClinicImages)
        console.log('── COMPLETE OBJECT ─────────────────────────────────')
        console.log(finalPayload)
        console.groupEnd()

        return finalPayload
      })
      goToNext('Summary')
    },
  }

  // ── Template mode ─────────────────────────────────────────────────────────
  const TABS = useMemo(() => {
    if (!fromDoctorTemplate) return ALL_TABS
    const hasDisease = formData?.symptoms?.complaints?.trim()
    return hasDisease ? ALL_TABS : ['Complaints']
  }, [ALL_TABS, fromDoctorTemplate, formData?.symptoms?.complaints])

  useEffect(() => {
    if (fromDoctorTemplate) setActiveTab('Complaints')
  }, [fromDoctorTemplate])

  // ── Save template ──────────────────────────────────────────────────────────
  const savePrescriptionTemplate = async () => {
    try {
      const complaints = formData.symptoms?.complaints?.trim() || ''
      const clinicId   = localStorage.getItem('hospitalId')

      const template = {
        clinicId,
        title:         complaints,
        symptoms:      complaints,
        tests:         formData.tests         || [],
        prescription:  formData.prescription  || [],
        treatments:    formData.treatments    || [],
        followUp:      formData.followUp      || {},
        exercisePlan:  formData.exercisePlan  || {},
        investigation: formData.investigation || {},
      }

      const res = await SavePatientPrescription(template)
      if (res.status === 200) success(res.message || 'Saved successfully!', { title: 'Success' })
      else                    info(res.message   || 'Updated successfully',  { title: 'Info'    })
    } catch (error) {
      console.error('❌ Error saving template:', error)
      alert('Failed to save prescription template.')
    }
  }

  // ── Scroll to top on tab change ────────────────────────────────────────────
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [activeTab])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppSidebar />

      {/* ── Tabs ── */}
      <div className="w-100" style={{ position: 'sticky', top: 110, zIndex: 10 }}>
        <CContainer fluid className="p-0">
          <CCard style={{ border: 0, borderRadius: 0, backgroundColor: COLORS.theme }}>
            <CCardBody className="p-0 pt-3">
              <CNav variant="tabs" role="tablist" style={{ whiteSpace: 'nowrap' }}>
                {TABS.map((t) => {
                  const active = t === activeTab
                  return (
                    <CNavItem key={t}>
                      <CNavLink
                        active={active}
                        onClick={() => setActiveTab(t)}
                        style={{ padding: '.5rem .85rem', cursor: 'pointer', borderRadius: '6px 6px 0 0' }}
                      >
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

      {/* ── Tab content ── */}
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