import React, { useEffect, useRef, useState } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilMenu,
} from '@coreui/icons'
import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import './header/sidebar.css'
import { COLORS, SIZES } from '../Themes'
import { getDateParts } from '../utils/formatDateTime'
import Button from './CustomButton/CustomButton'
// import { patientData } from '../Prescription/patientData.json'
import TooltipButton from './CustomButton/TooltipButton'
import { getClinicDetails, getTodayAppointments } from '../Auth/Auth'
import { useDoctorContext } from '../Context/DoctorContext'
import { capitalizeFirst, capitalizeWords } from '../utils/CaptalZeWord'
import './AppHeader.css'
const AppHeader = () => {
  const { patientData, setTodayAppointments, todayAppointments } = useDoctorContext()
  useEffect(() => {
    // clear context + localStorage so sidebar shows doctor data
    appointmentDetails();
  }, [])

  const appointmentDetails = async () => {

    const response = await getTodayAppointments()
    console.log(response)

    if (response.statusCode == 200) {
      console.log(response.data)
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
        const res = await getClinicDetails();
        console.log('✅ Clinic loaded:', res);
        setClinic(res);
      } catch (err) {
        console.error('❌ Error fetching clinic:', err);
      }
    };

    fetchClinic();
  }, []);


  const { day, date, time } = getDateParts()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [visible, setVisible] = useState(false)

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    const filtered = todayAppointments.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
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
      // ref={headerRef}
      style={{ top: 0, insetInline: 0, zIndex: 1030, margin: -20, backgroundColor: COLORS.bgcolor }}
    >
      <CContainer className="border-bottom px-4 header-row " fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
          aria-label="Toggle sidebar"
        >
          <CIcon icon={cilMenu} size="lg" style={{ color: COLORS.black }} />
        </CHeaderToggler>
        {/* Search */}
        <div className="position-relative flex-grow-1 mx-3 search-wrap" style={{ maxWidth: "500px" }}>
          <div className="position-relative">
            <CFormInput
              type="text"
              placeholder="🔍 Search patient by name..."
              value={searchTerm}
              onChange={handleSearch}
              className="placeholder-[#7e3a93] placeholder:font-bold"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setSearchResults([])
                }}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: COLORS.black,
                }}
              >
                ×
              </button>
            )}
          </div>

        {searchTerm && (
  <div
    className="position-absolute w-100 mt-1 bg-white shadow rounded p-2 search-dropdown"
    style={{ maxHeight: 300, overflowY: 'auto' }}
  >
    {searchResults.length > 0 ? (
      searchResults.map((patient, idx) => (
        <div
          key={idx}
          className="d-flex justify-content-between align-items-center border-bottom py-2 px-2"
        >
          <div>
            <strong>{capitalizeFirst(patient.name)}</strong>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>{patient.mobileNumber}</div>
          </div>

          <TooltipButton
            patient={patient}
            onSelect={() => {
              setSearchTerm('')
              setSearchResults([])
            }}
          />
        </div>
      ))
    ) : (
      <div className="text-center py-2 text-muted">No data found</div>
    )}
  </div>
)}

        </div>
        <CHeaderNav className="ms-auto">
          <CNavItem>
            <CNavLink
              onClick={(e) => {
                e.preventDefault();
              }}
              style={{ cursor: 'pointer' }}
            >
              <CIcon icon={cilBell} size="lg" style={{ color: COLORS.black }} />
            </CNavLink>
          </CNavItem>

        </CHeaderNav>

        {/* Theme switch + profile */}
        <CHeaderNav className="gap-2 align-items-center">

          <div className="vr h-100 mx-2 text-body text-opacity-75 d-none d-md-block" />

          <div className="d-flex flex-column align-items-center justify-content-center text-center px-2">
            {clinic ? (
              <>
                <h5 className="fw-bold " style={{ fontSize: SIZES.large, color: COLORS.black }}>
                  {capitalizeWords(clinic.name) || 'Clinic Name'}

                </h5>
                {/* <h6 style={{ color: COLORS.black, fontSize: SIZES.small }}>
                  {clinic.city || 'No city'}
                </h6> */}
              </>
            ) : (
              <h6 className="text-muted">Loading...</h6>
            )}
          </div>

          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>

      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>

      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>Patient Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedPatient && (
            <div>
              <p>
                <strong>Name:</strong>{capitalizeFirst(selectedPatient.name)} 
              </p>
              <p>
                <strong>Mobile:</strong> {selectedPatient.mobileNumber}
              </p>
              <p>
                <strong>Problem:</strong> {selectedPatient.problem}
              </p>
              <p>
                <strong>Doctor:</strong> {selectedPatient.doctorName}
              </p>
              <p>
                <strong>Consultation:</strong> {selectedPatient.consultationType}
              </p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <Button color="secondary" onClick={() => setVisible(false)}>
            Close
          </Button>
        </CModalFooter>
      </CModal>
    </CHeader>
  )
}

export default AppHeader
