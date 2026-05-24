 

import React, { useState } from "react";

import {
  getData,
  saveData,
  ATT_KEY,
  SHIFT_KEY,
} from "./storage";

import {
  attendanceDummy,
  shiftDummy,
  empDummy,
} from "./AttadanceDummyData";
import AttendanceTable from "./AttadanceTable";
import LeaveList from "./LeaveList";
import ShiftMaster from "./ShiftMaster";
import AssignShift from "./ShiftAssign";
import ShiftDaily from "./ShiftAssign";
import { useLocation } from "react-router-dom";

export default function AttendanceList() {

  const location = useLocation();

const emp = location.state || empDummy[0];

const shiftInfo = shiftDummy.find(
  (s) => s.name === emp.shift
);

  const [tab, setTab] = useState("attendance");

  const [month, setMonth] = useState("");

  const [showModal, setShowModal] = useState(false);

  const attendance = getData(ATT_KEY, attendanceDummy);
  const shifts = getData(SHIFT_KEY, shiftDummy);

  const [form, setForm] = useState({
    name: "",
    shift: "",
    reason: "",
  });

  // auto date time
  const now = new Date();

  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  const openModal = () => {

    setForm({
      name: empDummy[0].name,
      shift: empDummy[0].shift,
      reason: "",
    });

    setShowModal(true);
  };

  const saveAttendance = () => {

    const list = getData(ATT_KEY, attendanceDummy);

    const newList = [
      ...list,
      {
        id: Date.now(),
        name: form.name,
        shift: form.shift,
        reason: form.reason,
        date: date,
        in: time,
        out: "",
        status: "Present",
      },
    ];

    saveData(ATT_KEY, newList);

    setShowModal(false);
  };

  // filter by month
  const filtered = attendance.filter((a) => {

    if (!month) return true;

    return a.date.startsWith(month);
  });

  return (

    <div>
<div className="card mb-3">

  <div className="card-header bg-primary text-white">
    Employee Details
  </div>

  <div className="card-body">

    <div className="row">

      <div className="col-md-2">
        <b>ID :</b> {emp.id}
      </div>

      <div className="col-md-2">
        <b>Name :</b> {emp.name}
      </div>

      <div className="col-md-2">
        <b>Role :</b> {emp.role}
      </div>

      <div className="col-md-2">
        <b>Status :</b> {emp.status}
      </div>

      <div className="col-md-2">
        <b>Shift :</b> {emp.shift}
      </div>

      <div className="col-md-2">
        <b>Time :</b>
        {shiftInfo
          ? `${shiftInfo.start} - ${shiftInfo.end}`
          : "-"}
      </div>

    </div>

  </div>

</div>
      {/* tabs */}

      <ul className="nav nav-tabs" style={{color:"var(--color-black)"}}>

        <li className="nav-item">
          <button
            className={"nav-link " + (tab === "attendance" ? "active" : "")}  style={{color:"var(--color-black)"}}
            onClick={() => setTab("attendance")}
          >
            Attendance List
          </button>
        </li>

        <li className="nav-item">
          <button
            className={"nav-link " + (tab === "leave" ? "active" : "")}  style={{color:"var(--color-black)"}}
            onClick={() => setTab("leave")}
          >
            Leave List
          </button>
        </li>

        <li className="nav-item">
          <button
            className={"nav-link " + (tab === "shift" ? "active" : "")}  style={{color:"var(--color-black)"}}
            onClick={() => setTab("shift")}
          >
            Shift List
          </button>
        </li>

      </ul>


      <div className="mt-3" style={{color:"var(--color-black)"}}>


        {/* ATTENDANCE TAB */}

        {tab === "attendance" && (

          <AttendanceTable/>

        )}

         {tab === "leave" && (

          <LeaveList/>

        )}

        


        {/* SHIFT */}

        {tab === "shift" && (

         <ShiftDaily/>

        )}

      </div>


      {/* MODAL */}

     

    </div>
  );
}