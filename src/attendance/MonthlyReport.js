import React, { useState, useEffect, useCallback } from "react";
import { CPopover, CButton } from "@coreui/react";
import { empDummy } from "./AttadanceDummyData";
import { useGlobalSearch } from "../../Usecontext/GlobalSearchContext";
import { Search, X, Calendar } from "lucide-react";
import { http } from "../../../Utils/Interceptors";
import { BASE_URL, GetAllUsersMonthlyByClinicAndBranch } from "../../../baseUrl";

export default function MonthlyReport() {
  const { searchQuery, setSearchQuery } = useGlobalSearch();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMonthlyAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const hospitalId = localStorage.getItem("HospitalId");
      const branchId = localStorage.getItem("branchId");
      const res = await http.get(`${BASE_URL}/${GetAllUsersMonthlyByClinicAndBranch}/${hospitalId}/${branchId}/${month}`);
      if (res.status === 200 && res.data && res.data.success) {
        setAttendanceData(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching monthly attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [fetchMonthlyAttendance]);

  // If the API returns a list of daily records, we aggregate them by user
  // If it already returns a summary, we use it directly.
  // Assuming it returns daily records for the month based on the provided JSON structure.
  
  const userSummaries = React.useMemo(() => {
    const summary = {};
    attendanceData.forEach(record => {
      const { userId, name, status, role, date, reason } = record;
      if (!summary[userId]) {
        summary[userId] = { userId, name, role, present: 0, absent: 0, late: 0, leave: 0, records: [] };
      }
      summary[userId].records.push(record);
      if (status === "Present" || status === "LOGGED_OUT" || status === "LOGGED_IN") summary[userId].present++;
      else if (status === "Absent") summary[userId].absent++;
      else if (status === "Late") summary[userId].late++;
      else if (status === "Leave") summary[userId].leave++;
    });
    return Object.values(summary);
  }, [attendanceData]);

  const filteredSummaries = userSummaries.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q);
  });

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-header bg-white border-bottom pt-4 pb-3 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: "#1B4F8A" }}>Monthly Attendance Summary</h4>
            <small className="text-muted fw-medium">Overview for {month}</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="cm-search-wrapper" style={{ width: "250px" }}>
              <Search size={14} className="cm-search-icon-left" />
              <input
                type="text"
                className="cm-search-input"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="cm-search-clear" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div style={{ width: "180px" }}>
              <input
                type="month"
                className="form-control shadow-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #dee2e6", height: "36px" }}
              />
            </div>
          </div>
        </div>
        <div className="card-body p-0 mt-2">
          <div className="table-responsive wd-table-wrapper">
            <table className="table table-hover align-middle mb-0 pink-table">
              <thead style={{ backgroundColor: "#1B4F8A", color: "#fff" }}>
                <tr>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Name</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Present</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Absent</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Late</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Leave</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length > 0 ? (
                  filteredSummaries.map((s) => (
                    <tr key={s.userId} style={{ borderBottom: "1px solid #f1f3f5" }}>
                      <td className="px-4 py-3 fw-bold text-dark">{s.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-success-light text-success px-3 py-2 rounded-pill">
                          {s.present}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CPopover
                          trigger="hover"
                          placement="top"
                          content={
                            <table className="table table-sm mb-0">
                              <thead className="table-light">
                                <tr><th>Date</th><th>Reason</th></tr>
                              </thead>
                              <tbody>
                                {s.records.filter(r => r.status === "Absent").map((d, i) => (
                                  <tr key={i}><td>{d.date}</td><td>{d.reason || "N/A"}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          }
                        >
                          <CButton size="sm" color="danger" variant="outline" className="rounded-pill px-3">
                            {s.absent}
                          </CButton>
                        </CPopover>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CPopover
                          trigger="hover"
                          placement="top"
                          content={
                            <table className="table table-sm mb-0">
                              <thead className="table-light">
                                <tr><th>Date</th><th>In</th><th>Reason</th></tr>
                              </thead>
                              <tbody>
                                {s.records.filter(r => r.status === "Late").map((d, i) => (
                                  <tr key={i}><td>{d.date}</td><td>{d.login?.time || "-"}</td><td>{d.reason || "N/A"}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          }
                        >
                          <CButton size="sm" color="warning" variant="outline" className="rounded-pill px-3">
                            {s.late}
                          </CButton>
                        </CPopover>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CPopover
                          trigger="hover"
                          placement="top"
                          content={
                            <table className="table table-sm mb-0">
                              <thead className="table-light">
                                <tr><th>Date</th><th>Reason</th></tr>
                              </thead>
                              <tbody>
                                {s.records.filter(r => r.status === "Leave").map((d, i) => (
                                  <tr key={i}><td>{d.date}</td><td>{d.reason || "N/A"}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          }
                        >
                          <CButton size="sm" color="info" variant="outline" className="rounded-pill px-3">
                            {s.leave}
                          </CButton>
                        </CPopover>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      {loading ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        `No staff found matching "${searchQuery}"`
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}