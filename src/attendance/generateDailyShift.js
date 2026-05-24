import {
  getData,
  saveData,
  SHIFT_KEY,
} from "./storage";

import {
  shiftDummy,
} from "./AttadanceDummyData";

export function generateDailyShift(
  emp,
  days = 7
) {

  const shifts = getData(
    SHIFT_KEY,
    shiftDummy
  );

  let daily = [];

  const shiftInfo =
    shifts.find(
      (s) =>
        s.name === emp.shift
    );

  for (let i = 0; i < days; i++) {

    let d = new Date();

    d.setDate(
      d.getDate() + i
    );

    const date =
      d.toISOString()
        .split("T")[0];

    daily.push({
      empId: emp.id,
      date,
      name: emp.name,
      role: emp.role,
      shift: emp.shift,
      start:
        shiftInfo?.start,
      end:
        shiftInfo?.end,
    });

  }

  saveData(
    "shift_daily",
    daily
  );
}