import React, { useEffect, useState } from "react";
import { CModal, CModalHeader, CModalTitle, CModalBody } from "@coreui/react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { COLORS } from "../Themes";
import { getDoctorDetails } from "../Auth/Auth";

// ─── Time helpers ─────────────────────────────────────────────────────────────
const convertTo24Hr = (time12h) => {
  if (!time12h) return null;
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

const convertTo12Hr = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const generateTimeSlots = (start, end, interval = 30) => {
  const slots = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = new Date(1970, 0, 1, sh, sm, 0);
  const endDate = new Date(1970, 0, 1, eh, em, 0);
  while (cur <= endDate) {
    const h = cur.getHours();
    const m = cur.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    slots.push(`${hh.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`);
    cur = new Date(cur.getTime() + interval * 60 * 1000);
  }
  return slots;
};

const generateDates = (days = 15) => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
};

const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const s = timeStr.trim();
  const ampmMatch = s.match(/\b(AM|PM)\b/i);
  let timePart = s;
  let modifier = null;
  if (ampmMatch) {
    modifier = ampmMatch[0].toUpperCase();
    timePart = s.replace(/\s*(AM|PM)\s*/i, "").trim();
  }
  const parts = timePart.split(":").map((p) => p.trim());
  if (parts.length < 2) return null;
  let hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (modifier) {
    if (modifier === "PM" && hh !== 12) hh += 12;
    if (modifier === "AM" && hh === 12) hh = 0;
  }
  return hh * 60 + mm;
};

const formatFullDate = (date) =>
  date instanceof Date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : date;

const getLocalDateStr = (d) => new Date(d).toLocaleDateString("en-CA");

// ─── Status colour map (using theme colours where possible) ───────────────────
const STATUS_COLORS = {
  confirmed:    { bg: COLORS.bgcolor,  label: "Confirmed"   }, // navy
  "in-progress":{ bg: COLORS.orange,  label: "In-Progress" }, // yellow
  "in progress":{ bg: COLORS.orange,  label: "In-Progress" },
  completed:    { bg: "#28a745",       label: "Completed"   }, // green
  cancelled:    { bg: "#d9534f",       label: "Cancelled"   }, // red
  canceled:     { bg: "#d9534f",       label: "Cancelled"   },
};

const getStatusStyle = (status = "") => {
  const key = status.toLowerCase().trim();
  return STATUS_COLORS[key] || { bg: COLORS.bgcolor, label: "Booked" };
};

// ─── Popover ─────────────────────────────────────────────────────────────────
const generatePopover = (appt) => (
  <Popover
    id={`popover-${appt.bookingId}`}
    style={{
      maxWidth: "260px",
      border: `1.5px solid ${COLORS.bgcolor}`,
      borderRadius: "10px",
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(27,79,138,0.14)",
    }}
  >
    {/* Header */}
    <div
      style={{
        backgroundColor: COLORS.bgcolor,
        padding: "8px 14px",
        fontSize: "11px",
        fontWeight: "700",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      Patient Info
    </div>

    {/* Body */}
    <div style={{ backgroundColor: "#fff", padding: "10px 14px" }}>
      {[
        ["Name",        appt.name],
        ["Age & Gender",`${appt.age}, ${appt.gender}`],
        ["Mobile",      appt.patientMobileNumber || appt.mobileNumber],
        ["Branch",      `${appt.branchname}, ${appt.clinicName}`],
        ["Doctor",      appt.doctorName],
        ["Date & Time", `${formatFullDate(new Date(appt.serviceDate))}, ${appt.servicetime}`],
        ["Status",      appt.status],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "flex",
            gap: "8px",
            padding: "4px 0",
            borderBottom: "1px solid rgba(27,79,138,0.07)",
            fontSize: "12px",
          }}
        >
          <span style={{ minWidth: "80px", fontWeight: "600", color: COLORS.bgcolor, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.4px", paddingTop: "1px" }}>
            {label}
          </span>
          <span style={{ color: "#1a1a2e", fontWeight: "500" }}>{value || "—"}</span>
        </div>
      ))}
    </div>
  </Popover>
);

// ─── Legend item ─────────────────────────────────────────────────────────────
const LegendDot = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#fff" }}>
    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: color, flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.35)" }} />
    <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>{label}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CalendarModal = ({
  visible,
  onClose,
  todayAppointments = [],
  defaultBookedSlots = [],
  days = 15,
  interval = 30,
  handleClick = () => {},
  fetchAppointments,
  intervalMs = 60000,
}) => {
  const [timeSlots, setTimeSlots]   = useState([]);
  const [clinicTimes, setClinicTimes] = useState({ open: "", close: "" });
  const dates = generateDates(days);

  useEffect(() => {
    const fetchClinicTimings = async () => {
      try {
        const doctorData = await getDoctorDetails();
        if (doctorData?.availableTimes) {
          const [openTime, closeTime] = doctorData.availableTimes.split(" - ").map((t) => t.trim());
          if (openTime && closeTime) {
            const open  = convertTo24Hr(openTime);
            const close = convertTo24Hr(closeTime);
            setClinicTimes({ open, close });
            setTimeSlots(generateTimeSlots(open, close, interval));
          } else {
            setTimeSlots([]);
          }
        } else {
          setTimeSlots([]);
        }
      } catch {
        setTimeSlots([]);
      }
    };
    fetchClinicTimings();
  }, [interval]);

  useEffect(() => {
    if (!visible || !fetchAppointments) return;
    fetchAppointments();
    const id = setInterval(fetchAppointments, intervalMs);
    return () => clearInterval(id);
  }, [visible, fetchAppointments, intervalMs]);

  const getAppointments = (dateObj, slotStart, slotEnd) => {
    const dateStr  = getLocalDateStr(dateObj);
    const startMin = toMinutes(slotStart);
    const endMin   = slotEnd ? toMinutes(slotEnd) : startMin + interval;
    return (todayAppointments || []).filter((appt) => {
      if (!appt.serviceDate || !appt.servicetime) return false;
      if (getLocalDateStr(appt.serviceDate) !== dateStr) return false;
      const apptMin = toMinutes(appt.servicetime);
      return apptMin >= startMin && apptMin < endMin;
    });
  };

  const isDefaultBooked = (dateObj, slotStart, slotEnd) => {
    const dateStr  = getLocalDateStr(dateObj);
    const startMin = toMinutes(slotStart);
    const endMin   = slotEnd ? toMinutes(slotEnd) : startMin + interval;
    return (defaultBookedSlots || []).some((slot) => {
      if (!slot.date || !slot.time) return false;
      if (getLocalDateStr(slot.date) !== dateStr) return false;
      const sMin = toMinutes(slot.time);
      return sMin >= startMin && sMin < endMin;
    });
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const headerCellStyle = {
    padding: "10px 8px",
    backgroundColor: COLORS.bgcolor,
    color: "#fff",
    fontWeight: "700",
    fontSize: "12px",
    textAlign: "center",
    borderLeft: "1px solid rgba(255,255,255,0.15)",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 2,
    whiteSpace: "nowrap",
  };

  const timeColStyle = {
    padding: "8px",
    fontWeight: "700",
    fontSize: "12px",
    backgroundColor: "#EAF1FB",
    color: COLORS.bgcolor,
    textAlign: "center",
    borderBottom: "1px solid rgba(27,79,138,0.1)",
    position: "sticky",
    left: 0,
    zIndex: 1,
    whiteSpace: "nowrap",
  };

  const dataCellStyle = {
    padding: "5px 4px",
    borderLeft: "1px solid rgba(27,79,138,0.08)",
    borderBottom: "1px solid rgba(27,79,138,0.08)",
    minHeight: "44px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "3px",
    backgroundColor: "#fff",
  };

  return (
    <CModal visible={visible} onClose={onClose} size="xl">
      {/* ── Modal Header ───────────────────────────────────────────────── */}
      <CModalHeader
        closeButton
        style={{
          backgroundColor: COLORS.bgcolor,
          borderBottom: "none",
          padding: "12px 20px",
        }}
      >
        <CModalTitle
          className="w-100"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {/* Title */}
          <div style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}>
            📅 My Calendar{" "}
            <span style={{ fontWeight: "400", fontSize: "13px", opacity: 0.85 }}>
              {clinicTimes.open && clinicTimes.close
                ? `(${convertTo12Hr(clinicTimes.open)} – ${convertTo12Hr(clinicTimes.close)})`
                : "(Loading timings…)"}
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <LegendDot color={COLORS.bgcolor} label="Confirmed" />
            <LegendDot color={COLORS.orange}  label="In-Progress" />
            <LegendDot color="#28a745"         label="Completed" />
            <LegendDot color="#d9534f"         label="Cancelled" />
          </div>
        </CModalTitle>
      </CModalHeader>

      {/* ── Modal Body ─────────────────────────────────────────────────── */}
      <CModalBody style={{ padding: 0, backgroundColor: "#f4f7fb" }}>
        <div
          style={{
            overflow: "auto",
            maxHeight: "80vh",
            border: `1px solid ${COLORS.bgcolor}30`,
            borderRadius: "0 0 8px 8px",
          }}
        >
          {timeSlots.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: COLORS.bgcolor,
                fontSize: "15px",
                fontWeight: "500",
              }}
            >
              No clinic timings available
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `110px repeat(${dates.length}, minmax(90px, 1fr))`,
                fontFamily: "Segoe UI, Arial, sans-serif",
                fontSize: "13px",
              }}
            >
              {/* Top-left corner cell */}
              <div
                style={{
                  ...headerCellStyle,
                  backgroundColor: COLORS.bgcolor,
                  borderLeft: "none",
                  zIndex: 3,
                  left: 0,
                  position: "sticky",
                }}
              />

              {/* Date header cells */}
              {dates.map((d, idx) => {
                const isToday =
                  d.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    style={{
                      ...headerCellStyle,
                      backgroundColor: isToday ? COLORS.orange : COLORS.bgcolor,
                      color: "#fff",
                    }}
                  >
                    <div style={{ fontSize: "11px", opacity: 0.85 }}>
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>
                      {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                );
              })}

              {/* Time rows */}
              {timeSlots.map((slot, i) => (
                <React.Fragment key={slot + i}>
                  {/* Time label */}
                  <div style={timeColStyle}>{slot}</div>

                  {/* Data cells */}
                  {dates.map((d, j) => {
                    const nextSlot     = timeSlots[i + 1] || null;
                    const appointments = getAppointments(d, slot, nextSlot);
                    const defBooked    = isDefaultBooked(d, slot, nextSlot);
                    const isEven       = i % 2 === 0;

                    return (
                      <div
                        key={`${i}-${j}`}
                        style={{
                          ...dataCellStyle,
                          backgroundColor: isEven ? "#fff" : "#f4f7fb",
                        }}
                      >
                        {appointments.length > 0 ? (
                          appointments.map((appt) => {
                            const { bg, label } = getStatusStyle(appt.status);
                            const isClickable   = appt.status?.toLowerCase() !== "completed";

                            return (
                              <OverlayTrigger
                                key={appt.bookingId}
                                trigger={["hover", "focus"]}
                                placement="right"
                                overlay={generatePopover(appt)}
                              >
                                <div
                                  onClick={() => {
                                    if (!isClickable) return;
                                    handleClick(appt);
                                  }}
                                  style={{
                                    fontSize: "11px",
                                    borderRadius: "5px",
                                    backgroundColor: bg,
                                    color: "#fff",
                                    padding: "3px 6px",
                                    fontWeight: "600",
                                    cursor: isClickable ? "pointer" : "not-allowed",
                                    opacity: isClickable ? 1 : 0.65,
                                    transition: "opacity 0.15s, transform 0.1s",
                                    userSelect: "none",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isClickable) e.currentTarget.style.opacity = "0.85";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = isClickable ? "1" : "0.65";
                                  }}
                                >
                                  {label}
                                </div>
                              </OverlayTrigger>
                            );
                          })
                        ) : defBooked ? (
                          <div
                            style={{
                              fontSize: "11px",
                              borderRadius: "5px",
                              backgroundColor: COLORS.gray,
                              color: "#fff",
                              padding: "3px 6px",
                              fontWeight: "600",
                            }}
                          >
                            Reserved
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </CModalBody>
    </CModal>
  );
};

export default CalendarModal;