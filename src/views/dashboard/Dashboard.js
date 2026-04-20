import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  CCard,
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

  // ✅ NEW: search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getTodayAppointments();
      if (response.statusCode === 200) {
        setTodayAppointments(response.data);
        setBranches(doctorDetails?.branches || []);
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
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
      console.error('❌ Error fetching future appointments:', error);
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

  // ✅ Reset to page 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // ✅ Filter by type, branch, AND name search
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
      <h5 className="mb-4" style={{ fontSize: SIZES.medium, color: COLORS.black }}>
        Today Appointments
      </h5>

      <div className="d-flex flex-wrap flex-md-nowrap gap-3">
        {/* LEFT SIDE */}
        <div className="flex-grow-1" style={{ flexBasis: '60%' }}>

     

          {/* Filters */}
       {/* Filters */}
<div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
  
  {/* LEFT: Type filter buttons */}
  <div className="d-flex gap-2 flex-wrap">
    <Button
      variant={selectedType === null ? 'primary' : 'outline'}
      customColor={COLORS.bgcolor}
      color={COLORS.black}
      onClick={() => {
        setSelectedType(null);
        setSelectedBranch(null);
      }}
      size="small"
    >
      All ({todayAppointments.length})
    </Button>
    {Object.entries(consultationCounts).map(([type, count]) => (
      <Button
        key={type}
        variant="outline"
        customColor={COLORS.bgcolor}
        color={COLORS.black}
        size="small"
        onClick={() => setSelectedType(type)}
      >
        {type} ({count})
      </Button>
    ))}
  </div>

  {/* RIGHT: Search + Branch Dropdown + Calendar */}
  <div className="d-flex gap-2 align-items-center">

    {/* ✅ Search bar moved here */}
    <div style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#888',
          pointerEvents: 'none',
          fontSize: '14px',
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
          border: `1px solid ${COLORS.bgcolor || '#dee2e6'}`,
          fontSize: '13px',
          outline: 'none',
          backgroundColor: COLORS.bgcolor || '#f8f9fa',
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
            color: '#888',
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
          backgroundColor: COLORS.bgcolor,
          color: COLORS.black,
          borderRadius: '8px',
          padding: '0.5rem 1rem',
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

    {/* Calendar Button */}
    <Button
      variant="outline"
      customColor={COLORS.bgcolor}
      color={COLORS.black}
      size="small"
      onClick={() => {
        fetchFutureAppointments();
        setShowCalendar(true);
      }}
    >
      My Calendar
    </Button>
  </div>
</div>

          {/* Appointments Table */}
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', borderRadius: '8px' }}>
            <CTable className="border">
              <CTableHead>
                <CTableRow>
                  {['S.No', 'Name', 'Mobile', 'Date', 'Time', 'Consultation', 'Branch', 'Action'].map(
                    (header, i) => (
                      <CTableHeaderCell
                        key={i}
                        className={header === 'Action' ? 'text-center' : ''}
                        style={{ backgroundColor: COLORS.bgcolor, color: COLORS.black }}
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
                    <CTableDataCell colSpan="8" className="text-center py-4 text-muted">
                      {searchQuery
                        ? `No appointments found for "${searchQuery}"`
                        : 'No Appointments Available'}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  currentPatients.map((item, idx) => (
                    <CTableRow key={idx}>
                      <CTableDataCell>{(currentPage - 1) * itemsPerPage + idx + 1}</CTableDataCell>
                      <CTableDataCell>{capitalizeFirst(item.name)}</CTableDataCell>
                      <CTableDataCell>{item.patientMobileNumber}</CTableDataCell>
                      <CTableDataCell>{item.serviceDate}</CTableDataCell>
                      <CTableDataCell>{item.servicetime}</CTableDataCell>
                      <CTableDataCell>{item.consultationType}</CTableDataCell>
                      <CTableDataCell
                        style={{ whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '150px' }}
                      >
                        {branches.find((b) => b.branchId === item.branchId)?.branchName || 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <TooltipButton patient={item} tab={item.status} />
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            {/* Pagination */}
            <div className="d-flex justify-content-end align-items-center mt-2 gap-2">
              <Button
                size="small"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                size="small"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
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