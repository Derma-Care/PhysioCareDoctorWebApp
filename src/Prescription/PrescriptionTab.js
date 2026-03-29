import React, { useState, useEffect } from 'react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { CCard, CCardBody } from '@coreui/react'
import { useToast } from '../utils/Toaster'

/* ─── Diagnosis static options ─────────────────────────────────────────── */
const SEVERITY_OPTIONS = [
  { label: 'Select severity...', value: '' },
  { label: 'Mild',               value: 'Mild'     },
  { label: 'Moderate',           value: 'Moderate' },
  { label: 'Severe',             value: 'Severe'   },
]

const STAGE_OPTIONS = [
  { label: 'Select stage...',  value: ''          },
  { label: 'Acute',            value: 'Acute'     },
  { label: 'Sub-acute',        value: 'Sub-acute' },
  { label: 'Chronic',          value: 'Chronic'   },
]

/* ─── Diagnosis field styles ────────────────────────────────────────────── */
const diagInputStyle = {
  border: '1.5px solid #b6cfe8',
  borderRadius: 7,
  fontSize: '0.875rem',
  color: '#1a3a5c',
  backgroundColor: '#f5f9ff',
  padding: '7px 11px',
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  outline: 'none',
  fontFamily: 'inherit',
}

const diagLabelStyle = {
  fontWeight: 700,
  fontSize: '0.82rem',
  color: '#1a3a5c',
  marginBottom: 4,
  display: 'block',
  letterSpacing: '0.01em',
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
  />
)

const DiagSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ ...diagInputStyle, cursor: 'pointer', appearance: 'auto' }}
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
  />
)

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const PrescriptionTab = ({ seed = {}, onNext }) => {

  /* ── Diagnosis state ── */
  const [physioDiagnosis, setPhysioDiagnosis] = useState(seed.diagnosis?.physioDiagnosis ?? '')
  const [affectedArea,    setAffectedArea]    = useState(seed.diagnosis?.affectedArea    ?? '')
  const [severity,        setSeverity]        = useState(seed.diagnosis?.severity        ?? '')
  const [stage,           setStage]           = useState(seed.diagnosis?.stage           ?? '')
  const [diagNotes,       setDiagNotes]       = useState(seed.diagnosis?.notes           ?? '')

  const { warning } = useToast()

  /* Sync if seed changes */
  useEffect(() => {
    setPhysioDiagnosis(seed.diagnosis?.physioDiagnosis ?? '')
    setAffectedArea(seed.diagnosis?.affectedArea       ?? '')
    setSeverity(seed.diagnosis?.severity               ?? '')
    setStage(seed.diagnosis?.stage                     ?? '')
    setDiagNotes(seed.diagnosis?.notes                 ?? '')
  }, [seed])

  /* ── handleNext ── */
  const handleNext = () => {
    const payload = {
      diagnosis: {
        physioDiagnosis,
        affectedArea,
        severity,
        stage,
        notes: diagNotes,
      },
    }
    onNext?.(payload)
    console.log('🚀 PrescriptionTab payload:', payload)
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="container pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── DIAGNOSIS SECTION ─────────────────────────────────────────────── */}
      <CCard
        className="mb-4"
        style={{ border: '1.5px solid #c8ddf0', borderRadius: 12, boxShadow: '0 4px 24px rgba(26,90,168,0.08)' }}
      >
        <CCardBody>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderBottom: '2px solid #e3eef8', paddingBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>📝</div>
            <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.05rem' }}>Diagnosis</h5>
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
              <DiagSelect
                value={severity}
                onChange={setSeverity}
                options={SEVERITY_OPTIONS}
              />
            </DiagField>

            <DiagField label="Stage">
              <DiagSelect
                value={stage}
                onChange={setStage}
                options={STAGE_OPTIONS}
              />
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
      {/* ── END DIAGNOSIS SECTION ─────────────────────────────────────────── */}

      {/* ── BOTTOM ACTION BAR ─────────────────────────────────────────────── */}
      <div
        className="position-fixed bottom-0 right-0 p-3"
        style={{ zIndex: 1000, width: '75%', backgroundColor: '#F3f3f7' }}
      >
        <div   className="position-fixed bottom-0"
        style={{
          left: 0, right: 0,
          background: 'linear-gradient(90deg,#1a3a5c,#1a5fa8)',
          display: 'flex', justifyContent: 'flex-end',
          gap: 16, padding: '10px 24px',
          boxShadow: '0 -2px 16px rgba(26,90,168,0.18)',
        }}>
        
           <Button
                    customColor={COLORS.bgcolor}
                    color={COLORS.black}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
        </div>
      </div>

    </div>
  )
}

export default PrescriptionTab
