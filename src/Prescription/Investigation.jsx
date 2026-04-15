import React, { useState, useEffect, useRef } from 'react'
import { CCard, CCardBody, CContainer, CAlert } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'
import CreatableSelect from 'react-select/creatable'
import { addLabTest, getLabTests } from '../../src/Auth/Auth'

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