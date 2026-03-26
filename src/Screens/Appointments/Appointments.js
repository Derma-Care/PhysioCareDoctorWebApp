import React, { useEffect, useState, useContext } from 'react'
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
import { getAppointments, getAppointmentsCount } from '../../Auth/Auth'
import { useDoctorContext } from '../../Context/DoctorContext'

const tabLabels = {
  upcoming: 'Upcoming',
  inprogress: 'Active',
  completed: 'Completed',
}

const tabToNumberMap = {
  upcoming: 1,
  inprogress: 4,
  completed: 3,
}

const Appointments = ({ searchTerm = '' }) => {
  const { doctorDetails } = useDoctorContext() // get branches from doctorDetails
  const branches = doctorDetails?.branches || []

  const [activeTab, setActiveTab] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

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

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const tabNumber = tabToNumberMap[activeTab];
      try {
        // Add cache-buster to ensure fresh data
        const appointmentsData = await getAppointments(`${tabNumber}?_=${new Date().getTime()}`);
        if (isMounted) setAppointments(appointmentsData || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    };

    fetchData(); // initial fetch

    const interval = setInterval(() => {
      fetchData(); // auto-fetch every 10 seconds
    }, 10000); // adjust interval as needed

    return () => {
      isMounted = false;
      clearInterval(interval); // clean up interval on unmount
    };
  }, [activeTab]);


  // Filtering + Sorting
  const safeSearch = searchTerm.toLowerCase()

  const filteredPatients = Array.isArray(appointments)
    ? appointments
      .filter((p) => {
        const matchesSearch = p.name?.toLowerCase().includes(safeSearch)
        const matchesFilter = filter === 'All' || p.consultationType === filter
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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)

  return (
    <CContainer>
      <CRow>
        <CCol>
          {/* Sticky Header */}
          <div
            className="position-sticky z-3 w-100 pt-4"
            style={{ top: 105, backgroundColor: `${COLORS.theme}` }}
          >
            <h5 style={{ fontSize: SIZES.medium, color: COLORS.black }} className="pb-3">
              Appointments
            </h5>

            <CRow className="w-100 d-flex align-items-center mb-2">
              <CCol xs={12}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  {/* LEFT: Tabs + Consultation Filters */}
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Tabs Dropdown */}
                    <CDropdown style={{ cursor: 'pointer' }}>
                      <CDropdownToggle
                        size="sm"
                        className="d-flex align-items-center gap-2"
                        style={{
                          border: `1px solid ${COLORS.bgcolor}`,
                          borderRadius: '6px',
                          color: COLORS.black,
                          fontWeight: '600',
                          backgroundColor: COLORS.bgcolor,
                        }}
                      >
                        <span>{tabLabels[activeTab]}</span>
                        <span style={{ color: COLORS.black, fontWeight: '600' }}>
                          ({filteredPatients.length})
                        </span>
                      </CDropdownToggle>
                      <CDropdownMenu placement="end">
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

                    {/* Consultation Filters */}
                    <Button
                      variant={filter === 'Services & Treatments' ? 'primary' : 'outline'}
                      onClick={() => setFilter('Services & Treatments')}
                      customColor={filter === 'Services & Treatments' ? COLORS.bgcolor : COLORS.black}
                      size="small"
                    >
                      Services & Treatments
                    </Button>

                    <Button
                      variant={filter === 'In-Clinic Consultation' ? 'primary' : 'outline'}
                      onClick={() => setFilter('In-Clinic Consultation')}
                      customColor={filter === 'In-Clinic Consultation' ? COLORS.bgcolor : COLORS.black}
                      size="small"
                    >
                      In-Clinic Consultation
                    </Button>

                    <Button
                      variant={filter === 'Online Consultation' ? 'primary' : 'outline'}
                      onClick={() => setFilter('Online Consultation')}
                      customColor={filter === 'Online Consultation' ? COLORS.bgcolor : COLORS.black}
                      size="small"
                    >
                      Online Consultation
                    </Button>
                  </div>

                  {/* RIGHT: Branch Dropdown */}
                  <div>
                    <CDropdown style={{ cursor: 'pointer' }}>
                      <CDropdownToggle
                        size="sm"
                        className="d-flex align-items-center gap-2"
                        style={{
                          border: `1px solid ${COLORS.bgcolor}`,
                          borderRadius: '6px',
                          fontWeight: '600',
                          backgroundColor: COLORS.bgcolor,
                          color: COLORS.black,
                        }}
                      >
                        {selectedBranch ? selectedBranch.branchName : 'All Branches'}
                      </CDropdownToggle>
                      <CDropdownMenu>
                        {/* All Branches option */}
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

                </div>
              </CCol>
            </CRow>


          </div>

          {/* Appointments Table */}
          <CCard
            className="mb-2 border"
            style={{
              border: '2px solid #0d6efd',
              borderRadius: '8px',
              boxShadow: '0 0 10px rgba(13, 110, 253, 0.1)',
            }}
          >
            <CCardBody style={{ padding: '0', overflowY: 'auto' }}>
              <CTable hover responsive className="mb-0 table-horizontal-lines striped">
                <CTableHead>
                  <CTableRow className="text-nowrap" style={{ fontSize: '0.875rem' }}>
                    {[
                      'S.No',
                      'Patient ID',
                      'Name',
                      'Mobile',
                      'Date',
                      'Time',
                      'Consultation',
                      'Branch',
                      'Status',
                      'Action',
                    ].map((header) => (
                      <CTableHeaderCell
                        key={header}
                        style={{
                          backgroundColor: COLORS.bgcolor,
                          color: COLORS.black,
                          fontWeight: 'bold',
                        }}
                      >
                        {header}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={10} className="text-center py-4">
                        Loading...
                      </CTableDataCell>
                    </CTableRow>
                  ) : currentPatients.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={10}
                        className="text-center text-muted py-4"
                        style={{ color: COLORS.logocolor }}
                      >
                        No appointments found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    currentPatients.map((p, i) => (
                      <CTableRow key={p.id || `${p.patientId}-${i}`} style={{ fontSize: '0.85rem' }}>
                        <CTableDataCell>{indexOfFirstItem + i + 1}</CTableDataCell>
                        <CTableDataCell>{p.patientId}</CTableDataCell>
                        <CTableDataCell>
                          {p.name ? p.name.charAt(0).toUpperCase() + p.name.slice(1) : 'NA'}
                        </CTableDataCell>
                        <CTableDataCell>{p.mobileNumber}</CTableDataCell>
                        <CTableDataCell>{p.serviceDate}</CTableDataCell>
                        <CTableDataCell>{p.servicetime}</CTableDataCell>
                        <CTableDataCell>{p.consultationType}</CTableDataCell>
                        <CTableDataCell style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '150px' }}>
                          {branches.find((b) => b.branchId === p.branchId)?.branchName || 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <span
                            className="px-2 py-1 rounded"
                            style={{
                              backgroundColor: p.status === 'Confirmed' ? '#e8f9f2' : '#e0e0e0',
                              color: p.status === 'Confirmed' ? '#27ae60' : '#7f8c8d',
                              fontWeight: '500',
                              fontSize: '0.8rem',
                            }}
                          >
                            {p.status === 'In-Progress' ? 'Active' : p.status}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell>
                          <TooltipButton patient={p} tab={p.status} />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {/* Pagination Controls */}
              {filteredPatients.length > itemsPerPage && (
                <div className="d-flex justify-content-end align-items-center gap-2 p-2">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
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
