import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function EmployeeEdit() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState(state)

  return (
    <div>
      <h4>Edit Employee</h4>

      <input
        className="form-control"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
      />

      <button
        className="btn btn-primary mt-2"
        onClick={() => navigate('/attendance/attendance-list')}
      >
        Save
      </button>
    </div>
  )
}
