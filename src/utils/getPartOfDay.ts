const isGreaterThan = (date: Date, hours: number, minutes: number) => {
  const dh = date.getHours();
  const dm = date.getMinutes();

  if (dh === hours) {
    return dm >= minutes;
  } else {
    return dh >= hours;
  }
};

const isLessThan = (date: Date, hours: number, minutes: number) => {
  const dh = date.getHours();
  const dm = date.getMinutes();

  if (dh === hours) {
    return dm < minutes;
  } else {
    return dh < hours;
  }
};

export const getPartOfDay = (date: Date) => {
  if (isLessThan(date, 7, 15)) {
    return "Before school";
  }

  if (isGreaterThan(date, 7, 15) && isLessThan(date, 8, 8)) {
    return "1st Hour";
  }

  if (isGreaterThan(date, 8, 8) && isLessThan(date, 9, 1)) {
    return "2nd Hour";
  }

  if (isGreaterThan(date, 9, 1) && isLessThan(date, 9, 35)) {
    return "Resource";
  }

  if (isGreaterThan(date, 9, 35) && isLessThan(date, 10, 28)) {
    return "3rd Hour";
  }

  if (isGreaterThan(date, 10, 28) && isLessThan(date, 11, 21)) {
    return "4th Hour";
  }

  if (isGreaterThan(date, 11, 21) && isLessThan(date, 12, 14)) {
    return "5th Hour";
  }

  if (isGreaterThan(date, 12, 14) && isLessThan(date, 12, 44)) {
    return "During Lunch";
  }

  if (isGreaterThan(date, 12, 44) && isLessThan(date, 13, 37)) {
    return "6th Hour";
  }

  if (isGreaterThan(date, 13, 37) && isLessThan(date, 14, 25)) {
    return "7th Hour";
  }

  if (isGreaterThan(date, 14, 25)) {
    return "After School";
  }
};
