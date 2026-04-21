import React, { useState } from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Popover from 'react-bootstrap/Popover'
import Button from './CustomButton'
import './TooltipStyles.css'
import { COLORS } from '../../Themes'
import { useNavigate } from 'react-router-dom'
import { useDoctorContext } from '../../Context/DoctorContext'
import { flushSync } from 'react-dom'
import { CSpinner } from '@coreui/react'
import { getInProgressDetails } from '../../Auth/Auth'
import { capitalizeFirst } from '../../utils/CaptalZeWord'

const generateContent = (patient) => (
  <div className="tooltip-body">
    {[
      { label: 'Name',       value: capitalizeFirst(patient.name) },
      { label: 'Age',        value: patient.age },
      { label: 'Gender',     value: patient.gender },
      { label: 'Problem',    value: patient.problem },
      ...(patient.subService ? [{ label: 'Subservice', value: patient.subService }] : []),
      ...(patient.duration   ? [{ label: 'Duration',   value: patient.duration   }] : []),
    ].map(({ label, value }) => (
      <div
        key={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 0',
          borderBottom: '1px solid rgba(27,79,138,0.08)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: COLORS.bgcolor,
            minWidth: '72px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '13px',
            color: '#1a1a2e',
            fontWeight: '500',
          }}
        >
          {value || '—'}
        </span>
      </div>
    ))}
  </div>
)

const TooltipButton = ({ patient, onSelect, tab, disabled }) => {
  const navigate = useNavigate()
  const { setPatientData } = useDoctorContext()
  const [navLoading, setNavLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)   // tracks click/active state

  const popover = (
    <Popover
      id={`popover-${patient.id}`}
      className="custom-popover"
      style={{
        border: `1.5px solid ${COLORS.bgcolor}`,
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(27,79,138,0.12)',
        minWidth: '220px',
        overflow: 'hidden',
      }}
    >
      {/* Popover header strip */}
      <div
        style={{
          backgroundColor: COLORS.bgcolor,
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: '600',
          color: COLORS.white,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        Patient Info
      </div>

      {/* Popover body */}
      <div
        style={{
          backgroundColor: COLORS.white,
          padding: '10px 14px',
        }}
      >
        {generateContent(patient)}
      </div>
    </Popover>
  )

  const handleClick = async () => {
    setIsActive(true)                          // turn orange on click
    flushSync(() => setNavLoading(true))
    try {
      let formData = {}
      let details = null

      if (tab === 'In-Progress') {
        details = await getInProgressDetails(patient.patientId, patient.bookingId)
        formData = details?.savedDetails?.[0] || {}
      }

      setPatientData({ ...patient, details })
      onSelect?.()

      if (tab.toLowerCase() === 'confirmed') {
        navigate(`/tab-content/${patient.patientId}`, {
          state: { patient, formData, fromTab: 'Confirmed' },
        })
      } else if (tab.toLowerCase() === 'in-progress') {
        navigate(`/tab-inProgress/${patient.patientId}`, {
          state: { patient, formData, details, fromTab: 'In-Progress' },
        })
      } else if (tab === 'Completed') {
        navigate(`/tab-completed-content/${patient.patientId}`, {
          state: { patient, formData, fromTab: 'Completed' },
        })
      }
    } catch (error) {
      console.error('Failed to fetch details:', error)
      setIsActive(false)                       // reset to blue on error
      setNavLoading(false)
    }
  }

  // Derive button colors based on state priority:
  // disabled/loading → gray | active/clicked → orange | default → navy blue
  const getBgColor = () => {
    if (navLoading || disabled) return '#e9ecef'
    if (isActive) return COLORS.orange
    return COLORS.bgcolor                      // navy blue #1B4F8A
  }

  const getBorderColor = () => {
    if (navLoading || disabled) return '#dee2e6'
    if (isActive) return COLORS.orange
    return COLORS.bgcolor
  }

  const getTextColor = () => {
    if (navLoading || disabled) return COLORS.gray
    return COLORS.white
  }

  return (
    <>
      <OverlayTrigger trigger={['hover', 'focus']} placement="left" overlay={popover}>
        <span>
          <button
            onClick={handleClick}
            disabled={disabled || navLoading}
            style={{
              backgroundColor: getBgColor(),
              color: getTextColor(),
              border: `1.5px solid ${getBorderColor()}`,
              borderRadius: '8px',
              padding: '4px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: navLoading || disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '60px',
            }}
            onMouseEnter={(e) => {
              if (!disabled && !navLoading && !isActive) {
                // hover: show orange preview only when not already active
                e.currentTarget.style.backgroundColor = COLORS.orange
                e.currentTarget.style.borderColor = COLORS.orange
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !navLoading && !isActive) {
                // restore navy blue on mouse leave when not clicked
                e.currentTarget.style.backgroundColor = COLORS.bgcolor
                e.currentTarget.style.borderColor = COLORS.bgcolor
              }
            }}
          >
            {navLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    border: '2px solid #adb5bd',
                    borderTopColor: COLORS.gray,
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              </span>
            ) : 'View'}
          </button>
        </span>
      </OverlayTrigger>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Full screen loading overlay */}
      {navLoading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 2000,
            backgroundColor: 'rgba(27, 79, 138, 0.15)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              borderRadius: '12px',
              padding: '20px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(27,79,138,0.15)',
              border: `1.5px solid ${COLORS.bgcolor}20`,
            }}
          >
            <CSpinner
              style={{ color: COLORS.bgcolor, width: '22px', height: '22px' }}
            />
            <span
              style={{
                color: COLORS.black,
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              Opening patient…
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default TooltipButton