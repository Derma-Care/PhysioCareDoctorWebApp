import React, { useState } from "react";
import { saveData, ATT_KEY, getData } from "./storage";
import { attendanceDummy } from "./AttadanceDummyData";
 

export default function AttendanceEntry() {

  const [form, setForm] = useState({});
  const list = getData(ATT_KEY, attendanceDummy);

  const save = () => {

    const newList = [
      ...list,
      {
        id: Date.now(),
        ...form,
      },
    ];

    saveData(ATT_KEY, newList);

    alert("Saved");
  };

  return (

    <div>

      <input
        placeholder="Name"
        className="form-control"
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <input
        type="date"
        className="form-control mt-2"
        onChange={(e) =>
          setForm({ ...form, date: e.target.value })
        }
      />

      <button className="btn btn-primary mt-2" onClick={save}>
        Save
      </button>

    </div>
  );
}