import React, { useState, useEffect } from 'react'
import { COLORS } from '../Themes'

/* ─── Google Font injected once ─── */
if (!document.getElementById('dm-sans-font')) {
  const link = document.createElement('link')
  link.id = 'dm-sans-font'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
  document.head.appendChild(link)
}

if (!document.getElementById('notif-styles')) {
  const s = document.createElement('style')
  s.id = 'notif-styles'
  s.textContent = `
    @keyframes notifSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes notifPulse {
      0%   { box-shadow: 0 0 0 0 rgba(249,197,113,0.55); }
      70%  { box-shadow: 0 0 0 7px rgba(249,197,113,0); }
      100% { box-shadow: 0 0 0 0 rgba(249,197,113,0); }
    }
    .notif-row { animation: notifSlideIn 0.28s ease both; }
    .notif-pulse { animation: notifPulse 2.2s infinite; }
    .notif-dismiss { opacity: 0; transition: opacity 0.18s; }
    .notif-row:hover .notif-dismiss { opacity: 1 !important; }
    .notif-filter-btn { transition: all 0.18s ease; }
    .notif-filter-btn:hover { transform: translateY(-1px); }
  `
  document.head.appendChild(s)
}

/* ─── Sample Data ─── */
const NOTIF_DATA = [
  { id: 1, type: 'appointment', read: false, date: 'Today', title: 'New Appointment Booked', patient: 'Ravi Kumar', detail: 'In-Clinic Consultation · Today at 11:00 AM', time: '2 min ago' },
  { id: 2, type: 'cancel',      read: false, date: 'Today', title: 'Appointment Cancelled',   patient: 'Priya Sharma', detail: 'Online Consultation · 2:30 PM slot released', time: '15 min ago' },
  { id: 3, type: 'message',     read: false, date: 'Today', title: 'Patient Message',          patient: 'Ananya Reddy', detail: '"Doctor, when is my next physiotherapy session?"', time: '1 hr ago' },
  { id: 4, type: 'completed',   read: true,  date: 'Today', title: 'Session Completed',        patient: 'Mohammed Ali', detail: 'Follow-up visit marked complete · 45 min', time: '3 hr ago' },
  { id: 5, type: 'appointment', read: true,  date: 'Yesterday', title: 'New Appointment Booked', patient: 'Sneha Patel', detail: 'Online Consultation · Tomorrow at 9:00 AM', time: 'Yesterday, 5:45 PM' },
  { id: 6, type: 'reminder',    read: true,  date: 'Yesterday', title: 'Schedule Reminder',    patient: 'System', detail: '5 appointments scheduled for tomorrow. Review calendar.', time: 'Yesterday, 3:00 PM' },
  { id: 7, type: 'cancel',      read: true,  date: 'Yesterday', title: 'Appointment Cancelled', patient: 'Arjun Nair', detail: 'In-Clinic session · Rescheduling requested', time: 'Yesterday, 11:20 AM' },
  { id: 8, type: 'message',     read: true,  date: 'Earlier', title: 'Patient Message',        patient: 'Divya Menon', detail: '"Thank you doctor, feeling much better after the session!"', time: '2 days ago' },
]

const TYPE_CONFIG = {
  appointment: { label: 'Appointment', accent: '#1B4F8A', bg: '#EAF1FB', labelBg: '#d4e5f7', labelColor: '#1B4F8A',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  cancel:      { label: 'Cancelled',   accent: '#b91c1c', bg: '#fef2f2', labelBg: '#fecaca', labelColor: '#b91c1c',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg> },
  message:     { label: 'Message',     accent: '#0f6e56', bg: '#ecfdf5', labelBg: '#a7f3d0', labelColor: '#065f46',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  completed:   { label: 'Completed',   accent: '#0f6e56', bg: '#ecfdf5', labelBg: '#a7f3d0', labelColor: '#065f46',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> },
  reminder:    { label: 'Reminder',    accent: '#92400e', bg: '#fffbeb', labelBg: '#fde68a', labelColor: '#78350f',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
}

const FILTERS = ['All', 'Unread', 'Appointment', 'Message', 'Cancelled', 'Reminder']

function groupByDate(list) {
  return list.reduce((acc, n) => {
    acc[n.date] = acc[n.date] ? [...acc[n.date], n] : [n]
    return acc
  }, {})
}

function Avatar({ name, bg, color }) {
  const initials = name === 'System' ? '⚕' : name.split(' ').map(w => w[0]).slice(0, 2).join('')
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      backgroundColor: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: name === 'System' ? 15 : 12, fontWeight: 700,
      flexShrink: 0, letterSpacing: '0.5px',
      fontFamily: "'DM Sans', sans-serif",
      border: `1.5px solid ${color}22`,
    }}>
      {initials}
    </div>
  )
}

function StatCard({ label, value, accent, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: 10, padding: '12px 16px',
      border: `1px solid ${accent}22`, flex: 1,
    }}>
      <div style={{
        fontSize: 24, fontWeight: 600, color: accent, lineHeight: 1,
        fontFamily: "'DM Mono', monospace",
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{
        fontSize: 10, color: accent, opacity: 0.7, marginTop: 5,
        fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </div>
    </div>
  )
}

const Notifications = () => {
  const [notifications, setNotifications] = useState(NOTIF_DATA)
  const [activeFilter, setActiveFilter] = useState('All')
  const [hoveredId, setHoveredId] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Unread') return !n.read
    if (activeFilter === 'Appointment') return ['appointment', 'completed'].includes(n.type)
    if (activeFilter === 'Message') return n.type === 'message'
    if (activeFilter === 'Cancelled') return n.type === 'cancel'
    if (activeFilter === 'Reminder') return n.type === 'reminder'
    return true
  })

  const grouped = groupByDate(filtered)
  const markRead = id => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })))
  const deleteNotif = id => setNotifications(p => p.filter(n => n.id !== id))

  return (
    <div style={{
      padding: '28px 30px', maxWidth: 820, margin: '0 auto',
      fontFamily: "'DM Sans', sans-serif",
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 22,
        paddingBottom: 18, borderBottom: '1.5px solid #EAF1FB',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: COLORS.bgcolor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h5 style={{ fontSize: 19, fontWeight: 600, color: COLORS.bgcolor, margin: 0, letterSpacing: '-0.3px' }}>
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="notif-pulse" style={{
                backgroundColor: COLORS.orange, color: COLORS.bgcolor,
                fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: COLORS.gray }}>
            Patient activity, appointment updates &amp; clinical alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            background: 'none', border: `1.5px solid ${COLORS.bgcolor}`,
            color: COLORS.bgcolor, borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Mark all read
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <StatCard label="Total" value={notifications.length} accent="#1B4F8A" bg="#EAF1FB" />
        <StatCard label="Unread" value={unreadCount} accent="#92400e" bg="#fffbeb" />
        <StatCard label="Appointments" value={notifications.filter(n => n.type === 'appointment').length} accent="#0f6e56" bg="#ecfdf5" />
        <StatCard label="Cancelled" value={notifications.filter(n => n.type === 'cancel').length} accent="#b91c1c" bg="#fef2f2" />
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
        {FILTERS.map(f => {
          const active = activeFilter === f
          return (
            <button key={f} className="notif-filter-btn" onClick={() => setActiveFilter(f)} style={{
              backgroundColor: active ? COLORS.bgcolor : COLORS.white,
              color: active ? COLORS.white : COLORS.bgcolor,
              border: `1.5px solid ${active ? COLORS.bgcolor : '#d0dff0'}`,
              borderRadius: 20, padding: '5px 15px',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {f}
            </button>
          )
        })}
      </div>

      {/* ── Groups ── */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '56px 20px',
          background: COLORS.theme, borderRadius: 14, border: '1.5px solid #EAF1FB',
        }}>
          <svg width="40" height="40" fill="none" stroke={COLORS.bgcolor} strokeWidth="1.5" viewBox="0 0 24 24"
            style={{ opacity: 0.25, marginBottom: 10 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p style={{ color: COLORS.gray, fontSize: 14, margin: '0 0 4px', fontWeight: 500 }}>No notifications found</p>
          <p style={{ color: '#adb5bd', fontSize: 12, margin: 0 }}>Try switching filters above</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 26 }}>

            {/* Date divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: COLORS.gray,
                textTransform: 'uppercase', letterSpacing: '1.2px',
                fontFamily: "'DM Mono', monospace",
              }}>
                {date}
              </span>
              <div style={{ flex: 1, height: 1, background: '#EAF1FB' }} />
              <span style={{ fontSize: 10, color: '#adb5bd', fontFamily: "'DM Mono', monospace" }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {items.map((notif, idx) => {
                const cfg = TYPE_CONFIG[notif.type]
                const isHov = hoveredId === notif.id
                return (
                  <div
                    key={notif.id}
                    className="notif-row"
                    style={{ animationDelay: `${idx * 0.06}s` }}
                    onMouseEnter={() => setHoveredId(notif.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => markRead(notif.id)}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 13,
                      padding: '13px 15px',
                      backgroundColor: notif.read ? '#ffffff' : COLORS.theme,
                      border: `1px solid ${isHov ? cfg.accent + '44' : notif.read ? '#e4ecf7' : '#c9dcf0'}`,
                      borderLeft: notif.read
                        ? `1px solid ${isHov ? cfg.accent + '55' : '#e4ecf7'}`
                        : `4px solid ${cfg.accent}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isHov ? '0 4px 18px rgba(27,79,138,0.10)' : 'none',
                      position: 'relative',
                    }}>
                      {/* Avatar */}
                      <Avatar name={notif.patient} bg={cfg.bg} color={cfg.accent} />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 600, color: COLORS.bgcolor }}>
                            {notif.title}
                          </span>

                          {/* Badge */}
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            backgroundColor: cfg.labelBg, color: cfg.labelColor,
                            borderRadius: 20, padding: '2px 8px',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            fontFamily: "'DM Mono', monospace",
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            {cfg.icon}
                            {cfg.label}
                          </span>

                          {!notif.read && (
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              backgroundColor: COLORS.orange, display: 'inline-block', flexShrink: 0,
                            }} />
                          )}
                        </div>

                        {/* Patient */}
                        {notif.patient !== 'System' && (
                          <div style={{ fontSize: 11, color: COLORS.bgcolor, fontWeight: 600, opacity: 0.55, marginBottom: 2 }}>
                            Patient: {notif.patient}
                          </div>
                        )}
                        {notif.patient === 'System' && (
                          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, opacity: 0.7, marginBottom: 2 }}>
                            System Alert
                          </div>
                        )}

                        {/* Detail */}
                        <p style={{
                          fontSize: 12, color: COLORS.gray, margin: '0 0 5px',
                          lineHeight: 1.55, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: '90%',
                          fontStyle: notif.type === 'message' ? 'italic' : 'normal',
                        }}>
                          {notif.detail}
                        </p>

                        {/* Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="9" height="9" fill="none" stroke="#adb5bd" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                          </svg>
                          <span style={{ fontSize: 10, color: '#adb5bd', fontFamily: "'DM Mono', monospace" }}>
                            {notif.time}
                          </span>
                        </div>
                      </div>

                      {/* Dismiss */}
                      <button
                        className="notif-dismiss"
                        onClick={e => { e.stopPropagation(); deleteNotif(notif.id) }}
                        title="Dismiss"
                        style={{
                          background: '#fff', border: '1px solid #e4ecf7',
                          borderRadius: 6, width: 26, height: 26,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0, color: COLORS.gray, marginTop: 2,
                        }}
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* ── Footer ── */}
      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', paddingTop: 18, borderTop: '1px solid #EAF1FB', marginTop: 4 }}>
          <p style={{ fontSize: 10, color: '#adb5bd', margin: 0, fontFamily: "'DM Mono', monospace", letterSpacing: '0.5px' }}>
            SHOWING {filtered.length} OF {notifications.length} NOTIFICATIONS
          </p>
        </div>
      )}
    </div>
  )
}

export default Notifications