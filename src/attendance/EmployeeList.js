import React, { useState } from 'react'
import { getData, EMP_KEY } from './storage'
import { empDummy } from './AttadanceDummyData'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../../Usecontext/GlobalSearchContext'
import { Search, X } from 'lucide-react'

export default function EmployeeList() {
  const navigate = useNavigate()
  const { searchQuery, setSearchQuery } = useGlobalSearch()

 
    const [list, setList] = useState(
    getData(EMP_KEY, empDummy)
  );

  const shifts = [
    "Morning",
    "Evening",
    "Night",
    "Off",
  ];

  const updateShift = (
    id,
    shift
  ) => {

    const newList =
      list.map((e) =>
        e.id === id
          ? {
              ...e,
              shift,
            }
          : e
      );

    setList(newList);

    saveData(
      EMP_KEY,
      newList
    );
  };

  const filteredList = list.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.clinic.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-header bg-white border-bottom pt-4 pb-3 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: "#1B4F8A" }}>Employee Attendance List</h4>
            <small className="text-muted fw-medium">Manage shifts and view attendance records</small>
          </div>
          <div className="cm-search-wrapper" style={{ width: "250px" }}>
            <Search size={14} className="cm-search-icon-left" />
            <input
              type="text"
              className="cm-search-input"
              placeholder="Search employee..."
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
                  <th className="px-4 py-3 text-uppercase small fw-bold">ID</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Name</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Role</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Clinic</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Shift</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold">Status</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                      <td className="px-4 py-3 text-muted">{e.id}</td>
                      <td className="px-4 py-3 fw-bold text-dark">{e.name}</td>
                      <td className="px-4 py-3 text-muted">{e.role}</td>
                      <td className="px-4 py-3 text-muted">{e.clinic}</td>
                      <td className="px-4 py-3">
                        <select
                          className="form-select form-select-sm shadow-sm"
                          value={e.shift || ""}
                          onChange={(ev) => updateShift(e.id, ev.target.value)}
                          style={{ borderRadius: "6px", fontSize: "12px", border: "1px solid #dee2e6" }}
                        >
                          <option value="">Select</option>
                          {shifts.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge rounded-pill px-3 py-2 ${
                          e.status === 'Present' ? 'bg-success-light text-success' : 
                          e.status === 'Late' ? 'bg-warning-light text-warning' : 
                          'bg-danger-light text-danger'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="btn btn-sm btn-light shadow-sm border"
                          style={{ color: "#1B4F8A", borderRadius: "6px" }}
                          onClick={() => navigate('/attendance-list', { state: e })}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="mb-2">No employees found matching "{searchQuery}"</div>
                      <small>Try a different name or role.</small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
