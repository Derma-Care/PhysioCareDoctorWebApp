import React, { useState, useCallback, useMemo, useEffect } from 'react'
import TabContent from '../Prescription/TabContent'
import Snackbar from '../components/Snackbar'
import AppSidebar from './AppSidebar'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CNav, CNavItem, CNavLink, CContainer } from '@coreui/react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDoctorContext } from '../Context/DoctorContext'
import { SavePatientPrescription, getInProgressDetails, getFollowUpRecord } from '../Auth/Auth'
import { useToast } from '../utils/Toaster'
import { normalizeSavedData } from '../utils/normalizeData'
import Investigation from '../Prescription/Investigation'

const CompletedAppointmentsView = ({ defaultTab, tabs, fromDoctorTemplate = false }) => {
  const { id } = useParams()
  const { state } = useLocation()
  const { patientData, setPatientData } = useDoctorContext()

  // Clear patient context on unmount so sidebar reverts to doctor profile
  useEffect(() => {
    return () => {
      setPatientData(null)
    }
  }, [setPatientData])

  const [patient, setPatient] = useState(patientData || state?.patient || null)
  const navigate = useNavigate()
  const { success, info } = useToast()

  // Use tabs passed from props, or fallback to default
  const TABS = useMemo(() => {
    if (tabs) return tabs
    return ['History', 'Reports']
  }, [tabs])

  const [activeTab, setActiveTab] = useState(defaultTab || TABS[0])

  useEffect(() => {
    if (!TABS.includes(activeTab) && TABS.length > 0) {
      setActiveTab(TABS[0])
    }
  }, [TABS, activeTab])
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  // Fetch patient if needed
  useEffect(() => {
    if (!patient && id) {
      ; (async () => {
        try {
          const res = await fetch(`/api/patients/${id}`)
          if (!res.ok) throw new Error('Failed to fetch patient')
          const data = await res.json()
          setPatient(data)
        } catch (err) {
          console.error('Error fetching patient:', err)
        }
      })()
    }
  }, [id, patient])

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
    patientPain: '',
  })

  // ── Pre-populated from TooltipButton, no need to fetch here again ──

  const goToNext = useCallback(
    (current) => {
      const i = TABS.indexOf(current)
      if (i > -1 && i < TABS.length - 1) setActiveTab(TABS[i + 1])
    },
    [TABS],
  )

  const onNextMap = {
    Complaints: (data) => {
      setFormData((prev) => ({ ...prev, symptoms: { ...prev.symptoms, ...data } }))
      goToNext('Complaints')
    },
    Assessment: (data) => {
      setFormData((prev) => ({ ...prev, assessment: { ...prev.assessment, ...data } }))
      goToNext('Assessment')
    },
    Diagnosis: (data) => {
      setFormData((prev) => ({ ...prev, diagnosis: { ...prev.diagnosis, ...data } }))
      goToNext('Diagnosis')
    },
    Investigation: (data) => {
      setFormData((prev) => ({ ...prev, investigation: { ...prev.investigation, ...data } }))
      goToNext('Investigation')
    },
    Plan: (data) => {
      setFormData((prev) => ({ ...prev, therapySessions: { ...prev.therapySessions, ...data } }))
      goToNext('Plan')
    },
    HomePlan: (data) => {
      setFormData((prev) => ({ ...prev, exercisePlan: { ...prev.exercisePlan, ...data } }))
      goToNext('HomePlan')
    },
    FollowUp: (data) => {
      setFormData((prev) => ({ ...prev, followUp: Array.isArray(data) ? data : prev.followUp }))
      goToNext('FollowUp')
    },
    Prescription: (data) => {
      setFormData((prev) => ({ ...prev, prescription: { ...prev.prescription, ...data } }))
      goToNext('Prescription')
    },
    History: (data) => {
      setFormData((prev) => ({ ...prev, history: { ...prev.history, ...data } }))
      goToNext('History')
    },
    Reports: (data) => {
      setFormData((prev) => ({ ...prev, ClinicImages: { ...prev.ClinicImages, ...data } }))
      goToNext('Reports')
    },
  }

  const counts = useMemo(
    () => ({
      Assessment: formData?.tests?.selectedTests?.length || 0,
      Prescription: formData.prescription?.medicines?.length || 0,
      TreatmentPlan: formData.treatments?.selectedTreatments?.length || 0,
      Images: formData.ClinicImages?.items?.length || 0,
    }),
    [formData],
  )

  const savePrescriptionTemplate = async () => {
    try {
      const complaints = formData.symptoms?.complaints?.trim() || ''

      // if (!complaints) {
      //   alert('complaints is missing. Cannot save template.')
      //   return
      // }

      const clinicId = localStorage.getItem('hospitalId')
      const template = {
        clinicId,
        title: complaints,
        symptoms: complaints,
        assessment: formData.assessment || {},
        investigation: formData.investigation || {},
        diagnosis: formData.diagnosis || {},
        therapySessions: formData.therapySessions || {},
        followUp: formData.followUp || [],
        exercisePlan: formData.exercisePlan || {},
        recoverySupport: formData.recoverySupport || formData.exercisePlan?.recoverySupport || [],
      }

      const res = await SavePatientPrescription(template)
      console.log('✅ Saved template response:', res)

      if (res.status === 200) {
        success(`${res.message || 'Prescription Template saved successfully to server!'}`, {
          title: 'Success',
        })
      } else {
        info(`${res.message || 'A prescription template updated successfully'}`, { title: 'Info' })
      }
    } catch (error) {
      console.error('❌ Error saving template:', error)
      alert('Failed to save prescription template. Please try again.')
    }
  }


  const complaintsSeed = useMemo(() => ({
    ...formData.symptoms,
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

      {/* Tabs */}
      <div className="w-100" style={{ position: 'sticky', top: 110, zIndex: 10 }}>
        <CContainer fluid className="p-0">
          <CCard style={{ border: 0, borderRadius: 0, backgroundColor: `${COLORS.theme}` }}>
            <CCardBody className="py-1">
              <CNav variant="tabs" role="tablist" style={{ whiteSpace: 'nowrap' }}>
                {TABS.map((t) => {
                  const active = t === activeTab
                  const count = counts?.[t]
                  return (
                    <CNavItem key={t}>
                      <CNavLink
                        active={active}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTab(t)}
                        className="d-inline-flex align-items-center position-relative"
                        style={{
                          padding: '.5rem .850rem',
                          cursor: 'pointer',
                          // backgroundColor: active ? '#1976d2' : 'transparent',
                          borderRadius: '6px 6px 0 0',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            color: active ? COLORS.black : COLORS.black,
                            fontWeight: active ? '700' : '500',
                            backgroundColor: "transparent"
                          }}
                        >
                          {t}
                        </span>
                        {active && (
                          <span
                            style={{
                              position: 'absolute',
                              left: 12,
                              right: 12,
                              bottom: 0,
                              height: 3,
                              borderRadius: 2,
                              background: 'linear-gradient(90deg, #0d6efd, #42a5f5)',
                            }}
                          />
                        )}
                      </CNavLink>
                    </CNavItem>
                  )
                })}
              </CNav>
            </CCardBody>
          </CCard>
        </CContainer>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <TabContent
          activeTab={activeTab}
          formData={formData}
          complaintsSeed={complaintsSeed}
          onNext={onNextMap[activeTab]}
          setActiveTab={setActiveTab}
          onSaveTemplate={savePrescriptionTemplate}
          patientData={patient}
          setFormData={setFormData}
          fromDoctorTemplate={fromDoctorTemplate} // ✅ now correctly passed
          setImage={false}
        />
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default CompletedAppointmentsView
