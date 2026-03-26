import React, { useEffect, useRef, useState } from 'react'
import Button from '../components/CustomButton/CustomButton'
import './Tests.css'
import { COLORS } from '../Themes'
import html2pdf from 'html2pdf.js' // <-- add this import
import Select from 'react-select'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CContainer,
} from '@coreui/react'
import GradientTextCard from '../components/GradintColorText'
import { addLabTest, getLabTests } from '../../src/Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'
import CreatableSelect from 'react-select/creatable'
/**
 * Props:
 * - onNext?: (payload) => void
 * - sidebarWidth?: number
 * - patientName?: string
 * - doctor?: { name?: string, regNo?: string, clinic?: string, phone?: string }
 */
const Investigations = ({ seed = {}, onNext, sidebarWidth = 0, formData }) => {
  const [selectedTests, setSelectedTests] = useState(seed.selectedTests ?? [])
  const [testReason, setTestReason] = useState(seed.testReason ?? '')
  const [selectedTestOption, setSelectedTestOption] = useState('')
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [availableTests, setAvailableTests] = useState([])
  // print container ref
  const printRef = useRef(null)

  const showSnackbar = (message, type) => {
    setSnackbar({ show: true, message, type })
    setTimeout(() => setSnackbar({ show: false, message: '', type: '' }), 3000)
  }
  const options = availableTests.map((t) => ({ label: t.testName, value: t.testName }))
  // and filter with t.testName everywhere

  const {
    patientData,
    doctorId,
    setTodayAppointments,
    todayAppointments,
    clinicDetails,
    doctorDetails,
  } = useDoctorContext()

  const handleAddTest = (e) => {
    const value = e.target.value
    if (!value) return

    if (selectedTests.includes(value)) {
      showSnackbar('Test already added', 'warning')
    } else {
      setSelectedTests((prev) => [...prev, value])
      setSelectedTestOption(null) // reset after add
    }
  }

  const clearAllTests = () => {
    setSelectedTests([])
    setSelectedTestOption(null) // reset dropdown
  }


  useEffect(() => {
    const fetchTests = async () => {
      try {
        const tests = await getLabTests()
        if (Array.isArray(tests)) {
          setAvailableTests(tests) // store full objects
        }
      } catch (error) {
        console.error('Error fetching lab tests:', error)
      }
    }
    fetchTests()
  }, [])

  const handleRemoveTest = (item) => {
    setSelectedTests((prev) => prev.filter((t) => t !== item))
    if (selectedTestOption === item) {
      setSelectedTestOption('')
    }
  }

  const handleNext = () => {
    const payload = { selectedTests, testReason }
    onNext?.(payload)
  }

  const handlePrint = () => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    const testsHtml = selectedTests.length
      ? `<ul class="test-list">${selectedTests.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : `<p class="muted">No tests selected.</p>`

    const reasonHtml = testReason?.trim()
      ? `<div class="section">
         <h3 class="section-title">Reason for Recommendation</h3>
         <p>${escapeHtml(testReason)}</p>
       </div>`
      : ''

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Test Report – ${escapeHtml(patientData?.name??'')}</title>
  <style>
    :root{
      --ink:#0f172a;        /* slate-900 */
      --muted:#6b7280;      /* gray-500 */
      --line:#e5e7eb;       /* gray-200 */
      --accent:#2563eb;     /* blue-600 */
      --accent-soft:#eff6ff;/* blue-50 */
      --chip:#f1f5f9;       /* slate-100 */
      --bg:#ffffff;
    }
    *{ box-sizing:border-box; }
    html,body{ margin:0; padding:0; }
    body{
      font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color:var(--ink);
      background:var(--bg);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page{
      size: A4;
      margin: 12mm;
    }
    .page{
      padding: 20px 24px;
      border: 1px solid var(--line);
      border-radius: 10px;
    }
    header{
      display:flex;
      align-items:center;
      gap:16px;
      padding-bottom:14px;
      margin-bottom:18px;
      border-bottom:2px solid var(--line);
    }
    .logo{
      display:flex; align-items:center; justify-content:center;
      width: 110px; height: 72px;
   
     
     
      overflow:hidden;
      flex-shrink:0;
    }
    .logo img{
      max-width: 100%;
      max-height: 100%;
      display:block;
      object-fit: contain;
    }
    .clinic-block{
      display:flex; flex-direction:column; gap:4px;
    }
    .clinic-name{
      font-size: 20px; font-weight: 700; letter-spacing:.2px;
    }
    .clinic-meta{
      font-size: 13px; color:var(--muted);
    }

    /* Info grid */
    .grid{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      margin-bottom: 12px;
    }
    .kv{ display:flex; flex-direction:column; }
    .kv .label{ font-size:12px; color:var(--muted); }
    .kv .value{ font-size:15px; font-weight:600; padding-top:2px; }

    /* Section */
    .section{ margin-top:18px; }
    .section-card{
      border:1px solid var(--line);
      border-radius:10px;
      padding:14px;
      background:#fff;
    }
    .section-title{
      display:flex; align-items:center; gap:8px;
      font-size:16px; font-weight:700; margin:0 0 10px 0;
      color:#111827;
    }
    .pill{
      font-size:12px; font-weight:600; color:#1e293b;
      background:var(--chip); border:1px solid var(--line);
      padding:2px 8px; border-radius:999px;
    }

    /* Tests list as two columns if many */
    .test-list{
      margin:0; padding-left:18px;
      columns: 2; column-gap: 36px;
    }
    .test-list li{ break-inside: avoid; padding:2px 0; }

    /* Footer */
    .footer{
      margin-top: 22px;
      padding-top: 12px;
      border-top:1px solid var(--line);
      display:flex; justify-content:space-between; gap:12px;
      font-size:12px; color:var(--muted);
    }

    /* Print tweaks */
    @media print{
      .no-print{ display:none !important; }
      .page{ border:none; padding:0; }
      header{ border-color:#d1d5db; }
      
    }

    /* Small screens (if user views in new tab before print) */
    @media screen and (max-width:720px){
      .grid{ grid-template-columns: 1fr; }
      .test-list{ columns:1; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="logo">
        ${clinicDetails?.hospitalLogo
        ? `<img src="data:image/png;base64,${clinicDetails.hospitalLogo}" alt="Hospital Logo" />`
        : ''
      }
      </div>
      <div class="clinic-block">
        <div class="clinic-name">${escapeHtml(clinicDetails.name)}</div>
        <div class="clinic-meta">${escapeHtml(clinicDetails.address)} • ${escapeHtml(clinicDetails.contactNumber)}</div>
      </div>
    </header>

    <!-- Patient & Report meta -->
    <div class="grid">
      <div class="kv">
        <div class="label">Patient Name</div>
        <div class="value">${escapeHtml(patientData?.name??'')}</div>
      </div>
      <div class="kv">
        <div class="label">Date</div>
        <div class="value">${escapeHtml(dateStr)}</div>
      </div>
      <div class="kv">
        <div class="label">Doctor</div>
        <div class="value">${escapeHtml(doctorDetails.doctorName)}</div>
      </div>
      <div class="kv">
        <div class="label">Licence No</div>
        <div class="value"><span  >${escapeHtml(doctorDetails.doctorLicence)}</span></div>
      </div>
    </div>

    <!-- Tests -->
    <div class="section section-card">
      <h3 class="section-title">Recommended Tests</h3>
      ${testsHtml}
    </div>

    <!-- Reason (optional) -->
    ${reasonHtml
        ? `<div class="section section-card">
            
            ${reasonHtml.replace('<div class="section">', '').replace('</div>', '')}
         </div>`
        : ''
      }

    <div class="footer">
      <div>Generated on ${escapeHtml(dateStr)}</div>
      <div>${escapeHtml(clinicDetails.name)}</div>
    </div>
<!-- Signature -->
<div class="signature-block">
  <div style="text-align:right; margin-top:40px;">
    <img src="${doctorDetails?.doctorSignature}" 
         alt="Doctor's Signature"
         style="max-height:60px;" />
    <div style="font-size: 12px; color:#374151; margin-top:4px;">
      Doctor's Signature
    </div>
  </div>
</div>
    <div class="no-print" style="margin-top: 12px; text-align:right;">
      <button onclick="window.print()" style="
        background: var(--accent);
        color: white; border: 0;
        padding: 8px 14px; border-radius: 8px;
        font-weight:600; cursor:pointer;
      ">Print</button>
    </div>
  </div>
</body>
</html>
`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      alert('Please allow pop-ups to print.')
      return
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      win.focus()
      win.print()
    }
  }

  // Escapes HTML entities
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }


  // in Tests.jsx
  useEffect(() => {
    const incoming = seed || {}
    const next = Array.isArray(incoming.selectedTests) ? incoming.selectedTests : []
    setSelectedTests(next)
    setTestReason(incoming.testReason ?? incoming.reason ?? '')
  }, [seed])

  return (
    <div className="tests-wrapper pb-5">
      {/* Snackbar */}
      {snackbar.show && (
        <CAlert
          color={snackbar.type === 'error' ? 'danger' : snackbar.type || 'info'}
          className="mb-2"
        >
          {snackbar.message}
        </CAlert>
      )}

      <CContainer fluid className="p-0">
        <CRow className="g-3">
          {/* Left: Form area */}
          <CCol xs={12} lg={12}>
            <CCard className="h-100">
              <CCardBody>
                <CForm>
                  {/* Row: Recommended Test (left) + Selected Tests (right) */}
                  <CRow className="g-3">
                    {/* Recommended Test */}
                    <CCol xs={12} md={6}>
                      <CFormLabel className="label">
                        <GradientTextCard text={'Recommended Test (Optional)'} />
                      </CFormLabel>

                      <CreatableSelect
                        options={availableTests.map((t) => ({ label: t.testName, value: t.testName }))}
                        placeholder="Select or add tests..."
                        value={selectedTestOption ? { label: selectedTestOption, value: selectedTestOption } : null}
                        isClearable
                        isSearchable
                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                        onChange={(selected) => {
                          if (!selected) {
                            setSelectedTestOption(null);
                            return;
                          }

                          const value = selected.value;

                          if (!selectedTests.includes(value)) {
                            setSelectedTests((prev) => [...prev, value]);
                          }

                          setSelectedTestOption(null);
                        }}
                        onCreateOption={async (inputValue) => {
                          if (!inputValue) return;

                          // Call your API to add the test
                          const addedTest = await addLabTest(inputValue);

                          // Update available tests so it shows in dropdown
                          setAvailableTests((prev) => [...prev, { testName: addedTest }]);

                          // Select the new test
                          setSelectedTests((prev) => [...prev, addedTest]);

                          // Reset input
                          setSelectedTestOption(null);

                          showSnackbar(`Added new test: ${addedTest}`, 'success');
                        }}
                      />


                    </CCol>

                    {/* Selected tests chips */}
                    <CCol xs={12} md={5}>
                      <div className="d-flex align-items-center justify-content-between mb-1 p-0">
                        <GradientTextCard text={'Selected Tests'} />
                        {/* Clear all button (hidden when empty) */}
                        {selectedTests.length > 0 && (
                          <Button
                            customColor={COLORS.orange}
                            size="small"
                            variant="outline"
                            onClick={clearAllTests}
                            title="Remove all selected tests"
                          >
                            Clear all
                          </Button>
                        )}
                      </div>

                      {selectedTests.length === 0 ? (
                        <div className="text-body-secondary small">No tests selected yet.</div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {selectedTests.map((test) => (
                            <div
                              key={test}
                              className="d-inline-flex align-items-center px-2 py-1 border rounded bg-body-secondary"
                              style={{ lineHeight: 1 }}
                            >
                              {/* Chip text */}
                              <span className="me-2">{test}</span>

                              {/* Close (remove) button with keyboard support */}
                              <button
                                type="button"
                                aria-label={`Remove ${test}`}
                                className="btn btn-sm   p-0 text-body"
                                onClick={() => handleRemoveTest(test)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleRemoveTest(test)
                                  }
                                }}
                                title={`Remove ${test}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CCol>
                  </CRow>

                  {/* Reason (full width) */}
                  <CRow className="g-3 mt-1">
                    <CCol xs={12}>
                      <GradientTextCard text={'Reason for Recommendation (Optional)'} />

                      <CFormTextarea
                        className="mt-2"
                        rows={5}
                        value={testReason}
                        onChange={(e) => setTestReason(e.target.value)}
                        placeholder="Explain why these tests are recommended…"
                      />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>

      {/* Off-screen printable block (kept as-is for fidelity) */}
      <div
        ref={printRef}
        id="tests-print"
        style={{
          position: 'absolute',
          left: '-99999px',
          top: 0,
          width: '794px',
          background: '#fff',
          padding: '16px',
        }}
      >
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{clinicDetails?.clinic || 'Clinic'}</div>
          <div style={{ fontSize: 13 }}>
            {clinicDetails?.name || ''} • Reg. No: {clinicDetails?.regNo || ''}
          </div>
          <div style={{ fontSize: 13 }}>{clinicDetails?.phone || ''}</div>
        </div>

        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>Patient:</strong> {clinicDetails?.patientName || '-'}
          </div>
          <div>
            <strong>Date:</strong>{' '}
            {new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Recommended Tests</div>
          {selectedTests?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {selectedTests.map((t) => (
                <li key={t} style={{ marginBottom: 4, fontSize: 14 }}>
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 14, color: '#6b7280' }}>No tests selected.</div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Reason</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{testReason || '—'}</div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0,
          right: 0,

          backgroundColor: '#F3f3f7',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: 8,
        }}
      >
        <div className="d-flex gap-3">
          <Button customColor={COLORS.bgcolor} style={{ color: COLORS.white }} onClick={handlePrint} disabled={isGenerating}>
            {isGenerating ? 'Printing…' : 'Print'}
          </Button>
          <Button customColor={COLORS.bgcolor} // background color of button
            color={COLORS.black} onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Investigations
