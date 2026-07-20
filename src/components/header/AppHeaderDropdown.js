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
  const doctorData = JSON.parse(localStorage.getItem('clinicDetails') || localStorage.getItem('user') || '{}');
  const hospitalName = doctorData?.name || doctorData?.hospitalName || 'PhysioElite';
  const hospitalLogo = doctorData?.hospitalLogo
    ? `data:image/webp;base64,${doctorData.hospitalLogo}`
    : avatar8;
  // Logout
  const handleLock = () => {
    // Preserve local attendance data so it doesn't disappear if they log back in
    const todayStr = new Date().toISOString().split('T')[0]
    const userId = localStorage.getItem('doctorId') || '0001'
    const attendanceKey = `doctor_duty_log_${userId}_${todayStr}`
    const monthlyKey = `doctor_monthly_attendance_${userId}`

    const attendanceData = localStorage.getItem(attendanceKey)
    const monthlyData = localStorage.getItem(monthlyKey)


    const deviceId = localStorage.getItem('deviceId')

    localStorage.removeItem('token')
    sessionStorage.clear()
    localStorage.clear()

    // Restore the attendance data securely under the doctor's specific ID
    if (attendanceData) localStorage.setItem(attendanceKey, attendanceData)
    if (monthlyData) localStorage.setItem(monthlyKey, monthlyData)


    if (deviceId) localStorage.setItem('deviceId', deviceId)

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
            (() => {
              let logo = clinic?.hospitalLogo;
              if (logo && typeof logo === 'string' && logo !== 'null' && logo !== 'undefined' && logo.trim() !== '') {
                if (logo.includes('amazonaws.com/data%3Aimage')) {
                  try {
                    const decoded = decodeURIComponent(logo);
                    const dataIdx = decoded.indexOf('data:image');
                    if (dataIdx !== -1) {
                      logo = decoded.substring(dataIdx).split('?')[0];
                    }
                  } catch (e) {
                    console.error('Error decoding image URL', e);
                  }
                }
                return logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:image')
                  ? logo
                  : `data:image/png;base64,${logo}`;
              }
              return hospitalLogo;
            })()
          }
          className="profile-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = hospitalLogo;
          }}
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