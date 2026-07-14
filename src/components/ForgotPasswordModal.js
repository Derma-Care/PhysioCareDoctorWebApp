import React, { useState } from 'react'
import api from '../Auth/axiosInterceptor'
import { ipUrl } from '../Auth/BaseUrl'

/* ── shared input style ─────────────────────────────────────────── */
const inputStyle = (hasError) => ({
  width: '100%',
  padding: '.62rem .9rem',
  borderRadius: 10,
  fontSize: 13.5,
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: `1.5px solid ${hasError ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'}`,
  color: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color .2s, box-shadow .2s',
})

const labelStyle = {
  fontSize: 10.5,
  fontWeight: 700,
  color: 'rgba(245,166,35,0.85)',
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 5,
}

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

/* ══════════════════════════════════════════════════════════════════ */
const STEPS = ['mobile', 'otp', 'password']

const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState('mobile')

  // Step 1
  const [mobile, setMobile] = useState('')
  const [mobileError, setMobileError] = useState('')
  const [mobileLoading, setMobileLoading] = useState(false)
  const [otpInfo, setOtpInfo] = useState('')   // e.g. "OTP sent to test***@mail.com"

  // Step 2
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  // Step 3
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdErrors, setPwdErrors] = useState({})
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [apiError, setApiError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const clearAlerts = () => { setApiError(''); setSuccessMsg('') }

  /* ── Step 1: Send OTP ──────────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e.preventDefault()
    clearAlerts()
    if (!mobile.trim()) { setMobileError('Mobile number is required'); return }
    if (!/^\\d{10}$/.test(mobile.trim())) { setMobileError('Enter a valid 10-digit mobile number'); return }
    setMobileError('')
    setMobileLoading(true)
    try {
      // DUMMY IMPLEMENTATION FOR TESTING
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate success
      setOtpInfo('OTP has been sent to your registered email ID (dummy).')
      setStep('otp')
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setMobileLoading(false)
    }
  }

  /* ── Step 2: Verify OTP ────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    clearAlerts()
    if (!otp.trim()) { setOtpError('Please enter the OTP'); return }
    if (!/^\\d{4,8}$/.test(otp.trim())) { setOtpError('Enter a valid OTP'); return }
    setOtpError('')
    setOtpLoading(true)
    try {
      // DUMMY IMPLEMENTATION FOR TESTING
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Simulate success (or fail if OTP is '0000')
      if (otp === '0000') throw new Error('Invalid OTP')
      
      setStep('password')
    } catch (err) {
      setOtpError(err.message || err?.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  /* ── Step 3: Reset Password ────────────────────────────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault()
    clearAlerts()
    const errs = {}
    if (!newPwd.trim()) errs.newPwd = 'New password is required'
    else if (newPwd.length < 6) errs.newPwd = 'Minimum 6 characters'
    if (!confirmPwd.trim()) errs.confirmPwd = 'Please confirm the password'
    else if (newPwd !== confirmPwd) errs.confirmPwd = 'Passwords do not match'
    setPwdErrors(errs)
    if (Object.keys(errs).length) return
    setPwdLoading(true)
    try {
      // DUMMY IMPLEMENTATION FOR TESTING
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSuccessMsg('Password reset successfully! You can now sign in with your new password.')
      setTimeout(() => onClose(), 2800)
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setPwdLoading(false)
    }
  }

  /* ── Shared top banner ─────────────────────────────────────────── */
  const stepMeta = {
    mobile:   { icon: '📱', title: 'Forgot Password', sub: 'Enter your registered mobile number' },
    otp:      { icon: '✉️', title: 'Verify OTP',      sub: 'Check your registered email for the OTP' },
    password: { icon: '🔐', title: 'Reset Password',   sub: 'Set your new password' },
  }
  const { icon, title, sub } = stepMeta[step]

  const stepIndex = STEPS.indexOf(step)

  return (
    <div
      id="forgot-pwd-overlay"
      onClick={(e) => { if (e.target.id === 'forgot-pwd-overlay') onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(6,14,26,0.85)',
        backdropFilter: 'blur(9px)',
        WebkitBackdropFilter: 'blur(9px)',
        animation: 'fadeIn .22s ease both',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 420, margin: '0 16px',
        backgroundColor: 'rgba(13,30,54,0.97)',
        border: '1px solid rgba(245,166,35,0.22)',
        borderRadius: 22, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        animation: 'cardReveal .3s cubic-bezier(.22,.97,.58,1) both',
      }}>
        {/* top shimmer */}
        <div style={{ height: 4, backgroundImage: 'linear-gradient(90deg,#1B4F8A 0%,#F5A623 40%,#ffd17a 60%,#1B4F8A 100%)', backgroundSize: '200% auto', animation: 'stripFlow 3s linear infinite' }} />

        <div style={{ padding: '1.6rem 1.8rem 1.8rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
            <button type="button" id="close-forgot-btn" onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 16 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.18)'; e.currentTarget.style.color = '#ff8a8a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >✕</button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: i <= stepIndex ? '#F5A623' : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${i <= stepIndex ? '#F5A623' : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i <= stepIndex ? '#000' : 'rgba(255,255,255,0.4)',
                  transition: 'all .3s',
                }}>{i + 1}</div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: i < stepIndex ? '#F5A623' : 'rgba(255,255,255,0.1)', transition: 'background .3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Alerts */}
          {successMsg && (
            <div style={{ backgroundColor: 'rgba(34,197,94,0.13)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '.6rem .9rem', marginBottom: 14, fontSize: 12.5, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✅</span> {successMsg}
            </div>
          )}
          {apiError && (
            <div style={{ backgroundColor: 'rgba(220,53,69,0.13)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 10, padding: '.6rem .9rem', marginBottom: 14, fontSize: 12.5, color: '#ff8a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> {apiError}
            </div>
          )}

          {/* ── STEP 1: Mobile ── */}
          {step === 'mobile' && (
            <form onSubmit={handleSendOtp} noValidate>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Registered Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="forgot-mobile-input"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={e => { setMobile(e.target.value.replace(/\\D/g, '')); setMobileError(''); clearAlerts() }}
                    style={{ ...inputStyle(!!mobileError), paddingRight: '2.4rem' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                    onBlur={e => { e.target.style.borderColor = mobileError ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                  />
                  <span style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: 15, pointerEvents: 'none' }}>📱</span>
                </div>
                {mobileError && <div style={{ fontSize: 11, color: '#ff8a8a', marginTop: 3 }}>{mobileError}</div>}
              </div>
              <SubmitBtn loading={mobileLoading} label="Send OTP" />
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} noValidate>
              {otpInfo && (
                <div style={{ backgroundColor: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 10, padding: '.6rem .9rem', marginBottom: 14, fontSize: 12.5, color: '#ffd17a', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span>📧</span> {otpInfo}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Enter OTP</label>
                <input
                  id="forgot-otp-input"
                  type="text"
                  maxLength={8}
                  placeholder="Enter OTP sent to your email"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\\D/g, '')); setOtpError(''); clearAlerts() }}
                  style={{
                    ...inputStyle(!!otpError),
                    fontSize: 22, letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700,
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = otpError ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                />
                {otpError && <div style={{ fontSize: 11, color: '#ff8a8a', marginTop: 3 }}>{otpError}</div>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => { setStep('mobile'); clearAlerts() }}
                  style={{ flex: 1, padding: '.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 11, color: 'rgba(255,255,255,0.65)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                <div style={{ flex: 2 }}><SubmitBtn loading={otpLoading} label="Verify OTP" /></div>
              </div>
              <button type="button" onClick={handleSendOtp}
                style={{ marginTop: 10, background: 'none', border: 'none', color: 'rgba(245,166,35,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', display: 'block', width: '100%', textAlign: 'center' }}>
                Resend OTP
              </button>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} noValidate>
              {/* Mobile (read-only) */}
              <div style={{ marginBottom: 12, padding: '.5rem .85rem', backgroundColor: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.18)', borderRadius: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📱</span> Mobile: <span style={{ color: '#F5A623', fontWeight: 700 }}>{mobile}</span>
              </div>

              {[
                { id: 'forgot-new-pwd', label: 'New Password', val: newPwd, setVal: setNewPwd, show: showNew, setShow: setShowNew, err: pwdErrors.newPwd, key: 'newPwd' },
                { id: 'forgot-confirm-pwd', label: 'Confirm Password', val: confirmPwd, setVal: setConfirmPwd, show: showConfirm, setShow: setShowConfirm, err: pwdErrors.confirmPwd, key: 'confirmPwd' },
              ].map(({ id, label, val, setVal, show, setShow, err, key }) => (
                <div key={key} style={{ marginBottom: 13 }}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id={id}
                      type={show ? 'text' : 'password'}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      value={val}
                      onChange={e => { setVal(e.target.value); setPwdErrors(p => ({ ...p, [key]: '' })); clearAlerts() }}
                      style={{ ...inputStyle(!!err), paddingRight: '2.6rem' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = err ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShow(v => !v)}
                      style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <EyeIcon open={show} />
                    </button>
                  </div>
                  {err && <div style={{ fontSize: 11, color: '#ff8a8a', marginTop: 3 }}>{err}</div>}
                </div>
              ))}

              <SubmitBtn loading={pwdLoading} label="🔒 Reset Password" />
            </form>
          )}
        </div>

        {/* bottom strip */}
        <div style={{ height: 3, backgroundImage: 'linear-gradient(90deg,#F5A623 0%,#ffd17a 50%,#F5A623 100%)', backgroundSize: '200% auto', animation: 'stripFlow 3.5s linear infinite' }} />
      </div>
    </div>
  )
}

/* ── Shared submit button ─────────────────────────────────────────── */
const SubmitBtn = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    style={{
      width: '100%', padding: '.7rem',
      backgroundImage: loading ? 'none' : 'linear-gradient(90deg,#1B4F8A 0%,#2468b8 50%,#1B4F8A 100%)',
      backgroundColor: loading ? 'rgba(255,255,255,0.08)' : 'transparent',
      backgroundSize: '200% auto',
      animation: loading ? 'none' : 'stripFlow 3s linear infinite',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 11, color: '#fff',
      fontSize: 13.5, fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all .22s', fontFamily: 'inherit',
      boxShadow: loading ? 'none' : '0 4px 20px rgba(27,79,138,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    }}
  >
    {loading ? (
      <>
        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
        Please wait…
      </>
    ) : label}
  </button>
)

export default ForgotPasswordModal
