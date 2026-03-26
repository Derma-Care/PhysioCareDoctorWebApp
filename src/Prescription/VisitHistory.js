import React, { useState, useEffect } from 'react'
import './VisitHistory.css'
import GradientTextCard from '../components/GradintColorText'
import FileUploader from './FileUploader'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
} from '@coreui/react'
import { getVisitHistoryByPatientIdAndDoctorId } from '../Auth/Auth'
import ReportDetails from '../components/Reports/Reports'
import { Accordion } from 'react-bootstrap'

// AccordionItem without dynamic height
const AccordionItem = ({ id, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="vh-acc-item">
      <button
        className="vh-acc-header"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-button`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="vh-acc-title">{title}</span>
        <span className="vh-acc-icon">{open ? '−' : '+'}</span>
      </button>

      {open && <div className="vh-acc-panel">{children}</div>}
    </div>
  )
}

// Normalize attachments
const normalizeAttachments = (raw) => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string')
    return raw
      .split(',')
      .map((s) => s && s.trim())
      .filter(Boolean)
  return []
}

const freqLabel = (f) => {
  switch ((f || '').toLowerCase()) {
    case 'day':
      return 'Daily'
    case 'week':
      return 'Weekly'
    case 'month':
      return 'Monthly'
    default:
      return f ? f[0].toUpperCase() + f.slice(1) : '—'
  }
}

// Transform API visit
const transformVisit = (visit) => {
  const symptomsArr = []
  if (visit.symptoms) {
    if (visit.symptoms.symptomDetails) symptomsArr.push(visit.symptoms.symptomDetails)

    if (visit.symptoms.doctorObs)
      symptomsArr.push(`Doctor Observations: ${visit.symptoms.doctorObs}`)
    // if (visit.symptoms.diagnosis) symptomsArr.push(`Diagnosis: ${visit.symptoms.diagnosis}`)
    if (visit.symptoms.duration) symptomsArr.push(`Duration: ${visit.symptoms.duration}`)
  }

  const testsArr = (visit.tests?.selectedTests || []).map((testName) => ({ name: testName }))
  const testsReason = visit.tests?.testReason || ''
  const prescriptionPdf = visit.prescriptionPdf || []

  const rawSchedules = visit.treatments?.generatedData || {}
  const selectedTreatments =
    visit.treatments?.selectedTestTreatments ||
    visit.treatments?.selectedTreatments ||
    Object.keys(rawSchedules) ||
    []

  const treatmentSchedules = Object.fromEntries(
    Object.entries(rawSchedules).map(([name, meta]) => [
      name,
      {
        reason: meta?.reason || '',
        frequency: meta?.frequency || '',
        sittings: Number(meta?.sittings) || 0,
        startDate: meta?.startDate || '',
        dates: Array.isArray(meta?.dates) ? meta.dates : [],
      },
    ])
  )

  const treatmentsArr = selectedTreatments.filter(Boolean).map((name) => ({
    name,
    reason: treatmentSchedules?.[name]?.reason || '',
  }))

 const prescriptionArr = (visit.prescription?.medicines || []).map((med) => ({
  id: med.id,
  name: med.name,                 // ✅ keep original
  medicineType: med.medicineType, // ✅ keep original
  dose: med.dose,
  duration: med.duration,
  remindWhen: med.remindWhen,     // ✅ keep original
  others: med.others,
  food: med.food,
  note: med.note,                 // ✅ keep original
  times: med.times,
}))


  const attachmentsFromSymptoms = normalizeAttachments(visit.symptoms?.attachments)
  const attachmentsFromReports = visit.symptoms?.reports ? [visit.symptoms.reports] : []

  const d = new Date(visit.visitDateTime)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const visitNumTitle = `${visit.visitType?.replace('_', ' ') || 'VISIT'} (${day}–${month}–${year})`

  const bookingId =
    visit.bookingId ||
    visit.appointmentId ||
    visit.item?.bookingId ||
    visit.appointmentInfo?.bookingId ||
    visit?.booking?.id ||
    ''

  return {
    id: visit.id,
    bookingId,
    title: visitNumTitle,
    symptoms: symptomsArr,
    diagnosis: visit.symptoms?.diagnosis || '',
    tests: testsArr,
    testsReason,
    treatments: treatmentsArr,
    treatmentSchedules,
    prescription: prescriptionArr,
    prescriptionPdf,
    attachments: [...attachmentsFromSymptoms, ...attachmentsFromReports],
  }
}

// Convert times to initials
const toInitials = (input, sep = ', ') => {
  if (!input) return ''
  let tokens = []
  if (Array.isArray(input)) tokens = input
  else {
    const s = String(input).trim()
    if (s.includes(',') || s.includes('|') || /\s/.test(s)) tokens = s.split(/[,|\s]+/)
    else tokens = s.match(/morning|afternoon|evening|night/gi) || [s]
  }
  const map = { morning: 'M', m: 'M', afternoon: 'A', a: 'A', evening: 'E', e: 'E', night: 'N', n: 'N' }
  return tokens.map((t) => map[t.toLowerCase()] ?? (t[0]?.toUpperCase() || '')).filter(Boolean).join(sep)
}

const VisitHistory = ({ formData, patientData, patientId, doctorId }) => {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!patientId || !doctorId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getVisitHistoryByPatientIdAndDoctorId(patientId, doctorId);

        if (response.status === 200 && response.success) {
          if (response.data && response.data.visitHistory) {
            const visitHistory = response.data.visitHistory || [];
            const transformedVisits = visitHistory.map(transformVisit);
            setVisits(transformedVisits);
          } else {
            // ✅ show backend message when data is null
            setError(response.message || "No visit history available");
          }
        } else {
          setError(response.message || "Failed to fetch visit history");
        }
      } catch (e) {
        setError(e.message || "Failed to fetch visit history");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, doctorId]);




  if (loading)
    return (
      <div className="vh-loading">
        <CSpinner className="me-2" size="sm" />
        <span>Loading visit history...</span>
      </div>
    )

  if (error)
    return (
      <div className="vh-loading">
        <span>{error}</span>
      </div>
    )

  if (!visits.length)
    return (
      <div className="vh-loading">
        <span>No visit history available</span>
      </div>
    )

  return (
    <div className="visit-history">
      <h4 className="visit-title">Visit History</h4>
      {visits.map((v, idx) => (
        <AccordionItem key={v.id} id={v.id} title={v.title} defaultOpen={idx === 0}>
          <h6 className="section-title">Patient Complaints</h6>
          <p className="symptoms-text">
            {v.symptoms.map((s, i) => (
              <span key={i}>
                {s}
                {i < v.symptoms.length - 1 && <br />}
              </span>
            ))}
          </p>

          <div className="section">
            <h6 className="section-title">Probable Disease</h6>
            <p className="diagnosis">{v.diagnosis}</p>
          </div>

          <div className="vh-inner-accordion">
            <AccordionItem id={`${v.id}-tests`} title="Tests Recommended (With Reasons)">
              {v.tests?.length ? (
                <>
                  <ul className="item-list">
                    {v.tests.map((t, i) => (
                      <li key={i}>
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                      </li>
                    ))}
                  </ul>
                  {v.testsReason && (
                    <div className="mt-2">
                      <strong>Reason:</strong> {v.testsReason}
                    </div>
                  )}
                </>
              ) : (
                <p>No tests recommended</p>
              )}
            </AccordionItem>

            <AccordionItem id={`${v.id}-treatments`} title="Treatments (With Reasons)">
              {v.treatments?.length ? (
                <>
                  <ul className="item-list">
                    {v.treatments.map((t, i) => (
                      <li key={i}>
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                      </li>
                    ))}
                  </ul>

                  {v.treatmentSchedules && Object.keys(v.treatmentSchedules).length > 0 && (
                    <div className="mt-3">
                      {Object.entries(v.treatmentSchedules).map(([name, meta]) => (
                        <CCard key={name} className="mb-3 p-2">
                          <div style={{ fontWeight: 'bold' }}>
                            {name} — {freqLabel(meta?.frequency)} ({meta?.sittings ?? 0} sittings
                            from {meta?.startDate || '—'})
                          </div>
                          <div className="mt-2 table-responsive">
                            <table className="table table-sm mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th style={{ width: '8%' }}>S.No</th>
                                  <th style={{ width: '46%' }}>Date</th>
                                  <th style={{ width: '46%' }}>Sitting</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(meta?.dates || []).map((d, i) => (
                                  <tr key={`${name}-row-${i}`}>
                                    <td>{i + 1}</td>
                                    <td>{d?.date ?? '—'}</td>
                                    <td>{d?.sitting ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {meta?.reason && (
                            <div className="mt-2">
                              <strong>Reason:</strong> {meta.reason}
                            </div>
                          )}
                        </CCard>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>No treatments available</p>
              )}
            </AccordionItem>

         <AccordionItem id={`${v.id}-prescription`} title="Medication Details">
  {v.prescription.length > 0 && (
    <CCard className="shadow-sm mb-3">
      <CCardHeader className="py-2">
        <strong>Medication Details</strong>
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
            {v.prescription.map((med, index) => {
              // ✅ Duration
              const displayDuration = med.duration
                ? `${med.duration} days`
                : "NA";

              // ✅ Frequency (remindWhen / others)
              const displayFrequency =
                med.remindWhen && med.remindWhen !== "NA"
                  ? med.remindWhen === "Other" && med.others
                    ? `Other (${med.others})`
                    : med.remindWhen
                  : "NA";

              // ✅ Times
              const displayTimes =
                Array.isArray(med.times) && med.times.length > 0
                  ? med.times.filter(Boolean).join(", ")
                  : "NA";

              return (
                <CTableRow key={med.id ?? index}>
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
</AccordionItem>



            <AccordionItem id={`${v.id}-reports`} title="Reports">
              <div className="accordion-scroller">
                <Accordion alwaysOpen={false}>
                  <Accordion.Item eventKey="reports">
                    <Accordion.Header>Reports</Accordion.Header>
                    <Accordion.Body>
                      <ReportDetails formData={formData} patientData={patientData} show={false} />
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="past-reports">
                    <Accordion.Header>Previous Reports Submitted By Patient</Accordion.Header>
                    <Accordion.Body>
                      {v.attachments.length > 0 ? (
                        <FileUploader attachments={v.attachments} />
                      ) : (
                        <p>No Previous Reports available</p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="prescription">
                    <Accordion.Header>Download Prescription(Pdf)</Accordion.Header>
                    <Accordion.Body>
                      {v.prescriptionPdf.length > 0 ? (
                        <FileUploader attachments={v.prescriptionPdf} />
                      ) : (
                        <p>No Prescription available</p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            </AccordionItem>
          </div>
        </AccordionItem>
      ))}
    </div>
  )
}

export default VisitHistory
