import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CContainer, CRow, CCol, CCard, CCardBody, CForm, CFormInput, CButton, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilLowVision, cilEyedropper } from '@coreui/icons'
import launcherIcon from '../../../assets/images/ic_launcher.png'
import Doctor from '../../../assets/images/Group 11.png'
import logo from '../../../assets/images/sat.png'
import { postLogin, getDoctorDetails, getClinicDetails } from '../../../Auth/Auth'
import { COLORS } from '../../../Themes'
import { useToast } from '../../../utils/Toaster'
import { useDoctorContext } from '../../../Context/DoctorContext'

const Login = () => {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { success } = useToast()
  const { setDoctorId, setHospitalId, setDoctorDetails, setClinicDetails } = useDoctorContext()

  const validateLogin = () => {
    const newErrors = {}
    if (!userName.trim()) newErrors.userName = 'Username is required'
    if (!password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validateLogin()) return

    setLoading(true)
    setErrors({})

    try {
      // Clear previous login data
      localStorage.removeItem('doctorId')
      localStorage.removeItem('hospitalId')
      localStorage.removeItem('doctorDetails')
      localStorage.removeItem('clinicDetails')
      localStorage.removeItem('sessionKey')

      const response = await postLogin({ username: userName, password, fcmToken: 'fcmToken' }, '/login')

      if (response.success) {
        const { staffId, hospitalId } = response.data

        // Store new session key for this login
        const sessionKey = Date.now()
        localStorage.setItem('sessionKey', sessionKey)
        localStorage.setItem('doctorId', staffId)
        localStorage.setItem('hospitalId', hospitalId)

        const doctorDetails = await getDoctorDetails()
        const clinicDetails = await getClinicDetails()

        if (doctorDetails && clinicDetails) {
          localStorage.setItem('doctorDetails', JSON.stringify(doctorDetails))
          localStorage.setItem('clinicDetails', JSON.stringify(clinicDetails))

          setDoctorId(staffId)
          setHospitalId(hospitalId)
          setDoctorDetails(doctorDetails)
          setClinicDetails(clinicDetails)

          success(response.message || 'Login successful!')
          navigate('/dashboard')
        }
      } else {
        setErrors({ login: response.message || 'Login failed' })
      }
    } catch (err) {
      setErrors({ login: err.response?.data?.message || 'Login error occurred' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = 'auto')
  }, [])

  return (
    <CContainer fluid className="login-page d-flex align-items-center" style={{ backgroundColor: '#f6f9fc', minHeight: '100vh', position: 'relative' }}>
      <img src={Doctor} alt="Doctor" className="d-none d-md-block" style={{ position: 'absolute', bottom: 0, right: 0, maxHeight: '100%', objectFit: 'contain', zIndex: 0, opacity: 0.3 }} />
      <CRow className="w-100 g-0">
        <CCol xs={12} md={6} className="d-flex flex-column align-items-center justify-content-center text-center px-4" style={{ zIndex: 1 }}>
          <div style={{ maxWidth: 500 }}>
            <img src={launcherIcon} alt="Logo" style={{ height: 120 }} />
            <h1 style={{ backgroundImage: 'linear-gradient(90deg, #0061c2, #0196ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '40px', margin: '1rem 0', fontWeight: 'bolder' }}>
              Derma Care, Hyderabad
            </h1>
            <p style={{ color: COLORS.gray, fontSize: '20px' }}>Powered By Chiselon Technologies</p>
          </div>
        </CCol>

        <CCol xs={12} md={5} className="d-flex flex-column align-items-center justify-content-start px-4" style={{ zIndex: 1 }}>
          <CCard className="w-100 border-1 shadow-sm" style={{ maxWidth: 420, background: 'transparent' }}>
            <CCardBody className="p-4 text-center">
              <img src={logo} alt="Logo" height={60} className="mb-3" />
              <h4 style={{ backgroundImage: 'linear-gradient(90deg, #0061c2, #0196ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '26px', marginBottom: '1.5rem' }}>
                Doctor Login
              </h4>

              {errors.login && <CAlert color="danger">{errors.login}</CAlert>}

              <CForm onSubmit={handleLogin}>
                <div className="mb-3">
                  <div className="position-relative">
                    <CFormInput type="text" placeholder="Username or Mobile" value={userName} onChange={(e) => { setUserName(e.target.value); setErrors((p) => ({ ...p, userName: '', login: '' })) }} style={{ paddingRight: '2.5rem', borderColor: errors.userName ? '#dc3545' : COLORS.primary, borderRadius: '0.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', color: COLORS.primary }} />
                    <CIcon icon={cilUser} style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none', color: COLORS.primary }} />
                  </div>
                  {errors.userName && <div className="text-start text-danger mt-1" style={{ fontSize: '0.875rem' }}>{errors.userName}</div>}
                </div>

                <div className="mb-3">
                  <div className="position-relative">
                    <CFormInput type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '', login: '' })) }} style={{ paddingRight: '2.5rem', borderColor: errors.password ? '#dc3545' : COLORS.primary, borderRadius: '0.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }} />
                    <CIcon icon={showPassword ? cilLowVision : cilEyedropper} onClick={() => setShowPassword((v) => !v)} style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', color: COLORS.primary, cursor: 'pointer' }} />
                  </div>
                  {errors.password && <div className="text-start text-danger mt-1" style={{ fontSize: '0.875rem' }}>{errors.password}</div>}
                </div>

                <CButton type="submit" color="primary" className="w-100" disabled={loading} style={{ background: 'linear-gradient(90deg, #0061c2, #0196ee)', padding: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {loading ? 'Logging in...' : 'Login'}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default Login
