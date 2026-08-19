const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
const EMPLOYEE_NAME_REGEX = /^[A-Za-z ]+$/;
const DEPARTMENT_REGEX = /^[A-Za-z ]+$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

const VALIDATION_MESSAGES = {
  NAME:
    'Name must contain only English alphabet characters and spaces',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email format',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_STRENGTH:
    'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.',
  MOBILE_REQUIRED: 'Mobile is required',
  MOBILE_INVALID: 'Mobile must contain exactly 10 digits',
  DEPARTMENT_REQUIRED: 'Department is required',
  DEPARTMENT_INVALID:
    'Department must contain only English letters and spaces',
  ROLE_REQUIRED: 'Role is required',
  ROLE_INVALID: 'Invalid role. Allowed values: ADMIN, MANAGER, EMPLOYEE',
};

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

const isValidEmployeeName = (name) => {
  if (!isNonEmptyString(name)) {
    return false;
  }

  const trimmed = name.trim();
  return EMPLOYEE_NAME_REGEX.test(trimmed) && /[A-Za-z]/.test(trimmed);
};

const isValidEmail = (email) => {
  if (!isNonEmptyString(email)) {
    return false;
  }

  const trimmed = email.trim();

  if (trimmed.includes('..') || trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return false;
  }

  const [localPart, domainPart] = trimmed.split('@');

  if (!localPart || !domainPart || !domainPart.includes('.')) {
    return false;
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return false;
  }

  return EMAIL_REGEX.test(trimmed);
};

const isValidPassword = (password) => {
  if (!isNonEmptyString(password)) {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

const isValidMobile = (mobile) => {
  if (typeof mobile !== 'string') {
    return false;
  }

  return MOBILE_REGEX.test(mobile.trim());
};

const isValidDepartment = (department) => {
  if (!isNonEmptyString(department)) {
    return false;
  }

  const trimmed = department.trim();
  return DEPARTMENT_REGEX.test(trimmed) && /[A-Za-z]/.test(trimmed);
};

const isValidRole = (role) => {
  if (!isNonEmptyString(role)) {
    return false;
  }

  return VALID_ROLES.includes(role.trim());
};

const normalizeRole = (role) => role.trim();

const isValidTotalDays = (totalDays) => {
  if (totalDays === undefined || totalDays === null || totalDays === '') {
    return false;
  }

  const parsed = Number(totalDays);

  return !Number.isNaN(parsed) && parsed >= 0;
};

module.exports = {
  VALID_ROLES,
  VALIDATION_MESSAGES,
  isNonEmptyString,
  isPresent,
  isValidEmployeeName,
  isValidEmail,
  isValidPassword,
  isValidMobile,
  isValidDepartment,
  isValidRole,
  normalizeRole,
  isValidTotalDays,
};
