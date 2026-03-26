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

  const [formData, setFormData] = useState(state?.formData || {
    symptoms: {},
    tests: {},
    prescription: {},
    treatments: {},
    followUp: {},
    summary: {},
    history: {},
    ClinicImages: {},
  })

  const { success, info } = useToast()

  // Tabs (with default fallback)
  const ALL_TABS = tabs || [
    'Diagnosis',
    'Investigations',
    'Medication',
    'Procedures',
    'Follow-up',
    'Prescription',
    'Images',
    'History',
    'Reports',
  ]

  const [activeTab, setActiveTab] = useState(defaultTab || ALL_TABS[0])
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  // 🔥 Fetch details only if In-Progress and not already passed
  useEffect(() => {
    if (state?.fromTab === 'In-Progress' && patient && !details) {
      (async () => {
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

  // Go to next tab
  const goToNext = useCallback(
    (current) => {
      const i = ALL_TABS.indexOf(current)
      if (i > -1 && i < ALL_TABS.length - 1) setActiveTab(ALL_TABS[i + 1])
    },
    [ALL_TABS],
  )

  // Tab-specific next actions
  const onNextMap = {
    Diagnosis: (data) => {
      setFormData((prev) => ({ ...prev, symptoms: { ...prev.symptoms, ...data } }))
      goToNext('Diagnosis')
    },
    Investigations: (data) => {
      setFormData((prev) => ({ ...prev, tests: { ...prev.tests, ...data } }))
      goToNext('Investigations')
    },
    Medication: (data) => {
      setFormData((prev) => ({ ...prev, prescription: { ...prev.prescription, ...data } }))
      goToNext('Medication')
    },
    Procedures: (data) => {
      setFormData((prev) => ({ ...prev, treatments: { ...prev.treatments, ...data } }))
      goToNext('Procedures')
    },
    'Follow-up': (data) => {
      setFormData((prev) => ({ ...prev, followUp: { ...prev.followUp, ...data } }))
      goToNext('Follow-up')
    },
    Summary: async (data) => {
      const payload = { ...formData, summary: { ...formData.summary, ...data } }
      goToNext('Prescription')
      console.log('FINAL SUBMIT (Summary):', payload)
    },
    Images: (data) => {
      setFormData((prev) => ({ ...prev, ClinicImages: { ...prev.ClinicImages, ...data } }))
      goToNext('Images')
    },
    History: (data) => {
      const payload = { ...formData, history: { ...formData.history, ...data } }
      setFormData((prev) => ({ ...prev, history: payload.history }))
      console.log('FINAL SUBMIT (History):', payload)
    },
  }

  const TABS = useMemo(() => {
    if (!fromDoctorTemplate) return ALL_TABS

    const hasDisease =
      formData?.symptoms?.diagnosis && formData.symptoms.diagnosis.trim() !== ''

    if (hasDisease) return ALL_TABS
    return ['Diagnosis']
  }, [ALL_TABS, fromDoctorTemplate, formData?.symptoms?.diagnosis])
  // 🔹 Auto-open "Diagnosis" tab when doctor opens template mode
  useEffect(() => {
    if (fromDoctorTemplate) {
      setActiveTab('Diagnosis')
    }
  }, [fromDoctorTemplate])
  // Badge counts
  const counts = useMemo(
    () => ({
      Investigations: formData?.tests?.selectedTests?.length || 0,
      Prescription: formData.prescription?.medicines?.length || 0,
      Procedures: formData.treatments?.selectedTreatments?.length || 0,
      Images: formData.ClinicImages?.items?.length || 0,
    }),
    [formData],
  )

  // Save prescription template
  const savePrescriptionTemplate = async () => {
    try {
      const diagnosis = formData.symptoms?.diagnosis?.trim() || ''

      // if (!diagnosis) {
      //   alert('Diagnosis is missing. Cannot save template.')
      //   return
      // }

      const clinicId = localStorage.getItem('hospitalId')
      const template = {
        clinicId,
        title: diagnosis,
        symptoms: diagnosis,
        tests: formData.tests || [],
        prescription: formData.prescription || [],
        treatments: formData.treatments || [],
        followUp: formData.followUp || '',
      }

      const res = await SavePatientPrescription(template)
      if (res.status === 200) {
        success(`${res.message || 'Prescription Template saved successfully to server!'}`, { title: 'Success' })
      } else {
        info(`${res.message || 'A prescription template updated successfully'}`, { title: 'Info' })
      }
    } catch (error) {
      console.error('❌ Error saving template:', error)
      alert('Failed to save prescription template. Please try again.')
    }
  }



  // 🔹 Scroll to top when active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppSidebar />

      {/* Tabs */}
      <div className="w-100" style={{ position: 'sticky', top: 110, zIndex: 10 }}>
        <CContainer fluid className="p-0">
          <CCard style={{ border: 0, borderRadius: 0, backgroundColor: `${COLORS.theme}` }}>
            <CCardBody className="p-0 pt-3">
              <CNav variant="tabs" role="tablist" style={{ whiteSpace: 'nowrap' }}>
                {TABS.map((t) => {
                  const active = t === activeTab
                  const label = fromDoctorTemplate && t === 'Diagnosis' ? 'Diseases' : t

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
                          borderRadius: '6px 6px 0 0',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            color: active ? COLORS.black : COLORS.black,
                            fontWeight: active ? '700' : '500',
                            backgroundColor: 'transparent',
                          }}
                        >
                          {label}
                        </span>
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
          onNext={onNextMap[activeTab]}
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
