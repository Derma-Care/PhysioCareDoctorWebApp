import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CSpinner } from '@coreui/react'
import FileUploader from './FileUploader'
import Button from '../components/CustomButton/CustomButton'
import Snackbar from '../components/Snackbar'
import { useToast } from '../utils/Toaster'
import { getBookingDetails } from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'
import { COLORS } from '../Themes'
import {
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
} from '@coreui/react'
import { documentTextOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
// ─── helpers ────────────────────────────────────────────────────────────────
const toImageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return null
  if (raw.startsWith('http') || raw.startsWith('blob:') || raw.startsWith('/')) return raw
  if (raw.startsWith('data:')) return raw
  if (raw.startsWith('/9j/')) return `data:image/jpeg;base64,${raw}`
  if (raw.startsWith('iVBOR')) return `data:image/png;base64,${raw}`
  if (raw.startsWith('R0lGO')) return `data:image/gif;base64,${raw}`
  return `data:image/jpeg;base64,${raw}`
}

const flattenTherapyAnswers = (obj = {}) => {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([category, qList]) => ({
    category,
    questions: Array.isArray(qList) ? qList : [],
  }))
}

const isValid = (v) =>
  v !== undefined && v !== null && v !== '' && v !== 'NA' &&
  !(typeof v === 'string' && v.trim().toLowerCase() === 'undefined')

// ─── sub-components ──────────────────────────────────────────────────────────
const SLabel = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <span style={{
      fontSize: '0.82rem',      // ← match Investigation tab
      fontWeight: 700,
      letterSpacing: '0.08em',  // ← match Investigation tab
      textTransform: 'uppercase',
      color: '#1B4F8A',
      fontFamily: 'inherit',
    }}>{text}</span>
    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#b6cfe8,transparent)' }} />
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    Confirmed: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    Pending: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    Cancelled: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' }
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
    }}>{status}</span>
  )
}

const AnswerBadge = ({ answer }) => {
  const raw = answer ?? ''
  const display = String(raw).trim()

  if (!display || display.toLowerCase() === 'na' || display.toLowerCase() === 'undefined') {
    return (
      <span style={{
        background: '#F9FAFB', color: '#9CA3AF',
        border: '1px dashed #D1D5DB',
        borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 600,
        whiteSpace: 'nowrap', fontStyle: 'italic',
      }}>Not answered</span>
    )
  }

  const up = display.toUpperCase()
  const s = up === 'YES'
    ? { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' }
    : up === 'NO'
      ? { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' }
      : { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }

  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>{display}</span>
  )
}

const card = {
  background: '#FFFFFF',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 2px 12px rgba(27,79,138,0.08)',
  border: '1px solid #b6cfe8',
  marginBottom: 18,
}

const inputBase = {
  width: '100%', borderRadius: 10, border: '1.5px solid #b6cfe8',
  padding: '10px 13px', fontSize: '0.875rem',  // ← change 16 to '0.875rem'
  fontFamily: 'inherit',
  outline: 'none', background: '#FFFFFF', color: '#1a3a5c',
  boxSizing: 'border-box', resize: 'vertical',
}

const readonlyChip = {
  background: '#EFF6FF', border: '1px solid #b6cfe8',
  borderRadius: 10, padding: '10px 14px',
  fontSize: 13, fontWeight: 700, color: '#1B4F8A',
}

// ─── main component ──────────────────────────────────────────────────────────
const SymptomsDiseases = ({ seed = {}, onNext, patientData, setFormData }) => {

  const [symptomDetails, setSymptomDetails] = useState(seed.symptomDetails ?? patientData?.problem ?? '')
  const [duration, setDuration] = useState(seed.duration ?? patientData?.symptomsDuration ?? '0 Days')
  const [attachments, setAttachments] = useState(
    Array.isArray(seed.attachments) && seed.attachments.length
      ? seed.attachments
      : Array.isArray(patientData?.attachments) ? patientData.attachments : []
  )
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [bookingRecord, setBookingRecord] = useState(null)
  const [partImage, setPartImage] = useState(seed.partImage ?? '')
  const [showDiagramModal, setShowDiagramModal] = useState(false)
  const [theraphyAnswers, setTheraphyAnswers] = useState(seed.theraphyAnswers ?? {})
  const [selectedTherapy, setSelectedTherapy] = useState(seed.selectedTherapy ?? '')
  const [parts, setParts] = useState(Array.isArray(seed.parts) ? seed.parts : [])
  const [attachmentImages, setAttachmentImages] = useState(Array.isArray(seed.attachmentImages) ? seed.attachmentImages : [])
  const [previousInjuries, setPreviousInjuries] = useState(seed.previousInjuries ?? '')
  const [currentMedications, setCurrentMedications] = useState(seed.currentMedications ?? '')
  const [allergies, setAllergies] = useState(seed.allergies ?? '')
  const [occupation, setOccupation] = useState(seed.occupation ?? '')
  const [insuranceProvider, setInsuranceProvider] = useState(seed.insuranceProvider ?? '')
  const [activityLevels, setActivityLevels] = useState(Array.isArray(seed.activityLevels) ? seed.activityLevels : [])
  const [patientPain, setPatientPain] = useState(seed.patientPain ?? '')
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const { error } = useToast()

  useEffect(() => {
    if (!seed || typeof seed !== 'object') return
    if (isValid(seed.symptomDetails)) setSymptomDetails(seed.symptomDetails)
    if (isValid(seed.duration)) setDuration(seed.duration)
    if (Array.isArray(seed.attachments) && seed.attachments.length) setAttachments(seed.attachments)
    if (isValid(seed.partImage)) setPartImage(seed.partImage)
    if (Array.isArray(seed.parts) && seed.parts.length) setParts(seed.parts)
    if (isValid(seed.selectedTherapy)) setSelectedTherapy(seed.selectedTherapy)
    if (seed.theraphyAnswers && typeof seed.theraphyAnswers === 'object') setTheraphyAnswers(seed.theraphyAnswers)
    if (Array.isArray(seed.attachmentImages) && seed.attachmentImages.length) setAttachmentImages(seed.attachmentImages)
    if (isValid(seed.previousInjuries)) setPreviousInjuries(seed.previousInjuries)
    if (isValid(seed.currentMedications)) setCurrentMedications(seed.currentMedications)
    if (isValid(seed.allergies)) setAllergies(seed.allergies)
    if (isValid(seed.occupation)) setOccupation(seed.occupation)
    if (isValid(seed.insuranceProvider)) setInsuranceProvider(seed.insuranceProvider)
    if (Array.isArray(seed.activityLevels) && seed.activityLevels.length) setActivityLevels(seed.activityLevels)
    if (isValid(seed.patientPain)) setPatientPain(seed.patientPain)
  }, [seed])

  useEffect(() => {
    const clinicId = patientData?.clinicId
    const branchId = patientData?.branchId
    if (!clinicId || !branchId) return
    const run = async () => {
      setLoadingBooking(true)
      try {
        const json = await getBookingDetails(clinicId, branchId)
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [json]
        const record = list.find((b) => b.bookingId === patientData?.bookingId) ?? list[0]
        if (!record) return
        setBookingRecord(record)
        if (isValid(record.problem) && !isValid(seed.symptomDetails)) setSymptomDetails(record.problem)
        if (isValid(record.symptomsDuration) && !isValid(seed.duration)) setDuration(record.symptomsDuration.trim())
        else if (!isValid(seed.duration)) setDuration('0 Days')
        if (isValid(record.subServiceName) && !isValid(seed.selectedTherapy)) setSelectedTherapy(record.subServiceName)
        if (record.partImage && !isValid(seed.partImage)) setPartImage(record.partImage)
        if (Array.isArray(record.parts) && record.parts.length && !(Array.isArray(seed.parts) && seed.parts.length)) setParts(record.parts)
        if (record.theraphyAnswers && typeof record.theraphyAnswers === 'object' && !Object.keys(seed.theraphyAnswers ?? {}).length) setTheraphyAnswers(record.theraphyAnswers)
        if (isValid(record.previousInjuries) && !isValid(seed.previousInjuries)) setPreviousInjuries(record.previousInjuries)
        if (isValid(record.currentMedications) && !isValid(seed.currentMedications)) setCurrentMedications(record.currentMedications)
        if (isValid(record.allergies) && !isValid(seed.allergies)) setAllergies(record.allergies)
        if (isValid(record.occupation) && !isValid(seed.occupation)) setOccupation(record.occupation)
        if (isValid(record.insuranceProvider) && !isValid(seed.insuranceProvider)) setInsuranceProvider(record.insuranceProvider)
        if (Array.isArray(record.activityLevels) && record.activityLevels.length && !(Array.isArray(seed.activityLevels) && seed.activityLevels.length)) setActivityLevels(record.activityLevels)
        if (isValid(record.patientPain) && !isValid(seed.patientPain)) setPatientPain(record.patientPain)
        if (Array.isArray(record.attachments) && record.attachments.length && !(Array.isArray(seed.attachmentImages) && seed.attachmentImages.length)) {
          setAttachmentImages(record.attachments)
          setAttachments((prev) => {
            const existingSet = new Set(prev.map((a) => a?.url ?? a))
            const newItems = record.attachments
              .filter((a) => !existingSet.has(a))
              .map((raw, idx) => ({ url: toImageSrc(raw), name: `attachment_${idx + 1}`, isBase64: true }))
            return [...prev, ...newItems]
          })
        }
      } catch (e) {
        console.error('❌ Booking fetch failed:', e)
        error?.('Could not load booking details.')
      } finally {
        setLoadingBooking(false)
      }
    }
    run()
  }, [patientData?.clinicId, patientData?.branchId, patientData?.bookingId])

  const handleNext = () => {
    const payload = {
      symptomDetails, duration, attachments,
      partImage, parts, selectedTherapy, theraphyAnswers, attachmentImages,
      previousInjuries, currentMedications, allergies,
      occupation, insuranceProvider, activityLevels, patientPain,
    }
    onNext?.(payload)
  }

  const therapyGroups = useMemo(() => flattenTherapyAnswers(theraphyAnswers), [theraphyAnswers])
  const bk = bookingRecord

  const hasComplaintData =
    isValid(symptomDetails) || isValid(patientPain) || isValid(previousInjuries) ||
    isValid(currentMedications) || isValid(allergies) || isValid(occupation) ||
    activityLevels.length > 0

  const focusBlue = (e) => (e.target.style.borderColor = '#1B4F8A')
  const blurBlue = (e) => (e.target.style.borderColor = '#b6cfe8')

  return (
    <div style={{ paddingBottom: '90px', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>

      {/* ── Header: white bg, blue bottom border ── */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '2px solid #dceeff',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(27,79,138,0.10)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Logo Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
          }}>
            🧑‍⚕️
          </div>

          {/* Title */}
          <h5 style={{
            color: '#1B4F8A', fontWeight: 700, fontSize: '1.1rem'

          }}>
            Patient Consultation
          </h5>
        </div>

        {bk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: '#EFF6FF', borderRadius: 24, padding: '6px 16px',
              color: '#1B4F8A', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #b6cfe8',
              boxShadow: '0 2px 6px rgba(27,79,138,0.10)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B4F8A' }} />
              {bk.name} · {bk.age}yr {bk.gender?.charAt(0)}
            </div>
            <StatusBadge status={bk.status} />
          </div>
        )}
      </div>

      {/* ── Loading Banner ── */}
      {loadingBooking && (
        <div style={{
          background: '#EFF6FF', padding: '8px 20px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid #b6cfe8',
        }}>
          <CSpinner size="sm" style={{ color: '#1B4F8A' }} />
          <span style={{ color: '#1B4F8A', fontSize: 13 }}>Loading booking details…</span>
        </div>
      )}

      {/* ── Two-Column Main Grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 20, maxWidth: 1200, margin: '20px auto 0', padding: '0 20px',
      }}>

        {/* ════ LEFT COLUMN ════ */}
        <div>
          {hasComplaintData && (
            <div style={card}>
              <SLabel text="Complaint Details" />
              <textarea
                rows={4} value={symptomDetails}
                onChange={(e) => setSymptomDetails(e.target.value)}
                placeholder="Describe patient's main complaint…"
                style={{ ...inputBase, marginBottom: 14 }}
                onFocus={focusBlue} onBlur={blurBlue}
              />
 {/* Duration + Therapy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <div style={card}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isValid(selectedTherapy || bk?.subServiceName) ? '1fr 1fr' : '1fr',
                gap: 14,
              }}>
                <div>
                  <SLabel text="Duration" />
                  <input value={duration || '0 Days'} onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 weeks" style={{ ...inputBase, resize: 'none' }}
                    onFocus={focusBlue} onBlur={blurBlue} />
                </div>
                {isValid(selectedTherapy || bk?.subServiceName) && (
                  <div>
                    <SLabel text="Selected Therapy" />
                    <div style={readonlyChip}>{selectedTherapy || bk?.subServiceName}</div>
                  </div>
                )}
              </div>
            </div>

            {parts.length > 0 && (
              <div style={card}>
                <SLabel text="Affected Body Parts" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
                  {parts.map((p) => (
                    <span key={p} style={{
                      background: '#EFF6FF', color: '#1B4F8A',
                      border: '1px solid #b6cfe8', borderRadius: 20,
                      padding: '4px 14px', fontSize: 12, fontWeight: 700,
                      textTransform: 'capitalize',
                    }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
              {isValid(patientPain) && (
                <div style={{ marginBottom: 14 }}>
                  <SLabel text="Patient Pain" />
                  <input value={patientPain} onChange={(e) => setPatientPain(e.target.value)}
                    placeholder="e.g. chronic pain, acute pain…"
                    style={{ ...inputBase, resize: 'none' }}
                    onFocus={focusBlue} onBlur={blurBlue} />
                </div>
              )}

              {(isValid(previousInjuries) || isValid(currentMedications)) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isValid(previousInjuries) && isValid(currentMedications) ? '1fr 1fr' : '1fr',
                  gap: 14, marginBottom: 14,
                }}>
                  {isValid(previousInjuries) && (
                    <div>
                      <SLabel text="Previous Injuries" />
                      <input value={previousInjuries} onChange={(e) => setPreviousInjuries(e.target.value)}
                        placeholder="e.g. none" style={{ ...inputBase, resize: 'none' }}
                        onFocus={focusBlue} onBlur={blurBlue} />
                    </div>
                  )}
                  {isValid(currentMedications) && (
                    <div>
                      <SLabel text="Current Medications" />
                      <input value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)}
                        placeholder="e.g. none" style={{ ...inputBase, resize: 'none' }}
                        onFocus={focusBlue} onBlur={blurBlue} />
                    </div>
                  )}
                </div>
              )}

              {(isValid(allergies) || isValid(occupation)) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isValid(allergies) && isValid(occupation) ? '1fr 1fr' : '1fr',
                  gap: 14, marginBottom: 14,
                }}>
                  {isValid(allergies) && (
                    <div>
                      <SLabel text="Allergies" />
                      <input value={allergies} onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. none" style={{ ...inputBase, resize: 'none' }}
                        onFocus={focusBlue} onBlur={blurBlue} />
                    </div>
                  )}
                  {isValid(occupation) && (
                    <div>
                      <SLabel text="Occupation" />
                      <input value={occupation} onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. worker" style={{ ...inputBase, resize: 'none' }}
                        onFocus={focusBlue} onBlur={blurBlue} />
                    </div>
                  )}
                </div>
              )}

              {activityLevels.length > 0 && (
                <div>
                  <SLabel text="Activity Levels" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {activityLevels.map((lvl) => (
                      <span key={lvl} style={{
                        background: '#EFF6FF', color: '#1B4F8A',
                        border: '1px solid #b6cfe8', borderRadius: 20,
                        padding: '4px 12px', fontSize: 12, fontWeight: 700,
                      }}>{lvl}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

         

          {isValid(insuranceProvider) && (
            <div style={card}>
              <SLabel text="Insurance Provider" />
              <input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)}
                placeholder="e.g. none" style={{ ...inputBase, resize: 'none' }}
                onFocus={focusBlue} onBlur={blurBlue} />
            </div>
          )}
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div>
          {isValid(partImage) && (
            <>
              <div style={card}>
                <SLabel text="Body Part Diagram" />
                <div
                  onClick={() => setShowDiagramModal(true)}
                  style={{
                    background: '#EFF6FF', borderRadius: 10, overflow: 'hidden',
                    display: 'flex', justifyContent: 'center', border: '1px solid #b6cfe8',
                    cursor: 'zoom-in', position: 'relative',
                  }}
                >
                  <img src={toImageSrc(partImage)} alt="Body Part Diagram"
                    style={{ maxHeight: 220, objectFit: 'contain', display: 'block' }} />
                  {/* <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(27,79,138,0.75)', borderRadius: 6,
          padding: '3px 8px', color: '#fff', fontSize: 11, fontWeight: 600,
        }}>
          🔍 Click to expand
        </div> */}
                </div>
              </div>

              {/* ── Lightbox Modal ── */}
              {showDiagramModal && (
                <div
                  onClick={() => setShowDiagramModal(false)}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(10,30,60,0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: '#fff', borderRadius: 18,
                      padding: 24, maxWidth: '90vw', maxHeight: '90vh',
                      boxShadow: '0 16px 64px rgba(27,79,138,0.30)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                      position: 'relative',
                    }}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setShowDiagramModal(false)}
                      style={{
                        position: 'absolute', top: 12, right: 12,
                        background: '#FEE2E2', border: 'none', borderRadius: '50%',
                        width: 32, height: 32, cursor: 'pointer',
                        fontSize: 16, color: '#991B1B', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>

                    <span style={{ fontWeight: 700, color: '#1B4F8A', fontSize: 15 }}>
                      Body Part Diagram
                    </span>

                    <img
                      src={toImageSrc(partImage)}
                      alt="Body Part Diagram"
                      style={{
                        maxWidth: '80vw', maxHeight: '75vh',
                        objectFit: 'contain', borderRadius: 10,
                        border: '1px solid #b6cfe8',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              
              <SLabel text="Records/reports" />
              <IonIcon icon={documentTextOutline} style={{ fontSize: "18px" }} />
            </div>

            <FileUploader attachments={attachments} setAttachments={setAttachments} />
          </div>
        </div>
      </div>

      {/* ══ THERAPY QUESTIONNAIRE ══ */}
      {therapyGroups.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto 24px', padding: '0 20px' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 18, padding: 20,
            boxShadow: '0 8px 24px rgba(27,79,138,0.08)',
            border: '1px solid #b6cfe8',
          }}>
            <SLabel text="Therapy Questionnaire" />
            <CAccordion flush style={{ marginTop: 14, zIndex: 1 }}>
              {therapyGroups.map(({ category, questions }, index) => {
                const validQuestions = questions.filter(q => isValid(q.question))
                if (validQuestions.length === 0) return null
                return (
                  <CAccordionItem key={category} itemKey={index + 1} style={{
                    marginBottom: 12, border: '1px solid #b6cfe8',
                    borderRadius: 14, overflow: 'hidden',
                  }}>
                    <CAccordionHeader style={{
                      background: 'linear-gradient(90deg,#EFF6FF,#F0F9FF)',
                      color: '#1B4F8A', fontWeight: 700, textTransform: 'capitalize',
                    }}>
                      {category}
                      <span style={{
                        marginLeft: 8, fontSize: 11, fontWeight: 600,
                        color: '#1B4F8A', background: '#dceeff',
                        borderRadius: 20, padding: '2px 8px',
                      }}>
                        {validQuestions.length} questions
                      </span>
                    </CAccordionHeader>
                    <CAccordionBody style={{ padding: 0 }}>
                      {validQuestions.map((q, idx) => (
                        <div key={q.questionId ?? idx} style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', gap: 14, padding: '12px 16px',
                          borderBottom: idx < validQuestions.length - 1 ? '1px solid #EFF6FF' : 'none',
                          background: idx % 2 === 0 ? '#F8FBFF' : '#FFFFFF',
                        }}>
                          <div style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                            <span style={{
                              display: 'inline-block', minWidth: 22, height: 22,
                              borderRadius: '50%', background: '#dceeff',
                              color: '#1B4F8A', fontSize: 11, fontWeight: 700,
                              textAlign: 'center', lineHeight: '22px', marginRight: 8,
                            }}>{idx + 1}</span>
                            {q.question || `Question ${q.questionId}`}
                          </div>
                          <AnswerBadge answer={q.answer} />
                        </div>
                      ))}
                    </CAccordionBody>
                  </CAccordionItem>
                )
              })}
            </CAccordion>
          </div>
        </div>
      )}

      {/* ── Sticky Bottom Bar ── */}
      <div className="position-fixed bottom-0" style={{
        left: 0, right: 0,
        background: '#FFFFFF',
        borderTop: '2px solid #1B4F8A',
        display: 'flex', justifyContent: 'flex-end', gap: 16,
        padding: '10px 24px',
        boxShadow: '0 -2px 10px rgba(27,79,138,0.12)',
      }}>
        <Button
          customColor="#1B4F8A"
          onClick={handleNext}
          style={{
            borderRadius: '20px', fontWeight: 700,
            padding: '6px 24px',
            color: '#FFFFFF',                              // ← white text forced inline
            boxShadow: '0 2px 8px rgba(27,79,138,0.30)',
            border: '1.5px solid #1B4F8A',
          }}
        >
          Next
        </Button>
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default SymptomsDiseases