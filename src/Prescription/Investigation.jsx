import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer, CAlert } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import CreatableSelect from 'react-select/creatable'
import { addLabTest, getLabTests } from '../../src/Auth/Auth'
import { COLORS } from '../Themes'
import { useDoctorContext } from '../Context/DoctorContext'

/* ─── Styles (matching HomePlan / Diagnosis) ─────────────────────────────── */
const inputStyle = {
  border: '1.5px solid #b6cfe8', borderRadius: 7, fontSize: '0.875rem',
  color: '#1a3a5c', backgroundColor: '#f5f9ff', padding: '7px 11px',
  width: '100%', boxSizing: 'border-box', height: 38,
  outline: 'none', fontFamily: 'inherit',
}

const labelStyle = {
  fontWeight: 700, fontSize: '0.875rem', color: '#1a3a5c',
  marginBottom: 6, display: 'block',
}

const cardStyle = {
  border: '1px solid #d8e8f5', borderRadius: 14,
  boxShadow: '0 2px 16px rgba(26,90,168,0.07)',
}

const gridTwo = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: '16px 28px', marginBottom: 16,
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

const CardHeader = ({ emoji, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 24, borderBottom: '1.5px solid #e3eef8', paddingBottom: 16,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
    }}>{emoji}</div>
    <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700, fontSize: '1.15rem' }}>{title}</h5>
  </div>
)

/* ── escapeHtml ───────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const Investigation = ({ seed = {}, onNext, setFormData, formData }) => {
  const [selectedTests, setSelectedTests]           = useState(seed.selectedTests ?? [])
  const [selectedTestOption, setSelectedTestOption] = useState(null)
  const [notes, setNotes]                           = useState(seed.notes ?? '')
  const [snackbar, setSnackbar]                     = useState({ show: false, message: '', type: '' })
  const [availableTests, setAvailableTests]         = useState([])

  const seedRef = useRef(null)

  const { patientData, clinicDetails, doctorDetails } = useDoctorContext()

  // ── Seed sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (seed === seedRef.current) return
    seedRef.current = seed
    if (!seed || (!seed.selectedTests && !seed.notes)) return
    setSelectedTests(seed.selectedTests ?? [])
    setNotes(seed.notes ?? '')
  }, [seed])

  // ── Fetch available tests ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const tests = await getLabTests()
        if (Array.isArray(tests)) setAvailableTests(tests)
      } catch (err) {
        console.error('Error fetching lab tests:', err)
      }
    }
    fetchTests()
  }, [])

  // ── Snackbar helper ────────────────────────────────────────────────────
  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ show: true, message, type })
    setTimeout(() => setSnackbar({ show: false, message: '', type: '' }), 3000)
  }

  // ── Chip helpers ───────────────────────────────────────────────────────
  const handleRemoveTest = (item) =>
    setSelectedTests((prev) => prev.filter((t) => t !== item))

  const clearAllTests = () => {
    setSelectedTests([])
    setSelectedTestOption(null)
  }

  // ── handleNext ─────────────────────────────────────────────────────────
  const handleNext = () => {
    const payload = { investigation: { selectedTests, notes } }
    setFormData?.((prev) => ({ ...prev, investigation: { selectedTests, notes } }))
    onNext?.(payload)
  }

  // ── handlePrint ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const testsHtml = selectedTests.length > 0
      ? selectedTests.map(t => `
          <div style="display:inline-flex;align-items:center;background:#dbeafe;border:1px solid #b6cfe8;
            border-radius:20px;padding:4px 12px;font-size:13px;color:#1a3a5c;font-weight:600;margin:3px;">
            ${escapeHtml(t)}
          </div>`).join('')
      : '<span style="color:#8aaac8;font-size:13px;">No tests selected.</span>'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Investigation – ${escapeHtml(patientData?.name ?? '')}</title>
<style>
:root{--ink:#0f172a;--muted:#6b7280;--line:#e5e7eb;--accent:#2563eb;--bg:#fff;}
*{box-sizing:border-box;}html,body{margin:0;padding:0;}
body{font-family:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial;color:var(--ink);background:var(--bg);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@page{size:A4;margin:12mm;}
.page{padding:20px 24px;border:1px solid var(--line);border-radius:10px;}
header{display:flex;align-items:center;gap:16px;padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid var(--line);}
.logo{width:110px;height:72px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.logo img{max-width:100%;max-height:100%;object-fit:contain;}
.clinic-name{font-size:20px;font-weight:700;}.clinic-meta{font-size:13px;color:var(--muted);margin-top:4px;}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:16px;}
.kv{display:flex;flex-direction:column;margin-bottom:10px;}.kv .label{font-size:12px;color:var(--muted);}.kv .value{font-size:14px;font-weight:600;padding-top:2px;}
.section-card{border:1px solid var(--line);border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;}
.section-title{font-size:14px;font-weight:700;margin:0 0 12px 0;color:#1a3a5c;padding-bottom:8px;border-bottom:1px solid var(--line);}
.notes-box{background:#f5f9ff;border:1px solid #b6cfe8;border-radius:8px;padding:10px 14px;font-size:14px;line-height:1.6;color:#1a3a5c;white-space:pre-wrap;}
.footer{margin-top:22px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12px;color:var(--muted);}
@media print{.no-print{display:none!important;}.page{border:none;padding:0;}}
</style></head><body><div class="page">

<header>
  <div class="logo">${clinicDetails?.hospitalLogo ? `<img src="data:image/png;base64,${clinicDetails.hospitalLogo}" alt="Logo"/>` : ''}</div>
  <div>
    <div class="clinic-name">${escapeHtml(clinicDetails?.name ?? '')}</div>
    <div class="clinic-meta">${escapeHtml(clinicDetails?.address ?? '')} • ${escapeHtml(clinicDetails?.contactNumber ?? '')}</div>
  </div>
</header>

<div class="meta-grid">
  <div class="kv"><div class="label">Patient Name</div><div class="value">${escapeHtml(patientData?.name ?? '-')}</div></div>
  <div class="kv"><div class="label">Date</div><div class="value">${escapeHtml(dateStr)}</div></div>
  <div class="kv"><div class="label">Doctor</div><div class="value">${escapeHtml(doctorDetails?.doctorName ?? '-')}</div></div>
  <div class="kv"><div class="label">Licence No</div><div class="value">${escapeHtml(doctorDetails?.doctorLicence ?? '-')}</div></div>
</div>

<div class="section-card">
  <div class="section-title">🔬 Recommended Investigations</div>
  <div style="margin-bottom:${notes ? '16px' : '0'};display:flex;flex-wrap:wrap;gap:4px;">
    ${testsHtml}
  </div>
  ${notes ? `
  <div style="margin-top:12px;">
    <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Notes / Reason for Recommendation</div>
    <div class="notes-box">${escapeHtml(notes)}</div>
  </div>` : ''}
</div>

<div class="footer">
  <div>Generated on ${escapeHtml(dateStr)}</div>
  <div>${escapeHtml(clinicDetails?.name ?? '')}</div>
</div>

<div style="text-align:right;margin-top:40px;">
  ${doctorDetails?.doctorSignature ? `<img src="${doctorDetails.doctorSignature}" alt="Signature" style="max-height:60px;"/>` : ''}
  <div style="font-size:12px;color:#374151;margin-top:4px;">Doctor's Signature</div>
</div>

<div class="no-print" style="margin-top:12px;text-align:right;">
  <button onclick="window.print()" style="background:#2563eb;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer;">Print</button>
</div>

</div></body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Please allow pop-ups to print.'); return }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div className="pb-5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {snackbar.show && (
        <CAlert color={snackbar.type === 'error' ? 'danger' : snackbar.type || 'info'} className="mb-2">
          {snackbar.message}
        </CAlert>
      )}

      <CContainer fluid className="p-1">
        <CCard className="mb-4" style={cardStyle}>
          <CCardBody style={{ padding: '28px 32px' }}>
            <CardHeader emoji="🔬" title="Investigation" />

            {/* Row 1: Recommended Test | Selected Tests */}
            <div style={gridTwo}>

              {/* Recommended Test */}
              <Field label="Recommended Test (Optional)">
                <CreatableSelect
                  options={availableTests.map((t) => ({ label: t.testName, value: t.testName }))}
                  placeholder="Select or add tests…"
                  value={selectedTestOption}
                  isClearable
                  isSearchable
                  formatCreateLabel={(v) => `Add "${v}"`}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: '1.5px solid #b6cfe8',
                      borderRadius: 7,
                      backgroundColor: '#f5f9ff',
                      fontSize: '0.875rem',
                      color: '#1a3a5c',
                      minHeight: 38,
                      height: 38,
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#3a8fd4' },
                    }),
                    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                    placeholder: (base) => ({ ...base, color: '#8aaac8', fontSize: '0.875rem' }),
                    indicatorSeparator: () => ({ display: 'none' }),
                    dropdownIndicator: (base) => ({ ...base, padding: '0 6px', color: '#8aaac8' }),
                    menu: (base) => ({ ...base, borderRadius: 8, border: '1px solid #b6cfe8', boxShadow: '0 4px 16px rgba(26,90,168,0.12)', zIndex: 1000 }),
                    option: (base, state) => ({
                      ...base, fontSize: '0.875rem', color: '#1a3a5c',
                      backgroundColor: state.isFocused ? '#e0f2fe' : '#fff',
                      cursor: 'pointer',
                    }),
                  }}
                  onChange={(selected) => {
                    if (!selected) { setSelectedTestOption(null); return }
                    if (!selectedTests.includes(selected.value)) {
                      setSelectedTests((prev) => [...prev, selected.value])
                    }
                    setSelectedTestOption(null)
                  }}
                  onCreateOption={async (inputValue) => {
                    if (!inputValue) return
                    const added = await addLabTest(inputValue)
                    setAvailableTests((prev) => [...prev, { testName: added }])
                    setSelectedTests((prev) => [...prev, added])
                    setSelectedTestOption(null)
                    showSnackbar(`Added new test: ${added}`, 'success')
                  }}
                />
              </Field>

              {/* Selected Tests chips */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={labelStyle}>Selected Tests</label>
                  {selectedTests.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllTests}
                      style={{
                        background: 'none', border: '1.5px solid #f97316',
                        color: '#f97316', borderRadius: 6, fontSize: '0.75rem',
                        padding: '2px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {selectedTests.length === 0 ? (
                  <div style={{
                    border: '1.5px dashed #b6cfe8', borderRadius: 7,
                    background: '#f5f9ff', height: 38, display: 'flex',
                    alignItems: 'center', paddingLeft: 11,
                    fontSize: '0.875rem', color: '#8aaac8',
                  }}>
                    No tests selected yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedTests.map((test) => (
                      <div
                        key={test}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#dbeafe', border: '1px solid #b6cfe8',
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: '0.78rem', color: '#1a3a5c', fontWeight: 600,
                        }}
                      >
                        {test}
                        <button
                          type="button"
                          aria-label={`Remove ${test}`}
                          onClick={() => handleRemoveTest(test)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#5a7fa8', fontWeight: 700, fontSize: 14,
                            padding: 0, lineHeight: 1, fontFamily: 'inherit',
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Notes — full width */}
            <div style={{ marginBottom: 16 }}>
              <Field label="Notes / Reason for Recommendation (Optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Evaluate for suspected infection or fracture"
                  rows={4}
                  style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
                />
              </Field>
            </div>

          </CCardBody>
        </CCard>
      </CContainer>

      {/* Sticky bottom bar */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0, right: 0, background: '#a5c4d4',
          display: 'flex', justifyContent: 'flex-end', gap: 16,
          padding: '10px 24px', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          customColor="#ffffff"
          style={{ color: COLORS.bgcolor, borderRadius: '18px', padding: '6px 16px', fontWeight: 600, border: '1px solid #7e3a93' }}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button
          customColor="#ffffff"
          color="#7e3a93"
          onClick={handleNext}
          style={{ borderRadius: '20px', fontWeight: 600, padding: '6px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default Investigation