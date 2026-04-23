import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilMenu } from '@coreui/icons'
import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import './header/sidebar.css'
import { COLORS, SIZES } from '../Themes'
import { getDateParts } from '../utils/formatDateTime'
import Button from './CustomButton/CustomButton'
import TooltipButton from './CustomButton/TooltipButton'
import { getClinicDetails, getTodayAppointments } from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'
import { capitalizeFirst, capitalizeWords } from '../utils/CaptalZeWord'
import './AppHeader.css'

const AppHeader = () => {
  const { patientData, setTodayAppointments, todayAppointments } = useDoctorContext()

  useEffect(() => {
    appointmentDetails()
  }, [])

  const appointmentDetails = async () => {
    const response = await getTodayAppointments()
    if (response.statusCode === 200) {
      setTodayAppointments(response.data)
    }
  }

  const headerRef = useRef()
  const [clinic, setClinic] = useState(null)
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

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

  const { day, date, time } = getDateParts()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [visible, setVisible] = useState(false)

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    const filtered = todayAppointments.filter((p) =>
      p.name.toLowerCase().includes(value.toLowerCase())
    )
    setSearchResults(filtered)
  }

  const handleView = (patient) => {
    setSelectedPatient(patient)
    setVisible(true)
  }

  return (
    <CHeader
      position="sticky"
      className="mb-0 p-0 app-header"
      style={{
        top: 0,
        insetInline: 0,
        zIndex: 1030,
        margin: -20,
        backgroundColor: COLORS.bgcolor,
        borderBottom: `2px solid ${COLORS.bgcolor}`,
        boxShadow: '0 2px 8px rgba(27, 79, 138, 0.08)',
      }}
    >
      {/* Top Header Row */}
      <CContainer
        className="px-4"
        fluid
        style={{
          borderBottom: `1px solid ${COLORS.bgcolor}20`,
          paddingTop: '8px',
          paddingBottom: '8px',
        }}
      >
        {/* Hamburger Menu */}
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
          aria-label="Toggle sidebar"
        >
          <CIcon icon={cilMenu} size="lg" style={{ color: COLORS.white }} />
        </CHeaderToggler>

        {/* Right side: Bell + Clinic Name + Avatar */}
        <CHeaderNav className="ms-auto gap-2 align-items-center">

          {/* Bell icon */}
          {/* <CNavItem>
            <CNavLink
              onClick={(e) => e.preventDefault()}
              style={{ cursor: 'pointer', position: 'relative', padding: '4px 8px' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#EAF1FB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid ${COLORS.bgcolor}30`,
                }}
              >
                <CIcon icon={cilBell} size="sm" style={{ color: COLORS.bgcolor }} />
              </div>
            </CNavLink>
          </CNavItem> */}

          {/* Vertical divider */}
          <div
            style={{
              width: '1px',
              height: '32px',
              backgroundColor: `${COLORS.bgcolor}40`,
              margin: '0 4px',
            }}
          />

          {/* Clinic name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 8px',
            }}
          >
            {clinic ? (
              <>
                <h5
                  style={{
                    fontSize: SIZES.medium,
                    color: COLORS.white,
                    fontWeight: '700',
                    margin: 0,
                    letterSpacing: '0.3px',
                  }}
                >
                  {capitalizeWords(clinic.name) || 'Clinic Name'}
                </h5>
              </>
            ) : (
              <span style={{ color: COLORS.gray, fontSize: '13px' }}>Loading...</span>
            )}
          </div>

          {/* Profile dropdown */}
          <AppHeaderDropdown />

        </CHeaderNav>
      </CContainer>

      {/* Breadcrumb Row */}
      <CContainer
        className="px-4"
        fluid
        style={{
          backgroundColor: '#F0F6FF',
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
      >
        <AppBreadcrumb />
      </CContainer>

      {/* Patient Details Modal */}
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader
          style={{
            backgroundColor: COLORS.bgcolor,
            borderBottom: 'none',
          }}
        >
          <CModalTitle style={{ color: COLORS.white, fontWeight: '600', fontSize: '16px' }}>
            Patient Details
          </CModalTitle>
        </CModalHeader>

        <CModalBody style={{ backgroundColor: COLORS.white, padding: '20px 24px' }}>
          {selectedPatient && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Name', value: capitalizeFirst(selectedPatient.name) },
                { label: 'Mobile', value: selectedPatient.mobileNumber },
                { label: 'Problem', value: selectedPatient.problem },
                { label: 'Doctor', value: selectedPatient.doctorName },
                { label: 'Consultation', value: selectedPatient.consultationType },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F0F6FF',
                    border: `1px solid ${COLORS.bgcolor}20`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: COLORS.bgcolor,
                      minWidth: '90px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      color: COLORS.black,
                      fontWeight: '500',
                    }}
                  >
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CModalBody>

        <CModalFooter
          style={{
            backgroundColor: COLORS.white,
            borderTop: `1px solid ${COLORS.bgcolor}20`,
            padding: '12px 24px',
          }}
        >
          <button
            onClick={() => setVisible(false)}
            style={{
              backgroundColor: COLORS.bgcolor,
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              padding: '7px 20px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </CModalFooter>
      </CModal>
    </CHeader>
  )
}

export default AppHeader