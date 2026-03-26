import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import '../Profile/DoctorProfile.css'

import { formatDistanceToNow } from 'date-fns'
import { format, addDays, startOfToday, parse } from 'date-fns'
import {
  CCard,
  CCardBody,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CButton,

  CRow,
  CCol,

} from '@coreui/react'
import { averageRatings, getAvailableSlots } from '../../Auth/Auth'
import { COLORS } from '../../Themes'
import { capitalizeEachWord, capitalizeWords } from '../../utils/CaptalZeWord'

const DoctorProfile = () => {
  const [doctorDetails, setDoctorDetails] = useState(null)
  const [activeKey, setActiveKey] = useState(1)
  const [ratingsData, setRatingsData] = useState(null)
  const [slotsData, setSlotsData] = useState([])
  const [doctorImage, setDoctorImage] = useState(null)


  const [loading, setLoading] = useState(false)

  const [days, setDays] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    const today = new Date()
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i)
      return {
        date,
        dayLabel: format(date, 'EEE'), // Mon, Tue
        dateLabel: format(date, 'dd MMM'), // 16 Aug
      }
    })
    setDays(next7Days)
  }, [])

  useEffect(() => {
    const fetchDoctorDetails = () => {
      const storedData = localStorage.getItem('doctorDetails')

      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)

          if (parsed.doctorPicture) {
            const imgSrc = parsed.doctorPicture.startsWith('data:image')
              ? parsed.doctorPicture
              : `data:image/jpeg;base64,${parsed.doctorPicture}`
            setDoctorImage(imgSrc)
          }

          setDoctorDetails(parsed)
        } catch (error) {
          console.error('Error parsing doctor details from localStorage:', error)
        }
      }
    }

    fetchDoctorDetails()
  }, [])


  useEffect(() => {
    const fetchSlots = async () => {
      const doctorId = localStorage.getItem('doctorId')
      const hospitalId = localStorage.getItem('hospitalId')
      if (!doctorId || !hospitalId) return

      const response = await getAvailableSlots(hospitalId, doctorId)
      console.log('API response:', response)

      if (response?.slots?.length) {
        // Store the entire date-wise slots array, not just the first date
        setSlotsData(response.slots)
      }
    }
    fetchSlots()
  }, [])

  useEffect(() => {
    const fetchRatings = async () => {
      const doctorId = localStorage.getItem('doctorId');

      if (!doctorId) {
        console.warn('⚠️ Missing doctorId in localStorage');
        return;
      }

      try {
        const response = await averageRatings(doctorId);

        console.log('✅ Ratings API raw response:', response);

        if (response) {
          setRatingsData(response);

        } else {
          console.warn('⚠️ No ratings data returned');
        }
      } catch (error) {
        console.error('❌ Error fetching ratings in DoctorProfile:', error);
      }
    }

    fetchRatings();
  }, []); // Ratings



  const handleDateClick = (dayObj, idx) => {
    setSelectedDate(format(dayObj.date, 'yyyy-MM-dd'))
  }
  const normalizeDate = (dateString) => format(new Date(dateString), 'yyyy-MM-dd')
  const slotsForSelectedDate =
    slotsData.find((day) => normalizeDate(day.date) === selectedDate)?.availableSlots || []
  // const slotsForSelectedDate = slotsData.find(s => s.date === selectedDate)?.availableSlots || []
  //
  return (
    <div className="doctor-profile-wrapper">
      {/* CoreUI Tabs Navigation */}
      <CNav variant="tabs" className="mt-3 navhover" style={{ cursor: 'pointer' }} role="tablist">
        <CNavItem>
          <CNavLink
            active={activeKey === 1}
            onClick={() => setActiveKey(1)}
            style={{
              padding: '.5rem .850rem',
              cursor: 'pointer',
              // backgroundColor: active ? '#1976d2' : 'transparent',
              borderRadius: '6px 6px 0 0',
              transition: 'all 0.3s ease',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                color: activeKey === 1 ? COLORS.black : COLORS.black,
                fontWeight: activeKey === 1 ? '700' : '500',
                backgroundColor: 'transparent',
              }}
            >
              {' '}
              Doctor Info
            </span>
          </CNavLink>
        </CNavItem>
        {/* <CNavItem>
          <CNavLink
            style={{
              padding: '.5rem .850rem',
              cursor: 'pointer',
              // backgroundColor: active ? '#1976d2' : 'transparent',
              borderRadius: '6px 6px 0 0',
              transition: 'all 0.3s ease',
            }}
            active={activeKey === 2}
            onClick={() => setActiveKey(2)}
          >
            <span
              style={{
                fontSize: '16px',
                color: activeKey === 2 ? COLORS.black : COLORS.black,
                fontWeight: activeKey === 2 ? '700' : '500',
                backgroundColor: 'transparent',
              }}
            >
              {' '}
              Doctor Slots
            </span>
          </CNavLink>
        </CNavItem> */}
        <CNavItem>
          <CNavLink
            style={{
              padding: '.5rem .850rem',
              cursor: 'pointer',
              // backgroundColor: active ? '#1976d2' : 'transparent',
              borderRadius: '6px 6px 0 0',
              transition: 'all 0.3s ease',
            }}
            active={activeKey === 3}
            onClick={() => setActiveKey(3)}
          >
            <span
              style={{
                fontSize: '16px',
                color: activeKey === 3 ? COLORS.black : COLORS.black,
                fontWeight: activeKey === 3 ? '700' : '500',
                backgroundColor: 'transparent',
              }}
            >
              {' '}
              Ratings & Comments
            </span>
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{
              padding: '.5rem .850rem',
              cursor: 'pointer',
              // backgroundColor: active ? '#1976d2' : 'transparent',
              borderRadius: '6px 6px 0 0',
              transition: 'all 0.3s ease',
            }}
            active={activeKey === 4}
            onClick={() => setActiveKey(4)}
          >
            <span
              style={{
                fontSize: '16px',
                color: activeKey === 4 ? COLORS.black : COLORS.black,
                fontWeight: activeKey === 4 ? '700' : '500',
                backgroundColor: 'transparent',
              }}
            >
              {' '}
              Services
            </span>
          </CNavLink>
        </CNavItem>
      </CNav>

      <CTabContent className="mt-4">
        {/* Doctor Info Tab */}
        <CTabPane visible={activeKey === 1} className="pt-3">
          {/* Doctor Header */}
          <CCard className="mb-4 shadow-sm border-0 rounded-3">
            <CCardBody>
              <div
                className="d-flex flex-wrap align-items-center p-4 rounded-3"
                style={{ background: "linear-gradient(90deg, #f0f4ff, #ffffff)" }}
              >
                <div className="me-4 mb-3">
                  {doctorImage ? (
                    <img
                      src={doctorImage}
                      alt="Doctor"
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        border: "3px solid #1976d2",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        border: "3px solid #1976d2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f8f9fa",
                      }}
                    >
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="fw-bold mb-1">{capitalizeEachWord(doctorDetails?.doctorName) || 'Doctor Name'}</h5>
                  <p className="mb-1"><strong>Qualification:</strong> {doctorDetails?.qualification || "Qualification"}</p>
                  <p className="mb-1"><strong>License No:</strong> {doctorDetails?.doctorLicence || "DoctorLicence"}</p>
                  <p className="mb-0"><strong>Experience:</strong> {doctorDetails?.experience ? `${doctorDetails.experience} Years` : "Experience"}</p>
                </div>
              </div>
            </CCardBody>
          </CCard>

          {/* Contact & Availability */}
          <CCard className="mb-4 shadow-sm border-0 rounded-3">
            <CCardBody>
              <h6 className="fw-bold mb-3 border-bottom pb-2 " style={{ color: COLORS.black }}>📞 Contact & Availability</h6>

              {/* Two columns row */}
              <CRow className="mt-3">
                {/* Column 1 */}
                <CCol md={3}>
                  <div className="mb-3">
                    <p className="mb-1 text-muted"><strong>Email:</strong></p>
                    <p className="fw-semibold">{doctorDetails?.doctorEmail || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-muted"><strong>Phone:</strong></p>
                    <p className="fw-semibold">{doctorDetails?.doctorMobileNumber || "N/A"}</p>
                  </div>
                </CCol>

                {/* Column 2 */}
                <CCol md={3}>
                  <div className="mb-3">
                    <p className="mb-1 text-muted"><strong>Gender:</strong></p>
                    <p className="fw-semibold">{doctorDetails?.gender || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-muted"><strong>Languages Known:</strong></p>
                    <p className="fw-semibold">{doctorDetails?.languages?.join(", ") || "N/A"}</p>
                  </div>
                </CCol>

                {/* Column 3 */}
                <CCol md={3}>
                  <div className="mb-3">
                    <p className="mb-1 text-muted"><strong>Available Days:</strong></p>
                    <p className="fw-semibold">{doctorDetails?.availableDays || "N/A"}</p>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-muted"><strong>Available Times:</strong></p>
                    <p className="fw-semibold">{doctorDetails?.availableTimes || "N/A"}</p>
                  </div>
                </CCol>
              </CRow>
              {/* Signature in new row */}
              <CRow className="mt-3">
                <CCol md={12}>
                  <p><strong>Doctor Signature:</strong></p>
                  {doctorDetails?.doctorSignature ? (
                    <img
                      src={doctorDetails.doctorSignature}
                      alt="Signature"
                      style={{ width: "150px", border: "1px solid #ddd", borderRadius: "6px" }}
                    />
                  ) : (
                    <span className="text-muted">No signature uploaded</span>
                  )}
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>



          {/* Profile Info */}
          <CCard className="mb-4 shadow-sm border-0 rounded-3">
            <CCardBody>
              <h6 className="fw-bold mb-4 border-bottom pb-2" style={{ color: COLORS.black }}>
                📝 Profile Information
              </h6>

              {/* Description */}
              <div className="mb-4">
                <p className="fw-semibold mb-1" style={{ color: COLORS.black }}>
                  Description
                </p>
                <p className="ps-4 fw-medium" style={{ color: COLORS.gray }}>
                  {doctorDetails?.profileDescription || "No description available"}
                </p>
              </div>

              {/* Achievements */}
              <div className="mb-4">
                <p className="fw-semibold mb-1" style={{ color: COLORS.black }}>
                  🏅 Achievements
                </p>
                {Array.isArray(doctorDetails?.highlights) && doctorDetails.highlights.length > 0 ? (
                  <ul className="list-unstyled ps-4 fw-medium">
                    {doctorDetails.highlights.map((item, idx) => (
                      <li key={idx} style={{ color: COLORS.gray }}>
                        * {item.replace(/^•\s*/, "")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ps-2 mb-0 fw-medium" style={{ color: COLORS.gray }}>
                    No achievements added
                  </p>
                )}

              </div>

              {/* Area of Expertise */}
              <div>
                <p className="fw-semibold mb-1" style={{ color: COLORS.black }}>
                  🔍 Area of Expertise
                </p>
                {Array.isArray(doctorDetails?.focusAreas) && doctorDetails.focusAreas.length > 0 ? (
                  <ul className="list-unstyled ps-4 fw-medium">
                    {doctorDetails.focusAreas.map((area, idx) => (
                      <li key={idx} style={{ color: COLORS.gray }}>
                        * {area.replace(/^•\s*/, "")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ps-2 mb-0 fw-medium" style={{ color: COLORS.gray }}>
                    No focus areas listed
                  </p>
                )}

              </div>
            </CCardBody>
          </CCard>

          {/* Professional Info */}
          <CCard className="mb-4 shadow-sm border-0 rounded-3">
            <CCardBody>
              <h6 className="fw-bold mb-3 border-bottom pb-2 " style={{ color: COLORS.black }}>💼 Professional Info</h6>

              <CRow>
                <CCol md={12}>
                  <div className="d-flex gap-3">
                    {/* In-Clinic Fee */}
                    <div className="flex-fill p-3 bg-light rounded shadow-sm">
                      <p className="mb-0 text-muted">
                        <strong>In-Clinic Consultation Fee: ₹{doctorDetails?.doctorFees?.inClinicFee || 0}</strong>
                      </p>

                    </div>

                    {/* Video Consultation Fee */}
                    <div className="flex-fill p-3 bg-light rounded shadow-sm">
                      <p className="mb-0 text-muted"><strong>Video Consultation Fee: ₹{doctorDetails?.doctorFees?.vedioConsultationFee || 0}</strong></p>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CTabPane>

        {/* Doctor Slots Tab */}
        <CTabPane visible={activeKey === 2} className="pt-3">
          {/* Date Selector */}
          <div className="d-flex gap-2 flex-wrap mb-3 border-1">
            {days.map((dayObj, idx) => {
              const isSelected = selectedDate === format(dayObj.date, 'yyyy-MM-dd');
              return (
                <CButton
                  key={idx}
                  onClick={() => handleDateClick(dayObj)}
                  style={{
                    backgroundColor: isSelected ? COLORS.bgcolor : 'white', // selected vs unselected
                    color: COLORS.black,                                         // text color
                    border: '1px solid gray',
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{dayObj.dayLabel}</div>
                  <div style={{ fontSize: '12px' }}>{dayObj.dateLabel}</div>
                </CButton>
              );
            })}
          </div>


          {/* Slots Section */}
          <div className="doctor-slots">
            <div className=" d-flex justify-content-between align-items-center">
              <h5>Available Slots</h5>

              {/* Legend */}
              <div className="d-flex gap-3">
                <div className=" d-flex align-items-center">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '15px',
                      height: '15px',
                      backgroundColor: 'transparent',
                      border: '1px solid #808080',
                      borderRadius: '2px',
                      marginRight: '6px',
                    }}
                  ></span>
                  Available
                </div>
                <div className="legend-item d-flex align-items-center">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '15px',
                      height: '15px',
                      backgroundColor: '#d3d3d3',
                      marginRight: '6px',
                    }}
                  ></span>
                  Booked
                </div>
              </div>
            </div>

            {/* Show slots for selected date */}
            <CCard className="mt-3 border-0">
              <CCardBody className="p-0">
                {loading ? (
                  <p>Loading slots...</p>
                ) : slotsForSelectedDate.length ? (
                  <div className="slots-grid d-flex flex-wrap gap-2">
                    {slotsForSelectedDate.map((slot, idx) => (
                      <button
                        key={idx}
                        className="slot-btn btn"
                        style={{
                          border: '1px solid #808080',
                          backgroundColor: slot.slotbooked ? '#d3d3d3' : 'transparent',
                          color: '#000',
                          cursor: slot.slotbooked ? 'not-allowed' : 'pointer',
                          padding: '6px 12px',
                          borderRadius: '6px',
                        }}
                        disabled={slot.slotbooked}
                      >
                        {slot.slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No slots available for this day</p>
                )}
              </CCardBody>
            </CCard>
          </div>
        </CTabPane>

        {/* Ratings & Comments Tab */}
        <CTabPane visible={activeKey === 3} className="pt-4">
          {ratingsData ? (
            <div className="px-3">
              {/* Ratings Summary in One Card, Two Columns */}
              <CRow>
                <CCol md={12}>
                  <div className="d-flex bg-gradient-light rounded-2 shadow-sm border border-light p-4 gap-4 bg-light">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <span className="fs-2 text-primary">👨‍⚕️</span>
                      <div>
                        <p className="mb-1 text-muted fw-medium">
                          Doctor Overall Rating: {ratingsData?.doctorRating ?? 'N/A'}
                          <span > / 5 </span>
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <span className="fs-2 text-success">🏥</span>
                      <div>
                        <p className="mb-1 text-muted fw-medium">
                          Hospital Overall Rating: {ratingsData?.hospitalRating ?? 'N/A'}

                          <span> / 5 </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>
              <br />
              {/* Patient Feedback Section */}
              <h6 className="fw-bold mb-3 border-bottom pb-2 " style={{ color: COLORS.black }}>💬 Patient Feedback</h6>

              {ratingsData?.comments?.length ? (
                ratingsData.comments.map((feedback, idx) => {
                  return (
                    <div
                      key={idx}
                      className="bg-white shadow-lg rounded-3 p-4 mb-4 border border-light position-relative hover-shadow transition"
                      style={{ transition: '0.3s', cursor: 'pointer' }}
                    >
                      <div className="d-flex">
                        {/* Avatar Circle with Patient Index */}
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 shadow"
                          style={{ width: '55px', height: '55px', fontSize: '18px' }}
                        >
                          {`P${idx + 1}`}
                        </div>

                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-0 fw-semibold">{feedback.patientName || "N/A"}</h6>
                              <small className="text-muted">
                                {feedback.dateAndTimeAtRating
                                  ? formatDistanceToNow(
                                    parse(feedback.dateAndTimeAtRating, 'dd-MM-yyyy hh:mm:ss a', new Date()),
                                    { addSuffix: true }
                                  )
                                  : 'Unknown time'}
                              </small>
                            </div>
                            <div className="fs-5">{feedback.doctorRating ?? 'N/A'}</div>
                          </div>
                          <p className="mt-1 mb-0 text-dark">
                            {feedback.feedback?.trim() || 'No feedback provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted fst-italic">No feedback available</p>
              )}
            </div>
          ) : (
            <p className="text-muted fst-italic">No ratings or comments available.</p>
          )}
        </CTabPane>




        {/* Services Tab */}
        <CTabPane visible={activeKey === 4} className="pt-3">

          <CCardBody>
            <h6 className="fw-bold mb-3 border-bottom pb-2 " style={{ color: COLORS.black }}>
              📂 Categories & Services
            </h6>

            <CRow>
              {/* Categories */}
              <CCol md={3}>
                <p className="mb-1 text-muted"><strong>📌 Categories</strong></p>

                <ul className="mb-0">
                  {doctorDetails?.category?.length ? (
                    doctorDetails.category.map((cat) => (
                      <li key={cat.categoryId}>{cat.categoryName}</li>
                    ))
                  ) : (
                    <p className="text-muted mb-0">No category listed</p>
                  )}
                </ul>
              </CCol>

              {/* Services */}
              <CCol md={3}>
                <p className="mb-1 text-muted"><strong>🛠 Services</strong></p>

                <ul className="mb-0">
                  {doctorDetails?.service?.length ? (
                    doctorDetails.service.map((s) => <li key={s.serviceId}>{s.serviceName}</li>)
                  ) : (
                    <p className="text-muted mb-0">No services listed</p>
                  )}
                </ul>

              </CCol>

              {/* Sub Services */}
              <CCol md={3}>
                <p className="mb-1 text-muted"><strong>🔧 Sub Services</strong></p>
                {doctorDetails?.subServices?.length ? (
                  <ul className="mb-0">
                    {doctorDetails.subServices.map((sub, idx) => (
                      <li key={idx}>
                        {typeof sub === "string" ? sub : sub.subServiceName || "Unnamed Sub-Service"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No sub-services listed</p>
                )}
              </CCol>
            </CRow>
          </CCardBody>
        </CTabPane>
      </CTabContent>
    </div>
  )
}

export default DoctorProfile
