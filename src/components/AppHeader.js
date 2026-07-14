import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
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
import {
  getNotificationHistoryFromDB,
  deleteNotificationFromHistoryDB,
  markNotificationAsReadInHistoryDB,
  clearNotificationHistoryDB,
  subscribeToBroadcastChannel,
  listenNotification
} from '../firebase'
import './AppHeader.css'

const TYPE_CONFIG = {
  appointment: {
    label: 'Appointment', accent: '#1B4F8A', bg: '#EAF1FB',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  },
  cancel: {
    label: 'Cancelled', accent: '#b91c1c', bg: '#fef2f2',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
  },
  message: {
    label: 'Message', accent: '#0f6e56', bg: '#ecfdf5',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  },
  completed: {
    label: 'Completed', accent: '#0f6e56', bg: '#ecfdf5',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
  },
  reminder: {
    label: 'Reminder', accent: '#92400e', bg: '#fffbeb',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  },
  feedback: {
    label: 'Feedback', accent: '#4f46e5', bg: '#eef2ff',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
  },
  default: {
    label: 'Alert', accent: '#1B4F8A', bg: '#EAF1FB',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
  },
};

function getTypeConfig(type) {
  if (!type) return TYPE_CONFIG.default;
  const lower = type.toLowerCase();
  if (lower.includes('feedback')) return TYPE_CONFIG.feedback;
  return TYPE_CONFIG[lower] || TYPE_CONFIG.default;
}

function NotificationIcon({ cfg }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      backgroundColor: cfg.bg, color: cfg.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      border: `1px solid ${cfg.accent}30`,
      boxShadow: `0 2px 8px ${cfg.accent}15`
    }}>
      {React.cloneElement(cfg.icon, { width: 20, height: 20 })}
    </div>
  );
}

const AppHeader = () => {
  const { patientData, setTodayAppointments, todayAppointments, clinicDetails } = useDoctorContext()
  const branchName = localStorage.getItem('clinicDetails')

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
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const unreadCount = useSelector((state) => state.unreadNotificationsCount || 0)

  const [notifications, setNotifications] = useState([])
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)

  useEffect(() => {
    setDropdownOpen(false)
  }, [location.pathname])
  const hoverTimeoutRef = useRef(null)

  const markAllAsRead = async () => {
    if (isMarkingRead) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      setIsMarkingRead(true);
      try {
        await Promise.all(unread.map(n => markNotificationAsReadInHistoryDB(n.id)));
        await loadNotifications();
      } finally {
        setIsMarkingRead(false);
      }
    }
  }

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setDropdownOpen(true)
    markAllAsRead()
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const list = await getNotificationHistoryFromDB()

      const dummyItems = list.filter(n => typeof n.id === 'number' && n.id < 1000000)
      if (dummyItems.length > 0) {
        for (const item of dummyItems) {
          await deleteNotificationFromHistoryDB(item.id)
        }
        const updatedList = await getNotificationHistoryFromDB()
        const sorted = updatedList.sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))
        setNotifications(sorted)
        const unread = sorted.filter(n => !n.read).length
        dispatch({ type: 'set', unreadNotificationsCount: unread })
        return
      }

      const sorted = list.sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))
      setNotifications(sorted)
      const unread = sorted.filter(n => !n.read).length
      dispatch({ type: 'set', unreadNotificationsCount: unread })
    } catch (err) {
      console.error('Failed to load notifications history:', err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const unsubscribeBroadcast = subscribeToBroadcastChannel(() => {
      loadNotifications()
    })
    return () => {
      if (unsubscribeBroadcast) unsubscribeBroadcast()
    }
  }, [])

  const markRead = async (id) => {
    await markNotificationAsReadInHistoryDB(id);
    await loadNotifications();
  };

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  const { day, date, time } = getDateParts()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [visible, setVisible] = useState(false)

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    const filtered = todayAppointments.filter((p) => {
      const patientName = (p.name || p.patientName || '').toLowerCase()
      return patientName.includes(value.toLowerCase())
    })
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
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
          >
            <style>
              {`
                @keyframes bellShake {
                  0% { transform: rotate(0); }
                  15% { transform: rotate(15deg); }
                  30% { transform: rotate(-15deg); }
                  45% { transform: rotate(10deg); }
                  60% { transform: rotate(-10deg); }
                  75% { transform: rotate(5deg); }
                  85% { transform: rotate(-5deg); }
                  100% { transform: rotate(0); }
                }
                .notif-bell-icon:hover {
                  animation: bellShake 0.6s ease;
                }
                .notif-pulse {
                  animation: pulse 2s infinite;
                }
                @keyframes pulse {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
              `}
            </style>
            <button
              onClick={() => {
                const nextState = !dropdownOpen;
                setDropdownOpen(nextState);
                if (nextState) markAllAsRead();
              }}
              className="notif-bell-icon"
              style={{
                cursor: 'pointer',
                position: 'relative',
                padding: '4px 8px',
                background: 'none',
                border: 'none',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '25%',
                  background: 'linear-gradient(135deg, #EAF1FB 0%, #D4E3F5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid #b6cfe8`,
                  boxShadow: '0 2px 8px rgba(27,79,138,0.1)',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                <CIcon icon={cilBell} size="sm" style={{ color: COLORS.bgcolor }} />
                {unreadCount > 0 && (
                  <span
                    className="notif-pulse"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  right: 0,
                  width: '400px',
                  padding: '0',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#ffffff',
                  zIndex: 1050
                }}
              >
                {/* Dropdown Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid #E2E8F0',
                    background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
                  }}
                >
                  <span style={{ fontWeight: '800', fontSize: '16px', color: '#1E293B', letterSpacing: '-0.3px' }}>
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to clear all history?')) {
                          await clearNotificationHistoryDB();
                          await loadNotifications();
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Dropdown List */}
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: '420px', padding: '0' }}>
                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: '50px 20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CIcon icon={cilBell} size="lg" style={{ color: '#94A3B8' }} />
                      </div>
                      <span style={{ color: '#64748B', fontSize: '15px', fontWeight: '500' }}>No new notifications</span>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.read;
                      const cfg = getTypeConfig(notif.type);
                      return (
                        <div
                          key={notif.id}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await markRead(notif.id);
                            setSelectedNotification(notif);
                            setDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            padding: '16px 20px',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            backgroundColor: isUnread ? '#F8FAFC' : '#ffffff',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = isUnread ? '#F8FAFC' : '#ffffff')
                          }
                        >
                          <NotificationIcon cfg={cfg} />
                          <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    color: isUnread ? '#0F172A' : '#334155',
                                    lineHeight: '1.3',
                                  }}
                                >
                                  {notif.title}
                                </span>
                                {isUnread && (
                                  <span
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: '#3B82F6',
                                      flexShrink: 0,
                                      boxShadow: '0 0 0 3px #DBEAFE'
                                    }}
                                  />
                                )}
                              </div>
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await deleteNotificationFromHistoryDB(notif.id);
                                  await loadNotifications();
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#CBD5E1',
                                  fontSize: '16px',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  transition: 'color 0.2s',
                                  marginTop: '-2px',
                                  marginRight: '-4px'
                                }}
                                onMouseOver={(e) => e.target.style.color = '#ef4444'}
                                onMouseOut={(e) => e.target.style.color = '#CBD5E1'}
                                aria-label="Dismiss notification"
                              >
                                ✕
                              </button>
                            </div>
                            <span
                              style={{
                                display: 'block',
                                fontSize: '13px',
                                color: '#475569',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                marginTop: '4px',
                                lineHeight: '1.5'
                              }}
                            >
                              {notif.message || notif.detail}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', display: 'block', fontWeight: '600' }}>
                              {new Date(notif.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vertical divider */}
          <div
            style={{
              width: '1px',
              height: '32px',
              backgroundColor: `${COLORS.bgcolor}40`,
              margin: '0 4px',
            }}
          />

          {/* Clinic name & address */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '0 8px',
            }}
          >
            {clinicDetails ? (
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
                  {capitalizeWords(clinicDetails.name) || 'Clinic Name'}
                </h5>
                {clinicDetails.address && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      color: 'rgba(255, 255, 255, 0.75)',
                      marginTop: '2px',
                      fontWeight: '500',
                      letterSpacing: '0.1px',
                    }}
                  >
                    📍 {clinicDetails.branch}
                  </span>
                )}
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

      {/* ── Notification Detail Modal ── */}
      <CModal
        visible={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        alignment="center"
        backdrop="static"
      >
        <CModalBody style={{
          padding: '40px 30px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Large Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            backgroundColor: selectedNotification ? getTypeConfig(selectedNotification.type).bg : '#EAF1FB',
            color: selectedNotification ? getTypeConfig(selectedNotification.type).accent : '#1B4F8A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 8px 24px rgba(27,79,138,0.12)'
          }}>
            {selectedNotification && React.cloneElement(getTypeConfig(selectedNotification.type).icon, { width: 36, height: 36 })}
          </div>

          {/* Title */}
          <h4 style={{
            fontSize: 20, fontWeight: 700, color: COLORS.bgcolor,
            marginBottom: 12, letterSpacing: '-0.3px'
          }}>
            {selectedNotification?.title}
          </h4>

          {/* Body */}
          <p style={{
            fontSize: 14, color: COLORS.gray,
            lineHeight: 1.6, marginBottom: 28,
            maxWidth: '90%'
          }}>
            {selectedNotification?.message || selectedNotification?.detail}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectedNotification?.path && (
              <button
                onClick={async () => {
                  if (selectedNotification) {
                    await markRead(selectedNotification.id);

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

                    const today = new Date();
                    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const serviceDate = selectedNotification.serviceDate || selectedNotification.date;
                    const bodyText = (selectedNotification.message || selectedNotification.detail || '').toLowerCase();
                    const titleText = (selectedNotification.title || '').toLowerCase();

                    let isToday = false;
                    if (serviceDate) {
                      isToday = toISODate(serviceDate) === todayISO;
                    } else {
                      isToday = bodyText.includes('today') || titleText.includes('today') || bodyText.includes(todayISO) || titleText.includes(todayISO);
                    }

                    let targetPath = isToday ? '/dashboard' : '/appointments';
                    const notifPath = selectedNotification.path || '';
                    const notifMsg = (selectedNotification.message || '').toLowerCase();
                    const notifTitle = (selectedNotification.title || '').toLowerCase();
                    if (
                      notifPath.includes('feedback') ||
                      selectedNotification.type === 'SESSION_FEEDBACK' ||
                      notifMsg.includes('feedback') ||
                      notifTitle.includes('feedback')
                    ) {
                      targetPath = '/feedback';
                    }
                    setSelectedNotification(null);
                    navigate(targetPath, {
                      state: {
                        highlightBookingId: selectedNotification.bookingId || selectedNotification.bookingid,
                        highlightPatientId: selectedNotification.patientId || selectedNotification.patientid,
                        highlightMobileNumber: selectedNotification.mobileNumber || selectedNotification.patientMobileNumber
                      }
                    });
                  }
                }}
                style={{
                  backgroundColor: '#1B4F8A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(27,79,138,0.24)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                View Details
              </button>
            )}
            <button
              onClick={async () => {
                if (selectedNotification) {
                  await markRead(selectedNotification.id);
                  setSelectedNotification(null);
                }
              }}
              style={{
                backgroundColor: selectedNotification?.path ? '#f1f5f9' : '#1B4F8A',
                color: selectedNotification?.path ? '#334155' : '#ffffff',
                border: selectedNotification?.path ? '1px solid #cbd5e1' : 'none',
                borderRadius: 8,
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: selectedNotification?.path ? 'none' : '0 4px 12px rgba(27,79,138,0.24)',
                transition: 'transform 0.15s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {selectedNotification?.path ? 'Dismiss & Close' : 'Acknowledge & Close'}
            </button>
          </div>
        </CModalBody>
      </CModal>
    </CHeader>
  )
}

export default AppHeader