import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CImage,
  CSidebar,
  CSidebarFooter,
  CSidebarHeader,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CCol,
  CRow,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'
import './header/sidebar.css'
import navigation from '../_nav'
import { COLORS, SIZES } from '../Themes'
import doctor from '../assets/images/doctor.jpg'
import male from '../assets/images/male1.png'
import female from '../assets/images/female1.png'
import { useDoctorContext } from '../Context/DoctorContext'
import { getClinicDetails, getDoctorDetails, averageRatings, getPatientVitals } from '../Auth/Auth'
import { capitalizeEachWord, capitalizeFirst, capitalizeWords } from '../utils/CaptalZeWord'
import './AppSidebar.css'
const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const [doctorDetails, setDoctorDetails] = useState(null)
  const [clinicDetails, setClinicDetails] = useState(null)
  const { patientData, isPatientLoading, setPatientData } = useDoctorContext()
  const hasPatient = !!patientData
  const [ratings, setRatings] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [vitals, setVitals] = useState({
    height: null,
    weight: null,
    bloodPressure: null,
    temperature: null,
    bmi: null,
  });
  useEffect(() => {
    const fetchData = async () => {
      const doctor = await getDoctorDetails()
      const clinic = await getClinicDetails()
      setDoctorDetails(doctor)
      setClinicDetails(clinic)

      if (doctor?.doctorId) {
        const ratingData = await averageRatings(doctor.doctorId) // <-- only doctorId

        if (ratingData?.ratingStats?.length > 0) {
          setRatings(ratingData.ratingStats)
        } else {
          setRatings([{ category: ratingData.message || 'No reviews found', percentage: 0 }])
        }
      }
    }
    fetchData()
  }, [])


  // Load patient vitals whenever patientData changes
  useEffect(() => {
    let isMounted = true;

    const fetchVitals = async () => {
      if (hasPatient && patientData?.bookingId && patientData?.patientId) {
        try {
          const res = await getPatientVitals(
            patientData.bookingId,
            patientData.patientId
          );

          console.log("Vitals FINAL:", res);

          if (isMounted) {
            setVitals(res || {
              height: null,
              weight: null,
              bloodPressure: null,
              temperature: null,
              bmi: null,
            });
          }
        } catch (err) {
          console.error("Vitals API Error:", err);
        }
      }
    };

    fetchVitals();

    return () => {
      isMounted = false;
    };
  }, [hasPatient, patientData]);

  // const seed = patientData?.name || "guest"; // patient-specific seed
  // const genderImg = https://api.dicebear.com/6.x/avataaars/png?seed=${encodeURIComponent(seed)}&clothingColor=pink;
  const genderImg = (patientData?.gender || '').toString().toLowerCase() === 'male' ? male : female

  const display = {
    name: patientData?.name || '—',
    age: patientData?.age || '—',
    gender: patientData?.gender || '—',
    mobile: patientData?.patientMobileNumber || '—',
    visitType: patientData?.visitType === null
      ? 0
      : patientData?.visitType ?? '—',
    bookingFor: patientData?.bookingFor || '_',
    visitCount: patientData?.visitCount === null ? 0 : patientData?.visitCount ?? '—',
    followUp: patientData?.freeFollowUpsLeft || '—',
    symptom: patientData?.problem || '—',
    patientId: patientData?.patientId || '—',
    clinicName: patientData?.clinicName || '—',
    clinicId: patientData?.clinicId || '—',
    doctorName: patientData?.doctorName || '—',
    doctorId: patientData?.doctorId || '—',
    consultationFee: patientData?.consultationFee ?? '—',
    totalFee: patientData?.totalFee ?? '—',
    serviceDate: patientData?.serviceDate || '—',
    serviceTime: patientData?.serviceTime || patientData?.servicetime || '—',
    duration: patientData?.duration || '—',
    subServiceId: patientData?.subServiceId || '_',
    subServiceName: patientData?.subServiceName || '_',
    consultationExpiration: patientData?.consultationExpiration || '_',
    vitals,
  };
  // helpers (place above your return)
  const fmt = (n) => {
    if (n === '—' || isNaN(+n)) return '—';
    const num = Number(n);
    return `₹ ${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`;
  };

  // useEffect(() => {
  //   // clear context + localStorage so sidebar shows doctor data
  //   setPatientData(null)
  // }, [setPatientData])

  const imgSrc = doctorDetails?.doctorPicture.startsWith('data:image')
    ? doctorDetails?.doctorPicture
    : `data:image/png;base64,${doctorDetails?.doctorPicture}`

  return (
    <>
      <CSidebar
        className="border-end "
        //colorScheme="white"
        position="fixed"
        unfoldable={unfoldable}
        visible={sidebarShow}
        style={{ backgroundColor: COLORS.bgcolor }}
        onVisibleChange={(visible) => {
          dispatch({ type: 'set', sidebarShow: visible })
        }}

      >
        <CSidebarHeader className="border-bottom ">
          <div
            role="button"
            tabIndex={0}
            onClick={() => hasPatient && setShowModal(true)}
            onKeyDown={(e) =>
              hasPatient && (e.key === 'Enter' || e.key === ' ') && setShowModal(true)
            }
            className="d-flex flex-column align-items-center w-100 py-2"
            style={{ cursor: hasPatient ? 'pointer' : 'default' }}
            title={hasPatient ? 'View Patient Details' : undefined}
          >
            {isPatientLoading ? (
              // Skeleton while hydrating (prevents doctor flash)
              <div className="w-100 d-flex flex-column align-items-center">
                <div
                  className="rounded-circle border mb-2"
                  style={{ width: 88, height: 88, opacity: 0.3 }}
                />
                <div
                  className="mb-1"
                  style={{ width: '75%', height: 12, background: '#eee', borderRadius: 4 }}
                />
                <div style={{ width: '50%', height: 12, background: '#eee', borderRadius: 4 }} />
              </div>
            ) : hasPatient ? (
              <>
                <CImage
                  src={genderImg}
                  alt="Patient"
                  width={88}
                  className="rounded-circle border"
                  style={{ borderWidth: 2, padding: 5, color: COLORS.gray }}
                />
                <h4
                  className="mb-2 mt-2"
                  style={{
                    color: COLORS.black,
                    fontWeight: 'bold',
                    fontSize: SIZES.large,
                    textAlign: 'center',        // horizontally center
                    display: 'block',
                    lineHeight: '1.2',          // adjust spacing between lines
                    wordWrap: 'break-word',     // allow breaking long words
                    overflowWrap: 'break-word',
                    maxWidth: '100%',           // optional, restrict width
                    whiteSpace: 'normal',       // allow wrapping
                  }}
                >
                  {capitalizeEachWord(display.name)}
                </h4>
                <div style={{ height: "12px" }}></div>

                <div style={{ textAlign: "left", width: "100%", marginLeft: "15px" }}>
                  <h6 style={{ color: COLORS.black, fontSize: SIZES.small, marginBottom: "6px" }}>
                    <strong>Age / Gender:</strong>{" "}
                    <span>
                      {display.age
                        ? display.age.toString().toLowerCase().includes("year") ||
                          display.age.toString().toLowerCase().includes("yr")
                          ? display.age
                          : `${display.age} Years`
                        : "-"}

                      / {display.gender || "-"}
                    </span>
                  </h6>
                  <h6 style={{ color: COLORS.black, fontSize: SIZES.small, marginBottom: "6px" }}>
                    <strong>Mobile:</strong> <span>{display.mobile}</span>
                  </h6>
                  <h6 style={{ color: COLORS.black, fontSize: SIZES.small, marginBottom: "6px" }}>
                    <strong>Visit Type:</strong> <span>{capitalizeFirst(display.visitType)}</span>
                  </h6>
                  <h6 style={{ color: COLORS.black, fontSize: SIZES.small, marginBottom: "6px" }}>
                    <strong>Visit Count:</strong> <span>{display.visitCount === '—' ? 0 : display.visitCount}</span>
                  </h6>
                  <h6 style={{ color: COLORS.black, fontSize: SIZES.small, marginBottom: "6px" }}>
                    <strong>FollowUp Count:</strong> <span>{display.followUp === '—' ? 0 : display.followUp}</span>
                  </h6>
                </div>
                <hr className="w-100 my-2" />
                <div className="w-100 px-2">
                  <h4
                    className="mb-2 mt-2"
                    style={{ color: COLORS.black, fontWeight: 'bold', fontSize: SIZES.large }}
                  >
                    Vitals
                  </h4>
                  <h6 className="mb-1" style={{ color: COLORS.black, fontSize: SIZES.small }}>
                    <strong>Height:</strong> <span>{display.vitals?.height ? display.vitals.height : 0} cm</span>
                  </h6>
                  <h6 className="mb-1" style={{ color: COLORS.black, fontSize: SIZES.small }}>
                    <strong>Weight:</strong> <span>{display.vitals?.weight ? display.vitals.weight : 0} kg</span>
                  </h6>
                  <h6 className="mb-1" style={{ color: COLORS.black, fontSize: SIZES.small }}>
                    <strong>Blood Pressure:</strong> <span>{display.vitals?.bloodPressure ? display.vitals.bloodPressure : 0} mmHg</span>
                  </h6>
                  <h6 className="mb-1" style={{ color: COLORS.black, fontSize: SIZES.small }}>
                    <strong>Temperature:</strong> <span>{display.vitals?.temperature ? display.vitals.temperature : 0} °C</span>
                  </h6>
                  <h6 className="mb-1" style={{ color: COLORS.black, fontSize: SIZES.small }}>
                    <strong>BMI:</strong> <span>{display.vitals?.bmi ? display.vitals.bmi : 0} kg/m²</span>
                  </h6>
                </div>

              </>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {doctorDetails?.doctorPicture ? (
                    <CImage
                      src={imgSrc}
                      alt="Doctor"
                      width={100}
                      height={100}
                      className="rounded-circle border"
                      style={{ borderWidth: 2, padding: 5, color: COLORS.gray, objectFit: 'cover' }}
                    />
                  ) : (
                    <p>Loading image...</p>
                  )}

                  {/*                  
<CImage
  src={data:image/png;base64,${doctorDetails?.doctorPicture }}
  alt="Doctor"
  width={100}
  className="rounded-circle border"
  style={{ borderWidth: 2, padding: 5, color: COLORS.gray }}
/> */}
                  <h4
                    className=" mb-0 mt-2 text-center"
                    style={{ color: COLORS.black, fontWeight: 'bold', fontSize: SIZES.large }}
                  >
                    {capitalizeWords(doctorDetails?.doctorName) || 'Doctor Name'}
                  </h4>
                  <h6
                    className="mb-0 mt-1 text-center"
                    style={{ color: COLORS.black, fontSize: SIZES.small }}
                  >
                    {doctorDetails?.qualification || 'Qualification'} ({' '}
                    {doctorDetails?.specialization || 'Specialization'})
                  </h6>
                </div>
              </>
            )}
          </div>

          <CCloseButton
            className="d-lg-none"
            dark
            onClick={() => dispatch({ type: 'set', sidebarShow: false })}
          />
        </CSidebarHeader>

        {/* Show navigation only when NOT loading and no patient selected */}
        {!isPatientLoading && !hasPatient && <AppSidebarNav items={navigation} />}

        {/* Show Patient Ratings only if ratings exist */}
        {!isPatientLoading && !hasPatient && ratings.length > 0 && (
          <CSidebarFooter className="border-top d-none d-lg-flex flex-column mt-2" style={{ paddingLeft: 10, paddingRight: 10 }}>
            <h6 style={{ color: COLORS.black, fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Patient Ratings
            </h6>

            {ratings.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 8,
                  width: '100%',
                }}
              >
                {/* Label */}
                <div style={{ minWidth: 100 }}>
                  <small style={{ color: COLORS.black, fontSize: SIZES.small, fontWeight: 'bold' }}>
                    {item.category}
                  </small>
                </div>

                {/* Progress bar */}
                {item.percentage > 0 && (
                  <div style={{ flex: 1 }}>
                    <div
                      className="progress"
                      style={{ height: 8, borderRadius: 4, backgroundColor: '#e9ecef' }}
                    >
                      <div
                        className={`progress-bar ${item.category.toLowerCase().includes('excellent')
                          ? 'bg-success'
                          : item.category.toLowerCase().includes('good')
                            ? 'bg-primary'
                            : item.category.toLowerCase().includes('average')
                              ? 'bg-warning'
                              : 'bg-secondary'
                          }`}
                        role="progressbar"
                        style={{ width: `${item.percentage}%`, borderRadius: 4 }}
                        aria-valuenow={item.percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CSidebarFooter>
        )}
      </CSidebar>
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        alignment="center"
        size="lg"
        className="patient-modal-ui"
      >
        <CModalHeader className="modal-header-modern">
          <CModalTitle>Patient Overview</CModalTitle>
        </CModalHeader>

        <CModalBody className="modal-body-modern">
          {/* --- PATIENT BASIC INFO --- */}
          <div className="info-card">
            <div className="info-left">
              <CImage src={genderImg} alt="Patient" className="avatar" />
              <div className="patient-info">
                <div className="patient-field">
                  <span className="label">Name:</span>
                  <span className="value">{capitalizeFirst(display?.name || '—')}</span>
                </div>
                <div className="patient-field">
                  <span className="label">Patient ID:</span>
                  <span className="value">{display?.patientId || '—'}</span>
                </div>
              </div>
            </div>
            <div className="info-grid">
              <div><strong>Age/Gender:</strong> {display.age} / {display.gender}</div>
              <div><strong>Mobile:</strong> {display.mobile}</div>
              <div><strong>Booking For:</strong> {capitalizeFirst(display.bookingFor)}</div>
              <div><strong>Visit Type:</strong> {capitalizeFirst(display.visitType)}</div>
              <div><strong>Visit Count:</strong> {display.visitCount === '—' ? 0 : display.visitCount}</div>
              <div><strong>FollowUps:</strong> {display.followUp === '—' ? 0 : display.followUp}</div>
            </div>
          </div>

          {/* --- CLINIC / DOCTOR --- */}
          <div className="info-card">
            <div className="info-block">
              <h5>Clinic Details</h5>
              <p><strong>{display.clinicName}</strong> ({display.clinicId})</p>
              <p className="subtext">{display.clinicAddress}</p>
            </div>
            <div className="info-block">
              <h5>Doctor</h5>
              <p><strong>{display.doctorName}</strong> ({display.doctorId})</p>
            </div>
          </div>

          {/* --- DURATION & PROBLEM --- */}
          <div className="info-card">
            <div className="info-grid-2">
              <div>
                <h5>Duration</h5>
                <p>
                  Consultation Expiration:{" "}
                  {display?.consultationExpiration || "—"}
                </p>
              </div>
              <div>
                <h5>Problem</h5>
                <p>{display.symptom || "—"}</p>
              </div>
            </div>
          </div>

          {/* --- APPOINTMENT --- */}
          <div className="info-card">
            <div className="info-grid-2">
              <div>
                <h5>Appointment</h5>
                <p>Date: {display.serviceDate}</p>
                <p>Time: {display.serviceTime}</p>
              </div>
              <div>
                <h5>Sub-Service</h5>
                {display?.subServiceId ? (
                  <>
                    <p>ID: {display.subServiceId}</p>
                    <p>Name: {display.subServiceName}</p>
                  </>
                ) : (
                  <p>—</p>
                )}
              </div>
            </div>
          </div>

          {/* --- FEES --- */}
          <div className="info-card">
            <h5>Fees</h5>
            <p>Consultation Fee: {fmt(display.consultationFee)}</p>
            <p>Total Fee: {fmt(display.totalFee)}</p>
          </div>

          {/* --- VITALS --- */}
          <div className="info-card">
            <h5>Vitals</h5>
            <div className="vitals-container">
              <div><span>Height</span><strong>{display.vitals.height || 0} cm</strong></div>
              <div><span>Weight</span><strong>{display.vitals.weight || 0} kg</strong></div>
              <div><span>BP</span><strong>{display.vitals.bloodPressure || 0} mmHg</strong></div>
              <div><span>Temp</span><strong>{display.vitals.temperature || 0} °C</strong></div>
              <div><span>BMI</span><strong>{display.vitals.bmi || 0} kg/m²</strong></div>
            </div>
          </div>
        </CModalBody>
      </CModal>


    </>
  )
}

export default React.memo(AppSidebar)