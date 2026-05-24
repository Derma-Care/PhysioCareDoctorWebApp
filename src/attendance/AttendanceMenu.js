import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AttendanceMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

const tabs = [
  { name: "Employee List", path: "/attendance/employee-list" },
  { name: "Shift List", path: "/attendance/shift-list" },
  { name: "Entry", path: "/attendance/attendance-entry" },
  { name: "List", path: "/attendance/attendance-list" },
  { name: "Report", path: "/attendance/report" },
  { name: "Monthly", path: "/attendance/monthly" },
  { name: "Holiday", path: "/attendance/holiday" },
  { name: "Leave List", path: "/attendance/leave-list" },
  { name: "Leave Request", path: "/attendance/leave" },
  { name: "Leave Approval", path: "/attendance/leave-approval" },
  { name: "AssignShift", path: "/attendance/assignShift" },
  

 
];

  return (
    <div className="container mt-4">

      <h3>Attendance Module</h3>

      <ul className="nav nav-tabs">

        {tabs.map((t, i) => (
          <li key={i} className="nav-item" style={{color:"var(--color-black)"}}>

            <button style={{color:"var(--color-black)"}}
              className={
                "nav-link " +
                (location.pathname === t.path ? "active" : "")
              }
              onClick={() => navigate(t.path)}
            >
              {t.name}
            </button>

          </li>
        ))}

      </ul>

    </div>
  );
}

export default AttendanceMenu;