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

/* ─── Injected global styles ─────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  :root {
    --navy: #0F2D56;
    --blue: #1B4F8A;
    --blue-mid: #2563B0;
    --blue-light: #EBF3FF;
    --blue-pale: #F4F8FF;
    --accent: #3B82F6;
    --accent-glow: rgba(59,130,246,0.18);
    --green: #10B981;
    --green-bg: #ECFDF5;
    --red: #EF4444;
    --red-bg: #FEF2F2;
    --amber: #F59E0B;
    --amber-bg: #FFFBEB;
    --text-primary: #0F172A;
    --text-secondary: #475569;
    --text-muted: #94A3B8;
    --border: #E2E8F0;
    --surface: #FFFFFF;
    --bg: #F1F5FB;
    --shadow-sm: 0 1px 3px rgba(15,45,86,0.08), 0 1px 2px rgba(15,45,86,0.04);
    --shadow-md: 0 4px 16px rgba(15,45,86,0.10), 0 2px 6px rgba(15,45,86,0.06);
    --shadow-lg: 0 12px 40px rgba(15,45,86,0.14), 0 4px 16px rgba(15,45,86,0.08);
    --radius: 14px;
    --radius-sm: 8px;
    --radius-xs: 6px;
  }

  .at-wrap * {   box-sizing: border-box; }

  /* Header */
  .at-header {
    background: linear-gradient(135deg, #0F2D56 0%, #1B4F8A 60%, #2563B0 100%);
    padding: 0 32px;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 2px 16px rgba(15,45,86,0.22);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .at-header-back {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.18);
    color: #fff;
    border-radius: 8px;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.18s;
  }
  .at-header-back:hover { background: rgba(255,255,255,0.22); }
  .at-header-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.22); }
  .at-header-label { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
  .at-header-title { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: 0.1px; }
 
  /* Page body */
  .at-body { background: var(--bg); min-height: calc(100vh - 60px); padding: 32px 0 60px; }

  /* Hero date row */
  .at-hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
  .at-hero-date-tag { display: inline-flex; align-items: center; gap: 6px; background: var(--blue-light); border: 1px solid rgba(59,130,246,0.22); border-radius: 20px; padding: 4px 12px; font-size: 11.5px; font-weight: 700; color: var(--blue-mid); margin-bottom: 8px; }
  .at-hero-title { font-size: 28px; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; margin: 0 0 2px; }
  .at-hero-subtitle { font-size: 13.5px; color: var(--text-secondary); font-weight: 500; margin: 0; }

  /* Clock-in button */
  .at-toggle-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 10px 22px;
    border-radius: 40px;
    font-size: 13.5px; font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s cubic-bezier(.4,0,.2,1);
    white-space: nowrap;
    position: relative; overflow: hidden;
  }
  .at-toggle-btn.login {
    background: linear-gradient(135deg, #10B981, #059669);
    color: #fff;
    box-shadow: 0 4px 14px rgba(16,185,129,0.38);
  }
  .at-toggle-btn.login:hover { box-shadow: 0 6px 20px rgba(16,185,129,0.5); transform: translateY(-1px); }
  .at-toggle-btn.logout {
    background: linear-gradient(135deg, #EF4444, #DC2626);
    color: #fff;
    box-shadow: 0 4px 14px rgba(239,68,68,0.38);
  }
  .at-toggle-btn.logout:hover { box-shadow: 0 6px 20px rgba(239,68,68,0.5); transform: translateY(-1px); }
  .at-toggle-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.85); animation: at-pulse 1.8s ease-in-out infinite; }
  @keyframes at-pulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(1.35); } }

  /* Metric cards */
  .at-metric-card {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    padding: 20px 20px 18px;
    border: 1px solid var(--border);
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .at-metric-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .at-metric-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--blue), var(--accent));
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .at-metric-label { font-size: 10.5px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 8px; }
  .at-metric-value { font-size: 22px; font-weight: 800; color: var(--navy);  line-height: 1; }
  .at-metric-value.small { font-size: 16px; }
  .at-metric-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 22px; opacity: 0.12; }

  /* Status badge */
  .at-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
  }
  .at-status-badge.active { background: var(--green-bg); color: var(--green); }
  .at-status-badge.present { background: var(--blue-light); color: var(--blue-mid); }
  .at-status-badge.default { background: var(--border); color: var(--text-secondary); }

  /* Tabs */
  .at-tabs { display: flex; gap: 2px; background: var(--blue-pale); border: 1px solid var(--border); border-radius: 10px; padding: 4px; width: fit-content; margin-bottom: 24px; }
  .at-tab {
    padding: 8px 22px; border-radius: 7px; border: none;
    font-size: 12.5px; font-weight: 700; cursor: pointer;
    transition: all 0.18s;
    color: var(--text-muted); background: transparent;
  }
  .at-tab.active {
    background: var(--surface);
    color: var(--navy);
    box-shadow: var(--shadow-sm);
  }

  /* Table card */
  .at-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .at-card-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 24px 14px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(to right, rgba(235,243,255,0.5), transparent);
  }
  .at-card-title { font-size: 13.5px; font-weight: 800; color: var(--navy); margin: 0; }
  .at-card-subtitle { font-size: 11.5px; color: var(--text-muted); margin: 2px 0 0; font-weight: 500; }

  /* Add button */
  .at-add-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 16px; border-radius: 8px;
    background: var(--navy); color: #fff;
    font-size: 12.5px; font-weight: 700;
    border: none; cursor: pointer;
    transition: all 0.18s;
    box-shadow: 0 2px 8px rgba(15,45,86,0.2);
  }
  .at-add-btn:hover { background: var(--blue-mid);color: #fff; box-shadow: 0 4px 14px rgba(15,45,86,0.3); transform: translateY(-1px); }

  /* Table */
  .at-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .at-table thead tr { border-bottom: 1px solid var(--border); }
  .at-table thead th {
    padding: 11px 14px; font-size: 10.5px; font-weight: 700;
    color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase;
    background: var(--blue-pale); text-align: left;
  }
  .at-table thead th:first-child { padding-left: 24px; border-radius: 0; }
  .at-table thead th:last-child { padding-right: 24px; }
  .at-table tbody tr {
    border-bottom: 1px solid rgba(226,232,240,0.6);
    transition: background 0.12s;
  }
  .at-table tbody tr:last-child { border-bottom: none; }
  .at-table tbody tr:hover { background: var(--blue-pale); }
  .at-table tbody td { padding: 14px 14px; color: var(--text-primary); vertical-align: middle; }
  .at-table tbody td:first-child { padding-left: 24px; }
  .at-table tbody td:last-child { padding-right: 24px; }

  .at-table-index {  font-size: 11.5px; font-weight: 600; color: var(--text-muted); background: var(--border); width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .at-activity-name { font-weight: 700; color: var(--navy); }
  .at-duration-chip { display: inline-flex; align-items: center; background: var(--blue-light); color: var(--blue-mid); border-radius: 6px; padding: 3px 9px; font-size: 12px; font-weight: 600;  }
  .at-location { color: var(--blue-mid); font-weight: 500; font-size: 12.5px; }
  .at-desc { color: var(--text-secondary); font-size: 12.5px; }

  /* Monthly table specifics */
  .at-date-chip {  font-size: 12px; font-weight: 600; color: var(--navy); }
  .at-time-chip { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
  .at-total-chip {  font-size: 12px; font-weight: 700; color: var(--navy); }
  .at-working-chip { font-size: 12px; font-weight: 700; color: var(--green); }
  .at-idle-chip { font-size: 12px; font-weight: 700; color: var(--amber); }
  .at-view-btn {
    background: var(--blue-light); color: var(--blue-mid);
    border: 1px solid rgba(59,130,246,0.2); border-radius: 6px;
    padding: 4px 12px; font-size: 11.5px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
  }
  .at-view-btn:hover { background: var(--blue-mid); color: #fff; }

  /* Empty state */
  .at-empty { padding: 60px 24px; text-align: center; }
  .at-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }
  .at-empty-text { font-size: 13.5px; color: var(--text-muted); font-weight: 500; }

  /* Modal overrides */
  .at-modal .modal-content { border-radius: 16px; border: none; box-shadow: var(--shadow-lg); overflow: hidden;  }
  .at-modal-header { background: linear-gradient(135deg, #0F2D56, #1B4F8A); padding: 20px 24px; border: none; }
  .at-modal-header .modal-title { color: #fff; font-weight: 800; font-size: 17px; }
  .at-modal-header .btn-close { filter: invert(1) brightness(2); opacity: 0.7; }
  .at-modal-body { padding: 24px; background: var(--bg); }
  .at-modal-footer { padding: 16px 24px; background: var(--surface); border-top: 1px solid var(--border); gap: 10px; }

  .at-field-label { font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
  .at-field-input {
    width: 100%; border-radius: 10px; border: 1.5px solid var(--border);
    padding: 10px 14px; font-size: 13.5px; color: var(--text-primary);
 
    background: var(--surface);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .at-field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .at-field-input::placeholder { color: var(--text-muted); }

  .at-duration-box {
    display: flex; align-items: center; justify-content: center; gap: 16px;
    background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px;
    padding: 14px 20px;
  }
  .at-duration-unit { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .at-duration-unit label { font-size: 10.5px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
  .at-duration-unit input {
    width: 72px; text-align: center; font-size: 22px; font-weight: 800;
  color: var(--navy);
    border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 4px;
    outline: none; background: var(--blue-pale);
    transition: border-color 0.15s;
  }
  .at-duration-unit input:focus { border-color: var(--accent); }
  .at-duration-sep { font-size: 22px; font-weight: 800; color: var(--text-muted); margin-top: -16px; }

  .at-info-box {
    background: var(--blue-pale); border: 1px solid rgba(59,130,246,0.18);
    border-radius: 10px; padding: 14px 16px;
  }
  .at-info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .at-info-key { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
  .at-info-val { font-size: 12.5px; font-weight: 600; color: var(--blue-mid); }
  .at-info-divider { height: 1px; background: rgba(59,130,246,0.12); margin: 10px 0; }

  .at-cancel-btn {
    background: transparent; color: var(--text-secondary); border: 1.5px solid var(--border);
    border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; 
  }
  .at-cancel-btn:hover { background: var(--border); color: var(--text-primary); }
  .at-save-btn {
    background: linear-gradient(135deg, var(--navy), var(--blue-mid));
    color: #fff; border: none; border-radius: 8px; padding: 9px 24px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    box-shadow: 0 3px 10px rgba(15,45,86,0.22);
    transition: all 0.15s;  
  }
  .at-save-btn:hover:not(:disabled) { box-shadow: 0 5px 18px rgba(15,45,86,0.34); transform: translateY(-1px); }
  .at-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .at-close-btn {
    background: var(--blue); color: #fff; border: none; border-radius: 8px;
    padding: 9px 22px; font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.15s;  
  }
  .at-close-btn:hover { background: var(--navy); }

  /* Scrollbar */
  .at-table-wrap::-webkit-scrollbar { height: 6px; }
  .at-table-wrap::-webkit-scrollbar-track { background: var(--bg); }
  .at-table-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
`;

const AttendanceTracker = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTime, setLoginTime] = useState('—');
  const [logoutTime, setLogoutTime] = useState('—');
  const [status, setStatus] = useState('—');
  const [activeSubTab, setActiveSubTab] = useState('daily');
  const [data, setData] = useState('');
  const [activities, setActivities] = useState([]);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newDuration, setNewDuration] = useState('30 mins');
  const [newLocation, setNewLocation] = useState('Therapy Room A');
  const [newDescription, setNewDescription] = useState('');
  const [durationHrs, setDurationHrs] = useState(0);
  const [durationMins, setDurationMins] = useState(0);
  const [currentLocationText, setCurrentLocationText] = useState('Location unavailable');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (showAddActivityModal) {
      setLocationLoading(true);
      setCurrentLocationText('Fetching location...');
      if (window.isSecureContext && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const fullAddress = response.data.display_name;
              setCurrentLocationText(fullAddress);
              setNewLocation(fullAddress);
            } catch (err) {
              console.error(err);
              setCurrentLocationText('Location unavailable');
              setNewLocation('Location unavailable');
            } finally {
              setLocationLoading(false);
            }
          },
          (error) => {
            console.error(error);
            setCurrentLocationText('Location unavailable');
            setNewLocation('Location unavailable');
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setCurrentLocationText('Location unavailable');
        setNewLocation('Location unavailable');
        setLocationLoading(false);
      }
    }
  }, [showAddActivityModal]);

  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [selectedDateActivities, setSelectedDateActivities] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getFormattedDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    return `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  };

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

  const calculateDuration = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || startTimeStr === '—' || !endTimeStr || endTimeStr === '—') return { totalStr: '', totalMins: 0, hours: 0, minutes: 0 };
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMins < 0) diffMins += 24 * 60;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return { totalStr: `${h}h ${m}m`, totalMins: diffMins, hours: h, minutes: m };
  };

  const fetchDailyData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId = localStorage.getItem('doctorId') || '0001';
      const apiUrl = `${ipUrl}/clinic-admin/getUserDailyAttendence/${userId}/${todayStr}`;
      const res = await axios.get(apiUrl);
      if (res.data && res.data.success && res.data.data) {
        const dailyData = res.data.data;
        setData(dailyData);
        setActivities(dailyData.activities || dailyData.sessions || []);
        const fetchedLoginTime = dailyData.inTime || dailyData.loginTime || dailyData.login?.time || '—';
        const fetchedLogoutTime = dailyData.outTime || dailyData.logoutTime || dailyData.logout?.time || '—';
        setLoginTime(fetchedLoginTime);
        setLogoutTime(fetchedLogoutTime);
        if (fetchedLoginTime !== '—') {
          const currentlyLoggedIn = fetchedLogoutTime === '—';
          setIsLoggedIn(currentlyLoggedIn);
          setStatus(dailyData.status || (currentlyLoggedIn ? 'Active' : 'Present'));
        } else {
          setIsLoggedIn(false);
          setStatus('—');
        }
      } else {
        const storedState = localStorage.getItem(`doctor_duty_log_${new Date().toISOString().split('T')[0]}`);
        if (storedState) {
          const parsed = JSON.parse(storedState);
          setIsLoggedIn(parsed.isLoggedIn);
          setLoginTime(parsed.loginTime);
          setLogoutTime(parsed.logoutTime);
          setStatus(parsed.status);
          setActivities(parsed.activities || []);
        } else {
          setActivities([]); setLoginTime('—'); setLogoutTime('—'); setIsLoggedIn(false); setStatus('—');
        }
      }
    } catch (err) {
      console.error('Error fetching daily attendance:', err);
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
      const monthStr = todayStr.substring(0, 7);
      const userId = localStorage.getItem('doctorId') || '0001';
      const apiUrl = `${ipUrl}/clinic-admin/getUserMonthlyAttendence/${userId}/${monthStr}`;
      const res = await axios.get(apiUrl);
      if (res.data && res.data.success && res.data.data) {
        const historyList = res.data.data.map(item => ({
          date: item.date,
          login: item.inTime || item.login?.time || '—',
          logout: item.outTime || item.logout?.time || '—',
          total: item.logTime || item.totalTime || '—',
          working: item.workingHours || item.workingTime || '—',
          idle: item.idleTime || '—'
        }));
        setMonthlyHistory(historyList);
        localStorage.setItem('doctor_monthly_attendance', JSON.stringify(historyList));
      } else {
        const storedHistory = localStorage.getItem('doctor_monthly_attendance');
        if (storedHistory) setMonthlyHistory(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error('Error fetching monthly attendance:', err);
      const storedHistory = localStorage.getItem('doctor_monthly_attendance');
      if (storedHistory) setMonthlyHistory(JSON.parse(storedHistory));
    }
  };

  useEffect(() => {
    fetchDailyData();
    fetchMonthlyData();
    // const storedHistory = localStorage.getItem('doctor_monthly_attendance');
    // if (!storedHistory) {
    //   const seedHistory = [
    //     { date: '2026-05-24', login: '20:06', logout: '20:06', total: '0h 0m', working: '0h 0m', idle: '0h 0m' },
    //     { date: '2026-05-23', login: '12:27', logout: '', total: '0h 1m', working: '0h 0m', idle: '0h 1m' },
    //     { date: '2026-05-22', login: '12:41', logout: '', total: '', working: '', idle: '' },
    //     { date: '2026-05-20', login: '10:53', logout: '', total: '', working: '', idle: '' },
    //     { date: '2026-05-14', login: '16:42', logout: '', total: '', working: '', idle: '' },
    //   ];
    //   setMonthlyHistory(seedHistory);
    //   localStorage.setItem('doctor_monthly_attendance', JSON.stringify(seedHistory));
    // }
  }, []);

  const saveState = (updatedLogin, updatedInTime, updatedOutTime, updatedStatus, updatedActivities) => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`doctor_duty_log_${todayStr}`, JSON.stringify({
      isLoggedIn: updatedLogin, loginTime: updatedInTime, logoutTime: updatedOutTime,
      status: updatedStatus, activities: updatedActivities
    }));
  };

  const handleToggleLogin = async () => {
    const format24h = (date) => {
      let h = date.getHours(), m = date.getMinutes();
      return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
    };
    const nowStr = format24h(new Date());
    const todayStr = new Date().toISOString().split('T')[0];
    const userId = localStorage.getItem('doctorId') || '0001';

    if (!isLoggedIn) {
      try {
        const payload = { userId, date: todayStr, login: { time: nowStr, latitude: "17.433071", longitude: "78.407807" } };
        const res = await axios.post(`${ipUrl}/clinic-admin/saveUserAttendence`, payload);
        if (res.data && res.data.success) {
          setIsLoggedIn(true); setLoginTime(nowStr); setLogoutTime('—'); setStatus('Active');
          fetchDailyData(); fetchMonthlyData();
        } else {
          setIsLoggedIn(true); setLoginTime(nowStr); setLogoutTime('—'); setStatus('Active');
          saveState(true, nowStr, '—', 'Active', activities);
        }
      } catch (err) {
        console.error('Failed to log in on server:', err);
        setIsLoggedIn(true); setLoginTime(nowStr); setLogoutTime('—'); setStatus('Active');
        saveState(true, nowStr, '—', 'Active', activities);
      }
    } else {
      try {
        const payload = { userId, date: todayStr, logoutTime: nowStr, logoutLatitude: "17.433071", logoutLongtitude: "78.407807" };
        const res = await axios.put(`${ipUrl}/clinic-admin/updateUserAttendence`, payload);
        if (res.data && res.data.success) {
          setIsLoggedIn(false); setLogoutTime(nowStr); setStatus('Present');
          fetchDailyData(); fetchMonthlyData();
        } else {
          setIsLoggedIn(false); setLogoutTime(nowStr); setStatus('Present');
          saveState(false, loginTime, nowStr, 'Present', activities);
        }
      } catch (err) {
        console.error('Failed to log out on server:', err);
        setIsLoggedIn(false); setLogoutTime(nowStr); setStatus('Present');
        saveState(false, loginTime, nowStr, 'Present', activities);
      }
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity || !newActivity.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const durationStr = `${durationHrs}h ${durationMins}m`;
    const userId = localStorage.getItem('doctorId') || '0001';
    const clinicId = localStorage.getItem('hospitalId') || 'C001';
    const branchId = localStorage.getItem('branchId') || 'B001';
    const role = localStorage.getItem('role') || 'DOCTOR';

    const localFallback = () => {
      const newEntry = {
        id: activities.length + 1, activity: newActivity, duration: durationStr,
        location: newLocation, date: todayStr, description: newDescription
      };
      const updated = [...activities, newEntry];
      setActivities(updated);
      saveState(isLoggedIn, loginTime, logoutTime, status, updated);
      if (!isLoggedIn && loginTime !== '—' && logoutTime !== '—') {
        const durationResult = calculateDuration(loginTime, logoutTime);
        let totalWorkMins = 0;
        updated.forEach(act => { totalWorkMins += parseDurationStr(act.duration); });
        const workH = Math.floor(totalWorkMins / 60), workM = totalWorkMins % 60;
        const idleMins = Math.max(0, durationResult.totalMins - totalWorkMins);
        const idleH = Math.floor(idleMins / 60), idleM = idleMins % 60;
        const existIndex = monthlyHistory.findIndex(h => h.date === todayStr);
        let updatedHistory = [...monthlyHistory];
        if (existIndex > -1) {
          updatedHistory[existIndex] = { ...updatedHistory[existIndex], working: `${workH}h ${workM}m`, idle: `${idleH}h ${idleM}m` };
          setMonthlyHistory(updatedHistory);
          localStorage.setItem('doctor_monthly_attendance', JSON.stringify(updatedHistory));
        }
      }
      setNewActivity(''); setNewDescription(''); setDurationHrs(0); setDurationMins(0); setShowAddActivityModal(false);
    };

    try {
      const payload = {
        userId, role, clinicId, branchId, date: todayStr,
        activities: [{ activity: newActivity, description: newDescription, duration: durationStr, location: newLocation || 'Location unavailable', latitude: "17.433071", longtitude: "78.407807" }]
      };
      const res = await axios.post(`${ipUrl}/clinic-admin/saveUserAttendence`, payload);
      if (res.data && res.data.success) {
        setNewActivity(''); setNewDescription(''); setDurationHrs(0); setDurationMins(0); setShowAddActivityModal(false);
        fetchDailyData(); fetchMonthlyData();
      } else { localFallback(); }
    } catch (err) { console.error('Failed to save activity to server:', err); localFallback(); }
  };

  const handleViewDetails = async (dateStr) => {
    setSelectedHistoryDate(dateStr);
    setShowDetailsModal(true);
    setSelectedDateActivities([]);
    try {
      const userId = localStorage.getItem('doctorId') || '0001';
      const res = await axios.get(`${ipUrl}/clinic-admin/getUserDailyAttendence/${userId}/${dateStr}`);
      if (res.data && res.data.success && res.data.data) {
        setSelectedDateActivities(res.data.data.activities || res.data.data.sessions || []);
      } else {
        const storedState = localStorage.getItem(`doctor_duty_log_${dateStr}`);
        if (storedState) setSelectedDateActivities(JSON.parse(storedState).activities || []);
      }
    } catch (err) {
      console.error('Error fetching historical daily details:', err);
      const storedState = localStorage.getItem(`doctor_duty_log_${dateStr}`);
      if (storedState) setSelectedDateActivities(JSON.parse(storedState).activities || []);
    }
  };

  const getStatusClass = () => {
    if (status === 'Active') return 'active';
    if (status === 'Present') return 'present';
    return 'default';
  };

  return (
    <div className="at-wrap">
      <style>{GLOBAL_STYLES}</style>

      {/* ─── HEADER ────────────────────────────────────────────── */}
      {/* <div className="at-header">
        <button className="at-header-back" onClick={() => navigate('/dashboard')}>❮</button>
        <div className="at-header-label">Previous Page</div>
        <div className="at-header-sep" />
        <div className="at-header-title">Attendance Tracker</div>
      </div> */}

      <div className="at-body">
        <CContainer fluid style={{ maxWidth: '1200px', padding: '0 28px' }}>

          {/* ─── HERO ROW ──────────────────────────────────────── */}
          <div className="at-hero">
            <div>
              <div className="at-hero-date-tag">
                <span>📅</span> {getFormattedDate()}
              </div>
              <h2 className="at-hero-title">Daily Duty Log</h2>
              <p className="at-hero-subtitle">Track your work hours and activities</p>
            </div>
            <button
              onClick={handleToggleLogin}
              className={`at-toggle-btn ${isLoggedIn ? 'logout' : 'login'}`}
            >
              <span className="at-toggle-dot" />
              {isLoggedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>

          {/* ─── METRIC CARDS ──────────────────────────────────── */}
          <CRow className="mb-4 ">

            <CCol xs={12} sm={6} md={3}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: '10px',
                  borderLeft: '4px solid #1B4F8A',
                  overflow: 'hidden'
                }}
              >
                <CCardBody className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{
                      color: '#8a94a6',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      marginBottom: '4px'
                    }}>
                      Login
                    </div>

                    <h4 style={{
                      color: '#1B4F8A',
                      fontWeight: '800',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {loginTime}
                    </h4>
                    {/* <p style={{ fontSize: '12px', color: '#8a94a6' }}>{data?.login?.location || "NA"}</p> */}
                  </div>

                  <div className="d-none d-sm-block"
                    style={{
                      fontSize: '16px',
                      color: '#1B4F8A',
                      opacity: 0.85
                    }}>
                    🚪➜
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} md={3}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: '10px',
                  borderLeft: '4px solid #1B4F8A',
                  overflow: 'hidden'
                }}
              >
                <CCardBody className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{
                      color: '#8a94a6',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      marginBottom: '4px'
                    }}>
                      Logout
                    </div>

                    <h4 style={{
                      color: '#1B4F8A',
                      fontWeight: '800',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {logoutTime}
                    </h4>
                  </div>

                  <div className="d-none d-sm-block"
                    style={{
                      fontSize: '16px',
                      color: '#1B4F8A',
                      opacity: 0.85
                    }}>
                    🚪⬅
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} md={2}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: '10px',
                  borderLeft: '4px solid #1B4F8A',
                  overflow: 'hidden'
                }}
              >
                <CCardBody className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{
                      color: '#8a94a6',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      marginBottom: '4px'
                    }}>
                      Activities
                    </div>

                    <h4 style={{
                      color: '#1B4F8A',
                      fontWeight: '800',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {activities.length}
                    </h4>
                  </div>

                  <div className="d-none d-sm-block"
                    style={{
                      fontSize: '18px',
                      color: '#1B4F8A',
                      opacity: 0.85
                    }}>
                    📈
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} md={2}>
              <CCard
                className="border-0 shadow-sm h-100"
                style={{
                  borderRadius: '10px',
                  borderLeft: '4px solid #1B4F8A',
                  overflow: 'hidden'
                }}
              >
                <CCardBody className="d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{
                      color: '#8a94a6',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      letterSpacing: '0.3px',
                      marginBottom: '4px'
                    }}>
                      Status
                    </div>

                    <h4 style={{
                      color: '#1B4F8A',
                      fontWeight: '800',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {status}
                    </h4>
                  </div>

                  <div className="d-none d-sm-block"
                    style={{
                      fontSize: '16px',
                      color: '#1B4F8A',
                      opacity: 0.85
                    }}>
                    🛡️
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

          </CRow>

          {/* ─── TABS ──────────────────────────────────────────── */}
          <div className="at-tabs">
            <button className={`at-tab ${activeSubTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveSubTab('daily')}>
              Daily Log
            </button>
            <button className={`at-tab ${activeSubTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveSubTab('monthly')}>
              Monthly
            </button>
          </div>

          {/* ─── DAILY LOG TAB ─────────────────────────────────── */}
          {activeSubTab === 'daily' && (
            <div className="at-card">
              <div className="at-card-header">
                <div>
                  <div className="at-card-title">Today's Activities</div>
                  <div className="at-card-subtitle">{activities.length} {activities.length === 1 ? 'activity' : 'activities'} logged</div>
                </div>
                <button className="at-add-btn" onClick={() => setShowAddActivityModal(true)}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Activity
                </button>
              </div>
              <div className="at-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="at-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Activity</th>
                      <th>Duration</th>
                      <th>Location</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length > 0 ? (
                      activities.map((act, idx) => (
                        <tr key={act.id}>
                          <td><div className="at-table-index">{idx + 1}</div></td>
                          <td><div className="at-activity-name">{act.activity}</div></td>
                          <td><span className="at-duration-chip">{act.duration}</span></td>
                          <td><span className="at-location">{act.location ? `📍 ${act.location}` : '—'}</span></td>
                          <td><span className="at-desc">{act.description || '—'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">
                          <div className="at-empty">
                            <div className="at-empty-icon">📭</div>
                            <div className="at-empty-text">No activities logged today. Start by adding one.</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── MONTHLY TAB ───────────────────────────────────── */}
          {activeSubTab === 'monthly' && (
            <div className="at-card">
              <div className="at-card-header">
                <div>
                  <div className="at-card-title">Monthly Summary</div>
                  <div className="at-card-subtitle">{monthlyHistory.length} days recorded this month</div>
                </div>
              </div>
              <div className="at-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="at-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Login</th>
                      <th>Logout</th>
                      <th>Total</th>
                      <th>Working</th>
                      <th>Idle</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyHistory.length > 0 ? (
                      monthlyHistory.map((hist, idx) => (
                        <tr key={idx}>
                          <td><span className="at-date-chip">{hist.date}</span></td>
                          <td><span className="at-time-chip">{hist.login || '—'}</span></td>
                          <td><span className="at-time-chip">{hist.logout || '—'}</span></td>
                          <td><span className="at-total-chip">{hist.total || '—'}</span></td>
                          <td><span className="at-working-chip">{hist.working || '—'}</span></td>
                          <td><span className="at-idle-chip">{hist.idle || '—'}</span></td>
                          <td>
                            <button className="at-view-btn" onClick={() => handleViewDetails(hist.date)}>
                              View →
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">
                          <div className="at-empty">
                            <div className="at-empty-icon">📅</div>
                            <div className="at-empty-text">No monthly records found.</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </CContainer>
      </div>

      {/* ─── MODAL: ADD ACTIVITY ───────────────────────────────── */}
      <CModal className="at-modal" visible={showAddActivityModal} onClose={() => setShowAddActivityModal(false)} alignment="center">
        <CModalHeader className="at-modal-header">
          <CModalTitle>Add Activity</CModalTitle>
        </CModalHeader>
        <CModalBody className="at-modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <div className="at-field-label">Activity Name</div>
              <select
                className="at-field-input"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                <option value="">Select Activity</option>
                <option value="Consulations">Consultations</option>
                <option value="Other Activity">Other Activity</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Loss of Pay">Loss of Pay</option>
              </select>
            </div>

            <div>
              <div className="at-field-label">Description <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 500, fontSize: 11 }}>(optional)</span></div>
              <textarea
                className="at-field-input"
                rows={3}
                placeholder="Add any notes or details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div>
              <div className="at-field-label">Duration</div>
              <div className="at-duration-box">
                <div className="at-duration-unit">
                  <input
                    type="number" min="0" max="23"
                    value={durationHrs}
                    onChange={(e) => setDurationHrs(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <label>Hours</label>
                </div>
                <div className="at-duration-sep">:</div>
                <div className="at-duration-unit">
                  <input
                    type="number" min="0" max="59"
                    value={durationMins}
                    onChange={(e) => setDurationMins(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                  <label>Minutes</label>
                </div>
              </div>
            </div>

            <div className="at-info-box">
              <div className="at-info-row">
                <div>
                  <div className="at-info-key">Date</div>
                  <div className="at-info-val" style={{ ily: "'JetBrains Mono', monospace" }}>
                    {new Date().toISOString().split('T')[0]}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="at-info-key">Duration</div>
                  <div className="at-info-val" style={{ ily: "'JetBrains Mono', monospace" }}>
                    {durationHrs}h {durationMins}m
                  </div>
                </div>
              </div>
              <div className="at-info-divider" />
              <div className="at-info-key">📍 Location</div>
              <div className="at-info-val" style={{ marginTop: 4, fontSize: '12px', fontWeight: 500 }}>
                {locationLoading ? (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Fetching location…</span>
                ) : currentLocationText}
              </div>
            </div>

          </div>
        </CModalBody>
        <CModalFooter className="at-modal-footer">
          <button className="at-cancel-btn" onClick={() => setShowAddActivityModal(false)}>Cancel</button>
          <button className="at-save-btn" onClick={handleAddActivity} disabled={locationLoading}>
            Save Activity
          </button>
        </CModalFooter>
      </CModal>

      {/* ─── MODAL: VIEW DETAILS ───────────────────────────────── */}
      <CModal className="at-modal" visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="lg">
        <CModalHeader className="at-modal-header">
          <CModalTitle>Daily Log — {selectedHistoryDate}</CModalTitle>
        </CModalHeader>
        <CModalBody className="at-modal-body" style={{ padding: 0, background: 'var(--surface)' }}>
          <div className="at-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="at-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Activity</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {selectedDateActivities.length > 0 ? (
                  selectedDateActivities.map((act, idx) => (
                    <tr key={act.id}>
                      <td><div className="at-table-index">{idx + 1}</div></td>
                      <td><div className="at-activity-name">{act.activity}</div></td>
                      <td><span className="at-duration-chip">{act.duration}</span></td>
                      <td><span className="at-location">{act.location ? `📍 ${act.location}` : '—'}</span></td>
                      <td><span className="at-desc">{act.description || '—'}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="at-empty">
                        <div className="at-empty-icon">📭</div>
                        <div className="at-empty-text">No activities logged on this day.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CModalBody>
        <CModalFooter className="at-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="at-close-btn" onClick={() => setShowDetailsModal(false)}>Close</button>
        </CModalFooter>
      </CModal>

    </div>
  );
};

export default AttendanceTracker;