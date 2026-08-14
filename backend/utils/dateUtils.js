const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeDate = (dateInput) => {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const calculateLeaveDays = (fromDate, toDate) => {
  const start = normalizeDate(fromDate);
  const end = normalizeDate(toDate);

  if (start > end) {
    throw new Error('fromDate cannot be after toDate');
  }

  const leaveDays = Math.floor((end - start) / MS_PER_DAY) + 1;

  return leaveDays;
};

module.exports = {
  calculateLeaveDays,
};
