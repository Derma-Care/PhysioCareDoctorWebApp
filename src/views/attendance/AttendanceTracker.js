import React, { useState, useEffect } from 'react';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormLabel,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../Themes';

const AttendanceTracker = () => {
  const navigate = useNavigate();
  
  // State for Personal Attendance
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTime, setLoginTime] = useState('—');
  const [logoutTime, setLogoutTime] = useState('—');
  const [status, setStatus] = useState('—');
  const [activeSubTab, setActiveSubTab] = useState('daily'); // 'daily' or 'monthly'

  // Activities Roster State
  const [activities, setActivities] = useState([]);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newDuration, setNewDuration] = useState('30 mins');
  const [newLocation, setNewLocation] = useState('Therapy Room A');

  // Month-wise History States
  const [monthlyHistory, setMonthlyHistory] = useState([]);

  // Detail View Modal States
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [selectedDateActivities, setSelectedDateActivities] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Dynamic Current Date Formatter
  const getFormattedDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const today = new Date();
    return `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  };

  // Helper: Parse duration string (e.g. "30 mins" or "1h 15m") into total minutes
  const parseDurationStr = (str) => {
    if (!str) return 0;
    let mins = 0;
    const hourMatch = str.match(/(\d+)\s*h/);
    const minMatch = str.match(/(\d+)\s*m/);
    if (hourMatch) mins += parseInt(hourMatch[1]) * 60;
    if (minMatch) mins += parseInt(minMatch[1]);
    if (!hourMatch && !minMatch) {
      const rawMatch = str.match(/(\d+)/);
      if (rawMatch) mins += parseInt(rawMatch[1]);
    }
    return mins;
  };

  // Helper: Calculate duration between two HH:mm strings
  const calculateDuration = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || startTimeStr === '—' || !endTimeStr || endTimeStr === '—') {
      return { totalStr: '', totalMins: 0, hours: 0, minutes: 0 };
    }
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMins < 0) diffMins += 24 * 60; // handle overnight shifts
    
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return {
      totalStr: `${h}h ${m}m`,
      totalMins: diffMins,
      hours: h,
      minutes: m
    };
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const storedState = localStorage.getItem(`doctor_duty_log_${todayStr}`);
    const storedHistory = localStorage.getItem('doctor_monthly_attendance');

    if (storedState) {
      const parsed = JSON.parse(storedState);
      setIsLoggedIn(parsed.isLoggedIn);
      setLoginTime(parsed.loginTime);
      setLogoutTime(parsed.logoutTime);
      setStatus(parsed.status);
      setActivities(parsed.activities || []);
    }

    // Determine if stored history is in the old format or new format
    let needsReseed = false;
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (parsed.length > 0 && parsed[0].hasOwnProperty('hours')) {
          needsReseed = true;
        }
      } catch (e) {
        needsReseed = true;
      }
    }

    if (!storedHistory || needsReseed) {
      // Seed the exact monthly history requested by the user
      const seedHistory = [
        { date: '2026-05-24', login: '20:06', logout: '20:06', total: '0h 0m', working: '0h 0m', idle: '0h 0m' },
        { date: '2026-05-23', login: '12:27', logout: '', total: '0h 1m', working: '0h 0m', idle: '0h 1m' },
        { date: '2026-05-22', login: '12:41', logout: '', total: '', working: '', idle: '' },
        { date: '2026-05-20', login: '10:53', logout: '', total: '', working: '', idle: '' },
        { date: '2026-05-14', login: '16:42', logout: '', total: '', working: '', idle: '' },
      ];
      setMonthlyHistory(seedHistory);
      localStorage.setItem('doctor_monthly_attendance', JSON.stringify(seedHistory));

      // Seed dynamic activities for historical details
      const seedActivities24 = [];
      const seedActivities23 = [
        { id: 1, activity: 'Initial assessment for client Rohan', duration: '1 min', location: 'Cabin 2', date: '2026-05-23' }
      ];

      localStorage.setItem('doctor_duty_log_2026-05-24', JSON.stringify({
        isLoggedIn: false,
        loginTime: '20:06',
        logoutTime: '20:06',
        status: 'Present',
        activities: seedActivities24
      }));

      localStorage.setItem('doctor_duty_log_2026-05-23', JSON.stringify({
        isLoggedIn: false,
        loginTime: '12:27',
        logoutTime: '',
        status: 'Active',
        activities: seedActivities23
      }));
    } else {
      setMonthlyHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Save state helper
  const saveState = (updatedLogin, updatedInTime, updatedOutTime, updatedStatus, updatedActivities) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const stateObj = {
      isLoggedIn: updatedLogin,
      loginTime: updatedInTime,
      logoutTime: updatedOutTime,
      status: updatedStatus,
      activities: updatedActivities
    };
    localStorage.setItem(`doctor_duty_log_${todayStr}`, JSON.stringify(stateObj));
  };

  // Toggle Login / Logout Action
  const handleToggleLogin = () => {
    const format24h = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes}`;
    };

    const nowStr = format24h(new Date());

    if (!isLoggedIn) {
      // Clock In
      setIsLoggedIn(true);
      setLoginTime(nowStr);
      setLogoutTime('—');
      setStatus('Active');
      saveState(true, nowStr, '—', 'Active', activities);

      // Update monthly database list
      const todayStr = new Date().toISOString().split('T')[0];
      const existIndex = monthlyHistory.findIndex(h => h.date === todayStr);
      let updatedHistory = [...monthlyHistory];
      if (existIndex > -1) {
        updatedHistory[existIndex] = { 
          date: todayStr, 
          login: nowStr, 
          logout: '', 
          total: '', 
          working: '', 
          idle: '' 
        };
      } else {
        updatedHistory = [
          { 
            date: todayStr, 
            login: nowStr, 
            logout: '', 
            total: '', 
            working: '', 
            idle: '' 
          }, 
          ...updatedHistory
        ];
      }
      setMonthlyHistory(updatedHistory);
      localStorage.setItem('doctor_monthly_attendance', JSON.stringify(updatedHistory));
    } else {
      // Clock Out
      setIsLoggedIn(false);
      setLogoutTime(nowStr);
      setStatus('Present');

      // Calculate durations
      const durationResult = calculateDuration(loginTime, nowStr);
      
      // Calculate working time from activities
      let totalWorkMins = 0;
      activities.forEach(act => {
        totalWorkMins += parseDurationStr(act.duration);
      });
      
      const workH = Math.floor(totalWorkMins / 60);
      const workM = totalWorkMins % 60;
      const workingStr = `${workH}h ${workM}m`;
      
      const idleMins = Math.max(0, durationResult.totalMins - totalWorkMins);
      const idleH = Math.floor(idleMins / 60);
      const idleM = idleMins % 60;
      const idleStr = `${idleH}h ${idleM}m`;

      saveState(false, loginTime, nowStr, 'Present', activities);

      const todayStr = new Date().toISOString().split('T')[0];
      const existIndex = monthlyHistory.findIndex(h => h.date === todayStr);
      let updatedHistory = [...monthlyHistory];
      if (existIndex > -1) {
        updatedHistory[existIndex] = { 
          date: todayStr, 
          login: loginTime, 
          logout: nowStr, 
          total: durationResult.totalStr, 
          working: workingStr, 
          idle: idleStr 
        };
      }
      setMonthlyHistory(updatedHistory);
      localStorage.setItem('doctor_monthly_attendance', JSON.stringify(updatedHistory));
    }
  };

  // Add Custom Roster Activity
  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: activities.length + 1,
      activity: newActivity,
      duration: newDuration,
      location: newLocation,
      date: todayStr
    };

    const updated = [...activities, newEntry];
    setActivities(updated);
    saveState(isLoggedIn, loginTime, logoutTime, status, updated);

    // If already clocked out, dynamically update working and idle time in monthly list
    if (!isLoggedIn && loginTime !== '—' && logoutTime !== '—') {
      const durationResult = calculateDuration(loginTime, logoutTime);
      let totalWorkMins = 0;
      updated.forEach(act => {
        totalWorkMins += parseDurationStr(act.duration);
      });
      
      const workH = Math.floor(totalWorkMins / 60);
      const workM = totalWorkMins % 60;
      const workingStr = `${workH}h ${workM}m`;
      
      const idleMins = Math.max(0, durationResult.totalMins - totalWorkMins);
      const idleH = Math.floor(idleMins / 60);
      const idleM = idleMins % 60;
      const idleStr = `${idleH}h ${idleM}m`;

      const existIndex = monthlyHistory.findIndex(h => h.date === todayStr);
      let updatedHistory = [...monthlyHistory];
      if (existIndex > -1) {
        updatedHistory[existIndex] = { 
          ...updatedHistory[existIndex],
          working: workingStr,
          idle: idleStr
        };
        setMonthlyHistory(updatedHistory);
        localStorage.setItem('doctor_monthly_attendance', JSON.stringify(updatedHistory));
      }
    }

    // Reset fields
    setNewActivity('');
    setShowAddActivityModal(false);
  };

  // View historical daily log activities details
  const handleViewDetails = (dateStr) => {
    setSelectedHistoryDate(dateStr);
    const storedState = localStorage.getItem(`doctor_duty_log_${dateStr}`);
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        setSelectedDateActivities(parsed.activities || []);
      } catch (e) {
        setSelectedDateActivities([]);
      }
    } else {
      setSelectedDateActivities([]);
    }
    setShowDetailsModal(true);
  };

  return (
    <div style={{ backgroundColor: '#F0F6FF', minHeight: '100vh', paddingBottom: '40px', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* ─── BLUE BAR HEADER ────────────────────────────────────────────────── */}
      <div 
        style={{ 
          backgroundColor: '#1B4F8A', 
          color: '#ffffff', 
          padding: '16px 28px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#ffffff', 
            fontSize: '15px', 
            cursor: 'pointer',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Previous Page"
        >
          ❮
        </button>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
          Previous Page
        </div>
        <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />
        <div style={{ fontSize: '12.5px', fontWeight: '700', letterSpacing: '0.2px' }}>
          Attendance Tracker
        </div>
      </div>

      <CContainer fluid className="px-4 mt-4">
        {/* ─── LOG HEADER BLOCK ─────────────────────────────────────────────── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '26px', margin: '0 0 4px' }}>
              Daily Duty Log
            </h2>
            <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
              {getFormattedDate()}
            </div>
          </div>

          {/* Toggle Login/Logout Button */}
          <button
            onClick={handleToggleLogin}
            style={{
              backgroundColor: isLoggedIn ? '#FEE2E2' : '#EAF7F0',
              color: isLoggedIn ? '#D32F2F' : '#1B8A56',
              border: `1.5px solid ${isLoggedIn ? '#FCA5A5' : '#A7F3D0'}`,
              borderRadius: '24px',
              padding: '6px 20px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            <span 
              style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                backgroundColor: isLoggedIn ? '#D32F2F' : '#1B8A56',
                display: 'inline-block'
              }} 
            />
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </div>

        {/* ─── FOUR METRIC CARDS ROW ────────────────────────────────────────── */}
        <CRow className="g-3 mb-4">
          
          {/* Card 1: LOGIN */}
          <CCol xs={3}>
            <CCard 
              className="border-0 shadow-sm h-100" 
              style={{ 
                borderRadius: '10px', 
                borderLeft: '4px solid #1B4F8A',
                overflow: 'hidden'
              }}
            >
              <CCardBody className="p-2 p-md-3 d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ color: '#8a94a6', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '4px' }}>
                    Login
                  </div>
                  <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '14px', margin: 0 }}>
                    {loginTime}
                  </h4>
                </div>
                <div className="d-none d-sm-block" style={{ fontSize: '16px', color: '#1B4F8A', opacity: 0.85 }}>
                  🚪➜
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Card 2: LOGOUT */}
          <CCol xs={3}>
            <CCard 
              className="border-0 shadow-sm h-100" 
              style={{ 
                borderRadius: '10px', 
                borderLeft: '4px solid #1B4F8A',
                overflow: 'hidden'
              }}
            >
              <CCardBody className="p-2 p-md-3 d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ color: '#8a94a6', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '4px' }}>
                    Logout
                  </div>
                  <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '14px', margin: 0 }}>
                    {logoutTime}
                  </h4>
                </div>
                <div className="d-none d-sm-block" style={{ fontSize: '16px', color: '#1B4F8A', opacity: 0.85 }}>
                  🚪⬅
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Card 3: ACTIVITIES */}
          <CCol xs={3}>
            <CCard 
              className="border-0 shadow-sm h-100" 
              style={{ 
                borderRadius: '10px', 
                borderLeft: '4px solid #1B4F8A',
                overflow: 'hidden'
              }}
            >
              <CCardBody className="p-2 p-md-3 d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ color: '#8a94a6', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '4px' }}>
                    Activities
                  </div>
                  <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '14px', margin: 0 }}>
                    {activities.length}
                  </h4>
                </div>
                <div className="d-none d-sm-block" style={{ fontSize: '18px', color: '#1B4F8A', opacity: 0.85 }}>
                  📈
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Card 4: STATUS */}
          <CCol xs={3}>
            <CCard 
              className="border-0 shadow-sm h-100" 
              style={{ 
                borderRadius: '10px', 
                borderLeft: '4px solid #1B4F8A',
                overflow: 'hidden'
              }}
            >
              <CCardBody className="p-2 p-md-3 d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ color: '#8a94a6', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '4px' }}>
                    Status
                  </div>
                  <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '14px', margin: 0 }}>
                    {status}
                  </h4>
                </div>
                <div className="d-none d-sm-block" style={{ fontSize: '16px', color: '#1B4F8A', opacity: 0.85 }}>
                  🛡️
                </div>
              </CCardBody>
            </CCard>
          </CCol>

        </CRow>

        {/* ─── SUB TABS NAVIGATION ─────────────────────────────────────────── */}
        <div className="d-flex gap-4 border-bottom pb-2 mb-4">
          <button
            onClick={() => setActiveSubTab('daily')}
            style={{
              background: 'none',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              color: activeSubTab === 'daily' ? '#1B4F8A' : '#8a94a6',
              paddingBottom: '8px',
              borderBottom: activeSubTab === 'daily' ? '3px solid #1B4F8A' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Daily log
          </button>
          <button
            onClick={() => setActiveSubTab('monthly')}
            style={{
              background: 'none',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              color: activeSubTab === 'monthly' ? '#1B4F8A' : '#8a94a6',
              paddingBottom: '8px',
              borderBottom: activeSubTab === 'monthly' ? '3px solid #1B4F8A' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Monthly
          </button>
        </div>

        {/* ─── TAB CONTENT 1: DAILY LOG ────────────────────────────────────── */}
        {activeSubTab === 'daily' && (
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '13px' }}>
                Today's activities
              </h5>
              
              {/* Button to log custom activity */}
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setShowAddActivityModal(true)}
                style={{
                  fontSize: '11px',
                  borderRadius: '8px',
                  borderColor: '#1B4F8A',
                  color: '#1B4F8A',
                  fontWeight: '600'
                }}
              >
                + Log Activity
              </button>
            </div>

            <CCardBody className="p-0 pb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: '#8a94a6', fontSize: '11.5px', letterSpacing: '0.3px' }}>
                      <th className="ps-4 fw-bold">#</th>
                      <th className="fw-bold">Activity</th>
                      <th className="fw-bold">Duration</th>
                      <th className="fw-bold">Location</th>
                      <th className="fw-bold pe-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length > 0 ? (
                      activities.map((act, idx) => (
                        <tr key={act.id}>
                          <td className="ps-4 text-muted fw-semibold">{idx + 1}</td>
                          <td className="fw-bold text-dark">{act.activity}</td>
                          <td>{act.duration}</td>
                          <td style={{ color: '#1B4F8A', fontWeight: '500' }}>{act.location ? `📍 ${act.location}` : '—'}</td>
                          <td className="pe-4 text-muted">{act.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted" style={{ fontSize: '13.5px' }}>
                          No activities logged today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* ─── TAB CONTENT 2: MONTHLY HISTORY ──────────────────────────────── */}
        {activeSubTab === 'monthly' && (
          <CCard className="border-0 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <div className="card-header bg-white py-3 border-bottom-0">
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '13px' }}>
                Monthly summary
              </h5>
            </div>
            <CCardBody className="p-0 pb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr style={{ color: '#8a94a6', fontSize: '11px', letterSpacing: '0.3px' }}>
                      <th className="ps-4 fw-bold">Date</th>
                      <th className="fw-bold">Login</th>
                      <th className="fw-bold">Logout</th>
                      <th className="fw-bold">Total</th>
                      <th className="fw-bold">Working</th>
                      <th className="fw-bold">Idle</th>
                      <th className="fw-bold pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyHistory.map((hist, idx) => (
                      <tr key={idx}>
                        <td className="ps-4 text-dark fw-bold">{hist.date}</td>
                        <td>{hist.login || '—'}</td>
                        <td>{hist.logout || '—'}</td>
                        <td className="fw-semibold">{hist.total || '—'}</td>
                        <td className="text-success fw-semibold">{hist.working || '—'}</td>
                        <td className="text-warning fw-semibold">{hist.idle || '—'}</td>
                        <td className="pe-4">
                          <button
                            onClick={() => handleViewDetails(hist.date)}
                            className="btn btn-link btn-sm p-0 fw-bold"
                            style={{ color: '#1B4F8A', textDecoration: 'none', fontSize: '11.5px' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CCardBody>
          </CCard>
        )}

      </CContainer>

      {/* ─── MODAL: ADD CUSTOM ACTIVITY ───────────────────────────────────── */}
      <CModal visible={showAddActivityModal} onClose={() => setShowAddActivityModal(false)}>
        <CModalHeader style={{ backgroundColor: '#1B4F8A' }}>
          <CModalTitle className="text-white fw-bold">Log Clinical Activity</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex flex-column gap-3">
            <div>
              <CFormLabel className="fw-semibold small">Activity Title</CFormLabel>
              <CFormInput 
                type="text" 
                placeholder="e.g. Completed physical therapy session for Patient Prashanth" 
                value={newActivity} 
                onChange={(e) => setNewActivity(e.target.value)} 
              />
            </div>

            <div className="row g-2">
              <div className="col-6">
                <CFormLabel className="fw-semibold small">Duration</CFormLabel>
                <CFormInput 
                  type="text" 
                  placeholder="e.g. 45 mins" 
                  value={newDuration} 
                  onChange={(e) => setNewDuration(e.target.value)} 
                />
              </div>
              <div className="col-6">
                <CFormLabel className="fw-semibold small">Cabin / Location</CFormLabel>
                <CFormInput 
                  type="text" 
                  placeholder="e.g. Cabin 2" 
                  value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <button className="btn btn-light btn-sm" onClick={() => setShowAddActivityModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#1B4F8A', borderColor: '#1B4F8A' }} onClick={handleAddActivity}>Log Activity</button>
        </CModalFooter>
      </CModal>

      {/* ─── MODAL: VIEW DAILY LOG DETAILS ─────────────────────────────────── */}
      <CModal visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="lg">
        <CModalHeader style={{ backgroundColor: '#1B4F8A' }}>
          <CModalTitle className="text-white fw-bold">Daily Log Details - {selectedHistoryDate}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ color: '#8a94a6', fontSize: '11.5px', letterSpacing: '0.3px' }}>
                  <th className="ps-4 fw-bold">#</th>
                  <th className="fw-bold">Activity</th>
                  <th className="fw-bold">Duration</th>
                  <th className="fw-bold">Location</th>
                  <th className="fw-bold pe-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {selectedDateActivities.length > 0 ? (
                  selectedDateActivities.map((act, idx) => (
                    <tr key={act.id}>
                      <td className="ps-4 text-muted fw-semibold">{idx + 1}</td>
                      <td className="fw-bold text-dark">{act.activity}</td>
                      <td>{act.duration}</td>
                      <td style={{ color: '#1B4F8A', fontWeight: '500' }}>{act.location ? `📍 ${act.location}` : '—'}</td>
                      <td className="pe-4 text-muted">{act.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted" style={{ fontSize: '13.5px' }}>
                      No activities logged on this day.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CModalBody>
        <CModalFooter>
          <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#1B4F8A', borderColor: '#1B4F8A' }} onClick={() => setShowDetailsModal(false)}>Close</button>
        </CModalFooter>
      </CModal>

    </div>
  );
};

export default AttendanceTracker;
