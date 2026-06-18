import React, { useState, useEffect, useRef } from 'react'
import Button from '../components/CustomButton/CustomButton'
import { COLORS } from '../Themes'
import { CCard, CCardBody } from '@coreui/react'
import { useToast } from '../utils/Toaster'
import { getTemplatesByClinic, getTemplateById } from '../Auth/Auth'
import Select from 'react-select'
import { normalizeSavedData } from '../utils/normalizeData'

/* ─── Diagnosis static options ─────────────────────────────────────────── */
const SEVERITY_OPTIONS = [
  { label: 'Select severity...', value: '' },
  { label: 'Mild', value: 'Mild' },
  { label: 'Moderate', value: 'Moderate' },
  { label: 'Severe', value: 'Severe' },
]

const STAGE_OPTIONS = [
  { label: 'Select stage...', value: '' },
  { label: 'Acute', value: 'Acute' },
  { label: 'Sub-acute', value: 'Sub-acute' },
  { label: 'Chronic', value: 'Chronic' },
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
    onBlur={e => (e.target.style.borderColor = '#b6cfe8')}
  />
)

const DiagSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ ...diagInputStyle, cursor: 'pointer', appearance: 'auto' }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e => (e.target.style.borderColor = '#b6cfe8')}
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
    onBlur={e => (e.target.style.borderColor = '#b6cfe8')}
  />
)

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const PrescriptionTab = ({ seed = {}, onNext, formData = {}, setFormData }) => {

  const rawAss = formData.assessment || {}
  const sub = rawAss.subjectiveAssessment || {}
  const fun = rawAss.functionalAssessment || {}
  const phy = rawAss.physicalExamination || {}

  // Flatten for easy display
  const assessment = {
    chiefComplaint: sub.chiefComplaint || rawAss.chiefComplaint || formData.symptoms?.complaintDetails || '',
    painScale: sub.painScale || rawAss.painScale || 0,
    painType: sub.painType || rawAss.painType || '',
    posture: phy.postureAssessment || rawAss.posture || '',
    rangeOfMotion: phy.rangeOfMotion || rawAss.rangeOfMotion || '',
    specialTests: rawAss.specialTests || '',
    redFlags: rawAss.redFlags || {},
    radiationNeuro: rawAss.radiationNeuro || {},
    specialSymptoms: rawAss.specialSymptoms || {},
    psychosocial: rawAss.psychosocial || {},
    chronic: rawAss.chronicPainPatients || {},
    sports: rawAss.sportsRehabPatients || {},
    neuro: rawAss.neuroRehabPatients || {},
    difficultiesIn: fun.difficultiesIn || rawAss.difficultiesIn || [],
  }

  const isValid = (val) => val && (typeof val === 'string' ? val.trim().length > 0 : (Array.isArray(val) ? val.length > 0 : true))
  const hasAssessmentData = (
    isValid(assessment.chiefComplaint) || assessment.painScale > 0 || isValid(assessment.painType) ||
    (assessment.difficultiesIn?.length > 0) || isValid(assessment.posture) || isValid(assessment.rangeOfMotion) ||
    isValid(assessment.specialTests) ||
    Object.values(assessment.redFlags).some(v => v === true) ||
    Object.values(assessment.radiationNeuro).some(v => v === true) ||
    Object.values(assessment.specialSymptoms).some(v => v === true) ||
    Object.values(assessment.psychosocial).some(v => v === true) ||
    Object.values(assessment.chronic || {}).some(v => !!v) ||
    Object.values(assessment.sports || {}).some(v => !!v) ||
    Object.values(assessment.neuro || {}).some(v => !!v)
  )

  /* ── State ── */
  const [physioDiagnosis, setPhysioDiagnosis] = useState(seed.diagnosis?.physioDiagnosis ?? '')
  const [affectedArea, setAffectedArea] = useState(seed.diagnosis?.affectedArea ?? '')
  const [severity, setSeverity] = useState(seed.diagnosis?.severity ?? '')
  const [stage, setStage] = useState(seed.diagnosis?.stage ?? '')
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState(seed.diagnosis?.differentialDiagnosis ?? '')
  const [diagNotes, setDiagNotes] = useState(seed.diagnosis?.notes ?? '')

  const { success, warning, error } = useToast()
  const seedRef = useRef(null)

  const [templateOptions, setTemplateOptions] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await getTemplatesByClinic()
      if (data && Array.isArray(data)) {
        const options = data.map(t => {
          const tId = t.templateRecordId || t.id || t._id || t.therapistRecordId || 'N/A'
          const name = t.physioDiagnosis || t.title || t.diagnosis?.physioDiagnosis || 'Unnamed Template'
          return {
            label: name,
            value: tId,
            data: t
          }
        })
        setTemplateOptions(options)
      }
    } catch (err) {
      console.error('❌ Failed to fetch templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleTemplateSelect = async (selected) => {
    console.log('🔍 [PrescriptionTab] handleTemplateSelect triggered. Selected option:', selected)
    if (!selected) {
      console.log('🔍 [PrescriptionTab] No template selected (cleared)')
      return
    }

    const searchStr = String(selected.value || selected.label || '').trim().toLowerCase()
    
    // Search templateOptions to find the matching templateRecordId
    const match = templateOptions.find(opt => {
      const val = String(opt.value || '').toLowerCase()
      const lab = String(opt.label || '').toLowerCase()
      const diagName = String(opt.data?.physioDiagnosis || '').toLowerCase()
      return val === searchStr || lab === searchStr || diagName === searchStr
    })

    const tId = match ? match.value : selected.value
    console.log('🔍 [PrescriptionTab] Resolved template ID:', tId, 'from searchStr:', searchStr)

    if (!tId || tId === 'N/A') {
      console.warn('🔍 [PrescriptionTab] No valid template ID resolved.')
      return
    }

    try {
      console.log('🔍 [PrescriptionTab] Calling getTemplateById with ID:', tId)
      const details = await getTemplateById(tId)
      console.log('🔍 [PrescriptionTab] getTemplateById response details:', details)
      if (details) {
        const normalized = normalizeSavedData(details)
        console.log('🔍 [PrescriptionTab] Normalized template details:', normalized)

        // Auto-populate local state
        setPhysioDiagnosis(normalized.diagnosis?.physioDiagnosis ?? '')
        setAffectedArea(normalized.diagnosis?.affectedArea ?? '')
        setSeverity(normalized.diagnosis?.severity ?? '')
        setStage(normalized.diagnosis?.stage ?? '')
        setDifferentialDiagnosis(normalized.diagnosis?.differentialDiagnosis ?? '')
        setDiagNotes(normalized.diagnosis?.notes ?? '')

        // Update parent formData state
        if (setFormData) {
          setFormData(prev => ({
            ...prev,
            diagnosis: normalized.diagnosis || {},
            exercisePlan: normalized.exercisePlan || {},
            followUp: normalized.followUp || {},
            investigation: normalized.investigation || {},
            prescription: normalized.prescription || {},
            therapySessions: normalized.therapySessions || {},
            treatmentPlan: normalized.treatmentPlan || {},
            prescriptionPdf: normalized.prescriptionPdf || '',
          }))
        }
        success('Template applied successfully!', { title: 'Applied' })
      } else {
        console.warn('🔍 [PrescriptionTab] No details returned from getTemplateById')
      }
    } catch (err) {
      console.error('❌ Error applying template:', err)
      error('Failed to apply template.', { title: 'Error' })
    }
  }

  useEffect(() => {
    if (seed === seedRef.current) return
    seedRef.current = seed
    if (!seed?.diagnosis) return

    setPhysioDiagnosis(seed.diagnosis.physioDiagnosis ?? '')
    setAffectedArea(seed.diagnosis.affectedArea ?? '')
    setSeverity(seed.diagnosis.severity ?? '')
    setStage(seed.diagnosis.stage ?? '')
    setDifferentialDiagnosis(seed.diagnosis.differentialDiagnosis ?? '')
    setDiagNotes(seed.diagnosis.notes ?? '')
  }, [seed])

  /* ── handleNext ── */
  const handleNext = () => {
    const payload = {
      diagnosis: { physioDiagnosis, affectedArea, severity, stage, differentialDiagnosis, notes: diagNotes },
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
        
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
      }}
    >

      {/* ── TEMPLATE SEARCH CARD ────────────────────────────────────────── */}
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
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16,
            borderBottom: '2px solid #dceeff',
            paddingBottom: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17,
              boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
            }}>🔍</div>
            <h5 style={{
              margin: 0,
              color: '#1B4F8A',
              fontWeight: 700,
              fontSize: '1.05rem',
            }}>Quick Template Search</h5>
          </div>
          <div>
            <label style={diagLabelStyle}>Search Template by Name</label>
            <Select
              options={templateOptions}
              isLoading={loadingTemplates}
              onChange={handleTemplateSelect}
              placeholder="Search and select a template by name..."
              isClearable
              styles={{
                control: (provided) => ({
                  ...provided,
                  border: '1.5px solid #b6cfe8',
                  borderRadius: 7,
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#1B4F8A',
                  },
                }),
              }}
            />
          </div>
        </CCardBody>
      </CCard>

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

            <DiagField label="Primary Diagnosis">
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 16 }}>
            {/* Differential Diagnosis */}
            <DiagField label="Differential Diagnosis">
              <DiagTextarea
                value={differentialDiagnosis}
                onChange={setDifferentialDiagnosis}
                placeholder="e.g. Possible herniated disc"
                rows={3}
              />
            </DiagField>

            {/* Notes */}
            <DiagField label="Notes">
              <DiagTextarea
                value={diagNotes}
                onChange={setDiagNotes}
                placeholder="e.g. No radiating pain observed"
                rows={3}
              />
            </DiagField>
          </div>

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