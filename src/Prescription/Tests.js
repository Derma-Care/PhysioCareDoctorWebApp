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
  { label: 'Chronic Pain', value: 'chronicPain' },
  { label: 'Sports Rehab', value: 'sportsRehab' },
  { label: 'Neuro Rehab', value: 'neuroRehab' },
]
const FUNCTIONAL_DIFFICULTIES = [
  'Walking', 'Climbing stairs', 'Sitting/Standing', 'Lifting/Carrying', 'Sports/Training',
]
const POSTURE_OPTIONS = ['Normal', 'Deviations']
const ROM_OPTIONS = ['Normal', 'Restricted']
const STRENGTH_OPTIONS = ['Normal', 'Weakness in']
const NEURO_OPTIONS = ['Normal', 'Balance', 'Coordination', 'Sensation issues']

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8', borderRadius: 7, fontSize: '0.875rem',
  color: '#1a3a5c', backgroundColor: '#f5f9ff', padding: '7px 11px',
  width: '100%', boxSizing: 'border-box', height: 38,
  outline: 'none', fontFamily: 'inherit',
}
const labelStyle = {
  fontWeight: 700, fontSize: '0.82rem', color: '#1a3a5c',
  marginBottom: 4, display: 'block', letterSpacing: '0.01em',
}
const sectionHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  marginBottom: 14, marginTop: 8, paddingBottom: 8,
  borderBottom: '1.5px solid #e3eef8',
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
    placeholder={placeholder} style={inputStyle} />
)
const NativeSelect = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)
const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }} />
)
const SectionHeader = ({ icon, title, color = '#1a5fa8' }) => (
  <div style={sectionHeaderStyle}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <h6 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '0.95rem' }}>
      {icon} {title}
    </h6>
  </div>
)
const toggleItem = (arr, item) =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

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

  const [chiefComplaint, setChiefComplaint] = useState(seed.chiefComplaint ?? '')
  const [painScale, setPainScale] = useState(seed.painScale ?? '')
  const [painType, setPainType] = useState(seed.painType ?? '')
  const [durationValue, setDurationValue] = useState('')
  const [durationUnit, setDurationUnit] = useState('day')
  const [onset, setOnset] = useState(seed.onset ?? '')
  const [aggravatingFactors, setAggravatingFactors] = useState(seed.aggravatingFactors ?? '')
  const [relievingFactors, setRelievingFactors] = useState(seed.relievingFactors ?? '')
  const [observations, setObservations] = useState(seed.observations ?? '')
  const [posture, setPosture] = useState(seed.posture ?? '')
  const [rangeOfMotion, setRangeOfMotion] = useState(seed.rangeOfMotion ?? '')
  const [specialTests, setSpecialTests] = useState(seed.specialTests ?? '')
  const [difficultiesIn, setDifficultiesIn] = useState(seed.difficultiesIn ?? [])
  const [otherDifficulty, setOtherDifficulty] = useState(seed.otherDifficulty ?? '')
  const [dailyLivingAffected, setDailyLivingAffected] = useState(seed.dailyLivingAffected ?? '')
  const [postureAssessment, setPostureAssessment] = useState(seed.postureAssessment ?? [])
  const [postureDeviations, setPostureDeviations] = useState(seed.postureDeviations ?? '')
  const [romStatus, setRomStatus] = useState(seed.romStatus ?? [])
  const [romRestricted, setRomRestricted] = useState(seed.romRestricted ?? '')
  const [romJoints, setRomJoints] = useState(seed.romJoints ?? '')
  const [muscleStrength, setMuscleStrength] = useState(seed.muscleStrength ?? [])
  const [muscleWeakness, setMuscleWeakness] = useState(seed.muscleWeakness ?? '')
  const [neurologicalSigns, setNeurologicalSigns] = useState(seed.neurologicalSigns ?? [])

  // ✅ patientPain local state — only used when NOT from backend
  const [patientPain, setPatientPain] = useState(seed.patientPain ?? '')

  const [painTriggers, setPainTriggers] = useState(seed.painTriggers ?? '')
  const [chronicRelieving, setChronicRelieving] = useState(seed.chronicRelieving ?? '')
  const [typeOfSport, setTypeOfSport] = useState(seed.typeOfSport ?? '')
  const [recurringInjuries, setRecurringInjuries] = useState(seed.recurringInjuries ?? '')
  const [returnToSportGoals, setReturnToSportGoals] = useState(seed.returnToSportGoals ?? '')
  const [neuroDiagnosis, setNeuroDiagnosis] = useState(seed.neuroDiagnosis ?? '')
  const [neuroOnset, setNeuroOnset] = useState(seed.neuroOnset ?? '')
  const [mobilityStatus, setMobilityStatus] = useState(seed.mobilityStatus ?? '')
  const [cognitiveStatus, setCognitiveStatus] = useState(seed.cognitiveStatus ?? '')
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })

  const { patientData } = useDoctorContext()

  /* ── Sync seed changes ── */
  useEffect(() => {
    const s = seed || {}
    if (s.duration) {
      const parts = s.duration.split(' ')
      setDurationValue(parts[0] || '')
      setDurationUnit(parts[1]?.replace('s', '') || 'day')
    }
    setChiefComplaint(s.chiefComplaint ?? '')
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
    // ✅ sync patientPain from seed (comes from Complaints tab via backend)
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

  /* ✅ KEY LOGIC:
     - cameFromBackend = true  → seed.patientPain was set from API in SymptomsDiseases
       → show read-only badge + auto-expand corresponding fields
     - cameFromBackend = false → show dropdown for doctor to select manually */
  const cameFromBackend = isValid(seed.patientPain)
  const effectivePain = cameFromBackend ? seed.patientPain : patientPain

  /* ── handleNext ── */
  const handleNext = () => {
    const finalDuration = durationValue && durationUnit
      ? `${durationValue} ${durationUnit}${Number(durationValue) > 1 ? 's' : ''}`
      : ''

    const payload = {
      chiefComplaint, painScale, painType,
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
      ...(effectivePain === 'neuroRehab' && { neuroDiagnosis, neuroOnset, mobilityStatus, cognitiveStatus }),
    }
    onNext?.(payload)
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="tests-wrapper pb-5" style={{ paddingBottom: '90px' }}>

      {snackbar.show && (
        <CAlert color={snackbar.type === 'error' ? 'danger' : snackbar.type || 'info'} className="mb-2">
          {snackbar.message}
        </CAlert>
      )}

      <CContainer fluid className="p-0">
        <CRow className="g-3">
          <CCol xs={12}>
            <CCard className="h-100" style={{ border: '1.5px solid #c8ddf0', borderRadius: 12, boxShadow: '0 4px 24px rgba(26,90,168,0.08)' }}>
              <CCardBody>

                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, borderBottom: '2px solid #e3eef8', paddingBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🩺</div>
                  <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.1rem' }}>Assessment</h5>
                </div>

                <CForm>

                  {/* ══ Section 1: Subjective ══ */}
                  <SectionHeader icon="📋" title="Subjective Assessment" color="#2563eb" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 16 }}>
                    <Field label="Chief Complaint">
                      <TextInput value={chiefComplaint} onChange={setChiefComplaint} placeholder="e.g. Lower back pain" />
                    </Field>
                    <Field label="Pain Scale">
                      <NativeSelect value={painScale} onChange={setPainScale} options={PAIN_SCALE_OPTIONS} />
                    </Field>
                    <Field label="Pain Type">
                      <TextInput value={painType} onChange={setPainType} placeholder="e.g. Sharp and intermittent" />
                    </Field>
                    <Field label="Duration">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" value={durationValue} onChange={e => setDurationValue(e.target.value)}
                          placeholder="Value" style={{ ...inputStyle, flex: 1 }} />
                        <select value={durationUnit} onChange={e => setDurationUnit(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}>
                          <option value="day">Day</option>
                          <option value="week">Week</option>
                          <option value="month">Month</option>
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

                  {/* ══ Section 2: Functional Assessment ══ */}
                  <SectionHeader icon="🏃" title="Functional Assessment" color="#0891b2" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 24 }}>
                    <div>
                      <label style={labelStyle}>Difficulties in:</label>
                      <div style={{ background: '#f5f9ff', border: '1.5px solid #b6cfe8', borderRadius: 8, padding: '12px 14px' }}>
                        {FUNCTIONAL_DIFFICULTIES.map(item => (
                          <label key={item} style={checkboxRowStyle}>
                            <input type="checkbox" checked={difficultiesIn.includes(item)}
                              onChange={() => setDifficultiesIn(toggleItem(difficultiesIn, item))}
                              style={{ width: 15, height: 15, accentColor: '#1a5fa8', cursor: 'pointer' }} />
                            {item}
                          </label>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <input type="checkbox" checked={!!otherDifficulty}
                            onChange={e => !e.target.checked && setOtherDifficulty('')}
                            style={{ width: 15, height: 15, accentColor: '#1a5fa8', cursor: 'pointer' }} />
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

                  {/* ══ Section 3: Physical Examination ══ */}
                  <SectionHeader icon="🔬" title="Physical Examination" color="#7c3aed" />
                  <div style={{ marginBottom: 24, background: '#f5f9ff', border: '1.5px solid #b6cfe8', borderRadius: 10, overflow: 'hidden' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #e3eef8', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a3a5c', minWidth: 160 }}>Posture Assessment:</span>
                      {POSTURE_OPTIONS.map(opt => (
                        <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                          <input type="checkbox" checked={postureAssessment.includes(opt)}
                            onChange={() => setPostureAssessment(toggleItem(postureAssessment, opt))}
                            style={{ width: 15, height: 15, accentColor: '#1a5fa8', cursor: 'pointer' }} />
                          {opt}
                        </label>
                      ))}
                      {postureAssessment.includes('Deviations') && (
                        <UnderlineInput value={postureDeviations} onChange={setPostureDeviations} placeholder="describe deviations..." />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #e3eef8', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a3a5c', minWidth: 160 }}>Range of Motion (ROM):</span>
                      {ROM_OPTIONS.map(opt => (
                        <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                          <input type="checkbox" checked={romStatus.includes(opt)}
                            onChange={() => setRomStatus(toggleItem(romStatus, opt))}
                            style={{ width: 15, height: 15, accentColor: '#1a5fa8', cursor: 'pointer' }} />
                          {opt}
                        </label>
                      ))}
                      {romStatus.includes('Restricted') && (
                        <UnderlineInput value={romRestricted} onChange={setRomRestricted} placeholder="describe restriction..." />
                      )}
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a3a5c' }}>Joints affected:</span>
                      <UnderlineInput value={romJoints} onChange={setRomJoints} placeholder="e.g. knee, shoulder..." />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #e3eef8', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a3a5c', minWidth: 160 }}>Muscle Strength:</span>
                      {STRENGTH_OPTIONS.map(opt => (
                        <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                          <input type="checkbox" checked={muscleStrength.includes(opt)}
                            onChange={() => setMuscleStrength(toggleItem(muscleStrength, opt))}
                            style={{ width: 15, height: 15, accentColor: '#1a5fa8', cursor: 'pointer' }} />
                          {opt}
                        </label>
                      ))}
                      {muscleStrength.includes('Weakness in') && (
                        <UnderlineInput value={muscleWeakness} onChange={setMuscleWeakness} placeholder="specify area..." />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a3a5c', minWidth: 160 }}>Neurological Signs:</span>
                      {NEURO_OPTIONS.map(opt => (
                        <label key={opt} style={{ ...checkboxRowStyle, marginBottom: 0 }}>
                          <input type="checkbox" checked={neurologicalSigns.includes(opt)}
                            onChange={() => setNeurologicalSigns(toggleItem(neurologicalSigns, opt))}
                            style={{ width: 15, height: 15, accentColor: '#1a5fa8', cursor: 'pointer' }} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ══ Section 4: Objective ══ */}
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

                  {/* ══ Section 5: Patient Pain Classification ══ */}
                  <SectionHeader icon="💊" title="Patient Pain Classification" color="#dc2626" />

                  <div style={{ marginBottom: 20 }}>
                    {cameFromBackend ? (
                      /* ✅ CASE 1: Backend sent patientPain →
                         Show read-only badge, auto-expand fields below */
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                        background: '#fff7ed', border: '1.5px solid #fed7aa',
                        borderRadius: 10, padding: '12px 16px',
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                          Pain type received from consultation:
                        </span>
                        <span style={{
                          background: '#fee2e2', color: '#991b1b',
                          border: '1px solid #fecaca', borderRadius: 20,
                          padding: '4px 16px', fontSize: 13, fontWeight: 700,
                        }}>
                          {getPainLabel(effectivePain)}
                        </span>
                        <span style={{
                          fontSize: '0.75rem', color: '#b45309',
                          background: '#fef3c7', border: '1px solid #fcd34d',
                          borderRadius: 20, padding: '2px 10px',
                        }}>
                          Auto-filled from Complaints tab
                        </span>
                      </div>
                    ) : (
                      /* ✅ CASE 2: No backend value →
                         Show dropdown for doctor to pick manually */
                      <div style={{ maxWidth: 400 }}>
                        <Field label="Select Patient Pain Type">
                          <NativeSelect
                            value={patientPain}
                            onChange={setPatientPain}
                            options={PATIENT_PAIN_OPTIONS}
                          />
                        </Field>
                        {/* Hint when nothing selected yet */}
                        {!patientPain && (
                          <p style={{
                            marginTop: 8, fontSize: '0.8rem', color: '#6b7280',
                            fontStyle: 'italic',
                          }}>
                            Select a type to reveal additional fields below.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ══ Chronic Pain — auto-shown if effectivePain = chronicPain ══ */}
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

                  {/* ══ Sports Rehab — auto-shown if effectivePain = sportsRehab ══ */}
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

                  {/* ══ Neuro Rehab — auto-shown if effectivePain = neuroRehab ══ */}
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

                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>

      {/* Sticky bottom bar */}
      <div className="position-fixed bottom-0" style={{
        left: 0, right: 0, background: '#a5c4d4ff',
        display: 'flex', justifyContent: 'flex-end', gap: 12,
        padding: '10px 20px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
      }}>
        <Button
          customColor="#ffffff"
          style={{ color: COLORS.bgcolor, borderRadius: '18px', padding: '6px 18px', fontWeight: 600 }}
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default Assessment