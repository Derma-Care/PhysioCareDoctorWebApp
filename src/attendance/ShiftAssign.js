import React,
{ useEffect, useState } from "react";

import { getData }
from "./storage";

import {
  generateDailyShift,
} from "./generateDailyShift";

import {
  useLocation,
} from "react-router-dom";

export default function ShiftDaily() {

  const location =
    useLocation();

  const emp =
    location.state;

  const [list, setList] =
    useState([]);

  useEffect(() => {

    generateDailyShift(
      emp,
      7
    );

    setList(
      getData(
        "shift_daily",
        []
      )
    );

  }, []);

  return (

    <table className="table pink-table">

      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Role</th>
          <th>Shift</th>
          <th>Start</th>
          <th>End</th>
        </tr>
      </thead>

      <tbody>

        {list.map(
          (s, i) => (

            <tr key={i}>
              <td>{s.date}</td>
              <td>{s.name}</td>
              <td>{s.role}</td>
              <td>{s.shift}</td>
              <td>{s.start}</td>
              <td>{s.end}</td>
            </tr>

          )
        )}

      </tbody>

    </table>
  );
}