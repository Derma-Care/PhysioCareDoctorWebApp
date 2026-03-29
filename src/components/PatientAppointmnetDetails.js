import React, { useState, useCallback, useMemo, useEffect } from 'react'
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
  const { id } = useParams()
  const { state } = useLocation()
  const { patientData } = useDoctorContext()

  const [patient, setPatient] = useState(patientData || state?.patient || null)
  const [details, setDetails] = useState(state?.details || null)

  // ── Single accumulator — every tab ADDS to this, nothing is ever lost ────
  const [formData, setFormData] = useState(state?.formData || {
    symptoms:        {},
    assessment:      {},
    diagnosis:       {},
    treatmentPlans:  [],
    therapySessions: {},
    exercisePlan:    { exercises: [], homeAdvice: '' },
    followUp:        {},
    prescription:    {},
    history:         {},
    ClinicImages:    {},
    summary:         {},
  })

  const { success, info } = useToast()

  const ALL_TABS = tabs || [
    'Complaints',
    'Assessment',
    'Diagnosis',
    'TreatmentPlan',
    'TherapySessions',
    'ExercisePlan',
    'FollowUp',
    'Prescription',
    'History',
    'Reports',
    'Summary',
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

  // ── mergeAndLog ───────────────────────────────────────────────────────────
  // Merges the tab's patch into formData (keeping ALL previous tabs' data)
  // and logs both what this tab sent AND the full running total.
  const mergeAndLog = useCallback((tabName, patch) => {
    setFormData(prev => {
      const next = { ...prev, ...patch }

      console.group(`📦 [${tabName}] Next → accumulated formData:`)
      console.log('This tab patch  ➜', patch)
      console.log('Full formData   ➜', next)
      console.groupEnd()

      return next
    })
  }, [])

  // ── onNextMap ─────────────────────────────────────────────────────────────
  const onNextMap = {

    // ── Complaints (SymptomsDiseases) ─────────────────────────────────────
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
      }

      // If a template was applied, carry those sections forward too
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
    }
    ,

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
          posture:            data.posture            ?? '',
          rangeOfMotion:      data.rangeOfMotion      ?? '',
          specialTests:       data.specialTests       ?? '',
          observations:       data.observations       ?? '',
        },
      }

      mergeAndLog('Assessment', patch)
      goToNext('Assessment')
    },

    // ── Diagnosis (PrescriptionTab) ───────────────────────────────────────
    Diagnosis: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Diagnosis'); return }

      const patch = {
        diagnosis: {
          physioDiagnosis: data.diagnosis?.physioDiagnosis ?? '',
          affectedArea:    data.diagnosis?.affectedArea    ?? '',
          severity:        data.diagnosis?.severity        ?? '',
          stage:           data.diagnosis?.stage           ?? '',
          notes:           data.diagnosis?.notes           ?? '',
        },
      }

      mergeAndLog('Diagnosis', patch)
      goToNext('Diagnosis')
    },

    // ── TreatmentPlan (TestTreatments) ────────────────────────────────────
    TreatmentPlan: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('TreatmentPlan'); return }

      const patch = {
        treatmentPlans: Array.isArray(data.treatmentPlans) ? data.treatmentPlans : [],
      }

      mergeAndLog('TreatmentPlan', patch)
      goToNext('TreatmentPlan')
    },

    // ── TherapySessions ───────────────────────────────────────────────────
    TherapySessions: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('TherapySessions'); return }

      const patch = {
        therapySessions: {
          overallStatus: data.therapySessions?.overallStatus ?? '',
          sessions: Array.isArray(data.therapySessions?.sessions)
            ? data.therapySessions.sessions : [],
        },
      }

      mergeAndLog('TherapySessions', patch)
      goToNext('TherapySessions')
    },

    // ── ExercisePlan ──────────────────────────────────────────────────────
    ExercisePlan: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('ExercisePlan'); return }

      const patch = {
        exercisePlan: {
          exercises:  Array.isArray(data.exercisePlan?.exercises)
            ? data.exercisePlan.exercises : [],
          homeAdvice: data.exercisePlan?.homeAdvice ?? '',
        },
      }

      mergeAndLog('ExercisePlan', patch)
      goToNext('ExercisePlan')
    },

    // ── FollowUp (DoctorFollowUp) ─────────────────────────────────────────
 FollowUp: (data = {}) => {
  if (!data || typeof data !== 'object') {
    goToNext('FollowUp')
    return
  }

  const patch = {
    followUp: Array.isArray(data.followUp)
      ? data.followUp
      : [],
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

      const patch = { history: { ...data } }

      mergeAndLog('History', patch)
      goToNext('History')
    },

    // ── Reports / Images ──────────────────────────────────────────────────
    Reports: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Reports'); return }

      const patch = { ClinicImages: { ...data } }

      mergeAndLog('Reports', patch)
      goToNext('Reports')
    },

    Images: (data = {}) => {
      if (!data || typeof data !== 'object') { goToNext('Images'); return }

      const patch = { ClinicImages: { ...data } }

      mergeAndLog('Images', patch)
      goToNext('Images')
    },

    // ── Summary — FINAL combined payload ──────────────────────────────────
    // formData already has ALL tabs accumulated — just add summary on top
    Summary: (data = {}) => {
      setFormData(prev => {
        const finalPayload = {
          ...prev,
          summary: { ...prev.summary, ...(data ?? {}) },
        }

        console.group('🏁 ═══════════ FINAL PAYLOAD (Summary) ═══════════')
        console.log('symptoms        :', finalPayload.symptoms)
        console.log('assessment      :', finalPayload.assessment)
        console.log('diagnosis       :', finalPayload.diagnosis)
        console.log('treatmentPlans  :', finalPayload.treatmentPlans)
        console.log('therapySessions :', finalPayload.therapySessions)
        console.log('exercisePlan    :', finalPayload.exercisePlan)
        console.log('followUp        :', finalPayload.followUp)
        console.log('prescription    :', finalPayload.prescription)
        console.log('history         :', finalPayload.history)
        console.log('ClinicImages    :', finalPayload.ClinicImages)
        console.log('summary         :', finalPayload.summary)
        console.log('── COMPLETE OBJECT ──────────────────────────────────')
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
        title:        complaints,
        symptoms:     complaints,
        tests:        formData.tests        || [],
        prescription: formData.prescription || [],
        treatments:   formData.treatments   || [],
        followUp:     formData.followUp     || {},
        exercisePlan: formData.exercisePlan || {},
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