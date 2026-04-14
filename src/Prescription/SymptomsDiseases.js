import React, { useEffect, useMemo, useState } from 'react'
import { CSpinner } from '@coreui/react'
import FileUploader from './FileUploader'
import Button from '../components/CustomButton/CustomButton'
import Snackbar from '../components/Snackbar'
import { useToast } from '../utils/Toaster'
import { getBookingDetails } from '../Auth/Auth'
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

const StatusBadge = ({ status }) => {
  const map = {
    Confirmed: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    Pending:   { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
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

const readonlyChip = {
  background: '#F3EEFF', border: '1px solid #DDD0FF',
  borderRadius: 10, padding: '10px 14px',
  fontSize: 13, fontWeight: 700, color: '#5B21B6',
}

// ─── main component ──────────────────────────────────────────────────────────
const SymptomsDiseases = ({ seed = {}, onNext, patientData, setFormData }) => {

  const [symptomDetails, setSymptomDetails] = useState(seed.symptomDetails ?? patientData?.problem ?? '')
  const [duration, setDuration] = useState(patientData?.symptomsDuration ?? '0 Days')
  const [attachments, setAttachments] = useState(
    Array.isArray(seed.attachments) ? seed.attachments
      : Array.isArray(patientData?.attachments) ? patientData.attachments : [],
  )

  const [loadingBooking, setLoadingBooking] = useState(false)
  const [bookingRecord, setBookingRecord] = useState(null)
  const [partImage, setPartImage] = useState('')
  const [theraphyAnswers, setTheraphyAnswers] = useState({})
  const [selectedTherapy, setSelectedTherapy] = useState('')
  const [parts, setParts] = useState([])
  const [attachmentImages, setAttachmentImages] = useState([])

  // Complaint / background fields
  const [previousInjuries, setPreviousInjuries] = useState('')
  const [currentMedications, setCurrentMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [occupation, setOccupation] = useState('')
  const [insuranceProvider, setInsuranceProvider] = useState('')
  const [activityLevels, setActivityLevels] = useState([])
  const [patientPain, setPatientPain] = useState('')          // ← NEW

  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  const { error } = useToast()

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
        else setDuration('0 Days')
        if (isValid(record.subServiceName)) setSelectedTherapy(record.subServiceName)
        if (record.partImage) setPartImage(record.partImage)
        if (Array.isArray(record.parts)) setParts(record.parts)
        if (record.theraphyAnswers && typeof record.theraphyAnswers === 'object')
          setTheraphyAnswers(record.theraphyAnswers)

        // Complaint / background fields
        if (isValid(record.previousInjuries)) setPreviousInjuries(record.previousInjuries)
        if (isValid(record.currentMedications)) setCurrentMedications(record.currentMedications)
        if (isValid(record.allergies)) setAllergies(record.allergies)
        if (isValid(record.occupation)) setOccupation(record.occupation)
        if (isValid(record.insuranceProvider)) setInsuranceProvider(record.insuranceProvider)
        if (Array.isArray(record.activityLevels) && record.activityLevels.length > 0)
          setActivityLevels(record.activityLevels)
        if (isValid(record.patientPain)) setPatientPain(record.patientPain)  // ← NEW

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

  // ── handleNext ────────────────────────────────────────────────────────────
  const handleNext = () => {
    const payload = {
      symptomDetails, duration, attachments,
      partImage, parts, selectedTherapy, theraphyAnswers, attachmentImages,
      previousInjuries, currentMedications, allergies,
      occupation, insuranceProvider, activityLevels,
      patientPain,                                             // ← NEW
    }
    onNext?.(payload)
  }

  const therapyGroups = useMemo(() => flattenTherapyAnswers(theraphyAnswers), [theraphyAnswers])
  const bk = bookingRecord

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: '#F8F5FF', minHeight: '100vh', paddingBottom: 90,
    }}>

      {/* ── Header ── */}
      <div style={{
        background: '#a5c4d4ff', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          fontSize: 10, color: '#7e3a93', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Patient Consultation
        </div>

        {bk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: '#ffffff', borderRadius: 24, padding: '6px 16px',
              color: '#7e3a93', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
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

          {/* ── Complaint Details ── */}
          <div style={card}>
            <SLabel text="Complaint Details" />

            {/* Main complaint textarea */}
            <textarea
              rows={4} value={symptomDetails}
              onChange={(e) => setSymptomDetails(e.target.value)}
              placeholder="Describe patient's main complaint…"
              style={{ ...inputBase, marginBottom: 14 }}
              onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
              onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
            />

            {/* Patient Pain */}
            <div style={{ marginBottom: 14 }}>
              <SLabel text="Patient Pain" />
              <input
                value={patientPain}
                onChange={(e) => setPatientPain(e.target.value)}
                placeholder="e.g. chronic pain, acute pain…"
                style={{ ...inputBase, resize: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
                onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
              />
            </div>

            {/* Previous Injuries + Current Medications */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <SLabel text="Previous Injuries" />
                <input
                  value={previousInjuries}
                  onChange={(e) => setPreviousInjuries(e.target.value)}
                  placeholder="e.g. none"
                  style={{ ...inputBase, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
                />
              </div>
              <div>
                <SLabel text="Current Medications" />
                <input
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. none"
                  style={{ ...inputBase, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
                />
              </div>
            </div>

            {/* Allergies + Occupation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <SLabel text="Allergies" />
                <input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. none"
                  style={{ ...inputBase, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
                />
              </div>
              <div>
                <SLabel text="Occupation" />
                <input
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. worker"
                  style={{ ...inputBase, resize: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
                />
              </div>
            </div>

            {/* Activity Levels chips (read-only display) */}
            {activityLevels.length > 0 && (
              <div>
                <SLabel text="Activity Levels" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activityLevels.map((lvl) => (
                    <span key={lvl} style={{
                      background: '#EDE9FE', color: '#5B21B6',
                      border: '1px solid #DDD6FE', borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, fontWeight: 700,
                    }}>{lvl}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Duration + Therapy side-by-side */}
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <SLabel text="Duration" />
                <input
                  value={duration || '0 Days'}
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
                  <div style={readonlyChip}>{selectedTherapy || bk?.subServiceName}</div>
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

          {/* Insurance Provider (kept separate as it's more administrative) */}
          <div style={card}>
            <SLabel text="Insurance Provider" />
            <input
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              placeholder="e.g. none"
              style={{ ...inputBase, resize: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#6C2BD9')}
              onBlur={(e) => (e.target.style.borderColor = '#E5D9FF')}
            />
          </div>

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

          {/* Upload New Attachments */}
          <div style={card}>
            <SLabel text="Upload New Attachments" />
            <FileUploader attachments={attachments} setAttachments={setAttachments} />
          </div>

        </div>
      </div>

      {/* ══ THERAPY QUESTIONNAIRE — full width ══ */}
      {therapyGroups.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto 20px', padding: '0 20px' }}>
          <div style={card}>
            <SLabel text="Therapy Questionnaire" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {therapyGroups.map(({ category, questions }) => (
                <div key={category} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #EDE0FF' }}>
                  <div style={{
                    background: 'linear-gradient(90deg,#F3EEFF,#EEF2FF)',
                    padding: '8px 16px', fontWeight: 700, fontSize: 12,
                    color: '#6C2BD9', textTransform: 'capitalize', letterSpacing: '0.07em',
                    borderBottom: '1px solid #EDE0FF',
                  }}>{category}</div>
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
      <div className="position-fixed bottom-0" style={{
        left: 0, right: 0,
        background: '#a5c4d4ff',
        display: 'flex', justifyContent: 'flex-end', gap: 16,
        padding: '10px 24px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
      }}>
        <Button
          customColor="#ffffff" color="#7e3a93"
          onClick={handleNext}
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        >
          Next
        </Button>
      </div>

      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} />}
    </div>
  )
}

export default SymptomsDiseases