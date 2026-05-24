import React, { useState } from "react";
import {
  getData,
  saveData,
  LEAVE_KEY,
} from "./storage";

export default function LeaveRequest() {

  const [form, setForm] = useState({
    name: "",
    from: "",
    to: "",
    reason: "",
  });

  const save = () => {

    const list = getData(LEAVE_KEY, []);

    const newList = [
      ...list,
      {
        id: Date.now(),
        ...form,
        status: "Pending",
      },
    ];

    saveData(LEAVE_KEY, newList);

    alert("Leave Saved");

    setForm({
      name: "",
      from: "",
      to: "",
      reason: "",
    });
  };

  return (

    <div>

      <h4>Leave Request</h4>

      <input
        className="form-control"
        placeholder="Employee Name"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
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

      <button
        className="btn btn-primary mt-2"
        onClick={save}
      >
        Save
      </button>

    </div>
  );
}