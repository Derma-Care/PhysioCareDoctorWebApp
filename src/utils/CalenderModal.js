import React, { useEffect, useState } from "react";
import axios from "axios";
import { CModal, CModalHeader, CModalTitle, CModalBody } from "@coreui/react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { COLORS } from "../Themes";

import { getDoctorDetails } from "../Auth/Auth";

const convertTo24Hr = (time12h) => {
  if (!time12h) return null;
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

// Generate time slots dynamically
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
// Convert "07:00" → "07:00 AM", "22:00" → "10:00 PM"
const convertTo12Hr = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
};

const formatFullDate = (date) =>
  date instanceof Date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : date;

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
  let mm = parseInt(parts[1], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  if (modifier) {
    if (modifier === "PM" && hh !== 12) hh += 12;
    if (modifier === "AM" && hh === 12) hh = 0;
  }
  return hh * 60 + mm;
};

const CalendarModal = ({
  visible,
  onClose,
  todayAppointments = [],
  defaultBookedSlots = [],
  days = 15,
  interval = 30,
  handleClick = () => { },
  fetchAppointments,
  intervalMs = 60000,
}) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [clinicTimes, setClinicTimes] = useState({ open: "", close: "" });
  const dates = generateDates(days);

  // ✅ Fetch opening & closing times dynamically (no static fallback)
  useEffect(() => {
    const fetchClinicTimings = async () => {
      try {
        const doctorData = await getDoctorDetails(); // ✅ Use your API helper
        if (doctorData?.availableTimes) {
          const [openTime, closeTime] = doctorData.availableTimes.split(" - ").map((t) => t.trim());
          if (openTime && closeTime) {
            const open = convertTo24Hr(openTime);
            const close = convertTo24Hr(closeTime);
            setClinicTimes({ open, close });
            setTimeSlots(generateTimeSlots(open, close, interval));
          } else {
            console.warn("⚠️ Invalid availableTimes format:", doctorData.availableTimes);
            setTimeSlots([]);
          }
        } else {
          console.warn("⚠️ availableTimes not found in doctor details");
          setTimeSlots([]);
        }
      } catch (error) {
        console.error("❌ Failed to fetch doctor details:", error);
        setTimeSlots([]);
      }
    };

    fetchClinicTimings();
  }, [interval]);

  // Refresh appointments periodically
  useEffect(() => {
    if (!visible || !fetchAppointments) return;
    fetchAppointments(); // immediate
    const id = setInterval(fetchAppointments, intervalMs);
    return () => clearInterval(id);
  }, [visible, fetchAppointments, intervalMs]);

  const getLocalDateStr = (d) => new Date(d).toLocaleDateString("en-CA");

  const getAppointments = (dateObj, slotStart, slotEnd) => {
    const dateStr = getLocalDateStr(dateObj);
    const startMin = toMinutes(slotStart);
    const endMin = slotEnd ? toMinutes(slotEnd) : startMin + interval;

    return (todayAppointments || []).filter((appt) => {
      if (!appt.serviceDate || !appt.servicetime) return false;
      const apptDateStr = getLocalDateStr(appt.serviceDate);
      if (apptDateStr !== dateStr) return false;
      const apptMin = toMinutes(appt.servicetime);
      return apptMin >= startMin && apptMin < endMin;
    });
  };

  const isDefaultBooked = (dateObj, slotStart, slotEnd) => {
    const dateStr = getLocalDateStr(dateObj);
    const startMin = toMinutes(slotStart);
    const endMin = slotEnd ? toMinutes(slotEnd) : startMin + interval;

    return (defaultBookedSlots || []).some((slot) => {
      if (!slot.date || !slot.time) return false;
      const sDateStr = getLocalDateStr(slot.date);
      if (sDateStr !== dateStr) return false;
      const sMin = toMinutes(slot.time);
      return sMin >= startMin && sMin < endMin;
    });
  };

  const generatePopover = (appointment) => (
    <Popover id={`popover-${appointment.bookingId}`} style={{ maxWidth: "260px" }}>
      <Popover.Header as="h6">Patient Info</Popover.Header>
      <Popover.Body>
        <div><strong>Name:</strong> {appointment.name}</div>
        <div><strong>Age & Gender:</strong> {appointment.age}, {appointment.gender}</div>
        <div><strong>Mobile:</strong> {appointment.patientMobileNumber || appointment.mobileNumber}</div>
        <div><strong>Branch & Clinic:</strong> {appointment.branchname}, {appointment.clinicName}</div>
        <div><strong>Doctor:</strong> {appointment.doctorName}</div>
        <div><strong>Service Date & Time:</strong> {formatFullDate(new Date(appointment.serviceDate))}, {appointment.servicetime}</div>
        <div><strong>Status:</strong> {appointment.status}</div>
      </Popover.Body>
    </Popover>
  );

  return (
    <CModal visible={visible} onClose={onClose} size="xl">
      <CModalHeader closeButton>
        <CModalTitle
          className="w-100"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            color: COLORS.black,
          }}
        >
          {/* Centered Title */}
          <div style={{ textAlign: "center", flex: "1" }}>
            My Calendar{" "}
            {clinicTimes.open && clinicTimes.close ? (
              <>
                (
                {convertTo12Hr(clinicTimes.open)} - {convertTo12Hr(clinicTimes.close)}
                )
              </>
            ) : (
              "(Loading timings...)"
            )}
          </div>

          {/* Legend on Right Corner */}
          <div
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "4px",
                  backgroundColor: "#7e3a93",
                }}
              ></div>
              <span>Booked</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "4px",
                  backgroundColor: "#f0ad4e",
                }}
              ></div>
              <span>In-Progress</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "4px",
                  backgroundColor: "#28a745",
                }}
              ></div>
              <span>Completed</span>
            </div>
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: 0 }}>
        <div style={{ overflow: "auto", maxHeight: "80vh", border: "1px solid #ccc" }}>
          {timeSlots.length === 0 ? (
            <div className="text-center py-5">No clinic timings available</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `120px repeat(${dates.length}, 1fr)`,
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
              }}
            >
              <div style={{ backgroundColor: COLORS?.bgcolor || "#e9eef6" }}></div>

              {dates.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 6px",
                    backgroundColor: COLORS?.bgcolor || "#b5d0e0",
                    color: COLORS?.black || "#4b0082",
                    fontWeight: 600,
                    textAlign: "center",
                    borderLeft: "1px solid #dbdada",
                    borderBottom: "1px solid #dbdada",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  {d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit" })}
                </div>
              ))}

              {timeSlots.map((slot, i) => (
                <React.Fragment key={slot + i}>
                  <div
                    style={{
                      padding: "8px",
                      fontWeight: "bold",
                      backgroundColor: COLORS?.bgcolor || "#e9eef6",
                      color: COLORS?.black,
                      textAlign: "center",
                      borderBottom: "1px solid #dbdada",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                    }}
                  >
                    {slot}
                  </div>

                  {dates.map((d, j) => {
                    const nextSlot = timeSlots[i + 1] || null;
                    const appointments = getAppointments(d, slot, nextSlot);
                    const defaultBooked = isDefaultBooked(d, slot, nextSlot);

                    return (
                      <div
                        key={`${i}-${j}`}
                        style={{
                          padding: "6px",
                          borderLeft: "1px solid #dbdada",
                          borderBottom: "1px solid #dbdada",
                          minHeight: "44px",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        {appointments.length > 0 ? (
                          appointments.map((appt) => {
                            const status = appt.status?.toLowerCase();
                            let bgColor = "#7e3a93"; // default (Booked - purple)

                            if (status === "in-progress" || status === "in progress") {
                              bgColor = "#f0ad4e"; // orange for in-progress
                            } else if (status === "completed") {
                              bgColor = "#28a745"; // green for completed
                            } else if (status === "cancelled" || status === "canceled") {
                              bgColor = "#d9534f"; // red for cancelled
                            }

                            // Disable click only for completed appointments
                            const isClickable = status !== "completed";

                            return (
                              <OverlayTrigger
                                key={appt.bookingId}
                                trigger={["hover", "focus"]}
                                placement="right"
                                overlay={generatePopover(appt)}
                              >
                                <div
                                  onClick={() => {
                                    if (!isClickable) {
                                      alert("This appointment is completed and cannot be opened.");
                                      return;
                                    }
                                    handleClick(appt);
                                  }}
                                  style={{
                                    fontSize: "12px",
                                    borderRadius: "6px",
                                    backgroundColor: bgColor,
                                    color: "#fff",
                                    padding: "4px 6px",
                                    cursor: isClickable ? "pointer" : "not-allowed",
                                    opacity: isClickable ? 1 : 0.6,
                                  }}
                                >
                                  Booked
                                </div>
                              </OverlayTrigger>
                            );
                          })
                        ) : defaultBooked ? (
                          <div
                            style={{
                              fontSize: "12px",
                              borderRadius: "6px",
                              backgroundColor: "#999",
                              color: "#fff",
                              padding: "4px 6px",
                            }}
                          >
                            Default Booked
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
