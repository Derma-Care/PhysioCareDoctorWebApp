import React, { useState } from 'react'
import { card, SLabel, inputBase, checkboxStyle } from './SymptomsDiseases'
import Button from '../components/CustomButton/CustomButton'

const NeuroFunctionalInfo = ({ seed = {}, onNext, hideFooter = false }) => {
  // 3. RADIATION & NEURO SYMPTOMS
  const [radiating, setRadiating] = useState(seed.radiationNeuro?.radiating ?? false)
  const [numbness, setNumbness] = useState(seed.radiationNeuro?.numbness ?? false)
  const [weakness, setWeakness] = useState(seed.radiationNeuro?.weakness ?? false)
  const [gripDiff, setGripDiff] = useState(seed.radiationNeuro?.gripDifficulty ?? false)

  // 10. PSYCHOSOCIAL FACTORS
  const [stressLevel, setStressLevel] = useState(seed.psychosocial?.stressLevel ?? 'Low')
  const [workSatisfaction, setWorkSatisfaction] = useState(seed.psychosocial?.workSatisfaction ?? false)
  const [fearOfMovement, setFearOfMovement] = useState(seed.psychosocial?.fearOfMovement ?? false)

  // 11. SPECIAL SYMPTOMS
  const [headache, setHeadache] = useState(seed.specialSymptoms?.headache ?? false)
  const [dizziness, setDizziness] = useState(seed.specialSymptoms?.dizziness ?? false)

  React.useEffect(() => {
    onNext?.({
      radiationNeuro: { radiating, numbness, weakness, gripDifficulty: gripDiff },
      psychosocial: { stressLevel, workSatisfaction, fearOfMovement },
      specialSymptoms: { headache, dizziness }
    })
  }, [radiating, numbness, weakness, gripDiff, stressLevel, workSatisfaction, fearOfMovement, headache, dizziness])

  const handleNext = () => {
    onNext?.({
      radiationNeuro: { radiating, numbness, weakness, gripDifficulty: gripDiff },
      psychosocial: { stressLevel, workSatisfaction, fearOfMovement },
      specialSymptoms: { headache, dizziness }
    })
  }

  return (
    <div style={{ paddingBottom: hideFooter ? '0' : '90px', backgroundColor: '#FFFFFF', minHeight: hideFooter ? 'auto' : '100vh' }}>
      <div style={{ maxWidth: 800, margin: hideFooter ? '0' : '20px auto 0', padding: hideFooter ? '0' : '0 20px' }}>
        
        {/* Section 3 */}
        <div style={card}>
          <SLabel text="3. Radiation & Neuro Symptoms" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={checkboxStyle}><input type="checkbox" checked={radiating} onChange={() => setRadiating(!radiating)} /> Radiation to arm/fingers</label>
            <label style={checkboxStyle}><input type="checkbox" checked={numbness} onChange={() => setNumbness(!numbness)} /> Numbness/Tingling</label>
            <label style={checkboxStyle}><input type="checkbox" checked={weakness} onChange={() => setWeakness(!weakness)} /> Weakness</label>
            <label style={checkboxStyle}><input type="checkbox" checked={gripDiff} onChange={() => setGripDiff(!gripDiff)} /> Grip Difficulty</label>
          </div>
        </div>

        {/* Section 10 */}
        <div style={card}>
          <SLabel text="10. Psychosocial Factors" />
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1B4F8A', marginBottom: 6 }}>STRESS LEVEL</div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            {['Low', 'Moderate', 'High'].map(s => (
              <label key={s} style={checkboxStyle}>
                <input type="radio" checked={stressLevel === s} onChange={() => setStressLevel(s)} /> {s}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={checkboxStyle}><input type="checkbox" checked={workSatisfaction} onChange={() => setWorkSatisfaction(!workSatisfaction)} /> Work Satisfaction</label>
            <label style={checkboxStyle}><input type="checkbox" checked={fearOfMovement} onChange={() => setFearOfMovement(!fearOfMovement)} /> Fear of Movement</label>
          </div>
        </div>

        {/* Section 11 */}
        <div style={card}>
          <SLabel text="11. Special Symptoms" />
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={checkboxStyle}><input type="checkbox" checked={headache} onChange={() => setHeadache(!headache)} /> Headache</label>
            <label style={checkboxStyle}><input type="checkbox" checked={dizziness} onChange={() => setDizziness(!dizziness)} /> Dizziness</label>
          </div>
        </div>

      </div>

      {!hideFooter && (
        <div className="position-fixed bottom-0" style={{
          left: 0, right: 0,
          background: '#FFFFFF',
          borderTop: '2px solid #1B4F8A',
          display: 'flex', justifyContent: 'flex-end', gap: 16,
          padding: '10px 24px',
          boxShadow: '0 -2px 10px rgba(27,79,138,0.12)',
        }}>
          <Button
            customColor="#1B4F8A"
            onClick={handleNext}
            style={{
              borderRadius: '20px', fontWeight: 700,
              padding: '6px 24px',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(27,79,138,0.30)',
              border: '1.5px solid #1B4F8A',
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default NeuroFunctionalInfo
