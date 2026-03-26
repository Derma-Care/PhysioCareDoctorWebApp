import React, { useState, useCallback, useMemo, useEffect } from 'react'
import TabContent from '../Prescription/TabContent'
import Snackbar from '../components/Snackbar'
import AppSidebar from './AppSidebar'
import { COLORS } from '../Themes'
import { CCard, CCardBody, CNav, CNavItem, CNavLink, CContainer } from '@coreui/react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDoctorContext } from '../Context/DoctorContext'
import { SavePatientPrescription } from '../Auth/Auth'
import { useToast } from '../utils/Toaster'

const CompletedAppointmentsView = ({ defaultTab, tabs, fromDoctorTemplate = false }) => {
  const { id } = useParams()
  const { state } = useLocation()
  const { patientData } = useDoctorContext()
  const [patient, setPatient] = useState(patientData || state?.patient || null)
  const navigate = useNavigate()
  const { success, info } = useToast()

  // Use tabs passed from props, or fallback to default
  const TABS = tabs || ['History', 'Reports', 'Images']

  const [activeTab, setActiveTab] = useState(defaultTab || TABS[0])
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

  const [formData, setFormData] = useState({
    symptoms: {},
    tests: {},
    prescription: {},
    treatments: {},
    followUp: {},
    summary: {},
    history: {},
    ClinicImages: {},
  })

  const goToNext = useCallback(
    (current) => {
      const i = TABS.indexOf(current)
      if (i > -1 && i < TABS.length - 1) setActiveTab(TABS[i + 1])
    },
    [TABS],
  )

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
      goToNext('Summary')
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

  const counts = useMemo(
    () => ({
      Investigations: formData?.tests?.selectedTests?.length || 0,
      Prescription: formData.prescription?.medicines?.length || 0,
      Procedures: formData.treatments?.selectedTreatments?.length || 0,
      Images: formData.ClinicImages?.items?.length || 0,
    }),
    [formData],
  )

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
                        {/* {count > 0 && (
                          <span
                            style={{
                              background: COLORS.primary,
                              color: '#fff',
                              borderRadius: '50%',
                              padding: '0 6px',
                              fontSize: '12px',
                              marginLeft: 6,
                            }}
                          >
                            {count}
                          </span>
                        )} */}
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
