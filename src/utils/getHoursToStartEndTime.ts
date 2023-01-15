import { set } from "date-fns";

type Hours =
  | "1st"
  | "2nd"
  | "Resource"
  | "3rd"
  | "4th"
  | "5th"
  | "Lunch"
  | "6th"
  | "7th";

export const getHoursToStartEndTime = (day: Date, hour: Hours) => {
  let startTime;
  let endTime;

  switch (hour) {
    case "1st":
      startTime = set(day, { hours: 7, minutes: 15 });
      endTime = set(day, { hours: 8, minutes: 8 });
      break;
    case "2nd":
      startTime = set(day, { hours: 8, minutes: 8 });
      endTime = set(day, { hours: 9, minutes: 1 });
      break;
    case "Resource":
      startTime = set(day, { hours: 9, minutes: 1 });
      endTime = set(day, { hours: 9, minutes: 35 });
      break;
    case "3rd":
      startTime = set(day, { hours: 9, minutes: 35 });
      endTime = set(day, { hours: 10, minutes: 28 });
      break;
    case "4th":
      startTime = set(day, { hours: 10, minutes: 28 });
      endTime = set(day, { hours: 11, minutes: 21 });
      break;
    case "5th":
      startTime = set(day, { hours: 11, minutes: 21 });
      endTime = set(day, { hours: 12, minutes: 14 });
      break;
    case "Lunch":
      startTime = set(day, { hours: 12, minutes: 14 });
      endTime = set(day, { hours: 12, minutes: 44 });
      break;
    case "6th":
      startTime = set(day, { hours: 12, minutes: 44 });
      endTime = set(day, { hours: 13, minutes: 37 });
      break;
    case "7th":
      startTime = set(day, { hours: 13, minutes: 37 });
      endTime = set(day, { hours: 14, minutes: 25 });
      break;
  }

  return [startTime, endTime];
};
