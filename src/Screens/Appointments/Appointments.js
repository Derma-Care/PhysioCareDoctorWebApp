import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import { COLORS, SIZES } from '../../Themes'
import TooltipButton from '../../components/CustomButton/TooltipButton'
import Button from '../../components/CustomButton/CustomButton'
import { getAppointments } from '../../Auth/Auth'
import { useDoctorContext } from '../../Context/DoctorContext'
import { useToast } from '../../utils/Toaster'

const tabLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  dueForInvestigation: 'Due for Investigation',
  investigationDone: 'Investigation Done',
  followUpNeeded: 'Follow-up Needed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  drop: 'Drop',
  noReply: 'No Reply',
  completed: 'Completed',
  "on-going": 'On-Going',
  inprogress: "In-Progress",

  followUpPending: 'Follow-up Pending',
}

const tabToStatusMap = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  inprogress: 'In-Progress',
  "on-going": 'On-Going',
  noshow: 'No Reply',
  dueForInvestigation: 'Due for Investigation',
  investigationDone: 'Investigation Done',
  followUpNeeded: 'Follow-up Needed',
  rescheduled: 'Rescheduled',
  drop: 'Drop',
  noReply: 'No Reply',
  followUpPending: 'Follow-up Pending',
}

const Appointments = ({ searchTerm = '' }) => {
  const { doctorDetails } = useDoctorContext()
  const branches = doctorDetails?.branches || []

  const [activeTab, setActiveTab] = useState('confirmed')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const toast = useToast()

  const isFetchingRef = useRef(false)

  const toISODate = (val) => {
    if (!val) return ''
    const parsed = new Date(val)
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
    const parts = String(val).split(/[-/]/)
    if (parts.length === 3) {
      const [d, m, y] = parts
      const tryDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
      if (!isNaN(tryDate)) return tryDate.toISOString().slice(0, 10)
    }
    return ''
  }

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)
    try {
      const status = tabToStatusMap[activeTab]
      const response = await getAppointments(status, selectedBranch?.branchId || 'all')
      setAppointments(response.data || [])
      // if (response.success && response.message) {
      //   toast.info(response.message)
      // }
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [activeTab, selectedBranch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filter, selectedBranch, selectedDate, searchTerm, searchQuery])

  const safeSearch = (searchQuery || searchTerm).toLowerCase()

  const filteredPatients = Array.isArray(appointments)
    ? appointments
      .filter((p) => {
        const matchesSearch =
          p.name?.toLowerCase().includes(safeSearch) ||
          p.patientMobileNumber?.toLowerCase().includes(safeSearch) || p.mobileNumber?.toLowerCase().includes(safeSearch)
        const matchesFilter =
          filter === 'All' ||
          filter === 'First-Time & Follow-up' ||
          p.consultationType?.toLowerCase() === filter.toLowerCase()
        const matchesBranch =
          !selectedBranch ||
          p.branchId === selectedBranch.branchId ||
          p.branchName === selectedBranch.branchName
        const serviceISO = toISODate(p.serviceDate)
        const matchesDate = !selectedDate || serviceISO === selectedDate
        return matchesSearch && matchesFilter && matchesDate && matchesBranch
      })
      .sort((a, b) => new Date(toISODate(b.serviceDate)) - new Date(toISODate(a.serviceDate)))
    : []

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)

  const getDropdownLabel = () => {
    return tabLabels[activeTab] || 'Select Status'
  }

  // helper: is this filter button active?
  const isFilterActive = (name) => filter === name

  return (
    <CContainer>
      <style>{`
        .themed-dropdown-menu .dropdown-menu {
          background-color: #ffffff;
          border: 1.5px solid #1B4F8A;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(27,79,138,0.1);
        }
        .themed-dropdown-menu .dropdown-item {
          color: #1B4F8A;
          background-color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
        }
        .themed-dropdown-menu .dropdown-item:hover {
          background-color: #EAF1FB;
          color: #1B4F8A;
        }
        .themed-dropdown-menu .dropdown-item.active,
        .themed-dropdown-menu .dropdown-item:active {
          background-color: #f9c571 !important;
          color: #ffffff !important;
          font-weight: 600;
        }
        .appt-row:hover {
          background-color: #EAF1FB !important;
        }
      `}</style>

      <CRow>
        <CCol>

          {/* ── Sticky Header ── */}
          <div
            className="position-sticky z-3 w-100 pt-4"
            style={{ top: 105, backgroundColor: COLORS.theme }}
          >
            <h5
              style={{ fontSize: SIZES.medium, color: COLORS.black, fontWeight: '600' }}
              className="pb-3"
            >
              Appointments
            </h5>

            <CRow className="w-100 d-flex align-items-center mb-2">
              <CCol xs={12}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                  {/* LEFT: Tab Dropdown + Filter Buttons */}
                  <div className="d-flex align-items-center gap-2 flex-wrap">

                    {/* Tab Dropdown */}
                    <CDropdown className="themed-dropdown-menu" style={{ cursor: 'pointer' }}>
                      <CDropdownToggle
                        size="sm"
                        disabled={loading}
                        className="d-flex align-items-center gap-2"
                        style={{
                          backgroundColor: COLORS.bgcolor,
                          border: `1.5px solid ${COLORS.bgcolor}`,
                          borderRadius: '8px',
                          color: COLORS.white,
                          fontWeight: '600',
                          fontSize: '13px',
                          padding: '6px 14px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span>{getDropdownLabel()}</span>
                        <span style={{ color: COLORS.white, fontWeight: '600' }}>
                          ({filteredPatients.length})
                        </span>
                      </CDropdownToggle>
                      <CDropdownMenu placement="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {Object.keys(tabLabels).map((key) => (
                          <CDropdownItem
                            key={key}
                            active={activeTab === key}
                            onClick={() => {
                              setActiveTab(key)
                              setFilter('All')
                              setSelectedBranch(null)
                            }}
                          >
                            {tabLabels[key]}
                          </CDropdownItem>
                        ))}
                      </CDropdownMenu>
                    </CDropdown>

                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: COLORS.black,
                          pointerEvents: 'none',
                          fontSize: '13px',
                        }}
                      >
                        🔍
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search patient name or mobile..."
                        style={{
                          width: '260px',
                          paddingLeft: '32px',
                          paddingRight: searchQuery ? '28px' : '10px',
                          paddingTop: '6px',
                          paddingBottom: '6px',
                          borderRadius: '8px',
                          border: `1.5px solid ${COLORS.bgcolor}40`,
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: COLORS.white,
                          color: COLORS.black,
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = COLORS.bgcolor)}
                        onBlur={(e) => (e.target.style.borderColor = `${COLORS.bgcolor}40`)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: COLORS.black,
                            fontSize: '13px',
                            padding: 0,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* First-Time & Follow-up */}
                    {/* <button
                      onClick={() =>
                        setFilter(isFilterActive('First-Time & Follow-up') ? 'All' : 'First-Time & Follow-up')
                      }
                      style={{
                        backgroundColor: isFilterActive('First-Time & Follow-up') ? COLORS.orange : COLORS.white,
                        color: isFilterActive('First-Time & Follow-up') ? COLORS.white : COLORS.black,
                        border: `1.5px solid ${isFilterActive('First-Time & Follow-up') ? COLORS.orange : COLORS.black}`,
                        borderRadius: '8px',
                        padding: '5px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      First-Time & Follow-up
                    </button> */}

                    {/* In-Clinic Consultation */}
                    {/* <button
                      onClick={() =>
                        setFilter(isFilterActive('In-Clinic Consultation') ? 'All' : 'In-Clinic Consultation')
                      }
                      style={{
                        backgroundColor: isFilterActive('In-Clinic Consultation') ? COLORS.orange : COLORS.white,
                        color: isFilterActive('In-Clinic Consultation') ? COLORS.white : COLORS.black,
                        border: `1.5px solid ${isFilterActive('In-Clinic Consultation') ? COLORS.orange : COLORS.black}`,
                        borderRadius: '8px',
                        padding: '5px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      In-Clinic Consultation
                    </button> */}

                    {/* Online Consultation */}
                    {/* <button
                      onClick={() =>
                        setFilter(isFilterActive('Online Consultation') ? 'All' : 'Online Consultation')
                      }
                      style={{
                        backgroundColor: isFilterActive('Online Consultation') ? COLORS.orange : COLORS.white,
                        color: isFilterActive('Online Consultation') ? COLORS.white : COLORS.black,
                        border: `1.5px solid ${isFilterActive('Online Consultation') ? COLORS.orange : COLORS.black}`,
                        borderRadius: '8px',
                        padding: '5px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      Online Consultation
                    </button> */}
                  </div>

                  {/* RIGHT: Branch Dropdown */}
                  <CDropdown className="themed-dropdown-menu" style={{ cursor: 'pointer' }}>
                    <CDropdownToggle
                      size="sm"
                      disabled={loading}
                      className="d-flex align-items-center gap-2"
                      style={{
                        backgroundColor: COLORS.white,
                        border: `1.5px solid ${COLORS.black}`,
                        borderRadius: '8px',
                        color: COLORS.black,
                        fontWeight: '600',
                        fontSize: '13px',
                        padding: '6px 14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {selectedBranch ? selectedBranch.branchName : 'All Branches'}
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => setSelectedBranch(null)}>
                        All Branches
                      </CDropdownItem>
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <CDropdownItem
                            key={branch.branchId}
                            onClick={() => setSelectedBranch(branch)}
                          >
                            {branch.branchName}
                          </CDropdownItem>
                        ))
                      ) : (
                        <CDropdownItem disabled>No branches available</CDropdownItem>
                      )}
                    </CDropdownMenu>
                  </CDropdown>

                </div>
              </CCol>
            </CRow>
          </div>

          {/* ── Appointments Table ── */}
          <CCard
            className="mb-2"
            style={{
              border: `1.5px solid ${COLORS.bgcolor}`,
              borderRadius: '10px',
              boxShadow: '0 2px 12px rgba(27,79,138,0.08)',
              overflow: 'hidden',
            }}
          >
            <CCardBody style={{ padding: '0', overflowY: 'auto' }}>
              <CTable hover responsive className="mb-0">
                <CTableHead>
                  <CTableRow
                    className="text-nowrap"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {['S.No', 'Name', 'Mobile', 'Date', 'Time', 'Branch', 'Visit Type', 'Follow-up Status', 'Status', 'Action'].map(
                      (header) => (
                        <CTableHeaderCell
                          key={header}
                          style={{
                            backgroundColor: COLORS.bgcolor,
                            color: COLORS.white,
                            fontWeight: '600',
                            fontSize: '13px',
                            padding: '10px 12px',
                            borderBottom: 'none',
                          }}
                        >
                          {header}
                        </CTableHeaderCell>
                      ),
                    )}
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={10}
                        className="text-center py-4"
                        style={{ color: COLORS.black, fontSize: '14px' }}
                      >
                        Loading...
                      </CTableDataCell>
                    </CTableRow>
                  ) : currentPatients.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={10}
                        className="text-center py-4"
                        style={{ color: COLORS.gray, fontSize: '14px' }}
                      >
                        No appointments found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    currentPatients.map((p, i) => (
                      <CTableRow
                        key={p.id || `${p.patientId}-${i}`}
                        className="appt-row"
                        style={{
                          fontSize: '0.85rem',
                          backgroundColor: i % 2 === 0 ? COLORS.white : '#F0F6FF',
                        }}
                      >
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black }}>
                          {indexOfFirstItem + i + 1}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black, fontWeight: '500' }}>
                          {p.name ? p.name.charAt(0).toUpperCase() + p.name.slice(1) : 'NA'}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black }}>
                          {p.patientMobileNumber || p.mobileNumber}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black }}>
                          {p.serviceDate}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black }}>
                          {p.servicetime}
                        </CTableDataCell>
                        {/* <CTableDataCell style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              backgroundColor: '#EAF1FB',
                              color: COLORS.black,
                              borderRadius: '20px',
                              padding: '3px 10px',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            {p.consultationType}
                          </span>
                        </CTableDataCell> */}
                        <CTableDataCell
                          style={{
                            padding: '10px 12px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            maxWidth: '150px',
                            color: COLORS.black,
                          }}
                        >
                          {branches.find((b) => b.branchId === p.branchId)?.branchName || 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black, textTransform: 'capitalize' }}>
                          {p.visitType ? p.visitType.replace(/_/g, ' ').toLowerCase() : 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px', color: COLORS.black, textTransform: 'capitalize' }}>
                          {p.followupStatus || 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              backgroundColor:
                                p.status === 'Confirmed' ? '#EAF7F0'
                                  : p.status === 'In-Progress' ? '#FFF4E0'
                                    : p.status === 'Cancelled' ? '#FFF0F0'
                                      : p.status === 'No-Show' ? '#F4F4F4'
                                        : '#F0F6FF',
                              color:
                                p.status === 'Confirmed' ? '#1B8A56'
                                  : p.status === 'In-Progress' ? COLORS.orange
                                    : p.status === 'Cancelled' ? '#D32F2F'
                                      : p.status === 'No-Show' ? '#616161'
                                        : COLORS.black,
                              borderRadius: '20px',
                              padding: '3px 10px',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            {p.status}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '10px 12px' }}>
                          {p.status?.toLowerCase() === 'drop' || 
                           p.status?.toLowerCase() === 'cancelled' || 
                           p.followupStatus?.toLowerCase() === 'drop' || 
                           p.followupStatus?.toLowerCase() === 'cancelled' ? (
                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>—</span>
                          ) : (
                            <TooltipButton patient={p} tab={p.status} />
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {/* ── Pagination ── */}
              {filteredPatients.length > itemsPerPage && (
                <div className="d-flex justify-content-end align-items-center gap-2 p-3">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      backgroundColor: currentPage === 1 ? '#e9ecef' : COLORS.white,
                      color: currentPage === 1 ? COLORS.gray : COLORS.black,
                      border: `1.5px solid ${currentPage === 1 ? '#dee2e6' : COLORS.black}`,
                      borderRadius: '8px',
                      padding: '4px 14px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: '13px', color: COLORS.black, fontWeight: '500' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      backgroundColor: currentPage === totalPages ? '#e9ecef' : COLORS.white,
                      color: currentPage === totalPages ? COLORS.gray : COLORS.black,
                      border: `1.5px solid ${currentPage === totalPages ? '#dee2e6' : COLORS.black}`,
                      borderRadius: '8px',
                      padding: '4px 14px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </CCardBody>
          </CCard>

        </CCol>
      </CRow>
    </CContainer>
  )
}

export default Appointments