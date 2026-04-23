import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CForm, CFormInput, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilLowVision, cilEyedropper, cilLockLocked } from '@coreui/icons'
import launcherIcon from '../../../assets/images/ic_launcher.png'
import Doctor from '../../../assets/images/Group 11.png'
import logo from '../../../assets/images/sat.png'
import { postLogin, getDoctorDetails, getClinicDetails } from '../../../Auth/Auth'
import { COLORS } from '../../../Themes'
import { useToast } from '../../../utils/Toaster'
import { useDoctorContext } from '../../../Context/DoctorContext'

/* ─── Keyframes & global styles ─────────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  html, body, #root { height:100%; overflow:hidden; margin:0; padding:0; }

  @keyframes floatUp {
    from { opacity:0; transform:translateY(40px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes cardReveal {
    from { opacity:0; transform:translateY(30px) scale(.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes spin {
    to { transform:rotate(360deg); }
  }
  @keyframes orbFloat1 {
    0%,100% { transform:translate(0,0) scale(1); }
    33%     { transform:translate(60px,-40px) scale(1.08); }
    66%     { transform:translate(-30px,50px) scale(0.94); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform:translate(0,0) scale(1); }
    40%     { transform:translate(-70px,30px) scale(1.12); }
    80%     { transform:translate(40px,-60px) scale(0.9); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform:translate(0,0); }
    50%     { transform:translate(50px,80px); }
  }
  @keyframes gridDrift {
    0%   { transform:translateX(0) translateY(0); }
    100% { transform:translateX(60px) translateY(60px); }
  }
  @keyframes particleRise {
    0%   { opacity:0; transform:translateY(0) scale(0.5); }
    20%  { opacity:0.8; }
    100% { opacity:0; transform:translateY(-180px) scale(1.2); }
  }
  @keyframes crossPulse {
    0%,100% { opacity:0.12; transform:scale(1) rotate(0deg); }
    50%     { opacity:0.22; transform:scale(1.15) rotate(5deg); }
  }
  @keyframes lineGrow {
    from { width:0; opacity:0; }
    to   { width:56px; opacity:1; }
  }
  @keyframes shimmerText {
    0%   { background-position:-200% center; }
    100% { background-position:200% center; }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow:0 0 0 1px rgba(245,166,35,0.2), 0 32px 80px rgba(0,0,0,0.45); }
    50%     { box-shadow:0 0 0 1px rgba(245,166,35,0.45), 0 32px 80px rgba(0,0,0,0.45), 0 0 40px rgba(245,166,35,0.08); }
  }
  @keyframes pillSlide {
    from { opacity:0; transform:translateX(-24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes iconBob {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-6px); }
  }
  @keyframes stripFlow {
    0%   { background-position:200% center; }
    100% { background-position:-200% center; }
  }
  @keyframes scanLine {
    0%   { top:0%; opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:1; }
    100% { top:100%; opacity:0; }
  }
  @keyframes hexRotate {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes hexRotateRev {
    from { transform:rotate(360deg); }
    to   { transform:rotate(0deg); }
  }
  @keyframes glassShimmer {
    0%   { background-position:-200% 0; }
    100% { background-position:200% 0; }
  }

  .login-input {
    transition: border-color .22s, box-shadow .22s, background .22s !important;
    background: rgba(15,25,35,0.06) !important;
  }
  .login-input:focus {
    border-color: #F5A623 !important;
    box-shadow: 0 0 0 3px rgba(245,166,35,0.18) !important;
    background: rgba(255,255,255,0.9) !important;
    outline: none !important;
  }
  .login-input::placeholder {
    color: rgba(27,79,138,0.32) !important;
    font-size: 13px;
  }
  .sign-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 36px rgba(27,79,138,0.45) !important;
  }
  .sign-btn:active:not(:disabled) {
    transform: translateY(0) scale(.98);
  }
`

/* ─── Canvas particle system ─────────────────────────────────────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.6 ? '#F5A623' : '#ffffff',
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })
      // Draw faint connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = '#ffffff'
            ctx.globalAlpha = (1 - dist / 90) * 0.07
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}/>
}

/* ─── Stat Pill ──────────────────────────────────────────────────────────── */
const Pill = ({ icon, label, value, delay }) => (
  <div style={{
    display:'flex', alignItems:'center', gap:12,
    background:'rgba(255,255,255,0.07)',
    backdropFilter:'blur(16px)',
    WebkitBackdropFilter:'blur(16px)',
    border:'1px solid rgba(255,255,255,0.14)',
    borderRadius:14, padding:'10px 20px',
    animation:`pillSlide .6s ease both`,
    animationDelay: delay,
    transition:'background .2s, border-color .2s',
  }}>
    <div style={{
      width:36, height:36, borderRadius:10,
      background:'rgba(245,166,35,0.15)',
      border:'1px solid rgba(245,166,35,0.25)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:16,
    }}>{icon}</div>
    <div>
      <div style={{ color:'#F5A623', fontWeight:800, fontSize:17, lineHeight:1.1, fontFamily:"'Outfit',sans-serif" }}>{value}</div>
      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11.5, marginTop:1 }}>{label}</div>
    </div>
  </div>
)

/* ─── Hex Ring decoration ────────────────────────────────────────────────── */
const HexRing = ({ size, x, y, color, dur, rev }) => (
  <div style={{
    position:'absolute', left:x, top:y,
    width:size, height:size,
    border:`1px solid ${color}`,
    borderRadius:'50%',
    animation:`${rev ? 'hexRotateRev' : 'hexRotate'} ${dur}s linear infinite`,
    pointerEvents:'none',
    opacity:0.25,
  }}/>
)

/* ══════════════════════════════════════════════════════════════════════════ */
const Login = () => {
  const [userName, setUserName]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]             = useState({})
  const [loading, setLoading]           = useState(false)
  const [mounted, setMounted]           = useState(false)

  const navigate  = useNavigate()
  const { success } = useToast()
  const { setDoctorId, setHospitalId, setDoctorDetails, setClinicDetails } = useDoctorContext()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); document.body.style.overflow = 'auto' }
  }, [])

  const validate = () => {
    const e = {}
    if (!userName.trim()) e.userName = 'Username is required'
    if (!password.trim()) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleLogin = async (evt) => {
    evt.preventDefault()
    if (!validate()) return
    setLoading(true); setErrors({})
    try {
      ;['doctorId','hospitalId','doctorDetails','clinicDetails','sessionKey']
        .forEach(k => localStorage.removeItem(k))
      const res = await postLogin({ username: userName, password, fcmToken:'fcmToken' }, '/login')
      if (res.success) {
        const { staffId, hospitalId } = res.data
        localStorage.setItem('sessionKey', Date.now())
        localStorage.setItem('doctorId',   staffId)
        localStorage.setItem('hospitalId', hospitalId)
        const dd = await getDoctorDetails()
        const cd = await getClinicDetails()
        if (dd && cd) {
          localStorage.setItem('doctorDetails', JSON.stringify(dd))
          localStorage.setItem('clinicDetails',  JSON.stringify(cd))
          setDoctorId(staffId); setHospitalId(hospitalId)
          setDoctorDetails(dd); setClinicDetails(cd)
          success(res.message || 'Login successful!')
          navigate('/dashboard')
        }
      } else { setErrors({ login: res.message || 'Login failed' }) }
    } catch (err) {
      setErrors({ login: err.response?.data?.message || 'Login error occurred' })
    } finally { setLoading(false) }
  }

  const A = (delay) => mounted ? { animation:`floatUp .72s ease ${delay}s both` } : { opacity:0 }

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* ── PAGE SHELL ──────────────────────────────────────────────────── */}
      <div style={{
        width:'100vw', height:'100vh', overflow:'hidden',
        display:'flex', position:'relative',
        fontFamily:"'DM Sans',sans-serif",
        background:'linear-gradient(135deg, #060e1a 0%, #0d1e36 40%, #0a1628 70%, #111827 100%)',
      }}>

        {/* ── ANIMATED CANVAS PARTICLES ─────────────────────────────── */}
        <ParticleCanvas />

        {/* ── LARGE GLOWING ORBS ────────────────────────────────────── */}
        <div style={{
          position:'absolute', top:'-20%', left:'-10%',
          width:'55vw', height:'55vw', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(27,79,138,0.28) 0%, transparent 70%)',
          animation:'orbFloat1 18s ease-in-out infinite',
          pointerEvents:'none', filter:'blur(1px)',
        }}/>
        <div style={{
          position:'absolute', bottom:'-15%', right:'-5%',
          width:'45vw', height:'45vw', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(245,166,35,0.14) 0%, transparent 70%)',
          animation:'orbFloat2 22s ease-in-out 3s infinite',
          pointerEvents:'none', filter:'blur(1px)',
        }}/>
        <div style={{
          position:'absolute', top:'40%', left:'42%',
          width:'22vw', height:'22vw', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(42,109,181,0.18) 0%, transparent 70%)',
          animation:'orbFloat3 14s ease-in-out 1s infinite',
          pointerEvents:'none',
        }}/>

        {/* ── SUBTLE GRID OVERLAY ───────────────────────────────────── */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
          backgroundImage:`
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize:'60px 60px',
          animation:'gridDrift 40s linear infinite',
          opacity:0.6,
        }}/>

        {/* ── SCAN LINE EFFECT ──────────────────────────────────────── */}
        <div style={{
          position:'absolute', left:0, right:0, height:'2px',
          background:'linear-gradient(90deg,transparent,rgba(245,166,35,0.08),transparent)',
          animation:'scanLine 10s ease-in-out 2s infinite',
          pointerEvents:'none', zIndex:1,
        }}/>

        {/* ── ROTATING HEX RINGS ────────────────────────────────────── */}
        <HexRing size={300} x="-80px" y="-80px"      color="rgba(245,166,35,0.2)"  dur={28} rev={false}/>
        <HexRing size={180} x="-50px" y="-50px"      color="rgba(27,79,138,0.35)"  dur={18} rev={true}/>
        <HexRing size={220} x="calc(100vw - 160px)" y="calc(100vh - 160px)" color="rgba(245,166,35,0.15)" dur={34} rev={false}/>
        <HexRing size={140} x="calc(100vw - 130px)" y="calc(100vh - 130px)" color="rgba(42,109,181,0.3)"  dur={22} rev={true}/>

        {/* ── MEDICAL CROSS DECORATIONS ─────────────────────────────── */}
        {[
          { x:'4%',  y:'12%', s:28, delay:0,   op:0.18 },
          { x:'9%',  y:'58%', s:36, delay:0.9, op:0.10 },
          { x:'27%', y:'76%', s:20, delay:1.7, op:0.12 },
        ].map((c,i) => (
          <div key={i} style={{
            position:'absolute', left:c.x, top:c.y,
            opacity:c.op, pointerEvents:'none',
            animation:`crossPulse 5s ease-in-out ${c.delay}s infinite`,
          }}>
            <svg width={c.s} height={c.s} viewBox="0 0 32 32">
              <rect x="12" y="2"  width="8" height="28" rx="3" fill="#F5A623"/>
              <rect x="2"  y="12" width="28" height="8"  rx="3" fill="#F5A623"/>
            </svg>
          </div>
        ))}

        {/* ── FLOATING RISE PARTICLES ───────────────────────────────── */}
        {[
          { x:'6%',  y:'75%', s:5, d:'.2s',  c:'rgba(245,166,35,.6)' },
          { x:'13%', y:'60%', s:3, d:'1.4s', c:'rgba(255,255,255,.3)' },
          { x:'20%', y:'80%', s:6, d:'.8s',  c:'rgba(245,166,35,.4)' },
          { x:'3%',  y:'88%', s:4, d:'2.2s', c:'rgba(255,255,255,.25)' },
          { x:'17%', y:'70%', s:5, d:'.5s',  c:'rgba(245,166,35,.5)' },
        ].map((p,i) => (
          <div key={i} style={{
            position:'absolute', left:p.x, top:p.y,
            width:p.s, height:p.s, borderRadius:'50%',
            background:p.c, opacity:0, pointerEvents:'none',
            animation:`particleRise 8s ease-in-out ${p.d} infinite`,
          }}/>
        ))}

        {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
        <div style={{
          flex:'0 0 52%', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'0 5vw', position:'relative', zIndex:2,
        }}>

          {/* Live badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:7,
            background:'rgba(245,166,35,0.1)',
            border:'1px solid rgba(245,166,35,0.25)',
            borderRadius:20, padding:'5px 14px',
            marginBottom:24,
            ...A(0),
          }}>
            <div style={{
              width:6, height:6, borderRadius:'50%', background:'#F5A623',
              boxShadow:'0 0 6px rgba(245,166,35,0.8)',
            }}/>
            <span style={{ fontSize:11, fontWeight:600, color:'#F5A623', letterSpacing:'.1em', textTransform:'uppercase', fontFamily:"'Outfit',sans-serif" }}>
              Healthcare Platform
            </span>
          </div>

          {/* App icon */}
          <img src={launcherIcon} alt="App icon" style={{
            height:88, marginBottom:20,
            filter:'drop-shadow(0 12px 32px rgba(245,166,35,0.3))',
            animation: mounted ? `iconBob 4s ease-in-out 1s infinite, floatUp .7s ease 0s both` : 'none',
          }}/>

          {/* Title block */}
          <div style={{ textAlign:'center', maxWidth:460, ...A(.15) }}>
            <h1 style={{
              fontFamily:"'Outfit',sans-serif",
              fontSize:'clamp(26px,3.2vw,40px)', fontWeight:800,
              lineHeight:1.18, color:'#fff',
              marginBottom:8, letterSpacing:'-0.028em',
            }}>
              Chiselon{' '}
              <span style={{
                background:'linear-gradient(90deg,#F5A623 0%,#ffd17a 40%,#F5A623 80%)',
                backgroundSize:'200% auto',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent',
                animation:'shimmerText 2.8s linear infinite',
              }}>
                Clinic
              </span>
              {' '}Management<br/>System
            </h1>

            {/* Animated underline */}
            <div style={{
              height:3, background:'linear-gradient(90deg,#F5A623,#ffd17a)',
              borderRadius:2, margin:'0 auto 16px',
              animation: mounted ? 'lineGrow .9s ease .5s both' : 'none',
              width: mounted ? undefined : 0,
            }}/>

            <p style={{
              color:'rgba(255,255,255,0.42)', fontSize:13,
              marginBottom:32, letterSpacing:'.04em',
              fontFamily:"'Outfit',sans-serif", fontWeight:300,
            }}>
              Powered by Chiselon Technologies
            </p>
          </div>

       

          {/* Ghost doctor image */}
          <img src={Doctor} alt="" aria-hidden="true" style={{
            position:'absolute', bottom:0, right:-20,
            maxHeight:'72%', objectFit:'contain',
            opacity:.08, pointerEvents:'none', zIndex:0,
            filter:'saturate(0) brightness(3)',
          }}/>
        </div>

        {/* ── DIVIDER ────────────────────────────────────────────────── */}
        <div style={{
          width:1,
          background:'linear-gradient(to bottom, transparent, rgba(245,166,35,0.3) 30%, rgba(255,255,255,0.12) 70%, transparent)',
          alignSelf:'stretch', margin:'60px 0', flexShrink:0, zIndex:2,
        }}/>

        {/* ══ RIGHT PANEL ══════════════════════════════════════════════ */}
        <div style={{
          flex:'0 0 48%', display:'flex',
          alignItems:'center', justifyContent:'center',
          padding:'24px 44px', zIndex:2,
        }}>
          <div style={{
            width:'100%', maxWidth:400,
            background:'rgba(255,255,255,0.07)',
            backdropFilter:'blur(28px)',
            WebkitBackdropFilter:'blur(28px)',
            borderRadius:24,
            border:'1px solid rgba(255,255,255,0.12)',
            overflow:'hidden',
            animation: mounted ? `cardReveal .72s cubic-bezier(.22,.97,.58,1) .1s both, borderGlow 4s ease-in-out 1s infinite` : 'none',
          }}>

            {/* Top shimmer strip */}
            <div style={{
              height:4,
              background:'linear-gradient(90deg,#1B4F8A 0%,#F5A623 40%,#ffd17a 60%,#1B4F8A 100%)',
              backgroundSize:'200% auto',
              animation:'stripFlow 3s linear infinite',
            }}/>

            {/* Glass inner shimmer bar */}
            <div style={{
              height:1,
              background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',
              backgroundSize:'200% auto',
              animation:'glassShimmer 6s linear infinite',
            }}/>

            <div style={{ padding:'1.8rem 2rem 2rem' }}>

              {/* Brand row */}
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                marginBottom:20, ...A(.25),
              }}>
                <div style={{
                  width:36, height:36,
                  background:'rgba(245,166,35,0.15)',
                  border:'1px solid rgba(245,166,35,0.3)',
                  borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:"'Outfit',sans-serif", lineHeight:1 }}>Chiselon</div>
                  <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.38)', marginTop:1 }}>Doctor Portal</div>
                </div>
              </div>

              {/* Logo */}
              <div style={{ textAlign:'center', marginBottom:20, ...A(.3) }}>
                <img src={logo} alt="Logo" style={{
                  height:44, marginBottom:12,
                  filter:'brightness(0) invert(1)',
                  opacity:0.9,
                }}/>
                <h3 style={{
                  fontFamily:"'Outfit',sans-serif",
                  fontSize:22, fontWeight:800,
                  color:'#fff', marginBottom:3, letterSpacing:'-0.015em',
                }}>
                  Welcome Back
                </h3>
                <p style={{ color:'rgba(255,255,255,0.42)', fontSize:13, margin:0 }}>
                  Sign in to your doctor portal
                </p>
              </div>

              {/* Error */}
              {errors.login && (
                <CAlert color="danger" style={{
                  fontSize:13, borderRadius:10, padding:'.5rem .85rem',
                  marginBottom:14, background:'rgba(220,53,69,0.15)',
                  border:'1px solid rgba(220,53,69,0.35)', color:'#ff8a8a',
                }}>
                  {errors.login}
                </CAlert>
              )}

              <CForm onSubmit={handleLogin} noValidate>

                {/* ── Username ── */}
                <div style={{ marginBottom:14 }}>
                  <label style={{
                    fontSize:10.5, fontWeight:700,
                    color:'rgba(245,166,35,0.85)',
                    letterSpacing:'.1em', textTransform:'uppercase',
                    display:'block', marginBottom:6,
                    fontFamily:"'Outfit',sans-serif",
                  }}>Username</label>
                  <div style={{ position:'relative' }}>
                  <CFormInput
   className="li"
  type="text"
  placeholder="Username or Mobile"
  value={userName}
  onChange={(e) => { setUserName(e.target.value); setErrors(p=>({...p,userName:'',login:''})) }}
  style={{
    paddingRight:'2.5rem', paddingLeft:'0.9rem',
    paddingTop:'0.66rem', paddingBottom:'0.66rem',
    borderRadius:10, fontSize:14,
    borderColor: errors.userName ? '#dc3545' : 'rgba(255,255,255,0.14)',
       color:'#1a1a2e',     // ← was '#fff', change to dark color
  
  }}
/>
                      <CIcon icon={cilUser} style={{ position:'absolute', top:'50%', right:'0.8rem', transform:'translateY(-50%)', color:'#1B4F8A', pointerEvents:'none' }}/>
                  </div>
                  {errors.userName && <div style={{ fontSize:11.5, color:'#ff8a8a', marginTop:4 }}>{errors.userName}</div>}
                </div>

                {/* ── Password ── */}
                 {/* Password */}
                <div style={{ marginBottom:6 }}>
                  <label style={{
                     fontSize:10.5, fontWeight:700,
                    color:'rgba(245,166,35,0.85)',
                    letterSpacing:'.1em', textTransform:'uppercase',
                    display:'block', marginBottom:6,
                    fontFamily:"'Outfit',sans-serif",
                  }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <CFormInput
                      className="li"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(p=>({...p,password:'',login:''})) }}
                      style={{
                        paddingRight:'2.5rem', paddingLeft:'0.9rem',
                        paddingTop:'0.65rem', paddingBottom:'0.65rem',
                        borderRadius:10, fontSize:14,
                        borderColor: errors.password ? '#dc3545' : 'rgba(27,79,138,0.22)',
                        color:'#1a1a2e',
                      }}
                    />
                    <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position:'absolute', top:'50%', right:'0.8rem', transform:'translateY(-50%)', background:'none', border:'none', padding:0, color:'#1B4F8A', cursor:'pointer' }}
                    >
                      <CIcon icon={showPassword ? cilLowVision : cilEyedropper}/>
                    </button>
                  </div>

                  {errors.password && <div style={{ fontSize:11.5, color:'#ff8a8a', marginTop:4 }}>{errors.password}</div>}
                </div>

                {/* Forgot link */}
                <div style={{ textAlign:'right', marginBottom:18 }}>
                  <a href="#" style={{
                    fontSize:11.5, color:'rgba(245,166,35,0.7)',
                    textDecoration:'none', fontWeight:600,
                    fontFamily:"'Outfit',sans-serif",
                    letterSpacing:'.02em',
                  }}>Forgot password?</a>
                </div>

                {/* ── Submit ── */}
                <button
                  type="submit"
                  disabled={loading}
                  className="sign-btn"
                  style={{
                    width:'100%',
                    padding:'0.78rem',
                    background: loading
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(90deg,#1B4F8A 0%,#2468b8 50%,#1B4F8A 100%)',
                    backgroundSize:'200% auto',
                    animation: loading ? 'none' : 'stripFlow 3s linear infinite',
                    border:'1px solid rgba(255,255,255,0.12)',
                    borderRadius:12,
                    color:'#fff', fontWeight:700, fontSize:15,
                    letterSpacing:'.04em',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition:'all .22s ease',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(27,79,138,0.4)',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                    fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width:15, height:15, borderRadius:'50%',
                        border:'2.5px solid rgba(255,255,255,0.25)',
                        borderTopColor:'#fff', display:'inline-block',
                        animation:'spin .7s linear infinite',
                      }}/>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilLockLocked} style={{ width:16, height:16 }}/>
                      Sign In
                    </>
                  )}
                </button>

              </CForm>

              {/* Footer */}
              <p style={{
                textAlign:'center', marginTop:18,
                fontSize:11, color:'rgba(255,255,255,0.22)',
                letterSpacing:'.05em',
              }}>
                🔒 Secure · Encrypted · Chiselon Technologies
              </p>
            </div>

            {/* Bottom strip */}
            <div style={{
              height:3,
              background:'linear-gradient(90deg,#F5A623 0%,#ffd17a 50%,#F5A623 100%)',
              backgroundSize:'200% auto',
              animation:'stripFlow 3.5s linear infinite',
            }}/>
          </div>
        </div>

      </div>
    </>
  )
}

export default Login