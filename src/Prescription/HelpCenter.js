import React,{useEffect} from "react"
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CListGroup,
  CListGroupItem,
  CButton,
  CBadge,
} from "@coreui/react"
import { cilPhone, cilEnvelopeClosed, cilMap, cilChatBubble, cilInfo } from "@coreui/icons"
import CIcon from "@coreui/icons-react"
import { useDoctorContext } from "../Context/DoctorContext"

// WhatsApp link generator
const makeWhatsAppLink = (number, text = "") => {
  if (!number) return "#"
  const cleaned = number.replace(/[^+0-9]/g, "")
  const encoded = encodeURIComponent(text)
  const pure = cleaned.replace(/^\+/, "")
  return `https://wa.me/${pure}${text ? `?text=${encoded}` : ""}`
}

export default function DoctorHelpCenter() {
  const { doctorDetails, clinicDetails, isPatientLoading } = useDoctorContext()
  // 🔄 Reload page every 30 seconds
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     window.location.reload()
  //   }, 30000)

  //   return () => clearInterval(interval)
  // }, [])

  if (isPatientLoading) return <div>Loading...</div>
  if (!doctorDetails || !clinicDetails) return <div>No doctor or clinic data found.</div>

  const helpCenterData = {
    clinicName: clinicDetails.name || "Clinic",
    logo: clinicDetails.logo || "https://via.placeholder.com/80",
    doctorName: doctorDetails.doctorName || "",
    doctorPhoto: doctorDetails.photo || "https://via.placeholder.com/80",
    support: {
      whatsapp: clinicDetails.contactNumber || "",
      email: doctorDetails.doctorEmail || "",
      phone: clinicDetails.contactNumber || "",
      emergency: clinicDetails.emergencyNumber || "",
      hours: `${clinicDetails.openingTime || ""} - ${clinicDetails.closingTime || ""}`,
    },
    customerService: {
      name: "Derma Care",
      phone: "8919914783",
      email: "DermaCare@gmail.com",
      whatsapp: "8919914783",
      hours: "Mon-Fri 9AM - 6PM",
      address: "Jubilee Hills",
    },
    social: {
      facebook: clinicDetails.facebook || "",
      instagram: clinicDetails.instagram || "",
      linkedin: clinicDetails.linkedin || "",
    },
    services: clinicDetails.services || ["Dermatology", "Cosmetic Care", "Skin Treatments"],
    dermaCareSupport: { page: "#", faqs: "#" },
    branches: clinicDetails.branches || [],
  }

  const hasSocialLinks = Object.values(helpCenterData.social).some((link) => link)

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <CCard className="shadow-lg border-0 rounded-4 overflow-hidden">
        {/* Header */}
        <CCardHeader className="bg-gradient-info d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center gap-3">
            <img
              src={helpCenterData.logo}
              alt="Clinic Logo"
              className="rounded-circle"
              width={60}
              height={60}
            />
            <div>
              <h4 className="mb-0 text-dark">
                {helpCenterData.clinicName} 
              </h4>
              <small className="text-muted">Doctor: {helpCenterData.doctorName}</small>
            </div>
          </div>
          <CBadge color="light" className="px-3 py-2 text-dark">
            24/7 Support
          </CBadge>
        </CCardHeader>

        <CCardBody className="p-4">
          {/* Support Section */}
          <p className="mb-4 text-muted text-center">
            Need help? Choose a contact method below — WhatsApp, phone, email, or social media.
          </p>

          <CRow className="g-4 mb-4 text-center">
            {["whatsapp", "email", "phone"].map((type) => {
              const value = helpCenterData.support[type]
              if (!value) return null

              let buttonColor, icon, text, href
              switch (type) {
                case "whatsapp":
                  buttonColor = "success"
                  icon = cilChatBubble
                  text = "Chat Now"
                  href = makeWhatsAppLink(value, "Hello Support")
                  break
                case "email":
                  buttonColor = "primary"
                  icon = cilEnvelopeClosed
                  text = "Email Support"
                  href = `mailto:${value}`
                  break
                case "phone":
                  buttonColor = "danger"
                  icon = cilPhone
                  text = "Call"
                  href = `tel:${value}`
                  break
              }

              return (
                <CCol key={type} style={{ width: "33%" }}>
                  <CCard className="h-100 shadow-sm border-0 rounded-3 d-flex flex-column">
                    <CCardHeader className="fw-bold text-center text-md-start">{type.charAt(0).toUpperCase() + type.slice(1)}</CCardHeader>
                    <CCardBody className="d-flex flex-column">
                      <p className="small text-muted text-center text-md-start" style={{height:"40px"}}>
                        {type === "whatsapp" && "Chat with our support team on WhatsApp for quick assistance."}
                        {type === "email" && "Send us an email with your query and attachments."}
                        {type === "phone" && "Call us for appointment bookings and urgent consultations."}
                      </p>
                      <a href={href} target={type === "whatsapp" ? "_blank" : undefined} rel="noreferrer" style={{ textDecoration: "none" }}>
                        <CButton color={buttonColor} className="w-100 d-flex align-items-center justify-content-center">
                          <CIcon icon={icon} className="me-2" />
                          {text}
                        </CButton>
                      </a>
                      {type === "email" && (
                        <div className="mt-2 small text-muted text-center text-md-start">
                          Response: within 24-48 hours
                        </div>
                      )}
                      {type === "phone" && helpCenterData.support.hours && (
                        <div className="mt-2 small text-muted text-center text-md-start">
                          Hours: {helpCenterData.support.hours}
                        </div>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              )
            })}
          </CRow>


          {/* Customer Service Section */}
          <div className="mb-5">
            <h5 className="fw-bold mb-3">Customer Service</h5>
            <CRow className="g-4">
              <CCol xs={12} md={6} lg={4}>
                <CCard className="h-100 shadow-sm border-0 rounded-4 overflow-hidden hover-shadow">
                  <CCardHeader className="bg-light fw-bold">
                    {helpCenterData.customerService.name}
                  </CCardHeader>
                  <CCardBody className="p-3 d-flex flex-column justify-content-between">
                    {helpCenterData.customerService.address && (
                      <div className="mb-3">
                        <CIcon icon={cilInfo} className="me-2 text-primary" />
                        <span className="fw-semibold">Address:</span> {helpCenterData.customerService.address}
                      </div>
                    )}
                    <p className="small text-muted mb-3">
                      Reach our Customer Service team for general inquiries or support.
                    </p>
                    <div className="d-flex flex-column gap-2">
                      {helpCenterData.customerService.phone && (
                        <a href={`tel:${helpCenterData.customerService.phone}`} style={{ textDecoration: "none" }}>
                          <CButton
                            color="warning"
                            className="w-100 d-flex align-items-center justify-content-center"
                          >
                            <CIcon icon={cilPhone} className="me-2" />
                            Call
                          </CButton>
                        </a>
                      )}

                      {helpCenterData.customerService.whatsapp && (
                        <a
                          href={makeWhatsAppLink(helpCenterData.customerService.whatsapp, "Hello Customer Service")}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          <CButton color="success" className="w-100 d-flex align-items-center justify-content-center">
                            <CIcon icon={cilChatBubble} className="me-2" />
                            WhatsApp
                          </CButton>
                        </a>
                      )}
                      {helpCenterData.customerService.email && (
                        <a href={`mailto:${helpCenterData.customerService.email}`} style={{ textDecoration: "none" }}>
                          <CButton color="primary" className="w-100 d-flex align-items-center justify-content-center" >
                            <CIcon icon={cilEnvelopeClosed} className="me-2" />
                            Email
                          </CButton>
                        </a>
                      )}
                    </div>
                    {helpCenterData.customerService.hours && (
                      <div className="mt-3 small text-muted text-center">
                        Hours: {helpCenterData.customerService.hours}
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </div>

          {/* Social Media */}
          {hasSocialLinks && (
            <div className="mb-4">
              <h5 className="fw-bold">Follow Us</h5>
              <div className="d-flex gap-3 flex-wrap">
                {Object.entries(helpCenterData.social)
                  .filter(([_, link]) => link)
                  .map(([key, link]) => (
                    <a
                      key={key}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </a>
                  ))}
              </div>
            </div>
          )}


          {/* Branches Section */}
          {helpCenterData.branches.length > 0 && (
            <div>
              <h5 className="fw-bold">Our Branches</h5>
              <CListGroup flush>
                {helpCenterData.branches.map((b, index) => {
                  const phone = b.phone || b.contactNumber || ""
                  const mapLink = b.mapLink || b.map || ""
                  return (
                    <CListGroupItem
                      key={b.id || index}
                      className="d-flex justify-content-between align-items-start border rounded-3 mb-2 shadow-sm p-3 flex-wrap"
                    >
                      <div>
                        <div className="fw-bold">{b.branchName}</div>
                        <div className="fw-bold">{b.branchId}</div>
                        <div className="small text-muted">{b.address}</div>
                      </div>
                      <div className="d-flex gap-2 mt-2 mt-md-0">
                        {mapLink && (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-dark"
                          >
                            <CIcon icon={cilMap} className="me-1" />
                            Map
                          </a>
                        )}
                        {phone && (
                          <>
                            <a
                              href={`tel:${phone}`}
                              className="btn btn-sm btn-danger d-flex align-items-center"
                            >
                              <CIcon icon={cilPhone} className="me-1" />
                              Call
                            </a>
                            <a
                              href={makeWhatsAppLink(phone, "Hello from branch")}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-success d-flex align-items-center"
                            >
                              <CIcon icon={cilChatBubble} className="me-1" />
                              WhatsApp
                            </a>
                          </>
                        )}
                      </div>
                    </CListGroupItem>
                  )
                })}
              </CListGroup>
            </div>
          )}


        </CCardBody>
      </CCard>
    </div>
  )
}
