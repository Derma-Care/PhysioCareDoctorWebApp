import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Pagination from "../../../Utils/Pagination";
import { useGlobalSearch } from "../../Usecontext/GlobalSearchContext";
import { Search, X, Calendar } from "lucide-react";
import { http } from "../../../Utils/Interceptors";
import { BASE_URL, GetAllUsersDailyByClinicAndBranch, SaveUserAttendence, UpdateUserAttendence } from "../../../baseUrl";

export default function AttendanceReport() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [searchQuery, setSearchQuery] = useState("");

  // Filters for Main Page
  const [filterRole, setFilterRole] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const hospitalId = localStorage.getItem("HospitalId");
      const branchId = localStorage.getItem("branchId");
      const res = await http.get(`${BASE_URL}/${GetAllUsersDailyByClinicAndBranch}/${hospitalId}/${branchId}/${selectedDate}`);
      if (res.status === 200 && res.data && res.data.success) {
        setAttendanceData(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchQuery]);

  const getCurrentLocationCoords = () => {
    return new Promise((resolve) => {
      if (window.isSecureContext && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude.toString(),
              lon: position.coords.longitude.toString()
            });
          },
          () => resolve({ lat: "", lon: "" }),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        resolve({ lat: "", lon: "" });
      }
    });
  };

  const handleManualLogin = async (userId) => {
    try {
      const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const coords = await getCurrentLocationCoords();
      const payload = {
        date: selectedDate,
        login: {
          time: time,
          latitude: coords.lat,
          longitude: coords.lon
        },
        latitude: coords.lat,
        longitude: coords.lon,
        time: time,
        userId: userId
      };
      const res = await http.post(`${BASE_URL}/${SaveUserAttendence}`, payload);
      if (res.status === 200 || res.status === 201) {
        fetchAttendance();
      }
    } catch (error) {
      console.error("Error manual login:", error);
    }
  };

  const handleManualLogout = async (userId) => {
    try {
      const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const coords = await getCurrentLocationCoords();
      const payload = {
        date: selectedDate,
        logoutLatitude: coords.lat,
        logoutLongtitude: coords.lon,
        logoutTime: time,
        userId: userId
      };
      const res = await http.put(`${BASE_URL}/${UpdateUserAttendence}`, payload);
      if (res.status === 200) {
        fetchAttendance();
      }
    } catch (error) {
      console.error("Error manual logout:", error);
    }
  };

  const allFilteredAttendance = attendanceData.filter((att) => {
    // Role filter (case-insensitive)
    if (filterRole !== "all" && att.role?.toLowerCase() !== filterRole.toLowerCase()) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = att.name.toLowerCase().includes(q);
      const matchesRole = att.role?.toLowerCase().includes(q);
      const matchesStatus = att.status?.toLowerCase().includes(q);
      const matchesUserId = att.userId?.toLowerCase().includes(q);
      if (!matchesName && !matchesRole && !matchesStatus && !matchesUserId) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(allFilteredAttendance.length / pageSize);
  const todaysAttendance = allFilteredAttendance.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleViewStaff = (userId, role) => {
    navigate(`/attendance/staff/${userId}`, { state: { role } });
  };

  return (
    <div className="container-fluid mt-4">
      {/* MAIN VIEW */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-header bg-white border-bottom pt-4 pb-3 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: "#1B4F8A" }}>Daily Attendance</h4>
            <small className="text-muted fw-medium">Showing records for: {selectedDate}</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="wd-date-group mb-0">
              <div className="d-flex align-items-center position-relative">
                <Calendar size={14} className="position-absolute ms-2 text-muted" />
                <input
                  type="date"
                  className="form-control shadow-sm ps-5"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ borderRadius: "8px", border: "1px solid #dee2e6", height: "36px", fontSize: "14px", width: "160px" }}
                />
              </div>
            </div>
            <div style={{ width: "180px" }}>
              <select
                className="form-select shadow-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #dee2e6", height: "36px", fontSize: "14px" }}
              >
                <option value="all">All Roles</option>
                {[...new Set(attendanceData.map(a => a.role?.trim()).filter(Boolean))].map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="cm-search-wrapper" style={{ width: "250px" }}>
              <Search size={14} className="cm-search-icon-left" />
              <input
                type="text"
                className="cm-search-input"
                placeholder="Search attendance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="cm-search-clear" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-body p-0 mt-2">
          <div className="table-responsive wd-table-wrapper">
            <table className="table table-hover align-middle mb-0 pink-table">
              <thead style={{ backgroundColor: "#1B4F8A", color: "#fff" }}>
                <tr>
                  <th className="px-4 py-3 text-uppercase small fw-bold">S.No</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Name</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Role</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">In Time</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Out Time</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Status</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {todaysAttendance.length > 0 ? (
                  todaysAttendance.map((att, idx) => {
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3 text-muted">{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td className="px-4 py-3 fw-bold text-dark">{att.name}</td>
                        <td className="px-4 py-3" style={{ color: "#6c757d" }}>{att.role || "-"}</td>
                        <td className="px-4 py-3" style={{ color: "#495057" }}>
                          {att.login?.time ? (
                            att.login.time
                          ) : selectedDate <= today ? (
                            <button
                              className="btn btn-sm   shadow-sm"
                              style={{ borderRadius: "6px", color: "var(--pink-color)", borderColor: "var(--pink-color)" }}
                              onClick={() => handleManualLogin(att.userId)}
                              title="Manual Login"
                            >
                              Login
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#495057" }}>
                          {att.logout?.time ? (
                            att.logout.time
                          ) : selectedDate <= today && att.login?.time ? (
                            <button
                              className="btn btn-sm shadow-sm"
                              style={{ borderRadius: "6px", color: "var(--pink-color)", borderColor: "var(--pink-color)" }}
                              onClick={() => handleManualLogout(att.userId)}
                              title="Manual Logout"
                            >
                              Logout
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge`} style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontWeight: "500",
                            backgroundColor: (att.status === "Present" || att.status === "LOGGED_OUT" || att.status === "LOGGED_IN") ? "#d1e7dd" :
                              att.status === "Late" ? "#fff3cd" :
                                att.status === "Leave" ? "#cff4fc" : "#f8d7da",
                            color: (att.status === "Present" || att.status === "LOGGED_OUT" || att.status === "LOGGED_IN") ? "#0f5132" :
                              att.status === "Late" ? "#856404" :
                                att.status === "Leave" ? "#055160" : "#842029"
                          }}>
                            {att.status === "LOGGED_OUT" ? "Present" : att.status === "LOGGED_IN" ? "In Work" : att.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm btn-light shadow-sm border"
                              style={{ color: "#1B4F8A", borderRadius: "6px" }}
                              onClick={() => handleViewStaff(att.userId, att.role)}
                              title="Monthly View"
                            >
                              <i className="cil-calendar"></i> View
                            </button>
                            {/* <button
                              className="btn btn-sm btn-outline-primary shadow-sm"
                              style={{ borderRadius: "6px" }}
                              onClick={() => navigate(`/attendance/staff/${att.userId}`, { state: { openTracker: true, initialDate: att.date } })}
                              title="Track Activities"
                            >
                              <i className="cil-map"></i> Track
                            </button> */}
                            {/* {(att.role?.toLowerCase().includes("therapist") || att.role?.toLowerCase().includes("physio")) && (
                              <button
                                className="btn btn-sm btn-outline-success shadow-sm"
                                style={{ borderRadius: "6px" }}
                                onClick={() => navigate(`/attendance/staff/${att.userId}`, { state: { openPerformance: true } })}
                                title="Performance Summary"
                              >
                                <i className="cil-chart"></i> Performance
                              </button>
                            )} */}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      {loading ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2">No attendance records found for {selectedDate}.</div>
                          {/* <small>Select a different filter or check back later.</small> */}
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white border-0 py-3">
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
  );
}