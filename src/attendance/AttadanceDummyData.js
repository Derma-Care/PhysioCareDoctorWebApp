export const empDummy = [
  { id: 1, name: "Ramesh", role: "Nurse", clinic: "0001", shift: "Morning", status: "Present", joiningDate: "2024-01-15" },
  { id: 2, name: "Ravi", role: "Doctor", clinic: "0001", shift: "Morning", status: "Present", joiningDate: "2023-05-10" },
  { id: 3, name: "Sita", role: "Reception", clinic: "0001", shift: "Evening", status: "Present", joiningDate: "2025-02-01" },
  { id: 4, name: "Kiran", role: "Lab", clinic: "0001", shift: "Morning", status: "Present", joiningDate: "2024-11-20" },
  { id: 5, name: "Raju", role: "Security", clinic: "0001", shift: "Night", status: "Absent", joiningDate: "2024-06-15" },
  { id: 6, name: "Anu", role: "Pharmacy", clinic: "0001", shift: "Morning", status: "Late", joiningDate: "2025-01-10" },
  { id: 7, name: "John", role: "Nurse", clinic: "0001", shift: "Evening", status: "Present", joiningDate: "2024-03-25" },
  { id: 8, name: "Meena", role: "Reception", clinic: "0001", shift: "Morning", status: "Present", joiningDate: "2024-08-30" },
  { id: 9, name: "Rahul", role: "Doctor", clinic: "0001", shift: "Evening", status: "Present", joiningDate: "2023-12-05" },
  { id: 10, name: "Priya", role: "Lab", clinic: "0001", shift: "Morning", status: "Present", joiningDate: "2024-10-12" },
  { id: 11, name: "Amit", role: "Physiotherapist", clinic: "0001", shift: "Morning", status: "Present", joiningDate: "2023-01-01" },
  { id: 12, name: "Neha", role: "Physiotherapist", clinic: "0001", shift: "Evening", status: "Present", joiningDate: "2024-05-15" }
];

export const shiftDummy = [
  { id: 1, name: "Morning", start: "09:00", end: "14:00" },
  { id: 2, name: "Evening", start: "14:00", end: "20:00" },
  { id: 3, name: "Night", start: "20:00", end: "09:00" },
  { id: 4, name: "General", start: "10:00", end: "18:00" },
  { id: 5, name: "Half", start: "09:00", end: "12:00" },
  { id: 6, name: "OPD", start: "11:00", end: "17:00" },
  { id: 7, name: "Ward", start: "08:00", end: "16:00" },
  { id: 8, name: "ICU", start: "07:00", end: "15:00" },
  { id: 9, name: "Lab", start: "09:30", end: "18:30" },
  { id: 10, name: "Custom", start: "12:00", end: "21:00" }
];

export const holidayDummy = [
  { id: 1, date: "2026-01-26", name: "Republic" },
  { id: 2, date: "2026-08-15", name: "Independence" },
  { id: 3, date: "2026-03-29", name: "Ugadi" },
  { id: 4, date: "2026-04-10", name: "Ramzan" },
  { id: 5, date: "2026-05-01", name: "Labour" },
  { id: 6, date: "2026-08-19", name: "Raksha" },
  { id: 7, date: "2026-10-02", name: "Gandhi" },
  { id: 8, date: "2026-10-24", name: "Diwali" },
  { id: 9, date: "2026-12-25", name: "Christmas" },
  { id: 10, date: "2026-01-01", name: "New Year" }
];

 

export const attendanceDummy = [
  {
    id: 1,
    name: "Ramesh",
    date: "2026-03-01",
    in: "09:00",
    out: "18:00",
    status: "Present",
    reason: "",
    total: "9h",
    working: "8h",
    idle: "1h",
    loginLocation: "Main Clinic Entrance",
    logoutLocation: "Main Clinic Exit"
  },
  {
    id: 2,
    name: "Ramesh",
    date: "2026-03-02",
    in: "09:20",
    out: "18:00",
    status: "Late",
    reason: "Traffic"
  },

  {
    id: 3,
    name: "Ramesh",
    date: "2026-03-03",
    in: "-",
    out: "-",
    status: "Leave",
    reason: "Fever"
  },

  {
    id: 4,
    name: "Ramesh",
    date: "2026-03-04",
    in: "09:00",
    out: "18:00",
    status: "Present",
    reason: ""
  },

  {
    id: 5,
    name: "Ramesh",
    date: "2026-03-05",
    in: "-",
    out: "-",
    status: "Absent",
    reason: "Not informed"
  },

  {
    id: 6,
    name: "Ramesh",
    date: "2026-03-06",
    in: "09:05",
    out: "18:00",
    status: "Present",
    reason: ""
  },

  {
    id: 7,
    name: "Ramesh",
    date: "2026-03-07",
    in: "09:15",
    out: "18:00",
    status: "Late",
    reason: "Bus delay"
  },

  {
    id: 8,
    name: "Ramesh",
    date: "2026-03-08",
    in: "09:00",
    out: "18:00",
    status: "Present",
    reason: ""
  },

  {
    id: 9,
    name: "Ramesh",
    date: "2026-03-09",
    in: "-",
    out: "-",
    status: "Leave",
    reason: "Personal work"
  },

  {
    id: 10,
    name: "Ramesh",
    date: "2026-03-10",
    in: "09:00",
    out: "18:00",
    status: "Present",
    reason: ""
  },

  {
    id: 11,
    name: "Ramesh",
    date: "2026-03-11",
    in: "09:25",
    out: "18:00",
    status: "Late",
    reason: "Traffic"
  },

  {
    id: 12,
    name: "Ramesh",
    date: "2026-03-12",
    in: "09:00",
    out: "18:00",
    status: "Present",
    reason: ""
  },

  {
    id: 13,
    name: "Ramesh",
    date: "2026-03-13",
    in: "-",
    out: "-",
    status: "Absent",
    reason: "No call"
  },

  {
    id: 14,
    name: "Ramesh",
    date: "2026-03-14",
    in: "09:00",
    out: "18:00",
    status: "Present",
    reason: ""
  },

  {
    id: 15,
    name: "Ramesh",
    date: "2026-03-15",
    in: "09:10",
    out: "18:00",
    status: "Late",
    reason: "Rain"
  },
  { id: 16, name: "Amit", date: "2026-05-13", in: "09:00", out: "17:00", status: "Present", reason: "", total: "8h", working: "6h 30m", idle: "1h 30m", loginLocation: "Reception A", logoutLocation: "Reception A", sessionHours: 5, trainingHours: 1.5 },
  { id: 28, name: "Amit", date: "2026-05-12", in: "09:05", out: "17:15", status: "Present", reason: "", total: "8h 10m", working: "7h", idle: "1h 10m", loginLocation: "Reception A", logoutLocation: "Reception A" },
  { id: 29, name: "Amit", date: "2026-05-11", in: "09:20", out: "17:00", status: "Late", reason: "Traffic", total: "7h 40m", working: "6h", idle: "1h 40m", loginLocation: "Reception A", logoutLocation: "Reception A" },
  { id: 30, name: "Amit", date: "2026-05-10", in: "-", out: "-", status: "Leave", reason: "Family Event", total: "0h", working: "0h", idle: "0h", loginLocation: "-", logoutLocation: "-" },
  { id: 31, name: "Amit", date: "2026-05-09", in: "08:55", out: "16:55", status: "Present", reason: "", total: "8h", working: "7h 15m", idle: "45m", loginLocation: "Reception A", logoutLocation: "Reception A" },
  { id: 17, name: "Neha", date: "2026-05-13", in: "14:00", out: "20:00", status: "Present", reason: "", total: "6h", working: "5h", idle: "1h", loginLocation: "West Wing", logoutLocation: "West Wing", sessionHours: 4, trainingHours: 1 },
  { id: 32, name: "Neha", date: "2026-05-12", in: "14:05", out: "20:10", status: "Present", reason: "", total: "6h 5m", working: "5h 15m", idle: "50m", loginLocation: "West Wing", logoutLocation: "West Wing" },
  { id: 33, name: "Neha", date: "2026-05-11", in: "13:50", out: "19:50", status: "Present", reason: "", total: "6h", working: "5h 30m", idle: "30m", loginLocation: "West Wing", logoutLocation: "West Wing" },
  { id: 34, name: "Neha", date: "2026-05-10", in: "14:15", out: "20:15", status: "Late", reason: "Personal", total: "6h", working: "4h 45m", idle: "1h 15m", loginLocation: "West Wing", logoutLocation: "West Wing" },
  { id: 35, name: "Neha", date: "2026-05-09", in: "14:00", out: "20:00", status: "Present", reason: "", total: "6h", working: "5h", idle: "1h", loginLocation: "West Wing", logoutLocation: "West Wing" },
  { id: 18, name: "Ramesh", date: "2026-05-13", in: "08:30", out: "16:30", status: "Present", reason: "", total: "8h", working: "7h", idle: "1h", loginLocation: "Main Entrance", logoutLocation: "Main Entrance" },
  { id: 19, name: "Ravi", date: "2026-05-13", in: "10:00", out: "18:00", status: "Present", reason: "", total: "8h", working: "6h", idle: "2h", loginLocation: "Doctor Lounge", logoutLocation: "Doctor Lounge" },
  { id: 20, name: "Sita", date: "2026-05-13", in: "09:15", out: "17:15", status: "Late", reason: "Traffic", total: "8h", working: "6h 45m", idle: "1h 15m", loginLocation: "Front Desk", logoutLocation: "Front Desk" },
  { id: 21, name: "Kiran", date: "2026-05-13", in: "08:00", out: "16:00", status: "Present", reason: "", total: "8h", working: "7h 30m", idle: "30m", loginLocation: "Lab Area", logoutLocation: "Lab Area" },
  { id: 22, name: "Raju", date: "2026-05-13", in: "-", out: "-", status: "Absent", reason: "Sick", total: "0h", working: "0h", idle: "0h", loginLocation: "-", logoutLocation: "-" },
  { id: 23, name: "Anu", date: "2026-05-13", in: "09:45", out: "17:45", status: "Late", reason: "Personal", total: "8h", working: "6h 15m", idle: "1h 45m", loginLocation: "Pharmacy", logoutLocation: "Pharmacy" },
  { id: 24, name: "John", date: "2026-05-13", in: "12:00", out: "20:00", status: "Present", reason: "", total: "8h", working: "7h", idle: "1h", loginLocation: "Nurse Station", logoutLocation: "Nurse Station" },
  { id: 25, name: "Meena", date: "2026-05-13", in: "08:45", out: "16:45", status: "Present", reason: "", total: "8h", working: "7h 15m", idle: "45m", loginLocation: "Front Desk", logoutLocation: "Front Desk" },
  { id: 26, name: "Rahul", date: "2026-05-13", in: "11:00", out: "19:00", status: "Present", reason: "", total: "8h", working: "5h 30m", idle: "2h 30m", loginLocation: "OPD", logoutLocation: "OPD" },
  { id: 27, name: "Priya", date: "2026-05-13", in: "09:00", out: "17:00", status: "Present", reason: "", total: "8h", working: "7h", idle: "1h", loginLocation: "Lab Area", logoutLocation: "Lab Area" },
  { id: 36, name: "Ramesh", date: "2026-05-14", in: "09:00", out: "18:00", status: "Present", reason: "", total: "9h", working: "8h", idle: "1h", loginLocation: "Main Entrance", logoutLocation: "Main Entrance" },
  { id: 37, name: "Amit", date: "2026-05-14", in: "09:05", out: "17:15", status: "Present", reason: "", total: "8h 10m", working: "7h", idle: "1h 10m", loginLocation: "Reception A", logoutLocation: "Reception A" },
  { id: 38, name: "Neha", date: "2026-05-14", in: "14:00", out: "20:00", status: "Present", reason: "", total: "6h", working: "5h", idle: "1h", loginLocation: "West Wing", logoutLocation: "West Wing" },
  { id: 39, name: "Sita", date: "2026-05-14", in: "09:15", out: "17:15", status: "Late", reason: "Traffic", total: "8h", working: "6h 45m", idle: "1h 15m", loginLocation: "Front Desk", logoutLocation: "Front Desk" },
  { id: 40, name: "Kiran", date: "2026-05-14", in: "08:00", out: "16:00", status: "Present", reason: "", total: "8h", working: "7h 30m", idle: "30m", loginLocation: "Lab Area", logoutLocation: "Lab Area" }
];

export const shift_daily = [
  {
    empId: 1,
    name: "Ramesh",
    shift: "Morning",
    startDate: "2026-03-01"
  }
]

export const trackerDummyData = {
  "2026-05-13": {
    "Amit": [
      { id: 1, time: "09:00", activity: "Login", duration: "-", location: "Main Clinic" },
      { id: 2, time: "09:15", activity: "Patient Assessment", duration: "45 mins", location: "Room 1" },
      { id: 3, time: "10:00", activity: "Therapy Session", duration: "1 hr", location: "Gym" },
      { id: 4, time: "11:00", activity: "Idle", duration: "30 mins", location: "Staff Room" },
      { id: 5, time: "11:30", activity: "Therapy Session", duration: "1 hr", location: "Gym" },
      { id: 6, time: "13:00", activity: "Lunch Break", duration: "1 hr", location: "Cafeteria" },
      { id: 7, time: "14:00", activity: "Patient Assessment", duration: "45 mins", location: "Room 2" },
      { id: 8, time: "17:00", activity: "Logout", duration: "-", location: "Main Clinic" }
    ],
    "Neha": [
      { id: 1, time: "14:00", activity: "Login", duration: "-", location: "Main Clinic" },
      { id: 2, time: "14:15", activity: "Patient Assessment", duration: "45 mins", location: "Room 3" },
      { id: 3, time: "15:00", activity: "Therapy Session", duration: "1.5 hrs", location: "Gym" },
      { id: 4, time: "16:30", activity: "Idle", duration: "1 hr", location: "Staff Room" },
      { id: 5, time: "20:00", activity: "Logout", duration: "-", location: "Main Clinic" }
    ]
  }
};
