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
    <div><strong>Name:</strong> {capitalizeFirst(patient.name)}</div>
    <div><strong>Age:</strong> {patient.age}</div>
    <div><strong>Gender:</strong> {patient.gender}</div>
    <div><strong>Problem:</strong> {patient.problem}</div>
    {patient.subService && <div><strong>Subservice:</strong> {patient.subService}</div>}
    {patient.duration && <div><strong>Duration:</strong> {patient.duration}</div>}
  </div>
)

const TooltipButton = ({ patient, onSelect, tab, disabled }) => {
  const navigate = useNavigate()
  const { setPatientData } = useDoctorContext()
  const [navLoading, setNavLoading] = useState(false)

  const popover = (
    <Popover id={`popover-${patient.id}`} className="custom-popover">
      {generateContent(patient)}
    </Popover>
  )

  const handleClick = async () => {
    flushSync(() => setNavLoading(true))

    try {
      let formData = {}
      let details = null

      if (tab === 'In-Progress') {
        // 🔥 fetch API
        details = await getInProgressDetails(patient.patientId, patient.bookingId)
        formData = details?.savedDetails?.[0] || {}
      }

      // save in context
      setPatientData({ ...patient, details })
      onSelect?.()

      // navigation
      if (tab === 'Confirmed') {
        navigate(`/tab-content/${patient.patientId}`, { state: { patient, formData, fromTab: 'Confirmed' } })
      } else if (tab === 'In-Progress') {
        navigate(`/tab-inProgress/${patient.patientId}`, { state: { patient, formData, details, fromTab: 'In-Progress' } })
      } else if (tab === 'Completed') {
        navigate(`/tab-completed-content/${patient.patientId}`, { state: { patient, formData, fromTab: 'Completed' } })
      }
    } catch (error) {
      console.error('❌ Failed to fetch details:', error)
      setNavLoading(false)
    }
  }

  return (
    <>
      <OverlayTrigger trigger={['hover', 'focus']} placement="left" overlay={popover}>
        <span>
          <Button
            size="small"
            customColor={COLORS.bgcolor}
            onClick={handleClick}
            disabled={disabled || navLoading} // <-- Use parent disabled + loading
          >
            View
          </Button>
        </span>
      </OverlayTrigger>

      {navLoading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25"
          style={{ zIndex: 2000 }}
        >
          <div className="d-flex align-items-center">
            <CSpinner className="me-2" />
            <span>Opening patient…</span>
          </div>
        </div>
      )}
    </>
  )
}

export default TooltipButton
