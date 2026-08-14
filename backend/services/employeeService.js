const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const userService = require('./userService');
const { isNonEmptyString, isValidEmail } = require('../utils/validators');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

const resolveStatus = (status) => status || 'ACTIVE';

const buildStatusFilter = (statusParam) => {
  const status = (statusParam || 'ACTIVE').toUpperCase();

  if (status === 'ACTIVE') {
    return { $or: [{ status: 'ACTIVE' }, { status: { $exists: false } }] };
  }

  if (status === 'INACTIVE') {
    return { status: 'INACTIVE' };
  }

  if (status === 'ALL') {
    return null;
  }

  throw createError('Invalid status filter. Use ACTIVE, INACTIVE, or ALL', 400);
};

const syncEmployeeUserStatus = async (employee, status) => {
  employee.status = status;
  await employee.save();

  const user = await User.findOne({ employee: employee._id });

  if (user) {
    user.status = status;
    await user.save();
  }

  return { employee, user };
};

const validateEmployeeInput = (data, { isUpdate = false, requireDepartment = true } = {}) => {
  const requiredFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
  ];

  for (const field of requiredFields) {
    if (isUpdate && data[field.key] === undefined) {
      continue;
    }

    if (field.key === 'email') {
      if (!isNonEmptyString(data.email)) {
        throw createError('Email is required', 400);
      }

      if (!isValidEmail(data.email)) {
        throw createError('Invalid email format', 400);
      }

      continue;
    }

    if (!isNonEmptyString(data[field.key])) {
      throw createError(`${field.label} is required`, 400);
    }
  }

  if (isUpdate && data.department === undefined) {
    return;
  }

  if (requireDepartment && !isNonEmptyString(data.department)) {
    throw createError('Department is required', 400);
  }
};

const buildEmployeePayload = (employeeData) => {
  const payload = {
    name: employeeData.name.trim(),
    email: employeeData.email.trim().toLowerCase(),
    mobile: employeeData.mobile.trim(),
  };

  if (isNonEmptyString(employeeData.department)) {
    payload.department = employeeData.department.trim();
  }

  return payload;
};

const assertUniqueEmployeeEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingEmployee = await Employee.findOne({ email: normalizedEmail });

  if (existingEmployee) {
    throw createError('Employee email already exists', 409);
  }
};

const createEmployee = async (data) => {
  const {
    createUser = false,
    role,
    password,
    ...employeeData
  } = data;

  let normalizedRole;

  if (createUser) {
    userService.validatePassword(password);
    normalizedRole = userService.validateRoleValue(role);
  }

  const requireDepartment = !createUser || normalizedRole === 'EMPLOYEE';

  validateEmployeeInput(employeeData, { requireDepartment });
  await assertUniqueEmployeeEmail(employeeData.email);

  if (createUser) {
    const existingUser = await User.findOne({
      email: employeeData.email.trim().toLowerCase(),
    });

    if (existingUser) {
      throw createError('User email already exists', 409);
    }
  }

  const employee = await Employee.create(buildEmployeePayload(employeeData));

  if (!createUser) {
    return { employee, user: null };
  }

  try {
    const user = await userService.createUserAccount({
      name: employee.name,
      email: employee.email,
      password,
      role,
      employeeId: employee._id,
    });

    return { employee, user };
  } catch (error) {
    await Employee.findByIdAndDelete(employee._id);
    throw error;
  }
};

const getEmployees = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const andConditions = [];
  const statusFilter = buildStatusFilter(query.status);

  if (statusFilter) {
    andConditions.push(statusFilter);
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    andConditions.push({ $or: [{ name: searchRegex }, { email: searchRegex }] });
  }

  const filter = andConditions.length ? { $and: andConditions } : {};

  const [employees, total] = await Promise.all([
    Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ]);

  return {
    employees,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getEmployeeById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  return employee;
};

const buildEmployeeUpdatePayload = (employeeData) => {
  const payload = {};

  if (employeeData.name !== undefined) {
    payload.name = employeeData.name.trim();
  }

  if (employeeData.email !== undefined) {
    payload.email = employeeData.email.trim().toLowerCase();
  }

  if (employeeData.mobile !== undefined) {
    payload.mobile = employeeData.mobile.trim();
  }

  if (employeeData.department !== undefined) {
    payload.department = employeeData.department.trim();
  }

  return payload;
};

const updateEmployee = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const {
    createUser = false,
    role,
    password,
    ...employeeData
  } = data;

  validateEmployeeInput(employeeData, { isUpdate: true });

  const updatePayload = buildEmployeeUpdatePayload(employeeData);

  const employee = await Employee.findByIdAndUpdate(
    id,
    Object.keys(updatePayload).length ? updatePayload : {},
    {
      new: true,
      runValidators: true,
    }
  );

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  let user = null;

  if (createUser) {
    user = await userService.createOrUpdateUserForEmployee({
      employee,
      password,
      role,
    });
  }

  return { employee, user };
};

const deleteEmployee = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  return syncEmployeeUserStatus(employee, 'INACTIVE');
};

const updateEmployeeStatus = async (id, status) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const normalizedStatus = (status || '').toUpperCase();

  if (!VALID_STATUSES.includes(normalizedStatus)) {
    throw createError('Invalid status. Allowed values: ACTIVE, INACTIVE', 400);
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  return syncEmployeeUserStatus(employee, normalizedStatus);
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  resolveStatus,
};
