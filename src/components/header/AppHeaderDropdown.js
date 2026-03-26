import React, { useState, useEffect } from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import '../header/AppHear.css'
import avatar8 from './../../assets/images/ic_launcher.png'
import { Link, useNavigate } from 'react-router-dom'
import { getClinicDetails } from '../../Auth/Auth'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)

  // Logout / lock account
  const handleLock = () => {
    localStorage.removeItem('token')
    sessionStorage.clear()
    localStorage.clear()
    navigate('/login', { replace: true })
  }

  // Fetch clinic details
  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const res = await getClinicDetails()
        console.log('✅ Clinic loaded:', res)
        setClinic(res)
      } catch (err) {
        console.error('❌ Error fetching clinic:', err)
      }
    }
    fetchClinic()
  }, [])

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar
          src={clinic?.hospitalLogo ? `data:image/png;base64,${clinic.hospitalLogo}` : avatar8}
          // size="md"
          className="profile-image"
        />
      </CDropdownToggle>

      <CDropdownMenu className="pt-0" placement="bottom-end">
        {/* Account Section */}
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <CDropdownItem onClick={() => navigate('/updates')}>
          <CIcon icon={cilBell} className="me-2" />
          Updates
          <CBadge color="info" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/messages')}>
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Messages
          <CBadge color="success" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/tasks')}>
          <CIcon icon={cilTask} className="me-2" />
          Tasks
          <CBadge color="danger" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/comments')}>
          <CIcon icon={cilCommentSquare} className="me-2" />
          Comments
          <CBadge color="warning" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>

        {/* Settings Section */}
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
        <CDropdownItem onClick={() => navigate('/doctorprofile')}>
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/settings')}>
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/payments')}>
          <CIcon icon={cilCreditCard} className="me-2" />
          Payments
          <CBadge color="secondary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/projects')}>
          <CIcon icon={cilFile} className="me-2" />
          Projects
          <CBadge color="primary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>

        <CDropdownDivider />

        {/* Lock Account */}
        <CDropdownItem onClick={handleLock}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
