const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateInput = (dateInput) => {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) {
      throw new Error('Invalid date provided');
    }

    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }

  if (typeof dateInput === 'string') {
    const isoDateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoDateMatch) {
      const year = Number(isoDateMatch[1]);
      const month = Number(isoDateMatch[2]);
      const day = Number(isoDateMatch[3]);
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        throw new Error('Invalid date provided');
      }

      return date;
    }
  }

  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getTodayLocal = (referenceDate = new Date()) => parseDateInput(referenceDate);

const compareDates = (left, right) =>
  parseDateInput(left).getTime() - parseDateInput(right).getTime();

const toDateInputValue = (dateInput) => {
  const date = parseDateInput(dateInput);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
};

const getMinimumLeaveDate = (referenceDate = new Date()) => {
  const today = getTodayLocal(referenceDate);
  const minimum = new Date(today);
  minimum.setDate(minimum.getDate() - 7);

  return minimum;
};

const getMaximumLeaveDate = (referenceDate = new Date()) => {
  const today = getTodayLocal(referenceDate);
  const maximum = new Date(today);
  maximum.setMonth(maximum.getMonth() + 2);

  return maximum;
};

const isWeekend = (dateInput) => {
  const day = parseDateInput(dateInput).getDay();
  return day === 0 || day === 6;
};

const isLeaveDateSelectable = (dateInput, referenceDate = new Date()) => {
  const date = parseDateInput(dateInput);
  const minimum = getMinimumLeaveDate(referenceDate);
  const maximum = getMaximumLeaveDate(referenceDate);

  if (compareDates(date, minimum) < 0) {
    return false;
  }

  if (compareDates(date, maximum) > 0) {
    return false;
  }

  if (isWeekend(date)) {
    return false;
  }

  return true;
};

const calculateWorkingDays = (fromDate, toDate) => {
  const start = parseDateInput(fromDate);
  const end = parseDateInput(toDate);

  if (compareDates(start, end) > 0) {
    throw new Error('fromDate cannot be after toDate');
  }

  let count = 0;
  const current = new Date(start);

  while (compareDates(current, end) <= 0) {
    if (!isWeekend(current)) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};

const validateEmployeeLeaveDates = (fromDate, toDate, referenceDate = new Date()) => {
  if (!isLeaveDateSelectable(fromDate, referenceDate)) {
    throw new Error('From date must be a weekday within the allowed leave window');
  }

  if (!isLeaveDateSelectable(toDate, referenceDate)) {
    throw new Error('To date must be a weekday within the allowed leave window');
  }

  if (compareDates(fromDate, toDate) > 0) {
    throw new Error('fromDate cannot be after toDate');
  }

  const workingDays = calculateWorkingDays(fromDate, toDate);

  if (workingDays < 1) {
    throw new Error('Leave must include at least one working day');
  }

  return workingDays;
};

const calculateLeaveDays = calculateWorkingDays;

module.exports = {
  MS_PER_DAY,
  parseDateInput,
  getTodayLocal,
  compareDates,
  toDateInputValue,
  getMinimumLeaveDate,
  getMaximumLeaveDate,
  isWeekend,
  isLeaveDateSelectable,
  calculateWorkingDays,
  calculateLeaveDays,
  validateEmployeeLeaveDates,
};
