import React, { useState } from "react";
import {
  getData,
  saveData,
  LEAVE_KEY,
} from "./storage";
import { useGlobalSearch } from "../../Usecontext/GlobalSearchContext";
import { Search, X, Plus } from "lucide-react";

export default function LeaveList() {
  const { searchQuery, setSearchQuery } = useGlobalSearch();
  const [list, setList] = useState(
    getData(LEAVE_KEY, [])
  );

  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    name: "Prashanth", // auto fetch
    from: "",
    to: "",
    reason: "",
  });

  const saveLeave = () => {

    const newList = [
      ...list,
      {
        id: Date.now(),
        ...form,
        status: "Pending",
      },
    ];

    saveData(LEAVE_KEY, newList);

    setList(newList);

    setShow(false);

    setForm({
      name: "Prashanth",
      from: "",
      to: "",
      reason: "",
    });
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
            <h4 className="mb-1 fw-bold" style={{ color: "#1B4F8A" }}>My Leave Requests</h4>
            <small className="text-muted fw-medium">View and manage your leave applications</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="cm-search-wrapper" style={{ width: "250px" }}>
              <Search size={14} className="cm-search-icon-left" />
              <input
                type="text"
                className="cm-search-input"
                placeholder="Search leaves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="cm-search-clear" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShow(true)} style={{ borderRadius: "8px", height: "36px" }}>
              <Plus size={16} /> Add Leave
            </button>
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
                        <span className={`badge rounded-pill px-3 py-2 ${
                          l.status === 'Approved' ? 'bg-success-light text-success' : 
                          l.status === 'Pending' ? 'bg-warning-light text-warning' : 
                          'bg-danger-light text-danger'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No leave records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {/* MODAL */}

      {show && (

        <div className="modal d-block">

          <div className="modal-dialog">

            <div className="modal-content">

              <div className="modal-header">
                <h5>Add Leave</h5>

                <button
                  className="btn-close"
                  onClick={() => setShow(false)}
                />

              </div>

              <div className="modal-body">


                <input
                  className="form-control"
                  value={form.name}
                  disabled
                />


                <input
                  type="date"
                  className="form-control mt-2"
                  value={form.from}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      from: e.target.value,
                    })
                  }
                />


                <input
                  type="date"
                  className="form-control mt-2"
                  value={form.to}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      to: e.target.value,
                    })
                  }
                />


                <input
                  className="form-control mt-2"
                  placeholder="Reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reason: e.target.value,
                    })
                  }
                />


              </div>


              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={() => setShow(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={saveLeave}
                >
                  Save
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}