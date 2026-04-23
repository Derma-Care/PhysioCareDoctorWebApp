import React, { useEffect, useState } from 'react'
import Button from '../components/CustomButton/CustomButton'
import './Tests.css'
import { COLORS } from '../Themes'
import {
  CAlert, CCard, CCardBody, CCol, CForm, CRow, CContainer,
} from '@coreui/react'
import { useDoctorContext } from '../Context/DoctorContext'

/* ─── Static options ─────────────────────────────────────────────────────── */
const PAIN_SCALE_OPTIONS = [
  { label: 'Select pain scale...', value: '' },
  ...Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}/10`, value: `${i + 1}/10` })),
]
const ONSET_OPTIONS = [
  { label: 'Select onset...', value: '' },
  { label: 'Sudden', value: 'Sudden' },
  { label: 'Gradual', value: 'Gradual' },
  { label: 'Insidious', value: 'Insidious' },
]
const PATIENT_PAIN_OPTIONS = [
  { label: 'Select patient pain type...', value: '' },
  { label: 'Chronic Pain',  value: 'chronicPain' },
  { label: 'Sports Rehab',  value: 'sportsRehab' },
  { label: 'Neuro Rehab',   value: 'neuroRehab' },
]
const FUNCTIONAL_DIFFICULTIES = [
  'Walking', 'Climbing stairs', 'Sitting/Standing', 'Lifting/Carrying', 'Sports/Training',
]
const POSTURE_OPTIONS  = ['Normal', 'Deviations']
const ROM_OPTIONS      = ['Normal', 'Restricted']
const STRENGTH_OPTIONS = ['Normal', 'Weakness in']
const NEURO_OPTIONS    = ['Normal', 'Balance', 'Coordination', 'Sensation issues']

/* ─── Tabs config ────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'subjective',         label: 'Subjective',          icon: '📋' },
  { id: 'functional',         label: 'Functional',           icon: '🏃' },
  { id: 'physical',           label: 'Physical Exam',        icon: '🔬' },
  { id: 'objective',          label: 'Objective',            icon: '📐' },
  { id: 'painClassification', label: 'Pain Classification',  icon: '💊' },
]

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8', borderRadius: 7, fontSize: '0.875rem',
  color: '#1a3a5c', backgroundColor: '#FFFFFF', padding: '7px 11px',
  width: '100%', boxSizing: 'border-box', height: 38,
  outline: 'none', fontFamily: 'inherit',
}
const labelStyle = {
  fontWeight: 700, fontSize: '0.82rem', color: '#1B4F8A',
  marginBottom: 4, display: 'block', letterSpacing: '0.08em',
  textTransform: 'uppercase',
}
const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  marginBottom: 14, marginTop: 8, paddingBottom: 8,
  borderBottom: '1.5px solid #dceeff',
}
const checkboxRowStyle = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  fontSize: '0.875rem', color: '#1a3a5c', cursor: 'pointer',
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const isValid = (v) =>
  v !== undefined && v !== null && v !== '' && v !== 'NA' &&
  !(typeof v === 'string' && v.trim().toLowerCase() === 'undefined')

const getPainLabel = (value) =>
  PATIENT_PAIN_OPTIONS.find(o => o.value === value)?.label || value

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder = '' }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} style={inputStyle}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')} />
)

const NativeSelect = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')} />
)

const SectionHeader = ({ icon, title, color = '#1B4F8A' }) => (
  <div style={sectionHeaderStyle}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <h6 style={{ margin: 0, color: '#1B4F8A', fontWeight: 700, fontSize: '0.95rem' }}>
      {icon} {title}
    </h6>
  </div>
)

/* Plain multi-select toggle (used for Functional difficulties) */
const toggleItem = (arr, item) =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

/* Exclusive toggle: selecting 'Normal' clears all others; selecting any
   other option removes 'Normal' from the selection. */
const toggleExclusive = (arr, item, normalValue = 'Normal') => {
  if (item === normalValue) {
    return arr.includes(normalValue) ? [] : [normalValue]
  } else {
    const withoutNormal = arr.filter(i => i !== normalValue)
    return withoutNormal.includes(item)
      ? withoutNormal.filter(i => i !== item)
      : [...withoutNormal, item]
  }
}

const UnderlineInput = ({ value, onChange, placeholder = '' }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      border: 'none', borderBottom: '1.5px solid #b6cfe8',
      background: 'transparent', outline: 'none',
      fontSize: '0.875rem', color: '#1a3a5c',
      padding: '2px 4px', width: 220, fontFamily: 'inherit',
    }} />
)

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Assessment = ({ seed = {}, onNext, sidebarWidth = 0 }) => {

  /* ── tab state ── */
  const [activeTab, setActiveTab] = useState(0)

  const [painScale,           setPainScale]           = useState(seed.painScale          ?? '')
  const [painType,            setPainType]            = useState(seed.painType           ?? '')
  const [durationValue,       setDurationValue]       = useState('')
  const [durationUnit,        setDurationUnit]        = useState('day')
  const [onset,               setOnset]               = useState(seed.onset              ?? '')
  const [aggravatingFactors,  setAggravatingFactors]  = useState(seed.aggravatingFactors ?? '')
  const [relievingFactors,    setRelievingFactors]    = useState(seed.relievingFactors   ?? '')
  const [observations,        setObservations]        = useState(seed.observations       ?? '')
  const [posture,             setPosture]             = useState(seed.posture            ?? '')
  const [rangeOfMotion,       setRangeOfMotion]       = useState(seed.rangeOfMotion      ?? '')
  const [specialTests,        setSpecialTests]        = useState(seed.specialTests       ?? '')
  const [difficultiesIn,      setDifficultiesIn]      = useState(seed.difficultiesIn     ?? [])
  const [otherDifficulty,     setOtherDifficulty]     = useState(seed.otherDifficulty    ?? '')
  const [dailyLivingAffected, setDailyLivingAffected] = useState(seed.dailyLivingAffected ?? '')
  const [postureAssessment,   setPostureAssessment]   = useState(seed.postureAssessment  ?? [])
  const [postureDeviations,   setPostureDeviations]   = useState(seed.postureDeviations  ?? '')
  const [romStatus,           setRomStatus]           = useState(seed.romStatus          ?? [])
  const [romRestricted,       setRomRestricted]       = useState(seed.romRestricted      ?? '')
  const [romJoints,           setRomJoints]           = useState(seed.romJoints          ?? '')
  const [muscleStrength,      setMuscleStrength]      = useState(seed.muscleStrength     ?? [])
  const [muscleWeakness,      setMuscleWeakness]      = useState(seed.muscleWeakness     ?? '')
  const [neurologicalSigns,   setNeurologicalSigns]   = useState(seed.neurologicalSigns  ?? [])
  const [patientPain,         setPatientPain]         = useState(seed.patientPain        ?? '')
  const [painTriggers,        setPainTriggers]        = useState(seed.painTriggers       ?? '')
  const [chronicRelieving,    setChronicRelieving]    = useState(seed.chronicRelieving   ?? '')
  const [typeOfSport,         setTypeOfSport]         = useState(seed.typeOfSport        ?? '')
  const [recurringInjuries,   setRecurringInjuries]   = useState(seed.recurringInjuries  ?? '')
  const [returnToSportGoals,  setReturnToSportGoals]  = useState(seed.returnToSportGoals ?? '')
  const [neuroDiagnosis,      setNeuroDiagnosis]      = useState(seed.neuroDiagnosis     ?? '')
  const [neuroOnset,          setNeuroOnset]          = useState(seed.neuroOnset         ?? '')
  const [mobilityStatus,      setMobilityStatus]      = useState(seed.mobilityStatus     ?? '')
  const [cognitiveStatus,     setCognitiveStatus]     = useState(seed.cognitiveStatus    ?? '')
  const [snackbar,            setSnackbar]            = useState({ show: false, message: '', type: '' })

  const { patientData } = useDoctorContext()

  useEffect(() => {
    const s = seed || {}
    if (s.duration) {
      const parts = s.duration.split(' ')
      setDurationValue(parts[0] || '')
      setDurationUnit(parts[1]?.replace(/s$/, '') || 'day')
    }
    setPainScale(s.painScale ?? '')
    setPainType(s.painType ?? '')
    setOnset(s.onset ?? '')
    setAggravatingFactors(s.aggravatingFactors ?? '')
    setRelievingFactors(s.relievingFactors ?? '')
    setPosture(s.posture ?? '')
    setRangeOfMotion(s.rangeOfMotion ?? '')
    setSpecialTests(s.specialTests ?? '')
    setObservations(s.observations ?? '')
    setDifficultiesIn(s.difficultiesIn ?? [])
    setOtherDifficulty(s.otherDifficulty ?? '')
    setDailyLivingAffected(s.dailyLivingAffected ?? '')
    setPostureAssessment(s.postureAssessment ?? [])
    setPostureDeviations(s.postureDeviations ?? '')
    setRomStatus(s.romStatus ?? [])
    setRomRestricted(s.romRestricted ?? '')
    setRomJoints(s.romJoints ?? '')
    setMuscleStrength(s.muscleStrength ?? [])
    setMuscleWeakness(s.muscleWeakness ?? '')
    setNeurologicalSigns(s.neurologicalSigns ?? [])
    if (s.patientPain) setPatientPain(s.patientPain)
    setPainTriggers(s.painTriggers ?? '')
    setChronicRelieving(s.chronicRelieving ?? '')
    setTypeOfSport(s.typeOfSport ?? '')
    setRecurringInjuries(s.recurringInjuries ?? '')
    setReturnToSportGoals(s.returnToSportGoals ?? '')
    setNeuroDiagnosis(s.neuroDiagnosis ?? '')
    setNeuroOnset(s.neuroOnset ?? '')
    setMobilityStatus(s.mobilityStatus ?? '')
    setCognitiveStatus(s.cognitiveStatus ?? '')
  }, [seed])

  const cameFromBackend = isValid(seed.patientPain)
  const effectivePain   = cameFromBackend ? seed.patientPain : patientPain

  /* ── Duration: block negatives ── */
  const handleDurationChange = (val) => {
    if (val === '' || Number(val) >= 0) setDurationValue(val)
  }

  const handleNext = () => {
    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1)
      return
    }
    // Last tab → submit
    const finalDuration = durationValue && durationUnit
      ? `${durationValue} ${durationUnit}${Number(durationValue) > 1 ? 's' : ''}`
      : ''
    const payload = {
      painScale, painType,
      duration: finalDuration,
      onset, aggravatingFactors, relievingFactors,
      posture, rangeOfMotion, specialTests, observations,
      difficultiesIn, otherDifficulty, dailyLivingAffected,
      postureAssessment, postureDeviations,
      romStatus, romRestricted, romJoints,
      muscleStrength, muscleWeakness, neurologicalSigns,
      patientPain: effectivePain,
      ...(effectivePain === 'chronicPain' && { painTriggers, chronicRelieving }),
      ...(effectivePain === 'sportsRehab' && { typeOfSport, recurringInjuries, returnToSportGoals }),
      ...(effectivePain === 'neuroRehab'  && { neuroDiagnosis, neuroOnset, mobilityStatus, cognitiveStatus }),
    }
    onNext?.(payload)
  }

  /* ─── Tab content ────────────────────────────────────────────────────── */
  const renderTabContent = () => {
    switch (TABS[activeTab].id) {

      /* ── 1. Subjective ── */
      case 'subjective':
        return (
          <>
            <SectionHeader icon="📋" title="Subjective Assessment" color="#2563eb" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 16 }}>
              <Field label="Pain Scale">
                <NativeSelect value={painScale} onChange={setPainScale} options={PAIN_SCALE_OPTIONS} />
              </Field>
              <Field label="Pain Type">
                <TextInput value={painType} onChange={setPainType} placeholder="e.g. Sharp and intermittent" />
              </Field>
              <Field label="Duration">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" min="0" value={durationValue}
                    onChange={e => handleDurationChange(e.target.value)}
                    placeholder="Value"
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
                    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}
                  />
                  <select value={durationUnit} onChange={e => setDurationUnit(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => (e.target.style.borderColor = '#1B4F8A')}
                    onBlur={e  => (e.target.style.borderColor = '#b6cfe8')}>
                    <option value="day">Day/s</option>
                    <option value="week">Week/s</option>
                    <option value="month">Month/s</option>
                  </select>
                </div>
              </Field>
              <Field label="Onset">
                <NativeSelect value={onset} onChange={setOnset} options={ONSET_OPTIONS} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 24 }}>
              <Field label="Aggravating Factors">
                <Textarea value={aggravatingFactors} onChange={setAggravatingFactors}
                  placeholder="e.g. Prolonged sitting, bending forward" rows={3} />
              </Field>
              <Field label="Relieving Factors">
                <Textarea value={relievingFactors} onChange={setRelievingFactors}
                  placeholder="e.g. Rest, hot pack, walking" rows={3} />
              </Field>
            </div>
          </>
        )

      /* ── 2. Functional ── */
      case 'functional':
        return (
          <>
            <SectionHeader icon="🏃" title="Functional Assessment" color="#0891b2" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Difficulties in:</label>
                <div style={{
                  background: '#EFF6FF', border: '1.5px solid #b6cfe8',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  {FUNCTIONAL_DIFFICULTIES.map(item => (
                    <label key={item} style={checkboxRowStyle}>
                      <input type="checkbox" checked={difficultiesIn.includes(item)}
                        onChange={() => setDifficultiesIn(toggleItem(difficultiesIn, item))}
                        style={{ width: 15, height: 15, accentColor: '#1B4F8A', cursor: 'pointer' }} />
                      {item}
                    </label>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input type="checkbox" checked={!!otherDifficulty}
                      onChange={e => !e.target.checked && setOtherDifficulty('')}
                      style={{ width: 15, height: 15, accentColor: '#1B4F8A', cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a3a5c' }}>Other:</span>
                    <UnderlineInput value={otherDifficulty} onChange={setOtherDifficulty} placeholder="specify..." />
                  </div>
                </div>
              </div>
              <Field label="Activities of Daily Living Affected">
                <Textarea value={dailyLivingAffected} onChange={setDailyLivingAffected}
                  placeholder="e.g. Cannot climb stairs, difficulty dressing..." rows={6} />
              </Field>
            </div>
          </>
        )

      /* ── 3. Physical Examination ── */
      case 'physical':
        return (
          <>
            <SectionHeader icon="🔬" title="Physical Examination" color="#7c3aed" />
            <div style={{
              marginBottom: 24, background: '#EFF6FF',
              border: '1.5px solid #b6cfe8', borderRadius: 10, overflow: 'hidden',
            }}>
              {/* Posture */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #dceeff', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B4F8A', minWidth: 160 }}>Posture Assessment:</span>
                {POSTURE_OPTIONS.map(opt => (
                  <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                    <input type="checkbox" checked={postureAssessment.includes(opt)}
                      onChange={() => setPostureAssessment(toggleExclusive(postureAssessment, opt))}
                      style={{ width: 15, height: 15, accentColor: '#1B4F8A', cursor: 'pointer' }} />
                    {opt}
                  </label>
                ))}
                {postureAssessment.includes('Deviations') && (
                  <UnderlineInput value={postureDeviations} onChange={setPostureDeviations} placeholder="describe deviations..." />
                )}
              </div>

              {/* ROM */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #dceeff', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B4F8A', minWidth: 160 }}>Range of Motion (ROM):</span>
                {ROM_OPTIONS.map(opt => (
                  <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                    <input type="checkbox" checked={romStatus.includes(opt)}
                      onChange={() => setRomStatus(toggleExclusive(romStatus, opt))}
                      style={{ width: 15, height: 15, accentColor: '#1B4F8A', cursor: 'pointer' }} />
                    {opt}
                  </label>
                ))}
                {romStatus.includes('Restricted') && (
                  <UnderlineInput value={romRestricted} onChange={setRomRestricted} placeholder="describe restriction..." />
                )}
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1B4F8A' }}>Joints affected:</span>
                <UnderlineInput value={romJoints} onChange={setRomJoints} placeholder="e.g. knee, shoulder..." />
              </div>

              {/* Muscle Strength */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #dceeff', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B4F8A', minWidth: 160 }}>Muscle Strength:</span>
                {STRENGTH_OPTIONS.map(opt => (
                  <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                    <input type="checkbox" checked={muscleStrength.includes(opt)}
                      onChange={() => setMuscleStrength(toggleExclusive(muscleStrength, opt))}
                      style={{ width: 15, height: 15, accentColor: '#1B4F8A', cursor: 'pointer' }} />
                    {opt}
                  </label>
                ))}
                {muscleStrength.includes('Weakness in') && (
                  <UnderlineInput value={muscleWeakness} onChange={setMuscleWeakness} placeholder="specify area..." />
                )}
              </div>

              {/* Neurological Signs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1B4F8A', minWidth: 160 }}>Neurological Signs:</span>
                {NEURO_OPTIONS.map(opt => (
                  <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                    <input type="checkbox" checked={neurologicalSigns.includes(opt)}
                      onChange={() => setNeurologicalSigns(toggleExclusive(neurologicalSigns, opt))}
                      style={{ width: 15, height: 15, accentColor: '#1B4F8A', cursor: 'pointer' }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </>
        )

      /* ── 4. Objective ── */
      case 'objective':
        return (
          <>
            <SectionHeader icon="📐" title="Objective / Additional Findings" color="#0891b2" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 24 }}>
              <Field label="Posture Notes">
                <Textarea value={posture} onChange={setPosture}
                  placeholder="e.g. Forward head posture, slight lumbar lordosis" rows={3} />
              </Field>
              <Field label="Range of Motion Notes">
                <Textarea value={rangeOfMotion} onChange={setRangeOfMotion}
                  placeholder="e.g. Restricted lumbar flexion to 60°" rows={3} />
              </Field>
              <Field label="Special Tests">
                <Textarea value={specialTests} onChange={setSpecialTests}
                  placeholder="e.g. SLR positive at 60 degrees" rows={3} />
              </Field>
              <Field label="Observations">
                <Textarea value={observations} onChange={setObservations}
                  placeholder="e.g. Muscle tightness in lower back" rows={3} />
              </Field>
            </div>
          </>
        )

      /* ── 5. Pain Classification ── */
      case 'painClassification':
        return (
          <>
            <SectionHeader icon="💊" title="Patient Pain Classification" color="#dc2626" />
            <div style={{ marginBottom: 20 }}>
              {cameFromBackend ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  background: '#EFF6FF', border: '1.5px solid #b6cfe8',
                  borderRadius: 10, padding: '12px 16px',
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1B4F8A' }}>
                    Pain type received from consultation:
                  </span>
                  <span style={{
                    background: '#dceeff', color: '#1B4F8A',
                    border: '1px solid #b6cfe8', borderRadius: 20,
                    padding: '4px 16px', fontSize: 13, fontWeight: 700,
                  }}>
                    {getPainLabel(effectivePain)}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', color: '#1B4F8A',
                    background: '#EFF6FF', border: '1px solid #b6cfe8',
                    borderRadius: 20, padding: '2px 10px',
                  }}>
                    Auto-filled from Complaints tab
                  </span>
                </div>
              ) : (
                <div style={{ maxWidth: 400 }}>
                  <Field label="Select Patient Pain Type">
                    <NativeSelect value={patientPain} onChange={setPatientPain} options={PATIENT_PAIN_OPTIONS} />
                  </Field>
                  {!patientPain && (
                    <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Select a type to reveal additional fields below.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Chronic Pain */}
            {effectivePain === 'chronicPain' && (
              <div style={{ marginBottom: 24, background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991b1b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🔴</span> Chronic Pain Patients
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
                  <Field label="Pain Triggers">
                    <Textarea value={painTriggers} onChange={setPainTriggers}
                      placeholder="e.g. stress, weather changes, posture..." rows={3} />
                  </Field>
                  <Field label="Relieving Factors">
                    <Textarea value={chronicRelieving} onChange={setChronicRelieving}
                      placeholder="e.g. heat therapy, rest, medication..." rows={3} />
                  </Field>
                </div>
              </div>
            )}

            {/* Sports Rehab */}
            {effectivePain === 'sportsRehab' && (
              <div style={{ marginBottom: 24, background: '#f0fff4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#065f46', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🟢</span> Sports Rehab Patients
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
                  <Field label="Type of Sport">
                    <TextInput value={typeOfSport} onChange={setTypeOfSport} placeholder="e.g. football, cricket, tennis..." />
                  </Field>
                  <Field label="Recent / Recurring Injuries">
                    <TextInput value={recurringInjuries} onChange={setRecurringInjuries} placeholder="e.g. hamstring tear, ankle sprain..." />
                  </Field>
                  <Field label="Return-to-Sport Goals">
                    <Textarea value={returnToSportGoals} onChange={setReturnToSportGoals}
                      placeholder="e.g. return to training in 4 weeks..." rows={3} />
                  </Field>
                </div>
              </div>
            )}

            {/* Neuro Rehab */}
            {effectivePain === 'neuroRehab' && (
              <div style={{ marginBottom: 24, background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#5b21b6', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🟣</span> Neuro Rehab Patients
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
                  <Field label="Diagnosis">
                    <TextInput value={neuroDiagnosis} onChange={setNeuroDiagnosis} placeholder="e.g. stroke, Parkinson's, MS..." />
                  </Field>
                  <Field label="Onset">
                    <TextInput value={neuroOnset} onChange={setNeuroOnset} placeholder="e.g. 3 months ago, sudden..." />
                  </Field>
                  <Field label="Current Mobility Status">
                    <TextInput value={mobilityStatus} onChange={setMobilityStatus} placeholder="e.g. uses walker, wheelchair bound..." />
                  </Field>
                  <Field label="Cognitive / Communication Status">
                    <TextInput value={cognitiveStatus} onChange={setCognitiveStatus} placeholder="e.g. alert and oriented, aphasia..." />
                  </Field>
                </div>
              </div>
            )}
          </>
        )

      default:
        return null
    }
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="tests-wrapper pb-5" style={{ paddingBottom: '90px', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>

      {snackbar.show && (
        <CAlert color={snackbar.type === 'error' ? 'danger' : snackbar.type || 'info'} className="mb-2">
          {snackbar.message}
        </CAlert>
      )}

      <CContainer fluid className="p-0">
        <CRow className="g-3">
          <CCol xs={12}>
            <CCard className="h-100" style={{
              border: '1.5px solid #b6cfe8', borderRadius: 12,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 24px rgba(27,79,138,0.08)',
            }}>
              <CCardBody>

                {/* Card header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 18, borderBottom: '2px solid #dceeff', paddingBottom: 14,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'linear-gradient(135deg,#1B4F8A,#2A6DB5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, boxShadow: '0 2px 8px rgba(27,79,138,0.25)',
                  }}>🩺</div>
                  <h5 style={{ margin: 0, color: '#1B4F8A', fontWeight: 700, fontSize: '1.1rem' }}>Assessment</h5>
                </div>

                {/* ── Tab Bar ── */}
                <div style={{
                  display: 'flex', gap: 4, marginBottom: 24,
                  borderBottom: '2px solid #dceeff',
                  paddingBottom: 0,
                }}>
                  {TABS.map((tab, idx) => {
                    const isActive = idx === activeTab
                    const isDone   = idx < activeTab
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px',
                          border: 'none',
                          borderBottom: isActive ? '2.5px solid #1B4F8A' : '2.5px solid transparent',
                          background: 'transparent',
                          color: isActive ? '#1B4F8A' : isDone ? '#64b5f6' : '#6b7280',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s',
                          letterSpacing: '0.04em',
                          marginBottom: -2,
                        }}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {isDone && (
                          <span style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#1B4F8A', color: '#fff',
                            fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, flexShrink: 0,
                          }}>✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* ── Step indicator ── */}
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Step {activeTab + 1} of {TABS.length}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {TABS.map((_, idx) => (
                      <div key={idx} style={{
                        width: idx === activeTab ? 20 : 8, height: 6,
                        borderRadius: 3,
                        background: idx < activeTab ? '#1B4F8A' : idx === activeTab ? '#2A6DB5' : '#dceeff',
                        transition: 'all 0.2s',
                      }} />
                    ))}
                  </div>
                </div>

                <CForm>
                  {renderTabContent()}
                </CForm>

              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>

      {/* ── Sticky bottom bar ── */}
      <div className="position-fixed bottom-0" style={{
        left: 0, right: 0,
        background: '#FFFFFF',
        borderTop: '2px solid #1B4F8A',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        padding: '10px 20px',
        boxShadow: '0 -2px 10px rgba(27,79,138,0.12)',
      }}>
        {/* Back button */}
        <Button
          customColor={activeTab === 0 ? '#e2e8f0' : '#e8f0fb'}
          onClick={() => activeTab > 0 && setActiveTab(activeTab - 1)}
          disabled={activeTab === 0}
          style={{
            color: activeTab === 0 ? '#94a3b8' : '#1B4F8A',
            borderRadius: '18px',
            padding: '6px 24px',
            fontWeight: 700,
            border: `1.5px solid ${activeTab === 0 ? '#e2e8f0' : '#b6cfe8'}`,
            cursor: activeTab === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Back
        </Button>

        {/* Next / Submit button */}
        <Button
          customColor="#1B4F8A"
          onClick={handleNext}
          style={{
            color: '#FFFFFF',
            borderRadius: '18px',
            padding: '6px 24px',
            fontWeight: 700,
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

export default Assessment