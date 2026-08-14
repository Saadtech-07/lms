const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const {
  isNonEmptyString,
  isValidEmail,
  isValidRole,
  normalizeRole,
  isPresent,
} = require('../utils/validators');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validatePassword = (password) => {
  if (!isNonEmptyString(password)) {
    throw createError('Password is required', 400);
  }
};

const validateRoleValue = (role) => {
  if (!isValidRole(role)) {
    throw createError('Invalid role. Allowed values: ADMIN, MANAGER, EMPLOYEE', 400);
  }

  return normalizeRole(role);
};

const hashPassword = async (password) => bcrypt.hash(password, 10);

const assertEmployeeExists = async (employeeId) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw createError('Employee not found', 404);
  }

  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  return employee;
};

const assertUniqueUserEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createError('User email already exists', 409);
  }
};

const assertNoExistingUserForEmployee = async (employeeId) => {
  const existingUser = await User.findOne({ employee: employeeId });

  if (existingUser) {
    throw createError('A login account already exists for this employee', 409);
  }
};

const createUserAccount = async ({ name, email, password, role, employeeId }) => {
  if (!isNonEmptyString(name)) {
    throw createError('Name is required', 400);
  }

  if (!isValidEmail(email)) {
    throw createError('Invalid email format', 400);
  }

  validatePassword(password);
  const normalizedRole = validateRoleValue(role);

  await assertUniqueUserEmail(email);

  if (employeeId) {
    await assertNoExistingUserForEmployee(employeeId);
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    role: normalizedRole,
    employee: employeeId || undefined,
  });

  return user;
};

const createUserForEmployee = async ({ employee, password, role }) => {
  if (!isPresent(employee)) {
    throw createError('Employee ID is required', 400);
  }

  const employeeRecord = await assertEmployeeExists(employee);

  return createUserAccount({
    name: employeeRecord.name,
    email: employeeRecord.email,
    password,
    role,
    employeeId: employeeRecord._id,
  });
};

const createOrUpdateUserForEmployee = async ({ employee, password, role }) => {
  const existingUser = await User.findOne({
    $or: [{ employee: employee._id }, { email: employee.email }],
  });

  if (!existingUser) {
    return createUserAccount({
      name: employee.name,
      email: employee.email,
      password,
      role,
      employeeId: employee._id,
    });
  }

  if (
    existingUser.employee &&
    existingUser.employee.toString() !== employee._id.toString()
  ) {
    throw createError('User email already exists', 409);
  }

  if (role !== undefined) {
    existingUser.role = validateRoleValue(role);
  }

  if (isNonEmptyString(password)) {
    validatePassword(password);
    existingUser.password = await hashPassword(password);
  }

  if (!existingUser.employee) {
    existingUser.employee = employee._id;
  }

  await existingUser.save();

  return existingUser;
};

const updateUserRoleByEmployeeId = async (employeeId, role) => {
  if (!isPresent(role)) {
    throw createError('Role is required', 400);
  }

  const employee = await assertEmployeeExists(employeeId);
  const normalizedRole = validateRoleValue(role);

  const user = await User.findOne({ employee: employee._id });

  if (!user) {
    throw createError(
      'This employee does not have a login account. Create a user account before assigning a role.',
      400
    );
  }

  user.role = normalizedRole;
  await user.save();

  return {
    employee,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee: user.employee,
    },
  };
};

module.exports = {
  createUserAccount,
  createUserForEmployee,
  createOrUpdateUserForEmployee,
  updateUserRoleByEmployeeId,
  validatePassword,
  validateRoleValue,
};
