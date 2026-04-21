import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
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
} from '@coreui/react';

import Button from '../../components/CustomButton/CustomButton';
import TooltipButton from '../../components/CustomButton/TooltipButton';
import { COLORS, SIZES } from '../../Themes';
import { useDoctorContext } from '../../Context/DoctorContext';
import { getTodayAppointments, getTodayFutureAppointments } from '../../Auth/Auth';
import CalendarModal from '../../utils/CalenderModal';
import { useNavigate } from 'react-router-dom';

const capitalizeFirst = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

const Dashboard = () => {
  const navigate = useNavigate();
  const { setPatientData, setTodayAppointments, todayAppointments, doctorDetails } =
    useDoctorContext();

  const [selectedType, setSelectedType] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [futureAppointments, setFutureAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getTodayAppointments();
      if (response.statusCode === 200) {
        setTodayAppointments(response.data);
        setBranches(doctorDetails?.branches || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }, [doctorDetails?.id, setTodayAppointments]);

  const fetchFutureAppointments = useCallback(async () => {
    try {
      const response = await getTodayFutureAppointments();
      if (response.statusCode === 200) {
        setFutureAppointments(response.data);
      } else {
        setFutureAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching future appointments:', error);
      setFutureAppointments([]);
    }
  }, []);

  useEffect(() => {
    if (!doctorDetails) return;
    setPatientData(null);
    fetchAppointments();
    const interval = setInterval(() => {
      fetchAppointments();
    }, 10000);
    return () => clearInterval(interval);
  }, [doctorDetails?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredPatients = todayAppointments.filter((item) => {
    const typeMatch = selectedType ? item.consultationType === selectedType : true;
    const branchMatch = selectedBranch ? item.branchId === selectedBranch.branchId : true;
    const nameMatch = searchQuery.trim()
      ? item.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true;
    return typeMatch && branchMatch && nameMatch;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const consultationCounts = todayAppointments.reduce((acc, item) => {
    acc[item.consultationType] = (acc[item.consultationType] || 0) + 1;
    return acc;
  }, {});

  const handleCalendarClick = (appointment) => {
    if (!appointment) return;
    setPatientData(appointment);
    navigate(`/tab-content/${appointment.patientId}`, { state: { patient: appointment } });
  };

  return (
    <div className="container-fluid mt-3">
      <h5 className="mb-4" style={{ fontSize: SIZES.medium, color: COLORS.black, fontWeight: '600' }}>
        Today Appointments
      </h5>

      <div className="d-flex flex-wrap flex-md-nowrap gap-3">
        <div className="flex-grow-1" style={{ flexBasis: '60%' }}>

          {/* Filters Row */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">

            {/* LEFT: Type filter buttons */}
            <div className="d-flex gap-2 flex-wrap">

              {/* All button */}
              <button
                onClick={() => { setSelectedType(null); setSelectedBranch(null); }}
                style={{
                  backgroundColor: selectedType === null ? COLORS.black : COLORS.white,
                  color: selectedType === null ? COLORS.white : COLORS.black,
                  border: `1.5px solid ${selectedType === null ? COLORS.black : COLORS.black}`,
                  borderRadius: '8px',
                  padding: '4px 14px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                All ({todayAppointments.length})
              </button>

              {/* Consultation type buttons */}
              {Object.entries(consultationCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    backgroundColor: selectedType === type ? COLORS.black : COLORS.white,
                    color: selectedType === type ? COLORS.white : COLORS.black,
                    border: `1.5px solid ${selectedType === type ? COLORS.black : COLORS.black}`,
                    borderRadius: '8px',
                    padding: '4px 14px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {type} ({count})
                </button>
              ))}
            </div>

            {/* RIGHT: Search + Branch Dropdown + Calendar */}
            <div className="d-flex gap-2 align-items-center flex-wrap">

              {/* Search bar */}
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
                  placeholder="Search by patient name..."
                  style={{
                    width: '220px',
                    paddingLeft: '32px',
                    paddingRight: searchQuery ? '28px' : '10px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    borderRadius: '8px',
                    border: `1.5px solid ${COLORS.black}`,
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: COLORS.white,
                    color: COLORS.black,
                  }}
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

              {/* Branch Dropdown */}
              <CDropdown>
                <CDropdownToggle
                  style={{
                    backgroundColor: COLORS.white,
                    color: COLORS.black,
                    border: `1.5px solid ${COLORS.black}`,
                    borderRadius: '8px',
                    padding: '5px 14px',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  {selectedBranch ? selectedBranch.branchName : 'All Branches'}
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem onClick={() => setSelectedBranch(null)}>All Branches</CDropdownItem>
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <CDropdownItem key={branch.branchId} onClick={() => setSelectedBranch(branch)}>
                        {branch.branchName}
                      </CDropdownItem>
                    ))
                  ) : (
                    <CDropdownItem disabled>No branches available</CDropdownItem>
                  )}
                </CDropdownMenu>
              </CDropdown>

              {/* My Calendar button — yellow */}
              <button
                onClick={() => { fetchFutureAppointments(); setShowCalendar(true); }}
                style={{
                  backgroundColor: COLORS.black,
                  color: COLORS.white,
                  border: `1.5px solid ${COLORS.black}`,
                  borderRadius: '8px',
                  padding: '5px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                My Calendar
              </button>

            </div>
          </div>

          {/* Appointments Table */}
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', borderRadius: '8px', border: `1px solid ${COLORS.black}20` }}>
            <CTable className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <CTableHead>
                <CTableRow>
                  {['S.No', 'Name', 'Mobile', 'Date', 'Time', 'Consultation', 'Branch', 'Action'].map(
                    (header, i) => (
                      <CTableHeaderCell
                        key={i}
                        className={header === 'Action' ? 'text-center' : ''}
                        style={{
                          backgroundColor: COLORS.bgcolor,
                          color: COLORS.white,
                          fontWeight: '600',
                          fontSize: '13px',
                          padding: '10px 12px',
                          borderBottom: 'none',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        {header}
                      </CTableHeaderCell>
                    )
                  )}
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {currentPatients.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell
                      colSpan="8"
                      className="text-center py-4"
                      style={{ color: COLORS.gray, fontSize: '14px' }}
                    >
                      {searchQuery
                        ? `No appointments found for "${searchQuery}"`
                        : 'No Appointments Available'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  currentPatients.map((item, idx) => (
                    <CTableRow
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? COLORS.white : '#F0F6FF',
                        transition: 'background 0.15s',
                      }}
                    >
                      <CTableDataCell style={{ fontSize: '13px', padding: '10px 12px', color: COLORS.black }}>
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </CTableDataCell>
                      <CTableDataCell style={{ fontSize: '13px', padding: '10px 12px', color: COLORS.black, fontWeight: '500' }}>
                        {capitalizeFirst(item.name)}
                      </CTableDataCell>
                      <CTableDataCell style={{ fontSize: '13px', padding: '10px 12px', color: COLORS.black }}>
                        {item.patientMobileNumber}
                      </CTableDataCell>
                      <CTableDataCell style={{ fontSize: '13px', padding: '10px 12px', color: COLORS.black }}>
                        {item.serviceDate}
                      </CTableDataCell>
                      <CTableDataCell style={{ fontSize: '13px', padding: '10px 12px', color: COLORS.black }}>
                        {item.servicetime}
                      </CTableDataCell>
                      <CTableDataCell style={{ fontSize: '13px', padding: '10px 12px' }}>
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
                          {item.consultationType}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell
                        style={{
                          fontSize: '13px',
                          padding: '10px 12px',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          maxWidth: '150px',
                          color: COLORS.black,
                        }}
                      >
                        {branches.find((b) => b.branchId === item.branchId)?.branchName || 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell className="text-center" style={{ padding: '10px 12px' }}>
                        <TooltipButton patient={item} tab={item.status} />
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-end align-items-center mt-3 gap-2">
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
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                backgroundColor: (currentPage === totalPages || totalPages === 0) ? '#e9ecef' : COLORS.white,
                color: (currentPage === totalPages || totalPages === 0) ? COLORS.gray : COLORS.black,
                border: `1.5px solid ${(currentPage === totalPages || totalPages === 0) ? '#dee2e6' : COLORS.black}`,
                borderRadius: '8px',
                padding: '4px 14px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>

        </div>
      </div>

      {showCalendar && (
        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          todayAppointments={
            selectedBranch
              ? futureAppointments.filter((a) => a.branchId === selectedBranch.branchId)
              : futureAppointments
          }
          defaultBookedSlots={[]}
          handleClick={handleCalendarClick}
          fetchAppointments={fetchFutureAppointments}
        />
      )}
    </div>
  );
};

export default Dashboard;