import React, { useState, useEffect } from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import '../header/AppHear.css'
import avatar8 from './../../assets/images/ic_launcher.png'
import { useNavigate } from 'react-router-dom'
import { getClinicDetails } from '../../Auth/Auth'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)

  // Logout
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
        setClinic(res)
      } catch (err) {
        console.error('Error fetching clinic:', err)
      }
    }
    fetchClinic()
  }, [])

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle
        placement="bottom-end"
        className="py-0 pe-0"
        caret={false}
      >
        <CAvatar
          src={
            clinic?.hospitalLogo
              ? `data:image/png;base64,${clinic.hospitalLogo}`
              : avatar8
          }
          className="profile-image"
        />
      </CDropdownToggle>

      <CDropdownMenu className="pt-0 dropdown-custom" placement="bottom-end">
        <CDropdownHeader className="dropdown-header-custom">
          Settings
        </CDropdownHeader>

        <CDropdownItem
          className="dropdown-item-custom"
          onClick={() => navigate('/doctorprofile')}
        >
          <CIcon icon={cilUser} className="icon-style me-2" />
          Profile
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem
          className="dropdown-item-custom"
          onClick={handleLock}
        >
          <CIcon icon={cilLockLocked} className="icon-style me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown