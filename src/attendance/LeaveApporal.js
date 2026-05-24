import React, { useState } from "react";
import {
  getData,
  saveData,
  LEAVE_KEY,
} from "./storage";
import { useGlobalSearch } from "../../Usecontext/GlobalSearchContext";
import { Search, X } from "lucide-react";

export default function LeaveApproval() {
  const { searchQuery, setSearchQuery } = useGlobalSearch();
  const [list, setList] = useState(
    getData(LEAVE_KEY, [])
  );

  const changeStatus = (id, value) => {

    let reason = "";

    // ask reason if rejected
    if (value === "Rejected") {
      reason = prompt("Enter reject reason");
      if (!reason) return;
    }

    const newList = list.map((l) => {

      if (l.id === id) {

        return {
          ...l,
          status: value,
          rejectReason:
            value === "Rejected"
              ? reason
              : "",
        };

      }

      return l;
    });

    setList(newList);

    saveData(LEAVE_KEY, newList);
  };

  // Filter list by search query
  const filteredList = list.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q) || l.status.toLowerCase().includes(q);
  });

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-header bg-white border-bottom pt-4 pb-3 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: "#1B4F8A" }}>Leave Approval Management</h4>
            <small className="text-muted fw-medium">Review and process staff leave applications</small>
          </div>
          <div className="cm-search-wrapper" style={{ width: "250px" }}>
            <Search size={14} className="cm-search-icon-left" />
            <input
              type="text"
              className="cm-search-input"
              placeholder="Search by name or reason..."
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
        <div className="card-body p-0 mt-2">
          <div className="table-responsive wd-table-wrapper">
            <table className="table table-hover align-middle mb-0 pink-table">
              <thead style={{ backgroundColor: "#1B4F8A", color: "#fff" }}>
                <tr>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Name</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">From</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">To</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Reason</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Status</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Reject Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                      <td className="px-4 py-3 fw-bold text-dark">{l.name}</td>
                      <td className="px-4 py-3 text-muted">{l.from}</td>
                      <td className="px-4 py-3 text-muted">{l.to}</td>
                      <td className="px-4 py-3 text-muted">{l.reason}</td>
                      <td className="px-4 py-3">
                        <select
                          className={`form-select form-select-sm shadow-sm ${
                            l.status === 'Approved' ? 'text-success' : 
                            l.status === 'Pending' ? 'text-warning' : 
                            'text-danger'
                          }`}
                          value={l.status}
                          onChange={(e) => changeStatus(l.id, e.target.value)}
                          style={{ borderRadius: "6px", fontSize: "12px", width: "120px" }}
                        >
                          <option>Pending</option>
                          <option>Approved</option>
                          <option>Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted small">
                        {l.rejectReason || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No leave requests found.
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