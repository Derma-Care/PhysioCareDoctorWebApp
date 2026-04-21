import React from "react"
import { useDoctorContext } from "../Context/DoctorContext"

const C = {
  navy: "#1B4F8A",
  blue: "#2A6DB5",
  orange: "#f9c571",
  white: "#FFFFFF",
  danger: "#ef4444",
  success: "#22c55e",
  surface: "#f4f7fb",
  border: "#e2e8f0",
  muted: "#94a3b8",
  text: "#1e293b",
  textSm: "#718096",
}

const resolveLogoSrc = (logo) => {
  if (!logo) return null
  if (logo.startsWith("http") || logo.startsWith("data:")) return logo
  const isWebP = logo.startsWith("UklGR")
  return `data:image/${isWebP ? "webp" : "jpeg"};base64,${logo}`
}

const makeWA = (n, t = "") => {
  if (!n) return "#"
  const clean = n.replace(/[^+0-9]/g, "").replace(/^\+/, "")
  return `https://wa.me/${clean}${t ? `?text=${encodeURIComponent(t)}` : ""}`
}

const PhoneIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.99 5.99l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const MailIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const ChatIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const MapPinIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const ClockIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const GlobeIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
const InfoIcon = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const UsersIcon = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const Divider = () => <div style={{ height: 1, background: C.border, margin: "4px 0 18px" }} />

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
    {children}
  </div>
)

const Btn = ({ href, newTab, bg, color, Icon, label }) => (
  <a href={href} target={newTab ? "_blank" : undefined} rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
    <button style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: bg, color, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <Icon size={13} color={color} />
      {label}
    </button>
  </a>
)

const SmBtn = ({ href, newTab, bg, color, Icon, label }) => (
  <a href={href} target={newTab ? "_blank" : undefined} rel="noreferrer" style={{ textDecoration: "none" }}>
    <button style={{ padding: "6px 11px", borderRadius: 7, background: bg, color, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
      <Icon size={12} color={color} />
      {label}
    </button>
  </a>
)

const RowItem = ({ Icon, label, value, last }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
    <div style={{ width: 30, height: 30, borderRadius: 7, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={13} color={C.blue} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{value}</div>
    </div>
  </div>
)

export default function DoctorHelpCenter() {
  const { doctorDetails, clinicDetails, isPatientLoading } = useDoctorContext()

  if (isPatientLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: 12 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.navy}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Loading help center…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!doctorDetails || !clinicDetails) return (
    <div style={{ padding: "2rem", color: C.muted, textAlign: "center", fontSize: 14 }}>No clinic data found.</div>
  )

  const logoSrc = resolveLogoSrc(clinicDetails.hospitalLogo || clinicDetails.logo)

  const d = {
    clinicName: clinicDetails.name || "Clinic",
    logo: logoSrc,
    doctorName: doctorDetails.doctorName || "",
    branch: clinicDetails.branch || "",
    city: clinicDetails.city || "",
    hours: `${clinicDetails.openingTime || ""} – ${clinicDetails.closingTime || ""}`,
    services: clinicDetails.services || [],
    contact: {
      whatsapp: clinicDetails.contactNumber || "",
      email: doctorDetails.doctorEmail || clinicDetails.emailAddress || "",
      phone: clinicDetails.contactNumber || "",
    },
    cs: {
      name: "Derma Care",
      phone: "8919914783",
      email: "DermaCare@gmail.com",
      whatsapp: "8919914783",
      hours: "Mon–Fri, 9AM–6PM",
      address: "Jubilee Hills",
    },
    social: {
      Facebook: clinicDetails.facebookHandle || clinicDetails.facebook || "",
      Instagram: clinicDetails.instagramHandle || clinicDetails.instagram || "",
      YouTube: clinicDetails.twitterHandle || "",
      Website: clinicDetails.website || "",
    },
    branches: clinicDetails.branches || [],
  }

  const contactCards = [
    {
      key: "phone", label: "Phone",
      desc: "Call for appointments, urgent consultations and follow-ups.",
      iconBg: "#EFF6FF", iconColor: C.navy, Icon: PhoneIcon,
      btnBg: C.navy, btnColor: C.white,
      href: `tel:${d.contact.phone}`, newTab: false,
      meta: d.hours,
    },
    {
      key: "whatsapp", label: "WhatsApp",
      desc: "Chat with our support team for instant responses and appointment help.",
      iconBg: "#dcfce7", iconColor: "#16a34a", Icon: ChatIcon,
      btnBg: "#16a34a", btnColor: C.white,
      href: makeWA(d.contact.whatsapp, "Hello, I need support"), newTab: true,
      meta: d.contact.whatsapp,
    },
    {
      key: "email", label: "Email",
      desc: "Send your queries or attachments. We reply within 24–48 hours.",
      iconBg: "#fff8ec", iconColor: "#d97706", Icon: MailIcon,
      btnBg: "#f9c571", btnColor: C.navy,
      href: `mailto:${d.contact.email}`, newTab: false,
      meta: d.contact.email,
    },
  ]

  const btnLabel = { phone: "Call", whatsapp: "WhatsApp", email: "Email" }

  const socialLinks = Object.entries(d.social).filter(([, v]) => v)
  const SocialIcon = (key) => {
    if (key === "Facebook") return () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
    if (key === "Instagram") return () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
    if (key === "YouTube") return () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
    return () => <GlobeIcon size={13} color={C.navy} />
  }

  return (
    <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto", fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.surface, borderRadius: 16 }}>

      {/* ── Hero ── */}
   <div style={{ background: `linear-gradient(135deg, #1B4F8A 0%, #2A6DB5 100%)`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: '0 4px 20px rgba(27,79,138,0.2)' }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
    
    {/* Left: Logo + Info */}
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      {d.logo ? (
        <img src={d.logo} alt="Clinic Logo"
          style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.orange}`, background: C.white, flexShrink: 0 }}
          onError={(e) => { e.target.style.display = "none" }}
        />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.orange, border: `2px solid ${C.orange}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: C.navy, flexShrink: 0 }}>
          {d.clinicName.charAt(0)}
        </div>
      )}

      <div>
        {/* Clinic Name */}
        <div style={{ color: C.white, fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{d.clinicName}</div>

        {/* Doctor Name — strip leading "Dr." to avoid "Dr. Dr." */}
        {d.doctorName && (
          <div style={{ color: C.orange, fontSize: 12, marginTop: 2, fontWeight: 600 }}>
            Dr. {d.doctorName.replace(/^Dr\.?\s*/i, '')}
          </div>
        )}

        {/* Location */}
        {(d.branch || d.city) && (
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <MapPinIcon size={11} color="rgba(255,255,255,0.6)" />
            {[d.branch, d.city].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Service tags */}
        {d.services.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {d.services.slice(0, 3).map((s) => (
              <span key={s} style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", fontSize: 10, padding: "2px 8px", borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Right: Support badge + Hours */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <div style={{ background: C.orange, color: C.navy, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
        24 / 7 Support
      </div>
      {d.hours && (
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
          <ClockIcon size={11} color="rgba(255,255,255,0.6)" />
          {d.hours}
        </div>
      )}
    </div>

  </div>
</div>

      {/* ── Contact Cards ── */}
      <SectionLabel>Quick contact</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {contactCards.map(({ key, label, desc, iconBg, iconColor, Icon, btnBg, btnColor, href, newTab, meta }) => {
          if (!d.contact[key]) return null
          return (
            <div key={key} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid #f0f4f8` }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={iconColor} />
                </div>
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: C.navy }}>{label}</div>
                <div style={{ fontSize: 11, color: C.textSm, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <Btn href={href} newTab={newTab} bg={btnBg} color={btnColor} Icon={Icon} label={btnLabel[key]} />
                {meta && <div style={{ fontSize: 11, color: C.muted, marginTop: 7, textAlign: "center" }}>{meta}</div>}
              </div>
            </div>
          )
        })}
      </div>

      <Divider />

      {/* ── Customer Service + Clinic Info ── */}
      <SectionLabel>Customer service</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 28, height: 28, background: "#FEF9C3", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UsersIcon size={15} color="#854d0e" />
            </div>
            {d.cs.name}
          </div>
          {d.cs.address && <RowItem Icon={MapPinIcon} label="Address" value={d.cs.address} />}
          {d.cs.hours && <RowItem Icon={ClockIcon} label="Hours" value={d.cs.hours} last />}
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            {d.cs.phone && (
              <Btn href={`tel:${d.cs.phone}`} bg={C.navy} color={C.white} Icon={PhoneIcon} label="Call" />
            )}
            {d.cs.whatsapp && (
              <Btn href={makeWA(d.cs.whatsapp, "Hello Customer Service")} newTab bg="#16a34a" color={C.white} Icon={ChatIcon} label="WhatsApp" />
            )}
            {d.cs.email && (
              <Btn href={`mailto:${d.cs.email}`} bg={C.orange} color={C.navy} Icon={MailIcon} label="Email" />
            )}
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 28, height: 28, background: "#EFF6FF", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <InfoIcon size={15} color={C.navy} />
            </div>
            Clinic info
          </div>
          {d.branch && <RowItem Icon={MapPinIcon} label="Branch" value={[d.branch, d.city].filter(Boolean).join(", ")} />}
          {d.contact.phone && <RowItem Icon={PhoneIcon} label="Contact" value={d.contact.phone} />}
          {d.contact.email && <RowItem Icon={MailIcon} label="Email" value={d.contact.email} />}
          {d.hours && <RowItem Icon={ClockIcon} label="Hours" value={d.hours} last />}
        </div>
      </div>

      {/* ── Social ── */}
      {socialLinks.length > 0 && (
        <>
          <Divider />
          <SectionLabel>Follow us</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {socialLinks.map(([key, link]) => {
              const SI = SocialIcon(key)
              return (
                <a key={key} href={link} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: C.navy, border: `1px solid #bfdbfe` }}>
                  <SI />
                  {key}
                </a>
              )
            })}
          </div>
        </>
      )}

      {/* ── Branches ── */}
      {d.branches.length > 0 && (
        <>
          <Divider />
          <SectionLabel>Branches</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {d.branches.map((b, i) => {
              const phone = b.phone || b.contactNumber || ""
              const mapLink = b.mapLink || b.map || b.walkthrough || ""
              return (
                <div key={b.id || i} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? C.success : C.orange, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{b.branchName || b.hospitalName || `Branch ${b.branchId || i + 1}`}</div>
                      {b.branchId && <div style={{ fontSize: 11, color: C.blue, marginTop: 1 }}>{b.branchId}</div>}
                      {b.address && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{b.address}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {mapLink && <SmBtn href={mapLink} newTab bg="#EFF6FF" color={C.navy} Icon={MapPinIcon} label="Map" />}
                    {phone && (
                      <>
                        <SmBtn href={`tel:${phone}`} bg="#fee2e2" color="#b91c1c" Icon={PhoneIcon} label="Call" />
                        <SmBtn href={makeWA(phone, "Hello from branch")} newTab bg="#dcfce7" color="#15803d" Icon={ChatIcon} label="WA" />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

    </div>
  )
}