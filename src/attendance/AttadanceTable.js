import React, { useState } from "react";

import {
  getData,
  saveData,
  ATT_KEY,
  EMP_KEY,
  SHIFT_KEY,
} from "./storage";

import {
  attendanceDummy,
  empDummy,
  shiftDummy,
} from "./AttadanceDummyData";

import { useLocation } from "react-router-dom";

export default function AttendanceTable() {

  const [showModal, setShowModal] =
    useState(false);

  const attendance = getData(
    ATT_KEY,
    attendanceDummy
  );

  const employees = getData(
    EMP_KEY,
    empDummy
  );

  const location =
    useLocation();

  const emp =
    location.state;


  const shifts = getData(
    SHIFT_KEY,
    shiftDummy
  );


  const [form, setForm] =
    useState({
      name: "",
      shift: "",
      reason: "",
    });


  const now = new Date();

  const date =
    now.toISOString().slice(0, 10);

  const time =
    now.toTimeString().slice(0, 5);



  // summary

  const present =
    attendance.filter(
      (a) =>
        a.status === "Present"
    ).length;

  const late =
    attendance.filter(
      (a) =>
        a.status === "Late"
    ).length;

  const leave =
    attendance.filter(
      (a) =>
        a.status === "Leave"
    ).length;

  const absent =
    attendance.filter(
      (a) =>
        a.status === "Absent"
    ).length;

  const early =
    attendance.filter(
      (a) =>
        a.status === "Early"
    ).length;



  // open modal

  const openModal = () => {

    setForm({
      name: emp.name,
      shift: emp.shift,
      reason: "",
    });

    setShowModal(true);
  };



  // save attendance

  const saveAttendance = () => {

    const shiftInfo =
      shifts.find(
        (s) =>
          s.name === form.shift
      );

    let status = "Present";

    if (
      shiftInfo &&
      time > shiftInfo.start
    ) {
      status = "Late";
    }

    if (
      shiftInfo &&
      time < shiftInfo.start
    ) {
      status = "Early";
    }

    const list = getData(
      ATT_KEY,
      attendanceDummy
    );

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
        status: status,
      },
    ];

    saveData(
      ATT_KEY,
      newList
    );

    setShowModal(false);
  };



  return (

    <div className="container-fluid">

      <button
        className="btn btn-primary mb-2"
        onClick={openModal}
      >
        Add Attendance
      </button>



      {/* summary */}

      <div className="row mb-3">

        <div className="col-md-6">

          <div className="card">

            <div className="card-header bg-success text-white">
              Summary
            </div>

            <div className="card-body">

              <p className="text-success">
                Present : {present}
              </p>

              <p className="text-warning">
                Late : {late}
              </p>

              <p className="text-info">
                Leave : {leave}
              </p>

              <p className="text-danger">
                Absent : {absent}
              </p>

              <p className="text-primary">
                Early : {early}
              </p>

            </div>

          </div>

        </div>

      </div>



      {/* table */}

      <table className="table table-bordered pink-table">

        <thead>

          <tr>
            <th>Date</th>
            <th>In</th>
            <th>Out</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>

        </thead>

        <tbody>

          {attendance.map(
            (a) => (

              <tr key={a.id}>

                <td>{a.date}</td>

                <td>{a.in}</td>

                <td>{a.out}</td>

                <td>

                  <span
                    className={
                      a.status ===
                      "Present"
                        ? "text-success"

                        : a.status ===
                          "Late"
                        ? "text-warning"

                        : a.status ===
                          "Leave"
                        ? "text-info"

                        : a.status ===
                          "Early"
                        ? "text-primary"

                        : "text-danger"
                    }
                  >
                    {a.status}
                  </span>

                </td>

                <td>
                  {a.reason || "-"}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>



      {/* modal */}

      {showModal && (

        <div className="modal d-block">

          <div className="modal-dialog">

            <div className="modal-content">

              <div className="modal-header">
                Add Attendance
              </div>

              <div className="modal-body">

                <input
                  className="form-control"
                  value={form.name}
                  readOnly
                />

                <input
                  className="form-control mt-2"
                  value={form.shift}
                  readOnly
                />

                <input
                  className="form-control mt-2"
                  value={date}
                  readOnly
                />

                <input
                  className="form-control mt-2"
                  value={time}
                  readOnly
                />

                <input
                  className="form-control mt-2"
                  placeholder="Reason"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reason:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={
                    saveAttendance
                  }
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