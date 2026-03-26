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
import { pdf } from '@react-pdf/renderer'
import { capitalizeEachWord, capitalizeFirst } from '../utils/CaptalZeWord'

/**
 * Props:
 * - patientData
 * - formData: {
 *    symptoms: { symptomDetails, doctorObs, diagnosis, duration, attachments? }
 *    tests: { selectedTests: string[], testReason?: string }
 *    prescription: { medicines: [{ id?, name, dose, remindWhen, note, duration, times }] }
 *    treatments: { selectedTestTreatments: string[], treatmentReason?, generatedData? }
 *    followUp: { durationValue, durationUnit, nextFollowUpDate, followUpNote }
 *   }
 */

const Summary = ({ onNext, sidebarWidth = 0, onSaveTemplate, patientData, formData = {}, fromPage }) => {
  const { doctorDetails, setDoctorDetails, setClinicDetails, clinicDetails, updateTemplate } =
    useDoctorContext()

  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const navigate = useNavigate()
  const navigatingRef = useRef(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [clickedSaveTemplate, setClickedSaveTemplate] = useState(false)

  const { success, error, info, warning } = useToast()

  // ----------- Safe mapping from props -----------
  const symptomsDetails = formData?.symptoms?.symptomDetails ?? formData?.symptoms?.doctorObs ?? '—'
  const symptomsDuration = formData?.symptoms?.duration ?? patientData?.duration ?? '—'
  const doctorObs = formData?.symptoms?.doctorObs ?? patientData?.doctorObs ?? '—'
  const attachments = Array.isArray(formData?.symptoms?.attachments)
    ? formData.symptoms.attachments
    : Array.isArray(patientData?.attachments)
      ? patientData.attachments
      : []

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
    durationValue: formData?.followUp?.durationValue ?? 'NA',
    durationUnit: formData?.followUp?.durationUnit ?? 'NA',
    date: formData?.followUp?.nextFollowUpDate ?? 'NA',
    note: formData?.followUp?.followUpNote ?? 'NA',
  }

  const ACTIONS = { SAVE: 'save', SAVE_PRINT: 'savePrint' }
  const freqLabel = (f) =>
    f === 'day' ? 'Daily' : f === 'week' ? 'Weekly' : f === 'month' ? 'Monthly' : f || '—'

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

  // Inside useEffect (after fetching doctor & clinic details)
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const doctor = await getDoctorDetails()
        const clinic = await getClinicDetails()
        console.log("Fetched Doctor Details:", doctor)
        console.log("Fetched Clinic Details:", clinic)

        if (doctor) setDoctorDetails(doctor)
        if (clinic) setClinicDetails(clinic)
      } catch (e) {
        console.error('Failed to load doctor/clinic details', e)
      }
    }
    fetchDetails()
  }, [])

  // ---------------- PDF helpers ----------------
  // PDF Render
  const renderPrescriptionPdfBlob = async () => {
    console.log("Rendering Prescription PDF with:", { doctorDetails, clinicDetails, formData, patientData })
    return await pdf(
      <PrescriptionPDF
        doctorData={doctorDetails}
        clicniData={clinicDetails}
        formData={formData}
        patientData={patientData}
      />,
    ).toBlob()
  }


  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const res = reader.result
        const base64 = typeof res === 'string' ? res.split(',')[1] : ''
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Package all data + pdf (base64) and send it
  // Upload prescription
  const uploadPrescription = async ({ downloadAfter = false } = {}) => {
    try {
      // ✅ 1️⃣ Check diagnosis first
      const diagnosis = formData?.symptoms?.diagnosis?.trim() || '';
      if (!diagnosis) {
        warning('"Diagnosis" is missing. Cannot save or upload the prescription.', { title: 'Warning' });
        return false;
      }

      // ✅ 2️⃣ Validate treatment dates (no past dates allowed)
      const treatmentSchedules = formData?.treatments || {};
      let hasPastDate = false;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize for date-only comparison

      Object.values(treatmentSchedules).forEach((meta) => {
        (meta?.dates || []).forEach((d) => {
          if (d?.date && new Date(d.date) < today) {
            hasPastDate = true;
          }
        });
      });

      if (hasPastDate) {
        warning('Please change the date — past dates are not allowed.', { title: 'Warning' });
        return false; // stop saving
      }

      console.log("Preparing to upload prescription...");
      const blob = await renderPrescriptionPdfBlob();
      console.log("PDF Blob Generated:", blob);

      const base64 = await blobToBase64(blob);
      console.log("Base64 PDF length:", base64.length);

      const safeName = (patientData?.name || 'Prescription').replace(/[^\w\-]+/g, '_');
      const filename = `${safeName}.pdf`;

      const payload = {
        bookingId: patientData?.bookingId,
        clinicName: clinicDetails?.name,
        customerId: patientData?.customerId,
        clinicId: clinicDetails?.hospitalId,
        patientId: patientData?.patientId,
        doctorId: doctorDetails?.doctorId,
        symptoms: formData?.symptoms,
        tests: formData?.tests,
        treatments: formData?.treatments,
        followUp: formData?.followUp,
        prescription: formData?.prescription,
        prescriptionPdf: [base64],
        subServiceId: patientData?.subServiceId
      };

      console.log("Final Payload to Upload:", payload);

      const resp = await createDoctorSaveDetails(payload);
      console.log("API Response:", resp);

      if (resp) {
        success('Prescription saved successfully!', { title: 'Success' });
      } else {
        warning('Saved, but got an unexpected response.');
      }

      if (downloadAfter) {
        console.log("Downloading PDF file:", filename);
        downloadBlob(blob, filename);
      }

      return true;
    } catch (e) {
      console.error("Upload Prescription Error:", e);
      error('Failed to generate or send the PDF.', { title: 'Error' });
      return false;
    }
  };



  // ---------------- Actions ----------------
  // Actions
  const onClickSave = () => {
    console.log("Save button clicked")
    setPendingAction(ACTIONS.SAVE)
    setShowTemplateModal(true)
  }

  const onClickSavePrint = () => {
    console.log("Save & Print button clicked")
    setPendingAction(ACTIONS.SAVE_PRINT)
    setShowTemplateModal(true)
  }

  const confirmSaveAsTemplate = async () => {
    const action = pendingAction
    console.log("Confirm Save As Template Action:", action)
    setShowTemplateModal(false)
    try {
      await onSaveTemplate?.()
      console.log("Template Saved Successfully")
      const ok = await uploadPrescription({ downloadAfter: action === ACTIONS.SAVE_PRINT })
      if (ok) {
        console.log("Navigation to Dashboard")
        navigate('/dashboard', { replace: true })
      }
    } finally {
      setPendingAction(null)
    }
  }

  const skipTemplate = async () => {
    try {
      console.log("Preparing to upload prescription...")
      const blob = await renderPrescriptionPdfBlob()
      console.log("PDF Blob Generated:", blob)

      const base64 = await blobToBase64(blob)
      console.log("Base64 PDF length:", base64.length)

      const safeName = (patientData?.name || 'Prescription').replace(/[^\w\-]+/g, '_')
      const filename = `${safeName}.pdf`

      const payload = {
        bookingId: patientData?.bookingId,
        clinicName: clinicDetails?.name,
        customerId: patientData?.customerId,
        clinicId: clinicDetails?.hospitalId,
        patientId: patientData?.patientId,
        doctorId: doctorDetails?.doctorId,
        symptoms: formData?.symptoms,
        tests: formData?.tests,
        treatments: formData?.treatments,
        followUp: formData?.followUp,
        prescription: formData?.prescription,
        prescriptionPdf: [base64],
        visitType: patientData?.visitType || "OFFLINE",
        subServiceId: patientData?.subServiceId
      }
      console.log("Final Payload to Upload:", payload)

      const resp = await createDoctorSaveDetails(payload)
      console.log("API Response:", resp)

      if (resp) {
        success('Prescription saved successfully!', { title: 'Success' })
        navigate('/dashboard', { replace: true })
      } else {
        warning('Saved, but got an unexpected response.')
      }

      return true
    } catch (e) {
      console.error("Upload Prescription Error:", e)
      error('Failed to generate or send the PDF.', { title: 'Error' })
      return false
    }
  }

  // ---------------- Render ----------------
  return (
    <div className="pb-5" style={{ backgroundColor: COLORS.theme }}>
      <CContainer fluid className="p-0" id="print-area">
        {/* Patient Info */}
        <CCard className="shadow-sm mb-3">
          <CCardHeader className="py-2">
            <strong style={{ color: COLORS.black }}>Patient Information</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol xs={12} md={4}>
                <div>
                  <span className="fw-semibold">Name:</span> {capitalizeEachWord(patientData?.name || '—')}

                </div>
              </CCol>
              <CCol xs={12} md={3}>
                <div>
                  <span className="fw-semibold">Age / Gender:</span>{' '}
                  {patientData?.age
                    ? (patientData.age.toString().toLowerCase().includes("yr") ||
                      patientData.age.toString().toLowerCase().includes("year")
                      ? patientData.age
                      : `${patientData.age} yrs`)
                    : "—"}
                  {patientData?.gender ? ` / ${patientData.gender}` : ''}
                </div>
              </CCol>
              <CCol xs={12} md={4}>
                <div>
                  <span className="fw-semibold">Mobile Number:</span>{' '}
                  {patientData?.mobileNumber || '—'}
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Symptoms & Duration */}
        {(symptomsDetails !== '—' || symptomsDuration !== '—') && (
          <CCard className="shadow-sm mb-4">
            <CCardHeader className="py-2">
              <strong style={{ color: COLORS.black }}>Symptoms & Duration</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol xs={12} md={8}>
                  <h6 className="mb-2">Symptoms Complaints</h6>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{symptomsDetails}</div>
                  <h6 className="mb-2 mt-2">
                    Doctor Observations <span className="text-body-secondary">(if any)</span>
                  </h6>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{doctorObs}</div>
                </CCol>
                <CCol xs={12} md={4}>
                  <h6 className="mb-2">Duration of Symptoms</h6>
                  <CBadge color="info" className="px-3 py-2">
                    {symptomsDuration}
                  </CBadge>
                </CCol>
              </CRow>

              {Array.isArray(attachments) && attachments.length > 0 && (
                <>
                  <h6 className="mb-2 mt-4">Previous Reports & Prescriptions</h6>
                  <FileUploader attachments={attachments} accept=".pdf,image/*" />
                </>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* Diagnosis */}
        {diagnosis && (
          <CCard className="shadow-sm mb-3">
            <CCardHeader className="py-2">
              <strong style={{ color: COLORS.black }}>Probable Disease</strong>
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
                      med.duration_unit && med.duration_unit !== "NA"
                        ? med.duration_unit.trim()
                        : "";

                    const displayDuration =
                      durationValue > 0 && med.durationUnit
                        ? `${durationValue} ${med.durationUnit}${durationValue > 1 ? "s" : ""}`
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

      </CContainer>

      {/* Sticky Bottom Bar */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: sidebarWidth ? `${sidebarWidth}px` : 0,
          width: sidebarWidth ? `calc(100vw - ${sidebarWidth}px)` : '100vw',
          backgroundColor: '#F3f3f7',
          display: 'flex',
          justifyContent: 'space-evenly',
          padding: 12,
          zIndex: 999,
        }}
      >
        <div className="d-flex gap-2 mx-4 justify-content-between w-75">
          <Button
            customColor={COLORS.bgcolor}
            onClick={() => {
              setClickedSaveTemplate(true)
              // uploadPrescription({ downloadAfter: false })

              onSaveTemplate?.()
              info('Template saved. You can now Save or Save & Download.', { title: 'Template' })
            }}
          >
            {!updateTemplate ? 'Save Prescription Template' : 'Update Prescription Template'}
          </Button>

          <div className="d-flex gap-2">
            <Button
              onClick={() => {
                setPendingAction(ACTIONS.SAVE)
                clickedSaveTemplate
                  ? skipTemplate() // skip modal, proceed
                  : setShowTemplateModal(true)
              }}
              customColor={COLORS.bgcolor} // background color of button
              color={COLORS.black}
            >
              Save
            </Button>

            <Button
              customColor={COLORS.bgcolor}
              onClick={() => {
                setPendingAction(ACTIONS.SAVE_PRINT)
                clickedSaveTemplate
                  ? skipTemplate() // skip modal, proceed with download
                  : setShowTemplateModal(true)
              }}
            >
              Save & Download PDF
            </Button>
          </div>

          {showTemplateModal && !clickedSaveTemplate && (
            <div
              style={{ zIndex: 999 }}
              className="vh-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label="Save as template?"
            >
              <div className="vh-modal position-relative p-3">
                {/* 🔹 X Close Button */}
                <button
                  onClick={() => setShowTemplateModal(false)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "10px",
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    color: COLORS.black
                  }}
                  aria-label="Close modal"
                >
                  ✕
                </button>

                <h6 className="mb-2 mt-3">Save this as a template?</h6>
                <p className="muted mb-3">
                  You can reuse this prescription layout later for faster entry.
                </p>

                <div className="d-flex gap-2 justify-content-end">
                  <Button
                    onClick={() => {
                      setPendingAction(ACTIONS.SAVE);
                      skipTemplate(); // just navigate back
                    }}
                    customColor={COLORS.bgcolor}
                    color={COLORS.black}
                  >
                    No, just continue
                  </Button>

                  <Button customColor={COLORS.bgcolor} onClick={confirmSaveAsTemplate}>
                    Yes, save as template
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default Summary