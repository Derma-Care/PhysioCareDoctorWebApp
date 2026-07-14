import React, { useState, useEffect } from 'react'
import api from '../Auth/axiosInterceptor'
import { ipUrl } from '../Auth/BaseUrl'

const ResetPasswordModal = ({ onClose, initialUsername }) => {
  const [resetForm, setResetForm] = useState({ username: initialUsername || '', password: '', newPassword: '', confirmPassword: '' })
  const [resetErrors, setResetErrors] = useState({})
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetApiError, setResetApiError] = useState('')
  const [showResetPwd, setShowResetPwd] = useState({ current: false, newP: false, confirm: false })

  const validateReset = () => {
    const e = {}
    if (!resetForm.username.trim()) e.username = 'Username / Mobile is required'
    if (!resetForm.password.trim()) e.password = 'Current password is required'
    if (!resetForm.newPassword.trim()) e.newPassword = 'New password is required'
    else if (resetForm.newPassword.length < 6) e.newPassword = 'Minimum 6 characters'
    else if (resetForm.newPassword === resetForm.password.trim()) e.newPassword = 'New password must be different from current password'
    if (!resetForm.confirmPassword.trim()) e.confirmPassword = 'Please confirm new password'
    else if (resetForm.newPassword !== resetForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setResetErrors(e)
    return !Object.keys(e).length
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!validateReset()) return
    setResetLoading(true)
    setResetApiError('')
    setResetSuccess('')
    try {
      const identifier = resetForm.username.trim()
      const response = await api.put(
        `/clinic-admin/update-password/${identifier}`,
        {
          currentPassword: resetForm.password,
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword,
        },
        { baseURL: ipUrl },
      )
      const data = response.data
      if (response.status === 200 || data?.success) {
        setResetSuccess('Password updated successfully! Please sign in with your new password.')
        setTimeout(() => onClose(), 2800)
      } else {
        setResetApiError(data?.message || 'Failed to update password. Please try again.')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Network error. Please check your connection.'
      setResetApiError(msg)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div
      id="reset-password-modal-overlay"
      onClick={(e) => { if (e.target.id === 'reset-password-modal-overlay') onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(6,14,26,0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn .22s ease both',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        margin: '0 16px',
        backgroundColor: 'rgba(13,30,54,0.97)',
        border: '1px solid rgba(245,166,35,0.22)',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,166,35,0.1)',
        animation: 'cardReveal .3s cubic-bezier(.22,.97,.58,1) both',
      }}>
        {/* Top shimmer strip */}
        <div style={{
          height: 4,
          backgroundImage: 'linear-gradient(90deg,#1B4F8A 0%,#F5A623 40%,#ffd17a 60%,#1B4F8A 100%)',
          backgroundSize: '200% auto',
          animation: 'stripFlow 3s linear infinite',
        }} />

        <div style={{ padding: '1.6rem 1.8rem 1.8rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                backgroundColor: 'rgba(245,166,35,0.12)',
                border: '1px solid rgba(245,166,35,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17,
              }}>🔑</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Reset Password</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Update your account password</div>
              </div>
            </div>
            <button
              type="button"
              id="close-reset-modal-btn"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 16,
                transition: 'all .18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.18)'; e.currentTarget.style.color = '#ff8a8a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >✕</button>
          </div>

          {/* Success */}
          {resetSuccess && (
            <div style={{
              backgroundColor: 'rgba(34,197,94,0.13)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 10, padding: '.6rem .9rem',
              marginBottom: 14, fontSize: 12.5, color: '#4ade80',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>✅</span> {resetSuccess}
            </div>
          )}

          {/* API Error */}
          {resetApiError && (
            <div style={{
              backgroundColor: 'rgba(220,53,69,0.13)',
              border: '1px solid rgba(220,53,69,0.3)',
              borderRadius: 10, padding: '.6rem .9rem',
              marginBottom: 14, fontSize: 12.5, color: '#ff8a8a',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span> {resetApiError}
            </div>
          )}

          <form onSubmit={handleResetPassword} noValidate>

            {/* ── Username field ── */}
            <div style={{ marginBottom: 13 }}>
              <label style={{
                fontSize: 10.5, fontWeight: 700,
                color: 'rgba(245,166,35,0.85)',
                letterSpacing: '.1em', textTransform: 'uppercase',
                display: 'block', marginBottom: 5,
              }}>Username / Mobile</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-username-input"
                  type="text"
                  placeholder="Enter your username or mobile"
                  value={resetForm.username}
                  onChange={e => {
                    setResetForm(p => ({ ...p, username: e.target.value }))
                    setResetErrors(p => ({ ...p, username: '' }))
                    setResetApiError('')
                  }}
                  style={{
                    width: '100%', padding: '.62rem .9rem',
                    paddingRight: '2.6rem',
                    borderRadius: 10, fontSize: 13.5,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${resetErrors.username ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    color: '#fff', outline: 'none',
                    transition: 'border-color .2s, box-shadow .2s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = resetErrors.username ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                />
                <span style={{
                  position: 'absolute', top: '50%', right: '0.75rem',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.35)', fontSize: 14, pointerEvents: 'none',
                }}>👤</span>
              </div>
              {resetErrors.username && (
                <div style={{ fontSize: 11, color: '#ff8a8a', marginTop: 3 }}>{resetErrors.username}</div>
              )}
            </div>

            {/* ── Password fields ── */}
            {[{ key: 'password', label: 'Current Password', placeholder: 'Enter current password', showKey: 'current' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Enter new password', showKey: 'newP' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Confirm your new password', showKey: 'confirm' }]
              .map(({ key, label, placeholder, showKey }) => (
                <div key={key} style={{ marginBottom: 13 }}>
                  <label style={{
                    fontSize: 10.5, fontWeight: 700,
                    color: 'rgba(245,166,35,0.85)',
                    letterSpacing: '.1em', textTransform: 'uppercase',
                    display: 'block', marginBottom: 5,
                  }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id={`reset-${key}-input`}
                      type={showResetPwd[showKey] ? 'text' : 'password'}
                      placeholder={placeholder}
                      value={resetForm[key]}
                      onChange={e => {
                        setResetForm(p => ({ ...p, [key]: e.target.value }))
                        setResetErrors(p => ({ ...p, [key]: '' }))
                        setResetApiError('')
                      }}
                      style={{
                        width: '100%', padding: '.62rem .9rem',
                        paddingRight: '2.6rem',
                        borderRadius: 10, fontSize: 13.5,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${resetErrors[key] ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        color: '#fff', outline: 'none',
                        transition: 'border-color .2s, box-shadow .2s',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = resetErrors[key] ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowResetPwd(p => ({ ...p, [showKey]: !p[showKey] }))}
                      style={{
                        position: 'absolute', top: '50%', right: '0.75rem',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', padding: 0,
                        color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                        fontSize: 13, lineHeight: 1,
                      }}
                    >{showResetPwd[showKey] ? '🙈' : '👁'}</button>
                  </div>
                  {resetErrors[key] && (
                    <div style={{ fontSize: 11, color: '#ff8a8a', marginTop: 3 }}>{resetErrors[key]}</div>
                  )}
                </div>
              ))}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                id="cancel-reset-btn"
                onClick={onClose}
                style={{
                  flex: 1, padding: '.7rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 11, color: 'rgba(255,255,255,0.65)',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .18s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              >Cancel</button>
              <button
                type="submit"
                id="submit-reset-btn"
                disabled={resetLoading}
                style={{
                  flex: 2, padding: '.7rem',
                  backgroundImage: resetLoading ? 'none' : 'linear-gradient(90deg,#1B4F8A 0%,#2468b8 50%,#1B4F8A 100%)',
                  backgroundColor: resetLoading ? 'rgba(255,255,255,0.08)' : 'transparent',
                  backgroundSize: '200% auto',
                  animation: resetLoading ? 'none' : 'stripFlow 3s linear infinite',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 11, color: '#fff',
                  fontSize: 13.5, fontWeight: 700,
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  transition: 'all .22s', fontFamily: 'inherit',
                  boxShadow: resetLoading ? 'none' : '0 4px 20px rgba(27,79,138,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                {resetLoading ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.25)',
                      borderTopColor: '#fff', display: 'inline-block',
                      animation: 'spin .7s linear infinite',
                    }} />
                    Updating…
                  </>
                ) : '🔒 Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom strip */}
        <div style={{
          height: 3,
          backgroundImage: 'linear-gradient(90deg,#F5A623 0%,#ffd17a 50%,#F5A623 100%)',
          backgroundSize: '200% auto',
          animation: 'stripFlow 3.5s linear infinite',
        }} />
      </div>
    </div>
  )
}

export default ResetPasswordModal
