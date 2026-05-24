import React, { useState } from "react";

import { getData, HOLIDAY_KEY } from "./storage";
import { holidayDummy } from "./AttadanceDummyData";

export default function HolidayMaster() {

  const [list] = useState(
    getData(HOLIDAY_KEY, holidayDummy)
  );

  return (

    <table className="table pink-table">

      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
        </tr>
      </thead>

      <tbody>

        {list.map((h) => (

          <tr key={h.id}>
            <td>{h.date}</td>
            <td>{h.name}</td>
          </tr>

        ))}

      </tbody>

    </table>
  );
}