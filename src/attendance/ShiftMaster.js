import React, { useState } from "react";
import { getData, SHIFT_KEY } from "./storage";
import { shiftDummy } from "./AttadanceDummyData";

export default function ShiftMaster() {

  const [list] = useState(
    getData(SHIFT_KEY, shiftDummy)
  );

  return (

    <table className="table pink-table">

      <thead>
        <tr>
          <th>Name</th>
          <th>Start</th>
          <th>End</th>
        </tr>
      </thead>

      <tbody>

        {list.map((s) => (

          <tr key={s.id}>
            <td>{s.name}</td>
            <td>{s.start}</td>
            <td>{s.end}</td>
          </tr>

        ))}

      </tbody>

    </table>
  );
}