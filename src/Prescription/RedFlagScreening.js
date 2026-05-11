import React, { useState } from 'react'
import { card, SLabel, checkboxStyle } from './SymptomsDiseases'
import Button from '../components/CustomButton/CustomButton'

const RedFlagScreening = ({ seed = {}, onNext, hideFooter = false }) => {
  const [trauma, setTrauma] = useState(seed.redFlags?.trauma ?? false)
  const [weightLoss, setWeightLoss] = useState(seed.redFlags?.weightLoss ?? false)
  const [fever, setFever] = useState(seed.redFlags?.fever ?? false)
  const [cancer, setCancer] = useState(seed.redFlags?.cancer ?? false)
  const [nightPain, setNightPain] = useState(seed.redFlags?.nightPain ?? false)
  const [swallowing, setSwallowing] = useState(seed.redFlags?.swallowing ?? false)

  React.useEffect(() => {
    onNext?.({
      redFlags: { trauma, weightLoss, fever, cancer, nightPain, swallowing }
    })
  }, [trauma, weightLoss, fever, cancer, nightPain, swallowing])

  const handleNext = () => {
    onNext?.({
      redFlags: { trauma, weightLoss, fever, cancer, nightPain, swallowing }
    })
  }

  // If we are hiding footer, we might want to expose the state changes up
  // but since we will likely use refs or just call handleNext on tab change,
  // we can just pass the state via onNext when parent asks for it.
  // For now, let's just use useEffect to update parent if needed or wait for handleNext.

  return (
    <div style={{ paddingBottom: hideFooter ? '0' : '90px', backgroundColor: '#FFFFFF', minHeight: hideFooter ? 'auto' : '100vh' }}>
      <div style={{ maxWidth: 800, margin: hideFooter ? '0' : '20px auto 0', padding: hideFooter ? '0' : '0 20px' }}>
        
        <div style={card}>
          <SLabel text="Red Flag Screening" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={trauma} onChange={() => setTrauma(!trauma)} /> Trauma/Accident
            </label>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={weightLoss} onChange={() => setWeightLoss(!weightLoss)} /> Unexplained Weight Loss
            </label>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={fever} onChange={() => setFever(!fever)} /> Fever/Infection
            </label>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={cancer} onChange={() => setCancer(!cancer)} /> History of Cancer
            </label>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={nightPain} onChange={() => setNightPain(!nightPain)} /> Night Pain
            </label>
            <label style={checkboxStyle}>
              <input type="checkbox" checked={swallowing} onChange={() => setSwallowing(!swallowing)} /> Difficulty Swallowing/Dizziness
            </label>
          </div>
        </div>

        <div style={{ 
          background: '#FFFBEB', 
          border: '1px solid #FCD34D', 
          borderRadius: 12, 
          padding: '12px 16px',
          color: '#92400E',
          fontSize: '0.875rem',
          marginTop: 20
        }}>
          <strong>Note:</strong> Red flags are critical indicators. If any of these are present, clinical caution or referral may be necessary.
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

export default RedFlagScreening
