const EMP_KEY = 'emp_list'
const SHIFT_KEY = 'shift_list'
const HOLIDAY_KEY = 'holiday_list'
const LEAVE_KEY = 'leave_list'
const ATT_KEY = 'attendance_list'
const SHIFT_ASSIGN_KEY = "shift_assign";

export const getData = (key, dummy) => {
  const data = localStorage.getItem(key)

  if (data) return JSON.parse(data)

  localStorage.setItem(key, JSON.stringify(dummy))
  return dummy
}

export const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export { EMP_KEY, SHIFT_KEY, HOLIDAY_KEY, LEAVE_KEY, ATT_KEY, SHIFT_ASSIGN_KEY }
