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
import axios from 'axios';
import { ipUrl } from '../../Auth/BaseUrl';

const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => (
  <div
    className={`skeleton-loader ${className}`}
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: '#e2e8f0',
      display: 'inline-block',
      verticalAlign: 'middle'
    }}
  />
);

const AttendanceTracker = () => {
  const navigate = useNavigate();

  // State for Personal Attendance
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginTime, setLoginTime] = useState('—');
  const [logoutTime, setLogoutTime] = useState('—');
  const [status, setStatus] = useState('—');
  const [activeSubTab, setActiveSubTab] = useState('daily'); // 'daily' or 'monthly'
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Activities Roster State
  const [activities, setActivities] = useState([]);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newDuration, setNewDuration] = useState('30 mins');
  const [newLocation, setNewLocation] = useState('Therapy Room A');
  const [newDescription, setNewDescription] = useState('');
  const [durationHrs, setDurationHrs] = useState(0);
  const [durationMins, setDurationMins] = useState(0);
  const [currentLocationText, setCurrentLocationText] = useState('Location unavailable');
  const [currentLat, setCurrentLat] = useState("");
  const [currentLon, setCurrentLon] = useState("");
  const [activityErrors, setActivityErrors] = useState({});

  // Geolocation for Add Activity Modal
  useEffect(() => {
    if (showAddActivityModal) {
      setCurrentLocationText('Fetching location...');
      if (window.isSecureContext && navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLat(latitude.toString());
              setCurrentLon(longitude.toString());
              try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (res.data && res.data.display_name) {
                  // Format the display name to be shorter if needed, or use the full address
                  const address = res.data.display_name;
                  setCurrentLocationText(address);
                  setNewLocation(address);
                } else {
                  const locText = `Kinetix Wellness Care (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                  setCurrentLocationText(locText);
                  setNewLocation(locText);
                }
              } catch (geoErr) {
                const locText = `Kinetix Wellness Care (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                setCurrentLocationText(locText);
                setNewLocation(locText);
              }
            },
            (error) => {
              console.error('Error fetching location:', error);
              setCurrentLocationText('Location unavailable');
              setNewLocation('Location unavailable');
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } catch (err) {
          console.error('Geolocation failed:', err);
          setCurrentLocationText('Location unavailable');
          setNewLocation('Location unavailable');
        }
      } else {
        setCurrentLocationText('Location unavailable');
        setNewLocation('Location unavailable');
      }
    }
  }, [showAddActivityModal]);

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

  const fetchDailyData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId = localStorage.getItem('doctorId') || '0001';
      const apiUrl = `${ipUrl}/clinic-admin/getUserDailyAttendence/${userId}/${todayStr}`;

      const res = await axios.get(apiUrl);
      if (res.data && res.data.success && res.data.data) {
        const dailyData = res.data.data;
        setActivities(dailyData.activities || dailyData.sessions || []);

        const parseTime = (val) => {
          if (!val) return '—';
          if (typeof val === 'string' && (val.trim() === '' || val.trim().toLowerCase() === 'null' || val === '—' || val === '-')) return '—';
          return val;
        };

        const fetchedLoginTime = parseTime(dailyData.inTime || dailyData.loginTime || dailyData.login?.time);
        let fetchedLogoutTime = parseTime(dailyData.outTime || dailyData.logoutTime || dailyData.logout?.time || dailyData.logoutTime);

        // If they clocked in AGAIN after clocking out, the backend still returns the old outTime.
        // We must ignore the old outTime so they are properly marked as logged in.
        if (fetchedLoginTime !== '—' && fetchedLogoutTime !== '—') {
          if (fetchedLoginTime > fetchedLogoutTime) {
            fetchedLogoutTime = '—';
          }
        }

        setLoginTime(fetchedLoginTime);
        setLogoutTime(fetchedLogoutTime);

        if (fetchedLoginTime !== '—') {
          // If there's a login time and no logout time (or logout is '—'), they are logged in
          const currentlyLoggedIn = fetchedLogoutTime === '—';
          setIsLoggedIn(currentlyLoggedIn);
          setStatus(dailyData.status || (currentlyLoggedIn ? 'Active' : 'Present'));
        } else {
          setIsLoggedIn(false);
          setStatus('—');
        }
      } else {
        // Fallback to localStorage if no remote database record yet
        const storedState = localStorage.getItem(`doctor_duty_log_${todayStr}`);
        if (storedState) {
          const parsed = JSON.parse(storedState);
          setIsLoggedIn(parsed.isLoggedIn);
          setLoginTime(parsed.loginTime);
          setLogoutTime(parsed.logoutTime);
          setStatus(parsed.status);
          setActivities(parsed.activities || []);
        } else {
          setActivities([]);
          setLoginTime('—');
          setLogoutTime('—');
          setIsLoggedIn(false);
          setStatus('—');
        }
      }
    } catch (err) {
      console.error('Error fetching daily attendance:', err);
      // Fallback
      const todayStr = new Date().toISOString().split('T')[0];
      const storedState = localStorage.getItem(`doctor_duty_log_${todayStr}`);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        setIsLoggedIn(parsed.isLoggedIn);
        setLoginTime(parsed.loginTime);
        setLogoutTime(parsed.logoutTime);
        setStatus(parsed.status);
        setActivities(parsed.activities || []);
      }
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7); // yyyy-MM
      const userId = localStorage.getItem('doctorId') || '0001';
      const apiUrl = `${ipUrl}/clinic-admin/getUserMonthlyAttendence/${userId}/${monthStr}`;

      const res = await axios.get(apiUrl);
      if (res.data && res.data.success && res.data.data) {
        const historyList = res.data.data.map(item => ({
          date: item.date || item.createdDate || item.attendenceDate || '—',
          login: item.inTime || item.login?.time || '—',
          logout: item.outTime || item.logout?.time || '—',
          total: item.logTime || item.totalTime || '—',
          working: item.workingHours || item.workingTime || '—',
          idle: item.idleTime || '—'
        }));
        setMonthlyHistory(historyList);
        localStorage.setItem('doctor_monthly_attendance', JSON.stringify(historyList));
      } else {
        // Fallback
        const storedHistory = localStorage.getItem('doctor_monthly_attendance');
        if (storedHistory) {
          setMonthlyHistory(JSON.parse(storedHistory));
        }
      }
    } catch (err) {
      console.error('Error fetching monthly attendance:', err);
      // Fallback
      const storedHistory = localStorage.getItem('doctor_monthly_attendance');
      if (storedHistory) {
        setMonthlyHistory(JSON.parse(storedHistory));
      }
    }
  };

  // Load state on mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDailyData(), fetchMonthlyData()]);
      setIsLoading(false);
    };

    initializeData();

    // Load actual data instead of seeding mock data
    const storedHistory = localStorage.getItem('doctor_monthly_attendance');
    if (storedHistory) {
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
  const handleToggleLogin = async () => {
    const format24h = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes}`;
    };

    const nowStr = format24h(new Date());
    const todayStr = new Date().toISOString().split('T')[0];
    const userId = localStorage.getItem('doctorId');

    const getCurrentLocationCoords = () => {
      return new Promise((resolve) => {
        if (window.isSecureContext && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude.toString(),
                lon: position.coords.longitude.toString()
              });
            },
            () => resolve({ lat: "", lon: "" }),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          resolve({ lat: "", lon: "" });
        }
      });
    };

    if (!isLoggedIn) {
      // Clock In (Login)
      try {
        const getStorageVal = (keys, defaultVal) => {
          for (let k of keys) {
            const val = localStorage.getItem(k);
            if (val && val !== 'null' && val !== 'undefined') return val;
          }
          return defaultVal;
        };

        let branchId = getStorageVal(['branchId', 'BranchId'], '');
        if (!branchId) {
          const ddStr = localStorage.getItem('doctorDetails');
          if (ddStr) {
            try {
              const dd = JSON.parse(ddStr);
              branchId = dd.branchId || (dd.branches && dd.branches[0] ? dd.branches[0].branchId : '');
            } catch (e) { }
          }
        }
        if (!branchId) branchId = 'B001';

        const role = getStorageVal(['role', 'Role'], 'DOCTOR');
        const clinicId = getStorageVal(['hospitalId', 'HospitalId', 'clinicId'], 'C001');
        const safeUserId = getStorageVal(['doctorId', 'DoctorId', 'userId'], userId || '0001');

        const coords = await getCurrentLocationCoords();
        const payload = {
          date: todayStr,
          userId: safeUserId,
          role,
          clinicId,
          branchId,
          login: {
            time: nowStr,
            latitude: coords.lat,
            longitude: coords.lon
          },
          time: nowStr,
          latitude: coords.lat,
          longitude: coords.lon
        };

        const res = await axios.post(`${ipUrl}/clinic-admin/saveUserAttendence`, payload);

        setIsLoggedIn(true);
        setLoginTime(nowStr);
        setLogoutTime('—');
        setStatus('Active');
        saveState(true, nowStr, '—', 'Active', activities);
      } catch (err) {
        console.error('Failed to log in on server:', err);
        // Local fallback
        setIsLoggedIn(true);
        setLoginTime(nowStr);
        setLogoutTime('—');
        setStatus('Active');
        saveState(true, nowStr, '—', 'Active', activities);
      }
    } else {
      setShowLogoutModal(true);
    }
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);

    const format24h = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes}`;
    };

    const nowStr = format24h(new Date());
    const todayStr = new Date().toISOString().split('T')[0];
    const userId = localStorage.getItem('doctorId') || '0001';

    const getCurrentLocationCoords = () => {
      return new Promise((resolve) => {
        if (window.isSecureContext && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude.toString(),
                lon: position.coords.longitude.toString()
              });
            },
            () => resolve({ lat: "", lon: "" }),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          resolve({ lat: "", lon: "" });
        }
      });
    };

    try {
      const coords = await getCurrentLocationCoords();
      const payload = {
        userId,
        date: todayStr,
        logoutTime: nowStr,
        logoutLatitude: coords.lat,
        logoutLongitude: coords.lon
      };
      const res = await axios.put(`${ipUrl}/clinic-admin/updateUserAttendence`, payload);

      setIsLoggedIn(false);
      setLogoutTime(nowStr);
      setStatus('Present');
      saveState(false, loginTime, nowStr, 'Present', activities);
    } catch (err) {
      console.error('Failed to log out on server:', err);
      // Local fallback
      setIsLoggedIn(false);
      setLogoutTime(nowStr);
      setStatus('Present');
      saveState(false, loginTime, nowStr, 'Present', activities);
    }
  };

  // Add Custom Roster Activity
  const handleAddActivity = async () => {
    const newErrors = {};
    if (!newActivity || !newActivity.trim()) {
      newErrors.activity = "Please select an activity.";
    }

    const requiresDescription = ["Other Activity", "Paid Leave", "Loss of Pay"].includes(newActivity);
    if (requiresDescription && (!newDescription || !newDescription.trim())) {
      newErrors.description = "Description is mandatory for this activity.";
    }

    if (durationHrs === 0 && durationMins === 0) {
      newErrors.duration = "Please specify a duration greater than 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setActivityErrors(newErrors);
      return;
    }
    setActivityErrors({});

    const todayStr = new Date().toISOString().split('T')[0];
    const durationStr = `${durationHrs}h ${durationMins}m`;
    const userId = localStorage.getItem('doctorId') || '0001';
    const clinicId = localStorage.getItem('hospitalId') || 'C001';
    const branchId = localStorage.getItem('branchId') || 'B001';
    const role = localStorage.getItem('role') || 'DOCTOR';

    try {
      const payload = {
        userId,
        role,
        clinicId,
        branchId,
        date: todayStr,
        activities: [
          {
            activity: newActivity,
            description: newDescription,
            duration: durationStr,
            location: newLocation || 'Location unavailable',
            latitude: currentLat,
            longitude: currentLon
          }
        ]
      };
      const res = await axios.post(`${ipUrl}/clinic-admin/saveUserAttendence`, payload);
      if (res.data && res.data.success) {
        // Reset fields
        setNewActivity('');
        setNewDescription('');
        setDurationHrs(0);
        setDurationMins(0);
        setActivityErrors({});
        setShowAddActivityModal(false);
        fetchDailyData();
        fetchMonthlyData();
      } else {
        // Local fallback
        const newEntry = {
          id: activities.length + 1,
          activity: newActivity,
          duration: durationStr,
          location: newLocation,
          date: todayStr,
          description: newDescription
        };
        const updated = [...activities, newEntry];
        setActivities(updated);
        saveState(isLoggedIn, loginTime, logoutTime, status, updated);

        // Update local monthly history working & idle time
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

        setNewActivity('');
        setNewDescription('');
        setDurationHrs(0);
        setDurationMins(0);
        setActivityErrors({});
        setShowAddActivityModal(false);
      }
    } catch (err) {
      console.error('Failed to save activity to server:', err);
      // Local fallback
      const newEntry = {
        id: activities.length + 1,
        activity: newActivity,
        duration: durationStr,
        location: newLocation,
        date: todayStr,
        description: newDescription
      };
      const updated = [...activities, newEntry];
      setActivities(updated);
      saveState(isLoggedIn, loginTime, logoutTime, status, updated);

      // Update local monthly history working & idle time
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

      setNewActivity('');
      setNewDescription('');
      setDurationHrs(0);
      setDurationMins(0);
      setActivityErrors({});
      setShowAddActivityModal(false);
    }
  };

  // View historical daily log activities details
  const handleViewDetails = async (dateStr) => {
    setSelectedHistoryDate(dateStr);
    setShowDetailsModal(true);
    setSelectedDateActivities([]);

    try {
      const userId = localStorage.getItem('doctorId') || '0001';
      const apiUrl = `${ipUrl}/clinic-admin/getUserDailyAttendence/${userId}/${dateStr}`;

      const res = await axios.get(apiUrl);
      if (res.data && res.data.success && res.data.data) {
        setSelectedDateActivities(res.data.data.activities || res.data.data.sessions || []);
      } else {
        // Fallback
        const storedState = localStorage.getItem(`doctor_duty_log_${dateStr}`);
        if (storedState) {
          const parsed = JSON.parse(storedState);
          setSelectedDateActivities(parsed.activities || []);
        }
      }
    } catch (err) {
      console.error('Error fetching historical daily details:', err);
      // Fallback
      const storedState = localStorage.getItem(`doctor_duty_log_${dateStr}`);
      if (storedState) setSelectedDateActivities(JSON.parse(storedState).activities || []);
    }
  };

  return (
    <div style={{ backgroundColor: '#fafbfe', minHeight: '100vh', paddingBottom: '40px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-loader {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #f1f5f9 4%, #e2e8f0 25%, #f1f5f9 36%);
          background-size: 1000px 100%;
        }
      `}</style>

      <CContainer fluid className="px-5 pt-4">
        {/* ─── LOG HEADER BLOCK ─────────────────────────────────────────────── */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#eef2f6', color: '#1B4F8A', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              <span style={{ marginRight: '6px', fontSize: '14px' }}>📅</span> {getFormattedDate()}
            </div>
            <h2 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '18px', margin: '0 0 4px' }}>
              Daily Duty Log
            </h2>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
              Track your work hours and activities
            </div>
          </div>

          <button
            onClick={handleToggleLogin}
            disabled={logoutTime !== '—'}
            style={{
              backgroundColor: logoutTime !== '—' ? '#f3f4f6' : (isLoggedIn ? '#ef4444' : '#10b981'),
              color: logoutTime !== '—' ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '24px',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: logoutTime !== '—' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: logoutTime !== '—' ? 'none' : (isLoggedIn ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)'),
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'inline-block'
              }}
            />
            {logoutTime !== '—' ? 'Logged Out' : (isLoggedIn ? 'Clock Out' : 'Clock In')}
          </button>
        </div>

        {/* ─── FOUR METRIC CARDS ROW ────────────────────────────────────────── */}
        <div className="d-flex flex-wrap mb-5" style={{ gap: '56px' }}>
          {/* Card 1: LOGIN */}
          <CCard className="border-0" style={{ width: '180px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CCardBody className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <div style={{ color: '#8a94a6', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Login</div>
                <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '13px', margin: 0 }}>
                  {isLoading ? <Skeleton width="50px" height="15px" /> : loginTime}
                </h4>
              </div>
              <div style={{ color: '#d88665', fontSize: '18px', fontWeight: '700' }}>🚪➜</div>
            </CCardBody>
          </CCard>

          {/* Card 2: LOGOUT */}
          <CCard className="border-0" style={{ width: '180px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CCardBody className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <div style={{ color: '#8a94a6', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Logout</div>
                <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '13px', margin: 0 }}>
                  {isLoading ? <Skeleton width="50px" height="15px" /> : logoutTime}
                </h4>
              </div>
              <div style={{ color: '#d88665', fontSize: '18px', fontWeight: '700' }}>🚪⬅</div>
            </CCardBody>
          </CCard>

          {/* Card 3: ACTIVITIES */}
          <CCard className="border-0" style={{ width: '150px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CCardBody className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <div style={{ color: '#8a94a6', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Activities</div>
                <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '13px', margin: 0 }}>
                  {isLoading ? <Skeleton width="30px" height="15px" /> : activities.length}
                </h4>
              </div>
              <div style={{ fontSize: '18px' }}>📈</div>
            </CCardBody>
          </CCard>

          {/* Card 4: STATUS */}
          <CCard className="border-0" style={{ width: '160px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CCardBody className="p-3 d-flex justify-content-between align-items-center">
              <div>
                <div style={{ color: '#8a94a6', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Status</div>
                <h4 style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '13px', margin: 0 }}>
                  {isLoading ? <Skeleton width="50px" height="15px" /> : status}
                </h4>
              </div>
              <div style={{ fontSize: '18px' }}>🛡️</div>
            </CCardBody>
          </CCard>
        </div>

        {/* ─── SUB TABS NAVIGATION ─────────────────────────────────────────── */}
        <div className="mb-4">
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveSubTab('daily')}
              style={{
                background: activeSubTab === 'daily' ? '#ffffff' : 'transparent',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                color: activeSubTab === 'daily' ? '#1e293b' : '#64748b',
                padding: '8px 20px',
                borderRadius: '6px',
                boxShadow: activeSubTab === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Daily Log
            </button>
            <button
              onClick={() => setActiveSubTab('monthly')}
              style={{
                background: activeSubTab === 'monthly' ? '#ffffff' : 'transparent',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                color: activeSubTab === 'monthly' ? '#1e293b' : '#64748b',
                padding: '8px 20px',
                borderRadius: '6px',
                boxShadow: activeSubTab === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* ─── TAB CONTENT 1: DAILY LOG ────────────────────────────────────── */}
        {activeSubTab === 'daily' && (
          <CCard className="border-0" style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
            <div className="card-header bg-white py-4 px-4 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: '15px', color: '#1B4F8A' }}>
                  Today's Activities
                </h5>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {activities.length} activities logged
                </div>
              </div>

              <button
                onClick={() => setShowAddActivityModal(true)}
                disabled={!isLoggedIn}
                style={{
                  backgroundColor: !isLoggedIn ? '#e2e8f0' : '#1e3a8a',
                  color: !isLoggedIn ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '8px 16px',
                  cursor: !isLoggedIn ? 'not-allowed' : 'pointer',
                }}
              >
                + Add Activity
              </button>
            </div>

            <CCardBody className="p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr style={{ color: '#94a3b8', fontSize: '11px', letterSpacing: '0.5px' }}>
                      <th className="ps-4 py-3 fw-bold border-bottom-0 text-uppercase">#</th>
                      <th className="py-3 fw-bold border-bottom-0 text-uppercase">Activity</th>
                      <th className="py-3 fw-bold border-bottom-0 text-uppercase">Duration</th>
                      <th className="py-3 fw-bold border-bottom-0 text-uppercase">Location</th>
                      <th className="pe-4 py-3 fw-bold border-bottom-0 text-uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="ps-4 py-3"><Skeleton width="20px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="120px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="60px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="80px" height="15px" /></td>
                          <td className="pe-4 py-3"><Skeleton width="150px" height="15px" /></td>
                        </tr>
                      ))
                    ) : activities.length > 0 ? (
                      activities.map((act, idx) => (
                        <tr key={act.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="ps-4 text-muted fw-semibold py-3">{idx + 1}</td>
                          <td className="text-dark py-3 fw-bold">{act.activity}</td>
                          <td className="text-muted py-3">{act.duration}</td>
                          <td className="text-muted py-3">{act.location ? act.location : '—'}</td>
                          <td className="pe-4 text-muted py-3">{act.description ? act.description : '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center" style={{ padding: '80px 0' }}>
                          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📭</div>
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                            No activities logged today. Start by adding one.
                          </div>
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
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td className="ps-4 py-3"><Skeleton width="80px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="40px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="40px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="50px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="50px" height="15px" /></td>
                          <td className="py-3"><Skeleton width="50px" height="15px" /></td>
                          <td className="pe-4 py-3"><Skeleton width="30px" height="15px" /></td>
                        </tr>
                      ))
                    ) : (
                      monthlyHistory.map((hist, idx) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CCardBody>
          </CCard>
        )}

      </CContainer>

      {/* ─── MODAL: ADD CUSTOM ACTIVITY ───────────────────────────────────── */}
      <CModal visible={showAddActivityModal} onClose={() => { setShowAddActivityModal(false); setActivityErrors({}); }} alignment="center">
        <CModalHeader style={{ borderBottom: 'none', padding: '24px 24px 8px' }}>
          <CModalTitle style={{ color: '#1B4F8A', fontWeight: '800', fontSize: '20px' }}>Add Activity</CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: '8px 24px 24px' }}>
          <div className="d-flex flex-column gap-3">
            <div>
              <CFormLabel className="fw-bold small" style={{ color: '#1B4F8A', fontSize: '13px' }}>Activity Name <span className="text-danger">*</span></CFormLabel>
              <select
                className={`form-select ${activityErrors.activity ? 'is-invalid' : ''}`}
                value={newActivity}
                onChange={(e) => {
                  setNewActivity(e.target.value);
                  if (activityErrors.activity) setActivityErrors({ ...activityErrors, activity: null });
                }}
                style={{ borderRadius: '8px', border: activityErrors.activity ? '1px solid #dc3545' : '1px solid #ced4da', padding: '10px 12px', fontSize: '14px', color: newActivity ? '#212529' : '#6c757d' }}
              >
                <option value="">Select Activity</option>
                <option value="Followup Calls">Followup Calls</option>
                <option value="Consulations">Consulations</option>
                <option value="Other Activity">Other Activity</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Loss of Pay">Loss of Pay</option>
              </select>
              {activityErrors.activity && <div className="text-danger small mt-1">{activityErrors.activity}</div>}
            </div>

            <div>
              <CFormLabel className="fw-bold small" style={{ color: '#1B4F8A', fontSize: '13px' }}>
                Description {["Other Activity", "Paid Leave", "Loss of Pay"].includes(newActivity) ? <span className="text-danger">*</span> : <span className="text-muted fw-normal">(Optional)</span>}
              </CFormLabel>
              <textarea
                className={`form-control ${activityErrors.description ? 'is-invalid' : ''}`}
                rows={3}
                placeholder={["Other Activity", "Paid Leave", "Loss of Pay"].includes(newActivity) ? "Enter Description (Mandatory)" : "Enter Description (Optional)"}
                value={newDescription}
                onChange={(e) => {
                  setNewDescription(e.target.value);
                  if (activityErrors.description) setActivityErrors({ ...activityErrors, description: null });
                }}
                style={{ borderRadius: '8px', border: activityErrors.description ? '1px solid #dc3545' : '1px solid #ced4da', padding: '10px 12px', fontSize: '14px' }}
              />
              {activityErrors.description && <div className="text-danger small mt-1">{activityErrors.description}</div>}
            </div>

            <div>
              <CFormLabel className="fw-bold small" style={{ color: '#1B4F8A', fontSize: '13px' }}>Duration <span className="text-danger">*</span></CFormLabel>
              <div className="d-flex align-items-center justify-content-center gap-3 p-3 rounded" style={{ backgroundColor: '#F8FBFF', border: activityErrors.duration ? '1px solid #dc3545' : '1px solid #EBF3FC' }}>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="form-control text-center fw-bold"
                    value={durationHrs}
                    onChange={(e) => {
                      setDurationHrs(Math.max(0, parseInt(e.target.value) || 0));
                      if (activityErrors.duration) setActivityErrors({ ...activityErrors, duration: null });
                    }}
                    style={{ width: '70px', borderRadius: '8px', border: '1px solid #ced4da', padding: '8px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#1B4F8A', fontWeight: '600' }}>Hrs</span>
                </div>
                <span className="fw-bold" style={{ color: '#1B4F8A' }}>:</span>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="form-control text-center fw-bold"
                    value={durationMins}
                    onChange={(e) => {
                      setDurationMins(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)));
                      if (activityErrors.duration) setActivityErrors({ ...activityErrors, duration: null });
                    }}
                    style={{ width: '70px', borderRadius: '8px', border: '1px solid #ced4da', padding: '8px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#1B4F8A', fontWeight: '600' }}>Min</span>
                </div>
              </div>
              {activityErrors.duration && <div className="text-danger small mt-1">{activityErrors.duration}</div>}
            </div>

            {/* Styled Info Section */}
            <div className="p-3 rounded" style={{ backgroundColor: '#EBF5FF', border: '1px solid #D6E9FF', fontSize: '12.5px' }}>
              <div className="d-flex justify-content-between fw-bold" style={{ color: '#1B4F8A' }}>
                <span>Date: {new Date().toISOString().split('T')[0]}</span>
                <span>Duration: {durationHrs}h {durationMins}m</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#D6E9FF', margin: '8px 0' }} />
              <div>
                <div className="fw-bold" style={{ color: '#1B4F8A', marginBottom: '2px' }}>Location:</div>
                <div style={{ color: '#2C5E9E', fontWeight: '500' }}>{currentLocationText}</div>
              </div>
            </div>
          </div>
        </CModalBody>
        <CModalFooter style={{ borderTop: 'none', padding: '16px 24px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="btn"
            onClick={() => { setShowAddActivityModal(false); setActivityErrors({}); }}
            style={{ backgroundColor: '#6C757D', color: '#FFFFFF', borderRadius: '8px', padding: '8px 20px', fontWeight: '600', border: 'none', fontSize: '13.5px' }}
          >
            Cancel
          </button>
          <button
            className="btn"
            onClick={handleAddActivity}
            style={{ backgroundColor: '#1B4F8A', color: '#FFFFFF', borderRadius: '8px', padding: '8px 24px', fontWeight: '600', border: 'none', fontSize: '13.5px' }}
          >
            Save Activity
          </button>
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
                  {/* <th className="fw-bold pe-4">Date</th> */}
                </tr>
              </thead>
              <tbody>
                {selectedDateActivities.length > 0 ? (
                  selectedDateActivities.map((act, idx) => (
                    <tr key={act.id}>
                      <td className="ps-4 text-muted fw-semibold">{idx + 1}</td>
                      <td className="text-dark">
                        <div className="fw-bold">{act.activity}</div>
                        {act.description && <div className="text-muted small fw-normal" style={{ fontSize: '11px', marginTop: '2px' }}>{act.description}</div>}
                      </td>
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

      {/* LOGOUT CONFIRMATION MODAL */}
      <CModal visible={showLogoutModal} onClose={() => setShowLogoutModal(false)} alignment="center">
        <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <CModalTitle style={{ fontSize: '18px', fontWeight: '500', color: '#1B4F8A' }}>
            Logout Confirmation
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: '24px', color: '#1e293b', fontSize: '15px' }}>
          Are you sure you want to logout and end your session for today?
        </CModalBody>
        <CModalFooter style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', gap: '8px' }}>
          <button
            onClick={() => setShowLogoutModal(false)}
            style={{
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={confirmLogout}
            style={{
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Yes, Logout
          </button>
        </CModalFooter>
      </CModal>

    </div>
  );
};

export default AttendanceTracker;
