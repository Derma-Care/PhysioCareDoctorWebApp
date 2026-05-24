import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner } from "@coreui/react";
import { ArrowLeft, X, Calendar, Activity, Clock, Shield, MapPin } from "lucide-react";
import { empDummy, attendanceDummy } from "./AttadanceDummyData";
import Pagination from "../../../Utils/Pagination";
import { http } from "../../../Utils/Interceptors";
import { BASE_URL, GetUserDailyAttendence, GetUserMonthlyAttendence, GetTherapistPerformanceSummary } from "../../../baseUrl";

export default function StaffAttendanceDetails() {
  const { name: userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Filters
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // API Data
  const [historyData, setHistoryData] = useState([]);
  const [trackerData, setTrackerData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tracker Modal State
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [performanceYear, setPerformanceYear] = useState(new Date().getFullYear().toString());

  const fetchMonthlyHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const role = location.state?.role || "";
      console.log(role);
      const normalizedRole = role.toLowerCase();
      let apiUrl;

      if (normalizedRole === "physiotherapist" || normalizedRole === "intern") {
        apiUrl = `${BASE_URL}/getMonthly/${userId}/${month}`;
      } else {
        apiUrl = `${BASE_URL}/${GetUserMonthlyAttendence}/${userId}/${month}`;
      }

      const res = await http.get(apiUrl);
      if (res.data.success) {
        setHistoryData(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching monthly history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [userId, month]);

  const fetchTrackerDetails = async (date) => {
    setSelectedDate(date);
    setShowTrackerModal(true);
    setLoadingTracker(true);
    try {
      const role = location.state?.role || "";
      const normalizedRole = role.toLowerCase();
      let apiUrl;

      if (normalizedRole === "physiotherapist" || normalizedRole === "intern") {
        apiUrl = `${BASE_URL}/getDaily/${userId}/${date}`;
      } else {
        apiUrl = `${BASE_URL}/${GetUserDailyAttendence}/${userId}/${date}`;
      }

      const res = await http.get(apiUrl);
      if (res.data.success) {
        setTrackerData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching tracker details:", err);
    } finally {
      setLoadingTracker(false);
    }
  };

  const fetchPerformanceSummary = useCallback(async () => {
    if (!showPerformanceModal) return;
    setLoadingPerformance(true);
    try {
      const clinicId = localStorage.getItem("HospitalId");
      const branchId = localStorage.getItem("branchId");
      const res = await http.get(`${BASE_URL}/${GetTherapistPerformanceSummary}/${clinicId}/${branchId}/${userId}/${performanceYear}`);
      if (res.data.success) {
        setPerformanceData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching performance summary:", err);
    } finally {
      setLoadingPerformance(false);
    }
  }, [userId, performanceYear, showPerformanceModal]);

  useEffect(() => {
    fetchMonthlyHistory();
  }, [fetchMonthlyHistory]);

  useEffect(() => {
    fetchPerformanceSummary();
  }, [fetchPerformanceSummary]);

  useEffect(() => {
    if (location.state?.openTracker && location.state?.initialDate) {
      fetchTrackerDetails(location.state.initialDate);
    }
    if (location.state?.openPerformance) {
      setShowPerformanceModal(true);
    }
  }, [location.state]);

  const staffInfo = historyData.length > 0 ? historyData[0] : null;
  const staffName = staffInfo?.name || userId;
  const staffRole = staffInfo?.role || "Staff";

  const calculateDuration = (startDate) => {
    if (!startDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}Y ${months}M ${days}D`;
  };

  const experience = calculateDuration(staffInfo?.joiningDate);

  const formatHoursToYMD = (totalHours) => {
    if (!totalHours || totalHours === 0) return "0D 0H";
    let hours = totalHours;
    if (typeof hours === 'string' && hours.includes('h')) {
      hours = parseInt(hours);
    }
    let days = Math.floor(hours / 24);
    hours = hours % 24;
    let months = Math.floor(days / 30);
    days = days % 30;
    let years = Math.floor(months / 12);
    months = months % 12;

    let result = "";
    if (years > 0) result += `${years}Y `;
    if (months > 0 || years > 0) result += `${months}M `;
    result += `${days}D ${Math.round(hours)}H`;
    return result;
  };

  // History Data with local filter
  let allStaffHistory = historyData;
  if (fromDate && toDate) {
    allStaffHistory = allStaffHistory.filter((att) => att.date >= fromDate && att.date <= toDate);
  } else if (fromDate) {
    allStaffHistory = allStaffHistory.filter((att) => att.date >= fromDate);
  } else if (toDate) {
    allStaffHistory = allStaffHistory.filter((att) => att.date <= toDate);
  }

  const totalPages = Math.ceil(allStaffHistory.length / pageSize);
  const staffHistory = allStaffHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleViewTracker = (date) => {
    fetchTrackerDetails(date);
  };

  const selectedAttRecord = historyData.find(att => att.date === selectedDate);
  const role = location.state?.role || "";
  console.log(role);
  const normalizedRole = role.toLowerCase();
  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-link text-decoration-none p-0 me-3"
          onClick={() => navigate(-1)}
          style={{ color: "#1B4F8A" }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h4 className="mb-0 fw-bold" style={{ color: "#1B4F8A" }}>
            Attendance History: {staffName}
          </h4>
          <span className="badge mt-2" style={{ backgroundColor: "#1B4F8A", color: "#fff", padding: "6px 12px", fontSize: "12px", borderRadius: "20px" }}>
            Role: {staffRole}
          </span>
        </div>

        {(normalizedRole.toLowerCase().includes("physiotherapist") || normalizedRole.toLowerCase().includes("intern")) && (
          <CButton
            className=" ms-auto shadow-sm"
            style={{ backgroundColor: "white", borderRadius: "8px", fontWeight: "600", color: "var(--color-bgcolor)", border: "1px solid var(--color-bgcolor)" }}
            onClick={() => setShowPerformanceModal(true)}
          >
            Performance
          </CButton>
        )}
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 mb-4 ">
            <div className="col-md-3 wd-date-group">
              <label className="wd-date-label">Month Selection</label>
              <input
                type="month"
                className="wd-date-input w-100"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #dee2e6" }}
              />
            </div>
            <div className="col-md-3 wd-date-group">
              <label className="wd-date-label">From Date</label>
              <div className="d-flex align-items-center">
                <input
                  type="date"
                  className="wd-date-input w-100"
                  value={fromDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ borderRadius: "8px", border: "1px solid #dee2e6" }}
                />
                {fromDate && (
                  <X
                    size={18}
                    className="ms-2"
                    style={{ cursor: "pointer", color: "#dc3545", flexShrink: 0 }}
                    onClick={() => setFromDate("")}
                    title="Clear"
                  />
                )}
              </div>
            </div>
            <div className="col-md-3 wd-date-group">
              <label className="wd-date-label">To Date</label>
              <div className="d-flex align-items-center">
                <input
                  type="date"
                  className="wd-date-input w-100"
                  value={toDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ borderRadius: "8px", border: "1px solid #dee2e6" }}
                />
                {toDate && (
                  <X
                    size={18}
                    className="ms-2"
                    style={{ cursor: "pointer", color: "#dc3545", flexShrink: 0 }}
                    onClick={() => setToDate("")}
                    title="Clear"
                  />
                )}
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="table-responsive rounded shadow-sm wd-table-wrapper">
            <table className="table table-hover align-middle mb-0 pink-table">
              <thead style={{ backgroundColor: "#1B4F8A", color: "#fff" }}>
                <tr>
                  <th className="px-4 py-3 text-uppercase small fw-bold">S.No</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Date</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Login</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Logout</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Total</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Working</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Idle</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <CSpinner color="primary" />
                      <div className="mt-2 text-muted">Loading attendance history...</div>
                    </td>
                  </tr>
                ) : staffHistory.length > 0 ? (
                  staffHistory.map((att, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f3f5" }}>
                      <td className="px-4 py-3 text-muted">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3 fw-medium" style={{ color: "#495057" }}>{att.date}</td>
                      <td className="px-4 py-3" style={{ color: "#6c757d" }}>{att.inTime || "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#6c757d" }}>{att.outTime || "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#6c757d" }}>{att.logTime || "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#6c757d" }}>{att.workingHours || "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#6c757d" }}>{att.idleTime || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="btn btn-sm btn-light shadow-sm border"
                          style={{ color: "#1B4F8A", borderRadius: "6px" }}
                          onClick={() => handleViewTracker(att.date)}
                        >
                          <i className="cil-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <div className="mb-2">No records found for the selected dates.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* TRACKER MODAL */}
      <CModal
        visible={showTrackerModal}
        onClose={() => setShowTrackerModal(false)}
        size="lg"
        alignment="center" className="custom-modal"
      >
        <CModalHeader closeButton style={{ borderBottom: "1px solid #f1f3f5", padding: "20px 24px" }}>
          <CModalTitle style={{ color: "#1B4F8A", fontWeight: "bold", fontSize: "1.1rem" }}>
            Attendance Details <span className="text-muted fw-normal fs-6 ms-2">| {selectedDate}</span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: "24px" }}>
          {/* Summary Row */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                <div className="text-muted small text-uppercase fw-bold mb-1">Login Details</div>
                <div className="d-flex flex-column">
                  <span className="fw-bold" style={{ color: "#1B4F8A" }}>{trackerData?.login?.time || "-"}</span>
                  <span className="text-muted small" style={{ fontSize: "10px", lineHeight: "1.2" }}>{trackerData?.login?.location || "Location N/A"}</span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                <div className="text-muted small text-uppercase fw-bold mb-1">Logout Details</div>
                <div className="d-flex flex-column">
                  <span className="fw-bold" style={{ color: "#1B4F8A" }}>{trackerData?.logout?.time || "-"}</span>
                  <span className="text-muted small" style={{ fontSize: "10px", lineHeight: "1.2" }}>{trackerData?.logout?.location || "Location N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded border" style={{ backgroundColor: "#f0f7ff" }}>
            <h6 className="fw-bold mb-3" style={{ color: "#1B4F8A" }}>Daily Activity Log</h6>
            {loadingTracker ? (
              <div className="text-center py-3">
                <CSpinner size="sm" color="primary" />
                <div className="small text-muted mt-2">Fetching activity logs...</div>
              </div>
            ) : (trackerData?.activities?.length > 0 || trackerData?.sessions?.length > 0) ? (
              <div className="table-responsive">
                <table className="table table-sm table-borderless align-middle mb-0">
                  <thead className="text-muted small text-uppercase" style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th className="py-2">#</th>
                      <th className="py-2">Activity</th>
                      <th className="py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trackerData.activities || trackerData.sessions).map((act, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="py-2 fw-bold" style={{ color: "#1B4F8A" }}>{idx + 1}</td>
                        <td className="py-2 text-dark">
                          <div className="fw-bold">{act.activity}</div>
                          {act.description && <div className="text-muted small mb-1" style={{ fontSize: "11px", fontStyle: "italic" }}>{act.description}</div>}
                          <div className="text-muted" style={{ fontSize: "10px" }}>{act.location}</div>
                        </td>
                        <td className="py-2"><span className="badge bg-light text-dark border">{act.duration}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mb-0 text-muted small text-center py-2">No detailed activity logs available for this day.</p>
            )}
          </div>
        </CModalBody>
        <CModalFooter style={{ borderTop: "none", padding: "16px 24px" }}>
          <CButton color="secondary" style={{ backgroundColor: "#f8f9fa", color: "#495057", border: "1px solid #dee2e6" }} onClick={() => setShowTrackerModal(false)}>
            Close Details
          </CButton>
        </CModalFooter>
      </CModal>

      {/* PERFORMANCE MODAL */}
      <CModal
        visible={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        size="lg"
        alignment="center" className="custom-modal" backdrop="static"
      >
        <CModalHeader closeButton style={{ borderBottom: "1px solid #f1f3f5", padding: "20px 24px" }} keyboard={false}>
          <CModalTitle style={{ color: "#1B4F8A", fontWeight: "bold" }}>
            Performance Overview: {staffName}
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: "30px" }}>
          {/* Top Info & Year Filter */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="p-3 rounded border" style={{ backgroundColor: "#f0f7ff", flex: 1, marginRight: "20px" }}>
              <div className="text-muted small text-uppercase fw-bold mb-1">Total Experience (since {staffInfo?.joiningDate || "N/A"})</div>
              <h5 className="mb-0 fw-bold" style={{ color: "#1B4F8A" }}>{experience}</h5>
            </div>
            <div style={{ width: "150px" }}>
              <label className="form-label text-muted small text-uppercase fw-bold mb-1">Select Year</label>
              <select
                className="form-select shadow-sm"
                value={performanceYear}
                onChange={(e) => setPerformanceYear(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #dee2e6" }}
              >
                <option value="all">All Time</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>

          {loadingPerformance ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <div className="mt-3 text-muted">Analyzing performance data...</div>
            </div>
          ) : performanceData ? (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="p-3 text-center rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="text-muted small text-uppercase fw-bold mb-1">Session Time</div>
                    <h4 className="mb-0 fw-bold" style={{ color: "#1B4F8A", fontSize: "1.1rem" }}>
                      {formatHoursToYMD(performanceData.completedSessionTime || 0)}
                    </h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="p-3 text-center rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="text-muted small text-uppercase fw-bold mb-1">Idle Time</div>
                    <h4 className="mb-0 fw-bold" style={{ color: "#dc3545", fontSize: "1.1rem" }}>
                      {formatHoursToYMD(performanceData.idleTime || 0)}
                    </h4>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="p-3 text-center rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="text-muted small text-uppercase fw-bold mb-1">Training Time</div>
                    <h4 className="mb-0 fw-bold" style={{ color: "#198754", fontSize: "1.1rem" }}>
                      {formatHoursToYMD(performanceData.trainingTime || 0)}
                    </h4>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="p-3 text-center rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="text-muted small text-uppercase fw-bold mb-1">Avg Rating</div>
                    <h4 className="mb-0 fw-bold" style={{ color: "#ffc107", fontSize: "1.1rem" }}>{performanceData.avgRating || "4.5"}</h4>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded border" style={{ backgroundColor: "#f0f7ff" }}>
                <h5 className="fw-bold mb-3" style={{ color: "#1B4F8A" }}>Performance Analysis for {performanceYear === "all" ? "Entire Tenure" : performanceYear}</h5>
                <p className="mb-0" style={{ color: "#495057", lineHeight: "1.6" }}>
                  {performanceData.analysisSummary || `Based on the metrics for ${performanceYear === "all" ? "the entire period" : performanceYear}, ${staffName} is showing consistent dedication to patient care with a high session completion rate.`}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted">No performance data available for the selected year.</div>
          )}
        </CModalBody>
        <CModalFooter style={{ borderTop: "none", padding: "16px 24px" }}>
          <CButton color="secondary" variant="outline" onClick={() => setShowPerformanceModal(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
