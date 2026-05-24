import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function AttendanceLayout() {

  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { name: "Employee List", path: "/attendance/employee-list" },
    { name: "Shift List", path: "/attendance/shift-list" },
    // { name: "Attandance Entry", path: "/attendance/attendance-entry" },
    // { name: "Attandance List", path: "/attendance/attendance-list" },
    { name: "Report", path: "/attendance/report" },
    { name: "Monthly", path: "/attendance/monthly" },
    { name: "Holiday", path: "/attendance/holiday" },
    // { name: "Leave List", path: "/attendance/leave-list" },
    // { name: "Leave Request", path: "/attendance/leave" },
    { name: "Leave Approval", path: "/attendance/leave-approval" },
  ];
    useEffect(() => {

    if (location.pathname === "/attendance") {
      navigate("/attendance/report");
    }

  }, [location.pathname, navigate]);

  return (
    <div>

      <h3>Attendance</h3>

      <ul className="nav nav-tabs">

        {tabs.map((t, i) => (

          <li key={i} className="nav-item">

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

      <div className="mt-3">
        <Outlet />
      </div>

    </div>
  );
}