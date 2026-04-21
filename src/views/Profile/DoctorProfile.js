import React, { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { format, addDays, parse } from 'date-fns'
import {
  CCard, CCardBody, CRow, CCol, CButton,
} from '@coreui/react'
import { averageRatings, getAvailableSlots } from '../../Auth/Auth'
import { COLORS } from '../../Themes'
import { capitalizeEachWord } from '../../utils/CaptalZeWord'

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes stripFlow {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes shimmerPulse {
    0%,100% { opacity:.55; }
    50%      { opacity:1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 0 1px rgba(245,166,35,0.15), 0 4px 24px rgba(0,0,0,0.18); }
    50%      { box-shadow: 0 0 0 1px rgba(245,166,35,0.38), 0 4px 24px rgba(0,0,0,0.18); }
  }
  @keyframes avatarPop {
    from { transform: scale(0.88); opacity:0; }
    to   { transform: scale(1);    opacity:1; }
  }
  @keyframes dotPulse {
    0%,100% { transform:scale(1);   opacity:.65; }
    50%      { transform:scale(1.3); opacity:1; }
  }

  .dp-wrapper {
    font-family: 'Outfit', sans-serif;
    padding: 0 0 60px;
  }

  /* ── Tab Bar ── */
  .dp-tabbar {
    display: flex;
    gap: 4px;
    background: rgba(27,79,138,0.06);
    border: 1px solid rgba(27,79,138,0.12);
    border-radius: 14px;
    padding: 5px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .dp-tab {
    flex: 1;
    min-width: 120px;
    padding: 9px 16px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #6b7280;
    font-family: 'Outfit', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all .22s ease;
    position: relative;
    white-space: nowrap;
  }
  .dp-tab:hover:not(.active) {
    background: rgba(27,79,138,0.07);
    color: #1B4F8A;
  }
  .dp-tab.active {
    background: #1B4F8A;
    color: #fff;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(27,79,138,0.32);
  }
  .dp-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 50%; transform: translateX(-50%);
    width: 24px; height: 3px;
    background: #F5A623;
    border-radius: 2px 2px 0 0;
  }

  /* ── Cards ── */
  .dp-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(27,79,138,0.10);
    box-shadow: 0 2px 20px rgba(27,79,138,0.07);
    margin-bottom: 20px;
    overflow: hidden;
    animation: fadeUp .5s ease both;
  }
  .dp-card-header {
    padding: 16px 22px 14px;
    border-bottom: 1px solid rgba(27,79,138,0.08);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dp-card-header-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, rgba(27,79,138,0.12), rgba(245,166,35,0.10));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }
  .dp-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #1B4F8A;
    letter-spacing: .01em;
  }
  .dp-card-body { padding: 20px 22px; }

  /* ── Hero Banner ── */
  .dp-hero {
    background: linear-gradient(125deg, #0d1e36 0%, #1B4F8A 55%, #163d73 100%);
    border-radius: 18px;
    padding: 28px 28px 22px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
    animation: fadeUp .5s ease both;
  }
  .dp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .dp-hero-strip {
    position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg,#1B4F8A,#F5A623,#ffd17a,#1B4F8A);
    background-size: 200% auto;
    animation: stripFlow 3s linear infinite;
  }
  .dp-avatar-ring {
    width: 110px; height: 110px; border-radius: 50%;
    border: 3px solid rgba(245,166,35,0.6);
    box-shadow: 0 0 0 6px rgba(245,166,35,0.12), 0 8px 28px rgba(0,0,0,0.35);
    object-fit: cover;
    flex-shrink: 0;
    animation: avatarPop .6s cubic-bezier(.22,.97,.58,1) .1s both;
  }
  .dp-avatar-placeholder {
    width: 110px; height: 110px; border-radius: 50%;
    border: 3px solid rgba(245,166,35,0.4);
    background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.5); font-size: 13px;
    flex-shrink: 0;
    animation: avatarPop .6s cubic-bezier(.22,.97,.58,1) .1s both;
  }
  .dp-hero-name {
    font-size: 22px; font-weight: 800; color: #fff;
    letter-spacing: -.02em; margin-bottom: 4px;
  }
  .dp-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(245,166,35,0.15);
    border: 1px solid rgba(245,166,35,0.28);
    border-radius: 20px; padding: 4px 12px; margin-bottom: 12px;
  }
  .dp-hero-badge-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #F5A623;
    animation: dotPulse 2.5s ease-in-out infinite;
  }
  .dp-hero-badge-txt {
    font-size: 11px; font-weight: 600; color: #F5A623;
    letter-spacing: .08em; text-transform: uppercase;
  }
  .dp-hero-meta {
    display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 10px;
  }
  .dp-hero-meta-item {
    font-size: 13px; color: rgba(255,255,255,0.65);
    display: flex; align-items: center; gap: 5px;
  }
  .dp-hero-meta-item strong { color: rgba(255,255,255,0.9); }
  .dp-hero-stat {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    border-radius: 12px; padding: 12px 18px;
    text-align: center; min-width: 90px;
  }
  .dp-hero-stat-val {
    font-size: 20px; font-weight: 800; color: #F5A623; line-height: 1;
  }
  .dp-hero-stat-lbl {
    font-size: 10.5px; color: rgba(255,255,255,0.45); margin-top: 3px; letter-spacing: .03em;
  }

  /* ── Info Grid ── */
  .dp-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
  }
  .dp-info-item {
    background: rgba(27,79,138,0.04);
    border: 1px solid rgba(27,79,138,0.09);
    border-radius: 12px; padding: 12px 14px;
    transition: border-color .2s, background .2s;
  }
  .dp-info-item:hover {
    background: rgba(27,79,138,0.08);
    border-color: rgba(27,79,138,0.2);
  }
  .dp-info-label {
    font-size: 10.5px; font-weight: 700; color: #F5A623;
    letter-spacing: .09em; text-transform: uppercase; margin-bottom: 5px;
  }
  .dp-info-value { font-size: 13.5px; font-weight: 600; color: #1B4F8A; }

  /* ── Signature ── */
  .dp-sig-box {
    background: rgba(27,79,138,0.03);
    border: 1.5px dashed rgba(27,79,138,0.2);
    border-radius: 12px; padding: 14px 18px;
    display: inline-block;
  }

  /* ── List items ── */
  .dp-list-item {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid rgba(27,79,138,0.06);
    font-size: 13.5px; color: #374151;
  }
  .dp-list-item:last-child { border-bottom: none; }
  .dp-list-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #F5A623; flex-shrink: 0; margin-top: 5px;
  }

  /* ── Fee cards ── */
  .dp-fee-card {
    flex: 1;
    background: linear-gradient(135deg, rgba(27,79,138,0.06), rgba(245,166,35,0.04));
    border: 1px solid rgba(27,79,138,0.12);
    border-radius: 14px; padding: 16px 20px;
    position: relative; overflow: hidden;
  }
  .dp-fee-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(to bottom, #1B4F8A, #F5A623);
    border-radius: 3px 0 0 3px;
  }
  .dp-fee-label { font-size: 11px; font-weight: 700; color: #8a94a6; letter-spacing: .08em; text-transform: uppercase; }
  .dp-fee-value { font-size: 22px; font-weight: 800; color: #1B4F8A; margin-top: 4px; }
  .dp-fee-currency { font-size: 14px; font-weight: 500; color: #F5A623; vertical-align: super; }

  /* ── Date selector ── */
  .dp-date-btn {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid rgba(27,79,138,0.15);
    background: #fff;
    cursor: pointer;
    transition: all .2s;
    min-width: 70px; text-align: center;
    font-family: 'Outfit', sans-serif;
  }
  .dp-date-btn:hover { border-color: #1B4F8A; background: rgba(27,79,138,0.04); }
  .dp-date-btn.selected {
    background: #1B4F8A; border-color: #1B4F8A; color: #fff;
    box-shadow: 0 4px 14px rgba(27,79,138,0.32);
  }
  .dp-date-day { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .dp-date-num { font-size: 14px; font-weight: 700; margin-top: 1px; }

  /* ── Slots ── */
  .dp-slot {
    padding: 7px 14px;
    border-radius: 8px;
    border: 1.5px solid rgba(27,79,138,0.2);
    background: #fff;
    font-size: 13px; font-weight: 600; color: #1B4F8A;
    cursor: pointer;
    transition: all .18s;
    font-family: 'Outfit', sans-serif;
  }
  .dp-slot:hover:not(:disabled) {
    background: #1B4F8A; color: #fff;
    border-color: #1B4F8A;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(27,79,138,0.28);
  }
  .dp-slot:disabled {
    background: #f1f3f5; border-color: #e0e0e0;
    color: #bbb; cursor: not-allowed;
    text-decoration: line-through;
  }

  /* ── Ratings ── */
  .dp-rating-bar {
    background: linear-gradient(125deg, #0d1e36 0%, #1B4F8A 100%);
    border-radius: 16px; padding: 22px 24px;
    display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px;
    position: relative; overflow: hidden;
  }
  .dp-rating-bar::before {
    content: '';
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 36px 36px; pointer-events: none;
  }
  .dp-rating-tile {
    flex: 1; min-width: 160px;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 14px; padding: 16px 20px;
    display: flex; align-items: center; gap: 14px;
  }
  .dp-rating-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(245,166,35,0.15);
    border: 1px solid rgba(245,166,35,0.25);
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .dp-rating-val { font-size: 26px; font-weight: 800; color: #F5A623; line-height: 1; }
  .dp-rating-max { font-size: 13px; color: rgba(255,255,255,0.4); }
  .dp-rating-lbl { font-size: 11.5px; color: rgba(255,255,255,0.55); margin-top: 2px; letter-spacing: .03em; }

  /* ── Feedback card ── */
  .dp-feedback {
    background: #fff;
    border: 1px solid rgba(27,79,138,0.10);
    border-radius: 16px; padding: 18px 20px; margin-bottom: 14px;
    transition: box-shadow .2s, transform .2s;
    animation: fadeUp .45s ease both;
  }
  .dp-feedback:hover {
    box-shadow: 0 6px 28px rgba(27,79,138,0.12);
    transform: translateY(-2px);
  }
  .dp-feedback-avatar {
    width: 46px; height: 46px; border-radius: 50%;
    background: linear-gradient(135deg, #1B4F8A, #2A6DB5);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(27,79,138,0.28);
  }
  .dp-feedback-name { font-size: 14px; font-weight: 700; color: #1B4F8A; }
  .dp-feedback-time { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
  .dp-feedback-rating {
    background: rgba(245,166,35,0.12);
    border: 1px solid rgba(245,166,35,0.25);
    border-radius: 8px; padding: 3px 10px;
    font-size: 13px; font-weight: 700; color: #c67d00;
  }
  .dp-feedback-text { font-size: 13.5px; color: #374151; margin-top: 10px; line-height: 1.6; }

  /* ── Services ── */
  .dp-service-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(27,79,138,0.07);
    border: 1px solid rgba(27,79,138,0.14);
    border-radius: 8px; padding: 6px 12px;
    font-size: 12.5px; font-weight: 600; color: #1B4F8A;
    margin: 4px;
    transition: background .2s, border-color .2s;
  }
  .dp-service-tag:hover {
    background: #1B4F8A; color: #fff; border-color: #1B4F8A;
  }

  /* ── Section label ── */
  .dp-section-label {
    font-size: 11px; font-weight: 700; color: #F5A623;
    letter-spacing: .1em; text-transform: uppercase; margin-bottom: 12px;
  }

  /* ── Slot legend ── */
  .dp-legend {
    display: flex; gap: 16px; align-items: center;
    font-size: 12px; color: #6b7280;
  }
  .dp-legend-dot {
    width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0;
  }
`

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const InfoItem = ({ label, value }) => (
  <div className="dp-info-item">
    <div className="dp-info-label">{label}</div>
    <div className="dp-info-value">{value || 'N/A'}</div>
  </div>
)

const ListItems = ({ items, fallback }) => {
  if (!Array.isArray(items) || !items.length)
    return <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{fallback}</p>
  return items.map((item, i) => (
    <div key={i} className="dp-list-item">
      <div className="dp-list-dot" />
      <span>{typeof item === 'string' ? item.replace(/^•\s*/, '') : item?.subServiceName || item?.categoryName || item?.serviceName || 'Unnamed'}</span>
    </div>
  ))
}

/* ══════════════════════════════════════════════════════════════════════════ */
const DoctorProfile = () => {
  const [doctorDetails, setDoctorDetails] = useState(null)
  const [activeKey, setActiveKey]         = useState(1)
  const [ratingsData, setRatingsData]     = useState(null)
  const [slotsData, setSlotsData]         = useState([])
  const [doctorImage, setDoctorImage]     = useState(null)
  const [loading, setLoading]             = useState(false)
  const [days, setDays]                   = useState([])
  const [selectedDate, setSelectedDate]   = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    const today = new Date()
    setDays(Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i)
      return { date, dayLabel: format(date, 'EEE'), dateLabel: format(date, 'dd MMM') }
    }))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('doctorDetails')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.doctorPicture) {
          setDoctorImage(parsed.doctorPicture.startsWith('data:image')
            ? parsed.doctorPicture
            : `data:image/jpeg;base64,${parsed.doctorPicture}`)
        }
        setDoctorDetails(parsed)
      } catch (e) { console.error(e) }
    }
  }, [])

  useEffect(() => {
    const fetchSlots = async () => {
      const doctorId = localStorage.getItem('doctorId')
      const hospitalId = localStorage.getItem('hospitalId')
      if (!doctorId || !hospitalId) return
      const response = await getAvailableSlots(hospitalId, doctorId)
      if (response?.slots?.length) setSlotsData(response.slots)
    }
    fetchSlots()
  }, [])

  useEffect(() => {
    const fetchRatings = async () => {
      const doctorId = localStorage.getItem('doctorId')
      if (!doctorId) return
      try {
        const response = await averageRatings(doctorId)
        if (response) setRatingsData(response)
      } catch (e) { console.error(e) }
    }
    fetchRatings()
  }, [])

  const normalizeDate = (d) => format(new Date(d), 'yyyy-MM-dd')
  const slotsForSelectedDate = slotsData.find(
    (day) => normalizeDate(day.date) === selectedDate
  )?.availableSlots || []

  const TABS = [
    { key: 1, label: '👤 Doctor Info' },
    { key: 3, label: '⭐ Ratings' },
    { key: 4, label: '🛠 Services' },
    { key: 2, label: '🕐 Slots' },
  ]

  return (
    <>
      <style>{STYLES}</style>
      <div className="dp-wrapper">

        {/* ── TAB BAR ──────────────────────────────────────────────── */}
        <div className="dp-tabbar">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`dp-tab${activeKey === t.key ? ' active' : ''}`}
              onClick={() => setActiveKey(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1 — DOCTOR INFO
        ══════════════════════════════════════════════════════════ */}
        {activeKey === 1 && (
          <>
            {/* Hero */}
            <div className="dp-hero">
              <div className="dp-hero-strip" />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                {doctorImage
                  ? <img src={doctorImage} alt="Doctor" className="dp-avatar-ring" />
                  : <div className="dp-avatar-placeholder">No Image</div>
                }
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="dp-hero-badge">
                    <div className="dp-hero-badge-dot" />
                    <span className="dp-hero-badge-txt">Active Doctor</span>
                  </div>
                  <div className="dp-hero-name">
                    {capitalizeEachWord(doctorDetails?.doctorName) || 'Doctor Name'}
                  </div>
                  <div className="dp-hero-meta">
                    <div className="dp-hero-meta-item">
                      <span>🎓</span>
                      <strong>{doctorDetails?.qualification || 'Qualification'}</strong>
                    </div>
                    <div className="dp-hero-meta-item">
                      <span>🪪</span>
                      <span>Lic: <strong>{doctorDetails?.doctorLicence || '—'}</strong></span>
                    </div>
                    <div className="dp-hero-meta-item">
                      <span>📅</span>
                      <span><strong>{doctorDetails?.experience ? `${doctorDetails.experience} yrs` : '—'}</strong> exp.</span>
                    </div>
                  </div>
                </div>

                {/* Stat tiles */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignSelf: 'center' }}>
                  <div className="dp-hero-stat">
                    <div className="dp-hero-stat-val">₹{doctorDetails?.doctorFees?.inClinicFee || 0}</div>
                    <div className="dp-hero-stat-lbl">In-clinic fee</div>
                  </div>
                  <div className="dp-hero-stat">
                    <div className="dp-hero-stat-val">₹{doctorDetails?.doctorFees?.vedioConsultationFee || 0}</div>
                    <div className="dp-hero-stat-lbl">Video fee</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Availability */}
            <div className="dp-card" style={{ animationDelay: '.08s' }}>
              <div className="dp-card-header">
                <div className="dp-card-header-icon">📞</div>
                <div className="dp-card-title">Contact & Availability</div>
              </div>
              <div className="dp-card-body">
                <div className="dp-info-grid">
                  <InfoItem label="Email"            value={doctorDetails?.doctorEmail} />
                  <InfoItem label="Phone"            value={doctorDetails?.doctorMobileNumber} />
                  <InfoItem label="Gender"           value={doctorDetails?.gender} />
                  <InfoItem label="Languages"        value={doctorDetails?.languages?.join(', ')} />
                  <InfoItem label="Available Days"   value={doctorDetails?.availableDays} />
                  <InfoItem label="Available Times"  value={doctorDetails?.availableTimes} />
                </div>

                {/* Signature */}
                <div style={{ marginTop: 20 }}>
                  <div className="dp-section-label">Doctor Signature</div>
                  {doctorDetails?.doctorSignature
                    ? <div className="dp-sig-box">
                        <img src={doctorDetails.doctorSignature} alt="Signature"
                          style={{ height: 56, display: 'block' }} />
                      </div>
                    : <span style={{ fontSize: 13, color: '#9ca3af' }}>No signature uploaded</span>
                  }
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="dp-card" style={{ animationDelay: '.14s' }}>
              <div className="dp-card-header">
                <div className="dp-card-header-icon">📝</div>
                <div className="dp-card-title">Profile Information</div>
              </div>
              <div className="dp-card-body">
                <div style={{ marginBottom: 20 }}>
                  <div className="dp-section-label">Description</div>
                  <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                    {doctorDetails?.profileDescription || 'No description available'}
                  </p>
                </div>

                <CRow>
                  <CCol md={6}>
                    <div className="dp-section-label">🏅 Achievements</div>
                    <ListItems items={doctorDetails?.highlights} fallback="No achievements added" />
                  </CCol>
                  <CCol md={6}>
                    <div className="dp-section-label">🔍 Area of Expertise</div>
                    <ListItems items={doctorDetails?.focusAreas} fallback="No focus areas listed" />
                  </CCol>
                </CRow>
              </div>
            </div>

            {/* Fees */}
            <div className="dp-card" style={{ animationDelay: '.2s' }}>
              <div className="dp-card-header">
                <div className="dp-card-header-icon">💼</div>
                <div className="dp-card-title">Consultation Fees</div>
              </div>
              <div className="dp-card-body">
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div className="dp-fee-card">
                    <div className="dp-fee-label">In-Clinic Consultation</div>
                    <div className="dp-fee-value">
                      <span className="dp-fee-currency">₹</span>
                      {doctorDetails?.doctorFees?.inClinicFee || 0}
                    </div>
                  </div>
                  <div className="dp-fee-card">
                    <div className="dp-fee-label">Video Consultation</div>
                    <div className="dp-fee-value">
                      <span className="dp-fee-currency">₹</span>
                      {doctorDetails?.doctorFees?.vedioConsultationFee || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2 — SLOTS
        ══════════════════════════════════════════════════════════ */}
        {activeKey === 2 && (
          <div className="dp-card">
            <div className="dp-card-header">
              <div className="dp-card-header-icon">🕐</div>
              <div className="dp-card-title">Available Slots</div>
              <div style={{ marginLeft: 'auto' }}>
                <div className="dp-legend">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="dp-legend-dot" style={{ border: '1.5px solid rgba(27,79,138,0.25)', background: '#fff' }} />
                    Available
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="dp-legend-dot" style={{ background: '#e5e7eb' }} />
                    Booked
                  </div>
                </div>
              </div>
            </div>
            <div className="dp-card-body">
              {/* Date row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
                {days.map((dayObj, idx) => {
                  const iso = format(dayObj.date, 'yyyy-MM-dd')
                  const isSel = selectedDate === iso
                  return (
                    <button
                      key={idx}
                      className={`dp-date-btn${isSel ? ' selected' : ''}`}
                      onClick={() => setSelectedDate(iso)}
                    >
                      <div className="dp-date-day" style={{ color: isSel ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>{dayObj.dayLabel}</div>
                      <div className="dp-date-num" style={{ color: isSel ? '#fff' : '#1B4F8A' }}>{dayObj.dateLabel}</div>
                    </button>
                  )
                })}
              </div>

              {/* Slots */}
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9ca3af' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(27,79,138,0.2)', borderTopColor: '#1B4F8A', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                  Loading slots…
                </div>
              ) : slotsForSelectedDate.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {slotsForSelectedDate.map((slot, idx) => (
                    <button key={idx} className="dp-slot" disabled={slot.slotbooked}>
                      {slot.slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No slots available for this day</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3 — RATINGS
        ══════════════════════════════════════════════════════════ */}
        {activeKey === 3 && (
          <>
            {ratingsData ? (
              <>
                {/* Rating summary banner */}
                <div className="dp-rating-bar" style={{ animationDelay: '.05s', animation: 'fadeUp .5s ease both' }}>
                  <div className="dp-rating-tile">
                    <div className="dp-rating-icon">👨‍⚕️</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <div className="dp-rating-val">{ratingsData?.doctorRating ?? '—'}</div>
                        <div className="dp-rating-max">/ 5</div>
                      </div>
                      <div className="dp-rating-lbl">Doctor Overall Rating</div>
                    </div>
                  </div>
                  <div className="dp-rating-tile">
                    <div className="dp-rating-icon">🏥</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <div className="dp-rating-val">{ratingsData?.hospitalRating ?? '—'}</div>
                        <div className="dp-rating-max">/ 5</div>
                      </div>
                      <div className="dp-rating-lbl">Hospital Overall Rating</div>
                    </div>
                  </div>
                </div>

                {/* Feedback list */}
                <div className="dp-section-label" style={{ marginBottom: 14 }}>💬 Patient Feedback</div>
                {ratingsData?.comments?.length ? (
                  ratingsData.comments.map((fb, idx) => (
                    <div key={idx} className="dp-feedback" style={{ animationDelay: `${idx * 0.06}s` }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div className="dp-feedback-avatar">P{idx + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <div className="dp-feedback-name">{fb.patientName || 'Anonymous'}</div>
                              <div className="dp-feedback-time">
                                {fb.dateAndTimeAtRating
                                  ? formatDistanceToNow(
                                      parse(fb.dateAndTimeAtRating, 'dd-MM-yyyy hh:mm:ss a', new Date()),
                                      { addSuffix: true }
                                    )
                                  : 'Unknown time'}
                              </div>
                            </div>
                            {fb.doctorRating && (
                              <div className="dp-feedback-rating">⭐ {fb.doctorRating} / 5</div>
                            )}
                          </div>
                          <div className="dp-feedback-text">
                            {fb.feedback?.trim() || 'No feedback provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: 13 }}>No patient feedback available</p>
                )}
              </>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No ratings or comments available.</p>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4 — SERVICES
        ══════════════════════════════════════════════════════════ */}
        {activeKey === 4 && (
          <div className="dp-card" style={{ animation: 'fadeUp .5s ease both' }}>
            <div className="dp-card-header">
              <div className="dp-card-header-icon">🛠</div>
              <div className="dp-card-title">Categories & Services</div>
            </div>
            <div className="dp-card-body">
              <CRow style={{ rowGap: 24 }}>
                <CCol md={4}>
                  <div className="dp-section-label">📌 Categories</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {doctorDetails?.category?.length
                      ? doctorDetails.category.map(c => (
                          <span key={c.categoryId} className="dp-service-tag">{c.categoryName}</span>
                        ))
                      : <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No categories listed</p>
                    }
                  </div>
                </CCol>
                <CCol md={4}>
                  <div className="dp-section-label">🛠 Services</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {doctorDetails?.service?.length
                      ? doctorDetails.service.map(s => (
                          <span key={s.serviceId} className="dp-service-tag">{s.serviceName}</span>
                        ))
                      : <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No services listed</p>
                    }
                  </div>
                </CCol>
                <CCol md={4}>
                  <div className="dp-section-label">🔧 Sub Services</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {doctorDetails?.subServices?.length
                      ? doctorDetails.subServices.map((sub, i) => (
                          <span key={i} className="dp-service-tag">
                            {typeof sub === 'string' ? sub : sub.subServiceName || 'Unnamed'}
                          </span>
                        ))
                      : <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No sub-services listed</p>
                    }
                  </div>
                </CCol>
              </CRow>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export default DoctorProfile