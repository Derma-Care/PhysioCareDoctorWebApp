import React, { useState, useEffect, useRef } from 'react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { CCard, CCardBody } from '@coreui/react'
import { useToast } from '../utils/Toaster'

/* ─── Diagnosis static options ─────────────────────────────────────────── */
const SEVERITY_OPTIONS = [
  { label: 'Select severity...', value: '' },
  { label: 'Mild',     value: 'Mild' },
  { label: 'Moderate', value: 'Moderate' },
  { label: 'Severe',   value: 'Severe' },
]

const STAGE_OPTIONS = [
  { label: 'Select stage...', value: '' },
  { label: 'Acute',     value: 'Acute' },
  { label: 'Sub-acute', value: 'Sub-acute' },
  { label: 'Chronic',   value: 'Chronic' },
]

/* ─── Styles ─────────────────────────────────────────────────────────── */
const diagInputStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 7,
  fontSize: '0.875rem',
  color: '#1a3a5c',
  backgroundColor: '#FFFFFF',
  padding: '7px 11px',
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.18s ease',
}

const diagLabelStyle = {
  fontWeight: 700,
  fontSize: '0.82rem',
  color: '#1B4F8A',
  marginBottom: 4,
  display: 'block',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

/* ─── Tiny helpers ──────────────────────────────────────────────────────── */
const DiagField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={diagLabelStyle}>{label}</label>
    {children}
  </div>
)

const DiagTextInput = ({ value, onChange, placeholder = '' }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={diagInputStyle}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
  />
)

const DiagSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ ...diagInputStyle, cursor: 'pointer', appearance: 'auto' }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
)

const DiagTextarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{ ...diagInputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
  />
)

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const PrescriptionTab = ({ seed = {}, onNext }) => {

  /* ── State ── */
  const [physioDiagnosis, setPhysioDiagnosis] = useState(seed.diagnosis?.physioDiagnosis ?? '')
  const [affectedArea,    setAffectedArea]    = useState(seed.diagnosis?.affectedArea    ?? '')
  const [severity,        setSeverity]        = useState(seed.diagnosis?.severity        ?? '')
  const [stage,           setStage]           = useState(seed.diagnosis?.stage           ?? '')
  const [diagNotes,       setDiagNotes]       = useState(seed.diagnosis?.notes           ?? '')

  const { warning } = useToast()
  const seedRef = useRef(null)

  useEffect(() => {
    if (seed === seedRef.current) return
    seedRef.current = seed
    if (!seed?.diagnosis) return

    setPhysioDiagnosis(seed.diagnosis.physioDiagnosis ?? '')
    setAffectedArea(seed.diagnosis.affectedArea       ?? '')
    setSeverity(seed.diagnosis.severity               ?? '')
    setStage(seed.diagnosis.stage                     ?? '')
    setDiagNotes(seed.diagnosis.notes                 ?? '')
  }, [seed])

  /* ── handleNext ── */
  const handleNext = () => {
    const payload = {
      diagnosis: { physioDiagnosis, affectedArea, severity, stage, notes: diagNotes },
    }
    onNext?.(payload)
    console.log('🚀 PrescriptionTab payload:', payload)
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="container pb-5"
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}
    >

      {/* ── DIAGNOSIS SECTION ─────────────────────────────────────────────── */}
      <CCard
        className="mb-4"
        style={{
          border: '1.5px solid #b6cfe8',
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 24px rgba(27,79,138,0.10)',
        }}
      >
        <CCardBody>

          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 20,
            borderBottom: '2px solid #dceeff',
            paddingBottom: 12,
          }}>
            {/* Icon badge: blue gradient */}
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17,
              boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
            }}>📝</div>
            <h5 style={{
              margin: 0,
              color: '#1B4F8A',
              fontWeight: 700,
              fontSize: '1.05rem',
            }}>Diagnosis</h5>
          </div>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 16 }}>

            <DiagField label="Physio Diagnosis">
              <DiagTextInput
                value={physioDiagnosis}
                onChange={setPhysioDiagnosis}
                placeholder="e.g. Lumbar strain"
              />
            </DiagField>

            <DiagField label="Affected Area">
              <DiagTextInput
                value={affectedArea}
                onChange={setAffectedArea}
                placeholder="e.g. Lower back (L4-L5 region)"
              />
            </DiagField>

            <DiagField label="Severity">
              <DiagSelect value={severity} onChange={setSeverity} options={SEVERITY_OPTIONS} />
            </DiagField>

            <DiagField label="Stage">
              <DiagSelect value={stage} onChange={setStage} options={STAGE_OPTIONS} />
            </DiagField>

          </div>

          {/* Notes — full width */}
          <DiagField label="Notes">
            <DiagTextarea
              value={diagNotes}
              onChange={setDiagNotes}
              placeholder="e.g. No radiating pain observed"
              rows={3}
            />
          </DiagField>

        </CCardBody>
      </CCard>

      {/* ── BOTTOM ACTION BAR ─────────────────────────────────────────────── */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0, right: 0,
          background: '#FFFFFF',
          borderTop: '2px solid #1B4F8A',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(27,79,138,0.12)',
        }}
      >
        <Button
          customColor="#1B4F8A"
          color="#FFFFFF"
          onClick={handleNext}
          style={{
            borderRadius: '20px',
            fontWeight: 700,
            padding: '6px 24px',
            boxShadow: '0 2px 8px rgba(27,79,138,0.30)',
            border: '1.5px solid #1B4F8A',
          }}
        >
          Next
        </Button>
      </div>

    </div>
  )
}

export default PrescriptionTab