import React, { useEffect, useMemo, useState } from 'react'
import {
  CRow, CCol, CCard, CCardBody, CForm,
  CFormTextarea, CFormInput, CImage, CSpinner, CBadge,
} from '@coreui/react'
import Select, { components } from 'react-select'
import FileUploader from './FileUploader'
import Button from '../components/CustomButton/CustomButton'
import Snackbar from '../components/Snackbar'
import { COLORS } from '../Themes'
import GradientTextCard from '../components/GradintColorText'
import { useToast } from '../utils/Toaster'
import {
  getDoctorSaveDetails, getAllDiseases, addDisease,
  getAdImagesView, getBookingDetails,
} from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'

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
      fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
      textTransform: 'uppercase', color: '#6C2BD9', fontFamily: 'inherit',
    }}>{text}</span>
    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#EDE0FF,transparent)' }} />
  </div>
)

const InfoChip = ({ label, value, accent = false }) => (
  <div style={{
    background: accent ? '#F3EEFF' : '#F9FAFB',
    border: `1px solid ${accent ? '#DDD0FF' : '#E5E7EB'}`,
    borderRadius: 10, padding: '8px 14px', minWidth: 0,
  }}>
    <div style={{
      fontSize: 10, color: '#9CA3AF', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2,
    }}>{label}</div>
    <div style={{
      fontSize: 13, fontWeight: 600,
      color: accent ? '#5B21B6' : '#111827', wordBreak: 'break-word',
    }}>{value}</div>
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
  const up = String(answer).toUpperCase()
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
    }}>{answer}</span>
  )
}

const card = {
  background: '#fff',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 2px 12px rgba(108,43,217,0.07)',
  border: '1px solid #EDE0FF',
  marginBottom: 18,
}

const inputBase = {
  width: '100%', borderRadius: 10, border: '1.5px solid #E5D9FF',
  padding: '10px 13px', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', background: '#FDFBFF', color: '#111827',
  boxSizing: 'border-box', resize: 'vertical',
}

// ─── main component ──────────────────────────────────────────────────────────
const SymptomsDiseases = ({ seed = {}, onNext, patientData, setFormData }) => {

  const [symptomDetails, setSymptomDetails] = useState(seed.symptomDetails ?? patientData?.problem ?? '')
  const [doctorObs, setDoctorObs] = useState(seed.doctorObs ?? '')
  const [complaints, setComplaints] = useState(
    seed.complaints ?? (isValid(patientData?.subServiceName) ? patientData.subServiceName : ''),
  )
  const [duration, setDuration] = useState(patientData?.symptomsDuration ?? '')
  const [attachments, setAttachments] = useState(
    Array.isArray(seed.attachments) ? seed.attachments
      : Array.isArray(patientData?.attachments) ? patientData.attachments : [],
  )
  const [diseases, setDiseases] = useState([])
  const [tplLoading, setTplLoading] = useState(false)
  const [probableSymptoms, setProbableSymptoms] = useState('')
  const [keyNotes, setKeyNotes] = useState('')
  const [templateData, setTemplateData] = useState({
    symptoms: '', tests: {}, prescription: {}, treatments: {}, followUp: {}, summary: {},
  })
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [hasTemplate, setHasTemplate] = useState(false)
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  const [bookingRecord, setBookingRecord] = useState(null)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [partImage, setPartImage] = useState('')
  const [theraphyAnswers, setTheraphyAnswers] = useState({})
  const [selectedTherapy, setSelectedTherapy] = useState('')
  const [parts, setParts] = useState([])
  const [attachmentImages, setAttachmentImages] = useState([])

  const { setUpdateTemplate } = useDoctorContext()
  const { success, error, info } = useToast()

  // ── fetch booking ─────────────────────────────────────────────────────────
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

        if (isValid(record.problem)) setSymptomDetails(record.problem)
        if (isValid(record.symptomsDuration)) setDuration(record.symptomsDuration.trim())
        if (isValid(record.subServiceName)) {
          setComplaints((p) => p || record.subServiceName)
          setSelectedTherapy(record.subServiceName)
        }
        if (record.partImage) setPartImage(record.partImage)
        if (Array.isArray(record.parts)) setParts(record.parts)
        if (record.theraphyAnswers && typeof record.theraphyAnswers === 'object')
          setTheraphyAnswers(record.theraphyAnswers)
        if (Array.isArray(record.attachments) && record.attachments.length > 0) {
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

  // ── fetch diseases ────────────────────────────────────────────────────────
  const fetchDiseases = async () => {
    try {
      const data = (await getAllDiseases()) || []
      setDiseases(data.map((d) => ({
        diseaseName: d.diseaseName || '', probableSymptoms: d.probableSymptoms || '',
        notes: d.notes || '', hospitalId: d.hospitalId,
      })))
    } catch (e) { console.error('❌ Disease fetch failed:', e) }
  }
  useEffect(() => { fetchDiseases() }, [])

  // ── probable symptoms / key notes ─────────────────────────────────────────
  useEffect(() => {
    if (!complaints) { setProbableSymptoms(''); setKeyNotes(''); return }
    const matched = diseases.find((d) => d.diseaseName?.toLowerCase() === complaints.toLowerCase())
    if (matched) { setProbableSymptoms(matched.probableSymptoms || ''); setKeyNotes(matched.notes || '') }
    else { setProbableSymptoms(''); setKeyNotes('') }
  }, [complaints, diseases])

  // ── fetch template ────────────────────────────────────────────────────────
  const fetchTemplate = async (dx) => {
    if (!dx) return
    setTplLoading(true)
    try {
      const res = await getDoctorSaveDetails(dx)
      const raw = res?.data ?? res
      const item = Array.isArray(raw) ? raw[0] : raw
      setTemplateData(item || {})
      setHasTemplate(!!item)
    } catch (e) { setHasTemplate(false) }
    finally { setTplLoading(false) }
  }

  const handleComplaintsChange = async (selected) => {
    const val = selected?.value ?? ''
    setComplaints(val)
    if (!val) { setHasTemplate(false); return }
    await fetchTemplate(val)
  }

  useEffect(() => {
    const dx = (seed?.complaints ?? complaints ?? '').trim()
    if (dx && !hasTemplate) fetchTemplate(dx)
  }, [seed?.complaints])

  // ── handleNext ────────────────────────────────────────────────────────────
  const handleNext = () => {
    const payload = {
      symptomDetails, doctorObs, complaints, duration, attachments,
      prescription: templateData.prescription, tests: templateData.tests,
      treatments: templateData.treatments, followUp: templateData.followUp,
      exercise: templateData.exercise,
      partImage, parts, selectedTherapy, theraphyAnswers, attachmentImages,
    }
    console.log('🚀 Submitting payload:', payload)
    onNext?.(payload)
  }

  // ── applyTemplate ─────────────────────────────────────────────────────────
  const mapTemplateToFormData = (t = {}, dx) => {
    const medicines = Array.isArray(t?.prescription?.medicines)
      ? t.prescription.medicines.map((m) => {
        const dur = m?.duration ? `${m.duration}`.trim() : 'NA'
        let unit = m?.durationUnit ? m.durationUnit.trim() : ''
        if (dur !== 'NA' && unit) {
          const n = parseInt(dur, 10)
          if (!isNaN(n) && n > 1 && !unit.endsWith('s')) unit = `${unit}s`
        }
        return {
          id: m?.id ?? `tmp-${Date.now()}-${Math.random()}`,
          medicineType: m?.medicineType?.trim() || 'NA', name: m?.name || '',
          dose: m?.dose || '', remindWhen: m?.remindWhen || 'Once A Day',
          others: m?.others || '',
          duration: dur !== 'NA' && unit ? `${dur} ${unit}` : dur,
          food: m?.food || '', note: m?.note || '',
          times: Array.isArray(m?.times)
            ? m.times.map((t) => `${t}`.trim()).filter(Boolean)
            : m?.times && typeof m.times === 'string'
              ? m.times.split(',').map((t) => t.trim()).filter(Boolean)
              : [],
        }
      })
      : []
    return {
      symptoms: { symptomDetails: typeof t.symptoms === 'string' ? t.symptoms : '', doctorObs, complaints: dx, duration, attachments },
      tests: { selectedTests: Array.isArray(t?.tests?.selectedTests) ? t.tests.selectedTests : [], testReason: t?.tests?.testReason ?? '' },
      prescription: { medicines },
      treatments: {
        generatedData: t?.treatments?.generatedData ?? {},
        selectedTestTreatments: t?.treatments?.selectedTestTreatments ?? t?.treatments?.selectedTreatment ?? [],
        treatmentReason: t?.treatments?.reason ?? '',
      },
      followUp: {
        durationValue: t?.followUp?.durationValue ?? '', durationUnit: t?.followUp?.durationUnit ?? '',
        nextFollowUpDate: t?.followUp?.nextFollowUpDate ?? '',
        followUpNote: t?.followUp?.followUpnote ?? t?.followUp?.followUpNote ?? '',
      },
      summary: { complaints: dx },
    }
  }

  const applyTemplate = (dx) => {
    const merged = mapTemplateToFormData(templateData, dx)
    setFormData?.((prev) => ({ ...prev, ...merged, __templateApplied: { dx, at: Date.now() } }))
    setUpdateTemplate?.(true)
    success?.('Template applied successfully!', { title: 'Success' })
    onNext?.({ symptomDetails, doctorObs, complaints: dx, duration, attachments, ...merged })
  }

  // ── select options ────────────────────────────────────────────────────────
  const options = useMemo(
    () => diseases.map((d) => ({ label: d.diseaseName, value: d.diseaseName })),
    [diseases],
  )
  const canShowAdd =
    inputValue.trim() &&
    !options.some((o) => (o?.value || '').toLowerCase() === inputValue.trim().toLowerCase())

  const handleAddClick = async () => {
    const name = inputValue.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      const created = await addDisease({
        diseaseName: name, probableSymptoms: probableSymptoms.trim(), notes: keyNotes.trim(),
      })
      if (created) {
        success?.(`Saved "${name}" to diagnoses`, { title: 'Success' })
        setInputValue(''); setProbableSymptoms(''); setKeyNotes('')
        await fetchDiseases()
        setComplaints(name)
      } else { info?.(created?.message || 'Could not add disease', { title: 'Info' }) }
    } catch (e) { error?.('Could not add disease. Please try again.') }
    finally { setAdding(false) }
  }

  const ClearInput = (props) => (
    <components.ClearIndicator {...props}>
      <span style={{ cursor: 'pointer', color: '#6C2BD9', fontWeight: 'bold' }}
        onClick={() => props.clearValue()}>✕</span>
    </components.ClearIndicator>
  )

  const therapyGroups = useMemo(() => flattenTherapyAnswers(theraphyAnswers), [theraphyAnswers])

  const bk = bookingRecord

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: '#F8F5FF', minHeight: '100vh', paddingBottom: 90,
    }}>

      {/* ── Header ── */}
      <div
        style={{
          background: '#a5c4d4ff', // ✅ light background
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: '#7e3a93', // ✅ purple text
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Patient Consultation
          </div>
        </div>

        {bk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: '#ffffff', // ✅ white pill
                borderRadius: 24,
                padding: '6px 16px',
                color: '#7e3a93', // ✅ text color
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e', // ✅ softer green
                }}
              />
              {bk.name} · {bk.age}yr {bk.gender?.charAt(0)}
            </div>

            <StatusBadge status={bk.status} />
          </div>
        )}
      </div>

      {/* ── Loading Banner ── */}
      {loadingBooking && (
        <div style={{ background: '#EDE0FF', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CSpinner size="sm" style={{ color: '#6C2BD9' }} />
          <span style={{ color: '#6C2BD9', fontSize: 13 }}>Loading booking details…</span>
        </div>
      )}

      {/* ── Two-Column Main Grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 20, maxWidth: 1200, margin: '20px auto 0', padding: '0 20px',
      }}>

        {/* ════ LEFT COLUMN ════ */}
        <div>

          {/* Complaint Details */}
          <div style={card}>
            <SLabel text="Complaint Details" />
            <textarea
              rows={4} value={symptomDetails}
              onChange={(e) => setSymptomDetails(e.target.value)}
              placeholder="Describe patient's main complaint…"
              style={inputBase}
              onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
              onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
            />
          </div>

          {/* Duration + Therapy side-by-side */}
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <SLabel text="Duration" />
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 weeks"
                  style={{ ...inputBase, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
                />
              </div>
              {isValid(selectedTherapy || bk?.subServiceName) && (
                <div>
                  <SLabel text="Selected Therapy" />
                  <div style={{
                    background: '#F3EEFF', border: '1px solid #DDD0FF',
                    borderRadius: 10, padding: '10px 14px',
                    fontSize: 13, fontWeight: 700, color: '#5B21B6',
                  }}>
                    {selectedTherapy || bk?.subServiceName}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Affected Body Parts */}
          {parts.length > 0 && (
            <div style={card}>
              <SLabel text="Affected Body Parts" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
                {parts.map((p) => (
                  <span key={p} style={{
                    background: '#EDE9FE', color: '#5B21B6',
                    border: '1px solid #DDD6FE', borderRadius: 20,
                    padding: '4px 14px', fontSize: 12, fontWeight: 700,
                    textTransform: 'capitalize',
                  }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Diagnosis / Complaints */}
          {/* <div style={card}>
            <SLabel text="Diagnosis / Complaints" />
            <Select
              options={options}
              value={complaints ? { label: complaints, value: complaints } : null}
              onChange={handleComplaintsChange}
              onInputChange={(v) => setInputValue(v)}
              inputValue={inputValue}
              isClearable
              placeholder="Search or select diagnosis…"
              components={{ ClearIndicator: ClearInput }}
              styles={{
                control: (base) => ({
                  ...base, borderRadius: 10, borderColor: '#E5D9FF',
                  boxShadow: 'none', fontSize: 14,
                  '&:hover': { borderColor: '#6C2BD9' },
                }),
                option: (base, state) => ({
                  ...base, fontSize: 14,
                  backgroundColor: state.isSelected ? '#6C2BD9' : state.isFocused ? '#F3EEFF' : '#fff',
                  color: state.isSelected ? '#fff' : '#374151',
                }),
                menu: (base) => ({
                  ...base, borderRadius: 10, border: '1.5px solid #EDE0FF',
                  boxShadow: '0 8px 24px rgba(108,43,217,0.12)',
                }),
              }}
            />
            {canShowAdd && (
              <button type="button" onClick={handleAddClick} disabled={adding}
                style={{
                  marginTop: 6, fontSize: 13, color: '#6C2BD9',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, fontFamily: 'inherit',
                }}>
                {adding ? '…Adding' : `+ Add "${inputValue}" as new diagnosis`}
              </button>
            )}
            {tplLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <CSpinner size="sm" style={{ color: '#6C2BD9' }} />
                <small style={{ color: '#6C2BD9', fontSize: 12 }}>Fetching template…</small>
              </div>
            )}
            {hasTemplate && complaints && (
              <button type="button" onClick={() => applyTemplate(complaints)}
                style={{
                  marginTop: 10, padding: '7px 20px',
                  background: 'linear-gradient(135deg,#6C2BD9,#8B5CF6)',
                  color: '#fff', border: 'none', borderRadius: 24,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(108,43,217,0.25)', fontFamily: 'inherit',
                }}>
                ✦ Apply Template
              </button>
            )}
          </div> */}

          {/* Probable Symptoms */}
          {/* {probableSymptoms && (
            <div style={{ ...card, background: '#F3EEFF', border: '1px solid #DDD0FF' }}>
              <SLabel text="Probable Symptoms" />
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{probableSymptoms}</p>
            </div>
          )} */}

          {/* Key Notes */}
          {/* {keyNotes && (
            <div style={{ ...card, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <SLabel text="Key Notes" />
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{keyNotes}</p>
            </div>
          )} */}
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div>

          {/* Body Part Diagram */}
          {partImage && (
            <div style={card}>
              <SLabel text="Body Part Diagram" />
              <div style={{
                background: '#F3EEFF', borderRadius: 10, overflow: 'hidden',
                display: 'flex', justifyContent: 'center', border: '1px solid #DDD0FF',
              }}>
                <img
                  src={toImageSrc(partImage)}
                  alt="Body Part Diagram"
                  style={{ maxHeight: 220, objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* Patient Attachments */}
          {/* {attachmentImages.length > 0 && (
            <div style={card}>
              <SLabel text="Patient Attachments" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
                {attachmentImages.map((raw, idx) => {
                  const src = toImageSrc(raw)
                  if (!src) return null
                  return (
                    <div key={idx}
                      onClick={() => window.open(src, '_blank')}
                      style={{
                        width: 90, height: 90, borderRadius: 10, overflow: 'hidden',
                        cursor: 'pointer', border: '2px solid #DDD0FF',
                        transition: 'transform 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.borderColor = '#6C2BD9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.borderColor = '#DDD0FF'
                      }}
                    >
                      <img src={src} alt={`Attachment ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )} */}

          {/* Upload New Attachments */}
          <div style={card}>
            <SLabel text="Upload New Attachments" />
            <FileUploader attachments={attachments} setAttachments={setAttachments} />
          </div>

        </div>
        {/* ════ END TWO-COLUMN GRID ════ */}
      </div>

      {/* ══ THERAPY QUESTIONNAIRE — full width, below the two-column grid ══ */}
      {therapyGroups.length > 0 && (
        <div style={{
          maxWidth: 1200, margin: '0 auto 20px', padding: '0 20px',
        }}>
          <div style={card}>
            <SLabel text="Therapy Questionnaire" />

            {/* Multi-column layout for categories */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {therapyGroups.map(({ category, questions }, gi) => (
                <div key={category} style={{
                  borderRadius: 10, overflow: 'hidden',
                  border: '1px solid #EDE0FF',
                }}>
                  {/* Category header */}
                  <div style={{
                    background: 'linear-gradient(90deg,#F3EEFF,#EEF2FF)',
                    padding: '8px 16px', fontWeight: 700, fontSize: 12,
                    color: '#6C2BD9', textTransform: 'capitalize',
                    letterSpacing: '0.07em',
                    borderBottom: '1px solid #EDE0FF',
                  }}>{category}</div>

                  {/* Each Q&A row */}
                  {questions.map((q, idx) => (
                    <div key={q.questionId ?? idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: idx < questions.length - 1 ? '1px solid #F5F0FF' : 'none',
                      background: idx % 2 === 0 ? '#FDFBFF' : '#fff',
                    }}>
                      <span style={{ fontSize: 13, color: '#374151', flex: 1, marginRight: 16 }}>
                        {q.question || `Question ${q.questionId}`}
                      </span>
                      <AnswerBadge answer={q.answer} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Bottom Bar ── */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0,
          right: 0,
          background: '#a5c4d4ff', // ✅ light background
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)', // ✅ soft shadow
        }}
      >
        <Button
          customColor="#ffffff" // ✅ white button bg
          color="#7e3a93"       // ✅ purple text
          onClick={handleNext}
          style={{
            borderRadius: '20px',
            fontWeight: 600,
            padding: '6px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
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