import React, { useEffect, useRef, useState } from 'react'
import Button from '../components/CustomButton/CustomButton'
import './Tests.css'
import { COLORS } from '../Themes'
import {
  CAlert,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CRow,
  CContainer,
} from '@coreui/react'
import { useDoctorContext } from '../Context/DoctorContext'

/* ─── Static options ───────────────────────────────────────────────────── */
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

/* ─── Styles ────────────────────────────────────────────────────────────── */
const inputStyle = {
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

const labelStyle = {
  fontWeight: 700,
  fontSize: '0.82rem',
  color: '#1a3a5c',
  marginBottom: 4,
  display: 'block',
  letterSpacing: '0.01em',
}

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 14,
  marginTop: 8,
  paddingBottom: 8,
  borderBottom: '1.5px solid #e3eef8',
}

/* ─── Small helpers ─────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder = '' }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={inputStyle}
  />
)

const NativeSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
)

const Textarea = ({ value, onChange, placeholder = '', rows = 3 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
  />
)

const SectionHeader = ({ icon, title, color = '#1a5fa8' }) => (
  <div style={sectionHeaderStyle}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <h6 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.01em' }}>
      {icon} {title}
    </h6>
  </div>
)

/* ─── Component ─────────────────────────────────────────────────────────── */
const Assessment = ({ seed = {}, onNext, sidebarWidth = 0 }) => {
  const [chiefComplaint, setChiefComplaint] = useState(seed.chiefComplaint ?? '')
  const [painScale, setPainScale] = useState(seed.painScale ?? '')
  const [painType, setPainType] = useState(seed.painType ?? '')
  const [duration, setDuration] = useState(seed.duration ?? '')
  const [onset, setOnset] = useState(seed.onset ?? '')
  const [aggravatingFactors, setAggravatingFactors] = useState(seed.aggravatingFactors ?? '')
  const [relievingFactors, setRelievingFactors] = useState(seed.relievingFactors ?? '')
  const [posture, setPosture] = useState(seed.posture ?? '')
  const [rangeOfMotion, setRangeOfMotion] = useState(seed.rangeOfMotion ?? '')
  const [specialTests, setSpecialTests] = useState(seed.specialTests ?? '')
  const [observations, setObservations] = useState(seed.observations ?? '')

  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const printRef = useRef(null)

  const { patientData, clinicDetails, doctorDetails } = useDoctorContext()

  /* sync when seed changes */
  useEffect(() => {
    const s = seed || {}
    setChiefComplaint(s.chiefComplaint ?? '')
    setPainScale(s.painScale ?? '')
    setPainType(s.painType ?? '')
    setDuration(s.duration ?? '')
    setOnset(s.onset ?? '')
    setAggravatingFactors(s.aggravatingFactors ?? '')
    setRelievingFactors(s.relievingFactors ?? '')
    setPosture(s.posture ?? '')
    setRangeOfMotion(s.rangeOfMotion ?? '')
    setSpecialTests(s.specialTests ?? '')
    setObservations(s.observations ?? '')
  }, [seed])

  const handleNext = () => {
    const payload = {
      chiefComplaint,
      painScale,
      painType,
      duration,
      onset,
      aggravatingFactors,
      relievingFactors,
      posture,
      rangeOfMotion,
      specialTests,
      observations,
    }
    console.log('🚀 Assessment payload:', payload)
    onNext?.(payload)
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /* ── Print ── */
  const handlePrint = () => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const rowHtml = (label, value) =>
      value
        ? `<div class="kv"><div class="label">${label}</div><div class="value">${escapeHtml(value)}</div></div>`
        : ''

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Assessment – ${escapeHtml(patientData?.name ?? '')}</title>
  <style>
    :root{ --ink:#0f172a; --muted:#6b7280; --line:#e5e7eb; --accent:#2563eb; --bg:#fff; }
    *{ box-sizing:border-box; }
    html,body{ margin:0; padding:0; }
    body{ font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial; color:var(--ink); background:var(--bg); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @page{ size:A4; margin:12mm; }
    .page{ padding:20px 24px; border:1px solid var(--line); border-radius:10px; }
    header{ display:flex; align-items:center; gap:16px; padding-bottom:14px; margin-bottom:18px; border-bottom:2px solid var(--line); }
    .logo{ width:110px; height:72px; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .logo img{ max-width:100%; max-height:100%; object-fit:contain; }
    .clinic-name{ font-size:20px; font-weight:700; }
    .clinic-meta{ font-size:13px; color:var(--muted); margin-top:4px; }
    .meta-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px 24px; margin-bottom:16px; }
    .kv{ display:flex; flex-direction:column; margin-bottom:10px; }
    .kv .label{ font-size:12px; color:var(--muted); }
    .kv .value{ font-size:14px; font-weight:600; padding-top:2px; }
    .section-card{ border:1px solid var(--line); border-radius:10px; padding:14px; background:#fff; margin-bottom:14px; }
    .section-title{ font-size:14px; font-weight:700; margin:0 0 12px 0; color:#1a3a5c; padding-bottom:8px; border-bottom:1px solid var(--line); }
    .two-col{ display:grid; grid-template-columns:1fr 1fr; gap:4px 24px; }
    .full{ grid-column:1 / -1; }
    .footer{ margin-top:22px; padding-top:12px; border-top:1px solid var(--line); display:flex; justify-content:space-between; font-size:12px; color:var(--muted); }
    @media print{ .no-print{ display:none !important; } .page{ border:none; padding:0; } }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="logo">
        ${clinicDetails?.hospitalLogo ? `<img src="data:image/png;base64,${clinicDetails.hospitalLogo}" alt="Logo" />` : ''}
      </div>
      <div>
        <div class="clinic-name">${escapeHtml(clinicDetails?.name ?? '')}</div>
        <div class="clinic-meta">${escapeHtml(clinicDetails?.address ?? '')} • ${escapeHtml(clinicDetails?.contactNumber ?? '')}</div>
      </div>
    </header>

    <div class="meta-grid">
      ${rowHtml('Patient Name', patientData?.name)}
      ${rowHtml('Date', dateStr)}
      ${rowHtml('Doctor', doctorDetails?.doctorName)}
      ${rowHtml('Licence No', doctorDetails?.doctorLicence)}
    </div>

    <div class="section-card">
      <div class="section-title">📋 Subjective Assessment</div>
      <div class="two-col">
        ${rowHtml('Chief Complaint', chiefComplaint)}
        ${rowHtml('Pain Scale', painScale)}
        ${rowHtml('Pain Type', painType)}
        ${rowHtml('Duration', duration)}
        ${rowHtml('Onset', onset)}
        ${aggravatingFactors ? `<div class="kv full"><div class="label">Aggravating Factors</div><div class="value">${escapeHtml(aggravatingFactors)}</div></div>` : ''}
        ${relievingFactors ? `<div class="kv full"><div class="label">Relieving Factors</div><div class="value">${escapeHtml(relievingFactors)}</div></div>` : ''}
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">🔬 Objective / Physical Examination</div>
      <div class="two-col">
        ${posture ? `<div class="kv full"><div class="label">Posture</div><div class="value">${escapeHtml(posture)}</div></div>` : ''}
        ${rangeOfMotion ? `<div class="kv full"><div class="label">Range of Motion</div><div class="value">${escapeHtml(rangeOfMotion)}</div></div>` : ''}
        ${specialTests ? `<div class="kv full"><div class="label">Special Tests</div><div class="value">${escapeHtml(specialTests)}</div></div>` : ''}
        ${observations ? `<div class="kv full"><div class="label">Observations</div><div class="value">${escapeHtml(observations)}</div></div>` : ''}
      </div>
    </div>

    <div class="footer">
      <div>Generated on ${escapeHtml(dateStr)}</div>
      <div>${escapeHtml(clinicDetails?.name ?? '')}</div>
    </div>

    <div style="text-align:right; margin-top:40px;">
      ${doctorDetails?.doctorSignature ? `<img src="${doctorDetails.doctorSignature}" alt="Signature" style="max-height:60px;" />` : ''}
      <div style="font-size:12px; color:#374151; margin-top:4px;">Doctor's Signature</div>
    </div>

    <div class="no-print" style="margin-top:12px; text-align:right;">
      <button onclick="window.print()" style="background:#2563eb; color:#fff; border:0; padding:8px 14px; border-radius:8px; font-weight:600; cursor:pointer;">Print</button>
    </div>
  </div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Please allow pop-ups to print.'); return }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  /* ── render ── */
  return (
    <div className="tests-wrapper pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

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

                  {/* ── Section 1: Subjective ── */}
                  <SectionHeader icon="📋" title="Subjective Assessment" color="#2563eb" />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 16 }}>

                    <Field label="Chief Complaint">
                      <TextInput
                        value={chiefComplaint}
                        onChange={setChiefComplaint}
                        placeholder="e.g. Lower back pain"
                      />
                    </Field>

                    <Field label="Pain Scale">
                      <NativeSelect
                        value={painScale}
                        onChange={setPainScale}
                        options={PAIN_SCALE_OPTIONS}
                      />
                    </Field>

                    <Field label="Pain Type">
                      <TextInput
                        value={painType}
                        onChange={setPainType}
                        placeholder="e.g. Sharp and intermittent"
                      />
                    </Field>

                    <Field label="Duration">
                      <TextInput
                        value={duration}
                        onChange={setDuration}
                        placeholder="e.g. 2 weeks"
                      />
                    </Field>

                    <Field label="Onset">
                      <NativeSelect
                        value={onset}
                        onChange={setOnset}
                        options={ONSET_OPTIONS}
                      />
                    </Field>

                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px', marginBottom: 24 }}>
                    <Field label="Aggravating Factors">
                      <Textarea
                        value={aggravatingFactors}
                        onChange={setAggravatingFactors}
                        placeholder="e.g. Prolonged sitting, bending forward"
                        rows={3}
                      />
                    </Field>

                    <Field label="Relieving Factors">
                      <Textarea
                        value={relievingFactors}
                        onChange={setRelievingFactors}
                        placeholder="e.g. Rest, hot pack, walking"
                        rows={3}
                      />
                    </Field>
                  </div>

                  {/* ── Section 2: Objective ── */}
                  <SectionHeader icon="🔬" title="Objective / Physical Examination" color="#0891b2" />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 28px' }}>

                    <Field label="Posture">
                      <Textarea
                        value={posture}
                        onChange={setPosture}
                        placeholder="e.g. Forward head posture, slight lumbar lordosis"
                        rows={3}
                      />
                    </Field>

                    <Field label="Range of Motion">
                      <Textarea
                        value={rangeOfMotion}
                        onChange={setRangeOfMotion}
                        placeholder="e.g. Restricted lumbar flexion to 60°"
                        rows={3}
                      />
                    </Field>

                    <Field label="Special Tests">
                      <Textarea
                        value={specialTests}
                        onChange={setSpecialTests}
                        placeholder="e.g. SLR positive at 60 degrees"
                        rows={3}
                      />
                    </Field>

                    <Field label="Observations">
                      <Textarea
                        value={observations}
                        onChange={setObservations}
                        placeholder="e.g. Muscle tightness in lower back"
                        rows={3}
                      />
                    </Field>

                  </div>

                </CForm>

              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>

      {/* Off-screen print block */}
      <div
        ref={printRef}
        id="tests-print"
        style={{ position: 'absolute', left: '-99999px', top: 0, width: '794px', background: '#fff', padding: '16px' }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{clinicDetails?.name || 'Clinic'}</div>
        <div><strong>Patient:</strong> {patientData?.name || '-'}</div>
        <div style={{ marginTop: 12 }}>
          <div><strong>Chief Complaint:</strong>     {chiefComplaint}</div>
          <div><strong>Pain Scale:</strong>          {painScale}</div>
          <div><strong>Pain Type:</strong>           {painType}</div>
          <div><strong>Duration:</strong>            {duration}</div>
          <div><strong>Onset:</strong>               {onset}</div>
          <div><strong>Aggravating Factors:</strong> {aggravatingFactors}</div>
          <div><strong>Relieving Factors:</strong>   {relievingFactors}</div>
          <div><strong>Posture:</strong>             {posture}</div>
          <div><strong>Range of Motion:</strong>     {rangeOfMotion}</div>
          <div><strong>Special Tests:</strong>       {specialTests}</div>
          <div><strong>Observations:</strong>        {observations}</div>
        </div>
      </div>

      {/* Sticky bottom bar */}
    <div
  className="position-fixed bottom-0"
  style={{
    left: 0,
    right: 0,
    background: '#a5c4d4ff',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '10px 20px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
  }}
>
  {/* Print - Secondary */}
  <Button
    customColor="#ffffff"
    style={{
      color:COLORS.bgcolor,
      borderRadius: '18px',
      padding: '6px 16px',
      fontWeight: 600,
      border: '1px solid #7e3a93',
    }}
    onClick={handlePrint}
    disabled={isGenerating}
  >
    {isGenerating ? 'Printing…' : 'Print'}
  </Button>

  {/* Next - Primary */}
  <Button
    customColor="#ffffff"
    style={{

      color:COLORS.bgcolor,
      borderRadius: '18px',
      padding: '6px 18px',
      fontWeight: 600,
    }}
    onClick={handleNext}
  >
    Next
  </Button>
</div>
    </div>
  )
}

export default Assessment
