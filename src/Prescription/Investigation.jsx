import React, { useState, useEffect } from 'react'
import { CCard, CCardBody, CContainer, CForm } from '@coreui/react'
import Button from '../components/CustomButton/CustomButton'

/* ─── Styles (Same as HomePlan) ───────────────────────────── */
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
  fontSize: '0.875rem',
  color: '#1a3a5c',
  marginBottom: 6,
  display: 'block',
}

/* ─── Reusable Field Wrapper ───────────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

/* ─── Component ─────────────────────────────────────────── */
const Investigation = ({ seed = {}, onNext, setFormData }) => {
  const [tests, setTests] = useState('')
  const [notes, setNotes] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (seed) {
      setTests(seed.tests || '')
      setNotes(seed.notes || '')
    }
  }, [seed])

  const buildPrompt = () => {
    const lines = [
      tests && `Tests requested: ${tests}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean)

    if (!lines.length) return null

    return `You are a clinical assistant. Based on the following investigation details, provide:
1. Brief rationale for each test
2. Any additional tests that may be relevant
3. Key findings to look for

Keep it concise and clinical.

${lines.join('\n')}`
  }

  const handleGenerate = async () => {
    const prompt = buildPrompt()
    setError('')

    if (!prompt) {
      setError('Please fill in at least one field.')
      return
    }

    setIsGenerating(true)
    setAiOutput('')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Error ${res.status}`)
      }

      const data = await res.json()
      setAiOutput(data.content?.map(b => b.text || '').join('') || '')
    } catch (e) {
      setError('Error: ' + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = () => {
    const payload = { investigation: { tests, notes } }
    setFormData?.((prev) => ({ ...prev, ...payload }))
    onNext?.(payload)
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CContainer fluid className="p-0">
        <CCard style={{ border: '1px solid #d8e8f5', borderRadius: 14 }}>
          <CCardBody style={{ padding: '24px 28px' }}>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                borderBottom: '1.5px solid #e3eef8',
                paddingBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#1a5fa8,#3a8fd4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#fff',
                }}
              >
                🔬
              </div>
              <h5 style={{ margin: 0, color: '#1a3a5c', fontWeight: 700 }}>
                Investigation
              </h5>
            </div>

            <CForm>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px 28px',
                }}
              >

                {/* Tests */}
                <Field label="Tests">
                  <input
                    value={tests}
                    onChange={(e) => setTests(e.target.value)}
                    placeholder="e.g. Blood test, X-Ray, MRI"
                    style={inputStyle}
                  />
                </Field>

                {/* Notes */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Notes">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes about the investigation"
                      rows={4}
                      style={{
                        ...inputStyle,
                        height: 'auto',
                        resize: 'vertical',
                        lineHeight: 1.5,
                      }}
                    />
                  </Field>
                </div>
              </div>

              {/* AI Output */}
              {aiOutput && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: '#f0f6ff',
                    border: '1px solid #c8ddf0',
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: 20,
                      padding: '2px 8px',
                    }}
                  >
                    AI
                  </span>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      color: '#1a3a5c',
                    }}
                  >
                    {aiOutput}
                  </div>
                </div>
              )}

              {error && (
                <p style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>
                  {error}
                </p>
              )}
            </CForm>
          </CCardBody>
        </CCard>
      </CContainer>

      {/* Bottom bar */}
      <div
        className="position-fixed bottom-0"
        style={{
          left: 0,
          right: 0,
          background: '#a5c4d4',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          customColor="#ffffff"
          color="#7e3a93"
          onClick={handleNext}
          style={{
            borderRadius: '20px',
            fontWeight: 600,
            padding: '6px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default Investigation