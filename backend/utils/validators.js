const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isPresent = (value) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
};

const isValidEmail = (email) => {
  if (!isNonEmptyString(email)) {
    return false;
  }

  return EMAIL_REGEX.test(email.trim());
};

const isValidTotalDays = (totalDays) => {
  if (totalDays === undefined || totalDays === null || totalDays === '') {
    return false;
  }

  const parsed = Number(totalDays);

  return !Number.isNaN(parsed) && parsed >= 0;
};

const isValidRole = (role) => {
  if (!isNonEmptyString(role)) {
    return false;
  }

  return VALID_ROLES.includes(role.trim().toUpperCase());
};

const normalizeRole = (role) => role.trim().toUpperCase();

module.exports = {
  VALID_ROLES,
  isNonEmptyString,
  isPresent,
  isValidEmail,
  isValidTotalDays,
  isValidRole,
  normalizeRole,
};
