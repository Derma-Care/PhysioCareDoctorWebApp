import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
} from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import Snackbar from '../components/Snackbar'
import { COLORS } from '../Themes'
import './Summary.css'
import { useToast } from '../utils/Toaster'
import FileUploader from './FileUploader'
import { createDoctorSaveDetails, getClinicDetails, getDoctorDetails } from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'

import PrescriptionPDF from '../utils/PdfGenerator'
import { PDFDownloadLink, View, StyleSheet, Text } from '@react-pdf/renderer'

/**
 * Props:
 * - patientData
 * - formData: {
 *    symptoms: { symptomDetails, doctorObs, diagnosis, duration }
 *    tests: { selectedTests: [{name, reason?}] }
 *    prescription: { medicines: [{ id, medicine, dose, remind, note, duration, time }] }
 *    treatments: { selectedTreatments: [{name, reason?}] }
 *    followUp: { duration, date, note }
 *   }
 */

const DoctorSummary = ({
  onNext,
  sidebarWidth = 0,
  onSaveTemplate,
  patientData,
  formData = {},
}) => {
  const styles = StyleSheet.create({
    page: { padding: 28, fontSize: 11, fontFamily: 'Helvetica' },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 10,
      borderBottom: '2 solid #e5e7eb',
      marginBottom: 12,
    },
    logoBox: {
      width: 64,
      height: 64,
      border: '1 solid #e5e7eb',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
    },
    logo: { width: 56, height: 56, objectFit: 'contain' },
    hospitalInfo: { marginLeft: 10, flexGrow: 1 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
    sub: { color: '#64748b', marginBottom: '5px' },

    /* Blocks & spacing */
    section: { marginBottom: 12 },
    card: { border: '1 solid #e5e7eb', borderRadius: 6, padding: 10, backgroundColor: '#ffffff' },
    cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#111827' },
    rowSpace: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    kvRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    kvCol: { width: '48%' },
    label: { color: '#64748b', marginBottom: '5px' },
    value: { fontWeight: 'bold', marginBottom: '5px' },

    /* Lists */
    dotRow: { flexDirection: 'row', marginBottom: 2 },
    dot: { width: 10, textAlign: 'center' },
    dotText: { flex: 1 },

    /* Large table (prescription) */
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#e5e7eb',
      paddingVertical: 5,
      paddingHorizontal: 4,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: 4,
      borderBottom: '1 solid #eeeeee',
    },
    cell: { paddingRight: 6, fontSize: 11, lineHeight: 1.2 },
    cellCenter: { textAlign: 'center' },
    zebra: { backgroundColor: '#fafafa' },

    /* Small schedule table */
    smHeadRow: {
      flexDirection: 'row',
      backgroundColor: '#f2f4f7',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    smRow: {
      flexDirection: 'row',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderBottom: '1 solid #f1f5f9',
    },
    smCell: { fontSize: 10 },

    /* Footer / signature */
    signatureBlock: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      paddingTop: 10,
      borderTop: '1 solid #e5e7eb',
    },
    legend: { fontSize: 10, color: '#6b7280', marginTop: 6 },
  })
  const {

    doctorDetails,
    setDoctorDetails,
    setClinicDetails,
    clinicDetails,
    updateTemplate,
  } = useDoctorContext()
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const navigate = useNavigate()
  const navigatingRef = useRef(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [clickedSaveTemplate, setClickedSaveTemplate] = useState(false)

  const { success, error, info, warning } = useToast()

  // map safely
  const symptomsDetails = formData?.symptoms?.symptomDetails ?? formData?.symptoms?.doctorObs ?? '—'
  const symptomsDuration = formData?.symptoms?.duration ?? patientData?.duration ?? '—'
  const doctorObs = formData?.symptoms?.doctorObs ?? patientData?.doctorObs ?? '—'
  const attachments = formData?.symptoms?.attachments ?? patientData?.attachments ?? '—'
  // const reports = Array.isArray(formData.symptoms.reports) ? patientData?.reports : []

  const diagnosis = formData?.symptoms?.diagnosis ?? formData?.summary?.diagnosis ?? ''

  const tests = Array.isArray(formData?.tests?.selectedTests) ? formData.tests.selectedTests : []
  const testsReason = formData?.tests?.testReason ? formData.tests.testReason : ''
  const treatmentReason = formData?.treatments?.treatmentReason
    ? formData.treatments.treatmentReason
    : ''
  const treatments = Array.isArray(formData?.treatments?.selectedTestTreatments)
    ? formData.treatments.selectedTestTreatments
    : []

  const treatmentSchedules = formData?.treatments?.generatedData || {}
  const medicines = Array.isArray(formData?.prescription?.medicines)
    ? formData.prescription.medicines
    : []

  const followUp = {
    durationValue: formData.followUp.durationValue || 'NA',
    durationUnit: formData.followUp.durationUnit || 'NA',
    date: formData.followUp.nextFollowUpDate || 'NA',
    note: formData.followUp.followUpNote || 'NA',
  }

  const ACTIONS = { SAVE: 'save', SAVE_PRINT: 'savePrint' }
  const freqLabel = (f) =>
    f === 'day' ? 'Daily' : f === 'week' ? 'Weekly' : f === 'month' ? 'Monthly' : f || '—'

  const handleDelete = (id) => {
    // to actually delete, lift state to parent and update formData.prescription.medicines
    console.log('Delete prescription with ID:', id)
  }

  const handlePrint = async () => {
    const container = document.getElementById('print-area')
    if (!container) return

    const printContents = container.innerHTML
    const printWindow = window.open('', '', 'height=800,width=600')
    if (!printWindow) return alert('Please allow pop-ups to print.')

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Summary</title>
          <style>
            body { margin: 20px; color: #000; font-family: Segoe UI, Arial, sans-serif; }
            h3, h4, h5 { margin-top: 16px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 14px; }
            .summary-section { margin-bottom: 18px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    printWindow.document.close()

    await new Promise((resolve) => {
      const done = () => resolve()
      if (printWindow.document.readyState === 'complete') setTimeout(done, 50)
      else printWindow.addEventListener('load', () => setTimeout(done, 50))
    })

    await new Promise((resolve) => {
      let resolved = false
      const cleanup = () => {
        if (resolved) return
        resolved = true
        try {
          printWindow.close()
        } catch { }
        resolve()
      }
      try {
        printWindow.focus()
        printWindow.onafterprint = cleanup
        printWindow.print()
        setTimeout(cleanup, 1500)
      } catch {
        cleanup()
      }
    })
  }

  const capFirstOnly = (v) => {
    if (Array.isArray(v)) return v.map(capFirstOnly).join(', ')
    if (typeof v === 'string' && v.length) return v.replace(/^./, (c) => c.toUpperCase())
    return v
  }

  // put this helper above your component or inside it
  const toInitials = (input, sep = ', ') => {
    if (!input) return ''

    let tokens = []
    if (Array.isArray(input)) {
      tokens = input
    } else {
      const s = String(input).trim()
      if (s.includes(',') || s.includes('|') || /\s/.test(s)) {
        tokens = s.split(/[,|\s]+/)
      } else {
        tokens = s.match(/morning|afternoon|evening|night/gi) || [s]
      }
    }

    const map = {
      morning: 'M',
      m: 'M',
      afternoon: 'A',
      a: 'A',
      evening: 'E',
      e: 'E',
      night: 'N',
      n: 'N',
    }

    return tokens
      .map((t) => map[t.toLowerCase()] ?? (t[0]?.toUpperCase() || ''))
      .filter(Boolean)
      .join(sep)
  }

  useEffect(() => {
    const fetchDetails = async () => {
      const doctor = await getDoctorDetails()
      const clinic = await getClinicDetails()

      if (doctor) setDoctorDetails(doctor)
      if (clinic) setClinicDetails(clinic)
    }

    fetchDetails()
  }, [])

  const onClickSave = () => {
    setPendingAction(ACTIONS.SAVE)
    setShowTemplateModal(true)
  }
  const onClickSavePrint = () => {
    setPendingAction(ACTIONS.SAVE_PRINT)
    setShowTemplateModal(true)
  }

  console.log(clinicDetails)

  const confirmSaveAsTemplate = async () => {
    const action = pendingAction

    setShowTemplateModal(false)
    try {
      await onSaveTemplate?.()

      // ✅ Call API after saving template
      const payload = {
        bookingId: patientData.bookingId,
        // doctorName: doctorDetails.doctorName,
        customerId: patientData?.customerId,
        clinicName: clinicDetails.name,
        clinicId: clinicDetails.hospitalId,
        patientId: patientData.patientId,
        doctorId: doctorDetails.doctorId,
        symptoms: formData.symptoms,
        tests: formData.tests,
        treatments: formData?.treatments,
        followUp: formData.followUp,
        prescription: formData.prescription,
        subServiceId: patientData?.subServiceId
        // visitType: patientData?.visitType || "OFFLINE",
      }
      console.log(payload)
      const response = await createDoctorSaveDetails(payload)
      console.log(response)
      if (response) {
        success('Prescription Data Saved Successfully...!', { title: 'Success' })
        navigate('/dashboard', { replace: true })
      }

      // if (action === ACTIONS.SAVE_PRINT) {
      //   await handlePrint()
      // }
    } finally {
      setPendingAction(null)
    }
  }

  const skipTemplate = async () => {
    setShowTemplateModal(false)
    setPendingAction(null)
    // ✅ Call API after saving template
    const payload = {
      bookingId: patientData.bookingId,
      doctorName: doctorDetails.doctorName,
      customerId: patientData?.customerId,
      clinicName: clinicDetails.name,
      clinicId: clinicDetails.hospitalId,
      patientId: patientData.patientId,
      doctorId: doctorDetails.doctorId,
      symptoms: formData.symptoms,
      tests: formData.tests,
      treatments: formData?.treatments,
      followUp: formData.followUp,
      prescription: formData.prescription,
      subServiceId: patientData?.subServiceId

    }
    console.log(payload)
    const response = await createDoctorSaveDetails(payload)
    console.log(response)
    if (response) {
      success('Prescription Data Saved Successfully...!', { title: 'Success' })
      navigate('/dashboard', { replace: true })
    } else {
      error('Prescription Data Not Saved Successfully...!', { title: 'Error' })
    }
  }
  console.log('durationValue:', followUp.durationValue)
  const handleClick = () => {
    // First, call your save function
    onSaveTemplate?.()

    // Then navigate to the desired screen
    navigate('/Dashboard') // <-- replace with your route
  }
  return (
    <div className="pb-5" style={{ backgroundColor: COLORS.theme }}>
      <CContainer fluid className="p-0" id="print-area">
        {diagnosis ||
          tests.length > 0 ||
          treatments.length > 0 ||
          (treatmentSchedules && Object.keys(treatmentSchedules).length > 0) ||
          medicines.length > 0 ||
          followUp.durationValue !== 'NA' ? (
          <>
            {/* Diagnosis */}
            {diagnosis && (
              <CCard className="shadow-sm mb-3">
                <CCardHeader className="py-2">
                  <strong>Probable Disease</strong>
                </CCardHeader>
                <CCardBody>
                  <div className="fs-6">{diagnosis}</div>
                </CCardBody>
              </CCard>
            )}
            {/* Medication Table */}
            {medicines.length > 0 && (
              <CCard className="shadow-sm mb-3">
                <CCardHeader className="py-2">
                  <strong style={{ color: COLORS.black }}>Medication Details</strong>
                </CCardHeader>
                <CCardBody>
                  <CTable striped hover responsive className="align-middle">
                    <CTableHead>
                      <CTableRow className="bg-primary text-white">
                        <CTableHeaderCell>S.No</CTableHeaderCell>
                        <CTableHeaderCell>Medicine Type</CTableHeaderCell>
                        <CTableHeaderCell>Medicine</CTableHeaderCell>
                        <CTableHeaderCell>Dosage</CTableHeaderCell>
                        <CTableHeaderCell>Duration</CTableHeaderCell>
                        <CTableHeaderCell>Frequency</CTableHeaderCell>
                        <CTableHeaderCell>Instructions</CTableHeaderCell>
                        <CTableHeaderCell>Notes</CTableHeaderCell>
                        <CTableHeaderCell>Timings</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {medicines.map((med, index) => {
                        const durationValue = parseInt(med.duration, 10);
                        const durationUnit =
                          med.durationUnit && med.durationUnit !== "NA"
                            ? med.durationUnit.trim()
                            : "";

                        const displayDuration =
                          durationValue > 0 && durationUnit
                            ? `${durationValue} ${durationUnit}${durationValue > 1 ? "s" : ""}`
                            : durationValue > 0
                              ? `${durationValue}`
                              : "NA";


                        const displayFrequency =
                          med.remindWhen && med.remindWhen !== "NA"
                            ? med.remindWhen === "Other" && med.others
                              ? `Other (${med.others})`
                              : med.remindWhen
                            : med.others || "NA";

                        const displayTimes =
                          Array.isArray(med.times) && med.times.filter(Boolean).length > 0
                            ? med.times.filter(Boolean).join(", ")
                            : "NA";

                        return (
                          <CTableRow key={index}>
                            <CTableDataCell>{index + 1}</CTableDataCell>
                            <CTableDataCell>{med.medicineType || "NA"}</CTableDataCell>
                            <CTableDataCell>{med.name || "NA"}</CTableDataCell>
                            <CTableDataCell>{med.dose || "NA"}</CTableDataCell>
                            <CTableDataCell>{displayDuration}</CTableDataCell>
                            <CTableDataCell>{displayFrequency}</CTableDataCell>
                            <CTableDataCell>{med.food || "NA"}</CTableDataCell>
                            <CTableDataCell>{med.note || "NA"}</CTableDataCell>
                            <CTableDataCell>{displayTimes}</CTableDataCell>
                          </CTableRow>
                        );
                      })}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            )}

            {/* Tests */}
            {(tests.length > 0 || testsReason) && (
              <CCard className="shadow-sm mb-3">
                <CCardHeader className="py-2">
                  <strong style={{ color: COLORS.black }}>Investigations</strong>
                </CCardHeader>
                <CCardBody>
                  {tests.length > 0 ? (
                    <ul className="mb-2">
                      {tests.map((t, i) => (
                        <li key={`test-${i}`}>
                          <span className="fw-semibold">Recommended Test (Optional): </span>
                          <span>{typeof t === 'string' ? t : t?.name || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-2">
                      <span className="fw-semibold">Recommended Test (Optional):</span> NA
                    </p>
                  )}

                  {testsReason && (
                    <div className="mt-2">
                      <div className="text-muted fw-semibold">Reason:{testsReason}</div>

                    </div>
                  )}
                </CCardBody>
              </CCard>
            )}

            {/* Treatments */}
            {treatments.length > 0 && (
              <CCard className="shadow-sm mb-3">
                <CCardHeader className="py-2">
                  <strong style={{ color: COLORS.black }}>Procedures</strong>
                </CCardHeader>
                <CCardBody>
                  <ul className="mb-2">
                    {treatments.map((t, i) => (
                      <li key={`treat-${i}`}>
                        <strong>Selected Treatments: </strong>
                        {typeof t === "string" ? t : t?.name || "—"}
                      </li>
                    ))}
                  </ul>

                  {treatmentReason ? (
                    <div className="mt-2">
                      <div className="text-muted">Reason</div>
                      <div>{treatmentReason}</div>
                    </div>
                  ) : null}
                </CCardBody>
              </CCard>
            )}

            {/* Treatment Schedules */}
            {treatmentSchedules && Object.keys(treatmentSchedules).length > 0 && (
              <CCard className="shadow-sm mb-3">
                <CCardHeader className="py-2">
                  <strong style={{ color: COLORS.black }}>Treatment Schedule</strong>
                </CCardHeader>
                <CCardBody>
                  {Object.entries(treatmentSchedules).map(([name, meta]) => (
                    <CCard key={name} className="mb-3 p-2">
                      <div style={{ fontWeight: 'bold' }}>
                        {name} — {freqLabel(meta?.frequency)} ({meta?.sittings ?? 0} sittings from{' '}
                        {meta?.startDate ?? '—'})
                      </div>

                      <div className="mt-2 table-responsive">
                        <table className="table table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: "8%", textAlign: "center" }}>S.No</th>
                              <th style={{ width: "46%", textAlign: "center" }}>Date</th>
                              <th style={{ width: "46%", textAlign: "center" }}>Sitting</th>
                              <th style={{ width: "46%", textAlign: "center" }}>Status</th>
                            </tr>

                          </thead>
                          <tbody>
                            {(meta?.dates || []).map((d, i) => (
                              <tr key={`${name}-row-${i}`} className="text-center">
                                <td>{i + 1}</td>
                                <td>{d?.date ?? '—'}</td>
                                <td>{d?.sitting ?? '—'}</td>
                                <td style={{ textAlign: "center" }}>
                              <span
                                className={`badge ${d?.status === "Pending"
                                    ? "bg-warning text-dark"
                                    : d?.status === "Completed"
                                      ? "bg-success"
                                      : d?.status === "Cancelled"
                                        ? "bg-danger"
                                        : "bg-secondary"
                                  }`}
                              >
                                {d?.status || "Pending"}
                              </span>
                            </td>
                              </tr>
                            ))}
                          </tbody>

                        </table>
                      </div>

                      {meta?.reason ? <div className="mt-2">Reason: {meta.reason}</div> : null}
                    </CCard>
                  ))}
                </CCardBody>
              </CCard>
            )}



            {/* Follow-up Plan */}
            {followUp.durationValue !== 'NA' && (
              <CCard className="shadow-sm mb-4">
                <CCardHeader className="py-2">
                  <strong style={{ color: COLORS.black }}>Follow-up Plan</strong>
                </CCardHeader>
                <CCardBody>
                  <CCol xs={12} md={6}>
                    <div>
                      <span className="fw-semibold">Next Follow Up :</span>{' '}
                      {followUp.durationValue && followUp.durationValue !== 0 ? (
                        <>
                          After{' '}
                          <span>
                            {followUp.durationValue} {followUp.durationUnit || 'NA'}
                          </span>
                          {followUp.date && followUp.date !== '—' && (
                            <> ({followUp.date})</>
                          )}
                        </>
                      ) : (
                        'NA'
                      )}
                    </div>
                  </CCol>

                  <CCol xs={12}>
                    <div>
                      <span className="fw-semibold">Follow Up Note:</span>{' '}
                      <span style={{ whiteSpace: 'pre-wrap' }}>
                        {followUp.note && followUp.note.trim() !== '' ? followUp.note : 'NA'}
                      </span>
                    </div>
                  </CCol>
                </CCardBody>
              </CCard>
            )}
          </>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '60vh' }}
          >
            <span style={{ fontWeight: 'bold' }}>No data found for this patient.</span>
          </div>
        )}
      </CContainer>

      {/* Sticky Bottom Bar */}

      <div
        className="position-fixed bottom-0 end-0"

        style={{
          backgroundColor: '#F3f3f7',
          padding: 12,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Button customColor={COLORS.bgcolor}
          color={COLORS.black} onClick={handleClick}>
          {!updateTemplate ? 'Update' : 'Save Prescription Template'}
        </Button>
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default DoctorSummary
