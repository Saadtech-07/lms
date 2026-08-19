const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const userService = require('./userService');
const {
  isPresent,
  isValidEmail,
  isValidEmployeeName,
  isValidMobile,
  isValidDepartment,
  VALIDATION_MESSAGES,
} = require('../utils/validators');
const {
  stripEmployeeAuditFields,
  getEmployeeAuditPopulateOptions,
  populateEmployeeAudit,
} = require('../utils/auditUtils');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

const resolveStatus = (status) => status || 'ACTIVE';

const isEmployeeDeleted = (employee) => Boolean(employee?.isDeleted);

const buildStatusFilter = (statusParam) => {
  const status = (statusParam || 'ALL').toUpperCase();

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

const buildNotDeletedFilter = () => ({
  $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
});

const syncUserStatus = async (employeeId, status) => {
  const user = await User.findOne({ employee: employeeId });

  if (user) {
    user.status = status;
    await user.save();
  }

  return user;
};

const syncEmployeeUserStatus = async (employee, status, { actorId } = {}) => {
  employee.status = status;

  if (actorId) {
    employee.updatedBy = actorId;
  }

  await employee.save();
  const user = await syncUserStatus(employee._id, status);

  return { employee, user };
};

const validateEmployeeName = (name, { required = false } = {}) => {
  if (!isPresent(name)) {
    if (required) {
      throw createError('Name is required', 400);
    }
    return;
  }

  if (!isValidEmployeeName(name)) {
    throw createError(VALIDATION_MESSAGES.NAME, 400);
  }
};

const validateEmployeeEmail = (email, { required = false } = {}) => {
  if (!isPresent(email)) {
    if (required) {
      throw createError(VALIDATION_MESSAGES.EMAIL_REQUIRED, 400);
    }
    return;
  }

  if (!isValidEmail(email)) {
    throw createError(VALIDATION_MESSAGES.EMAIL_INVALID, 400);
  }
};

const validateEmployeeMobile = (mobile, { required = false } = {}) => {
  if (!isPresent(mobile)) {
    if (required) {
      throw createError(VALIDATION_MESSAGES.MOBILE_REQUIRED, 400);
    }
    return;
  }

  if (!isValidMobile(mobile)) {
    throw createError(VALIDATION_MESSAGES.MOBILE_INVALID, 400);
  }
};

const validateEmployeeDepartment = (department, { required = false } = {}) => {
  if (!isPresent(department)) {
    if (required) {
      throw createError(VALIDATION_MESSAGES.DEPARTMENT_REQUIRED, 400);
    }
    return;
  }

  if (!isValidDepartment(department)) {
    throw createError(VALIDATION_MESSAGES.DEPARTMENT_INVALID, 400);
  }
};

const validateEmployeeInput = (data, { isUpdate = false } = {}) => {
  if (isUpdate) {
    if (data.name !== undefined) {
      validateEmployeeName(data.name, { required: true });
    }

    if (data.email !== undefined) {
      validateEmployeeEmail(data.email, { required: true });
    }

    if (data.mobile !== undefined) {
      validateEmployeeMobile(data.mobile, { required: true });
    }

    if (data.department !== undefined) {
      validateEmployeeDepartment(data.department, { required: true });
    }

    return;
  }

  validateEmployeeName(data.name, { required: true });
  validateEmployeeEmail(data.email, { required: true });
  validateEmployeeMobile(data.mobile, { required: true });
  validateEmployeeDepartment(data.department, { required: true });
};

const buildEmployeePayload = (employeeData) => {
  const payload = {
    name: employeeData.name.trim(),
    email: employeeData.email.trim().toLowerCase(),
    mobile: employeeData.mobile.trim(),
    department: employeeData.department.trim(),
    status: 'ACTIVE',
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };

  return payload;
};

const assertUniqueEmployeeEmail = async (email, excludeEmployeeId = null) => {
  const normalizedEmail = email.trim().toLowerCase();
  const employeeQuery = { email: normalizedEmail };

  if (excludeEmployeeId) {
    employeeQuery._id = { $ne: excludeEmployeeId };
  }

  const existingEmployee = await Employee.findOne(employeeQuery);

  if (existingEmployee) {
    throw createError('Email already exists', 409);
  }
};

const assertUniqueUserEmail = async (email, excludeUserId = null) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userQuery = { email: normalizedEmail };

  if (excludeUserId) {
    userQuery._id = { $ne: excludeUserId };
  }

  const existingUser = await User.findOne(userQuery);

  if (existingUser) {
    throw createError('Email already exists', 409);
  }
};

const assertUniqueMobile = async (mobile, excludeEmployeeId = null) => {
  const normalizedMobile = mobile.trim();
  const mobileQuery = { mobile: normalizedMobile };

  if (excludeEmployeeId) {
    mobileQuery._id = { $ne: excludeEmployeeId };
  }

  const existingEmployee = await Employee.findOne(mobileQuery);

  if (existingEmployee) {
    throw createError('Mobile number already exists', 409);
  }
};

const validateCreateEmployeeInput = (data) => {
  const sanitized = stripEmployeeAuditFields(data);
  const { role, password, ...employeeData } = sanitized;

  validateEmployeeInput(employeeData);
  userService.validatePassword(password);

  if (!isPresent(role)) {
    throw createError(VALIDATION_MESSAGES.ROLE_REQUIRED, 400);
  }

  const normalizedRole = userService.validateRoleValue(role);

  return { role: normalizedRole, password, employeeData };
};

const createEmployee = async (data, createdBy) => {
  const { role, password, employeeData } = validateCreateEmployeeInput(data);

  await assertUniqueEmployeeEmail(employeeData.email);
  await assertUniqueUserEmail(employeeData.email);
  await assertUniqueMobile(employeeData.mobile);

  const employee = await Employee.create({
    ...buildEmployeePayload(employeeData),
    createdBy,
  });

  try {
    const user = await userService.createUserAccount({
      name: employee.name,
      email: employee.email,
      password,
      role,
      employeeId: employee._id,
    });

    await populateEmployeeAudit(employee);

    return { employee, user };
  } catch (error) {
    await Employee.findByIdAndDelete(employee._id);
    throw error;
  }
};

const isDeletedListRequested = (query = {}) => {
  const value = String(query.deleted ?? query.isDeleted ?? '').toLowerCase();
  return ['true', '1', 'yes'].includes(value);
};

const getEmployees = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;
  const showDeleted = isDeletedListRequested(query);

  const andConditions = [showDeleted ? { isDeleted: true } : buildNotDeletedFilter()];

  if (!showDeleted) {
    const statusFilter = buildStatusFilter(query.status);

    if (statusFilter) {
      andConditions.push(statusFilter);
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    andConditions.push({ $or: [{ name: searchRegex }, { email: searchRegex }] });
  }

  const filter = andConditions.length ? { $and: andConditions } : {};

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate(getEmployeeAuditPopulateOptions())
      .sort(showDeleted ? { deletedAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit),
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

  const employee = await Employee.findById(id).populate(getEmployeeAuditPopulateOptions());

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

const updateEmployee = async (id, data, updatedBy) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const sanitized = stripEmployeeAuditFields(data);

  const {
    createUser = false,
    role,
    password,
    ...employeeData
  } = sanitized;

  validateEmployeeInput(employeeData, { isUpdate: true });

  if (employeeData.email !== undefined) {
    await assertUniqueEmployeeEmail(employeeData.email, id);

    const linkedUser = await User.findOne({ employee: id });
    await assertUniqueUserEmail(employeeData.email, linkedUser?._id);
  }

  if (employeeData.mobile !== undefined) {
    await assertUniqueMobile(employeeData.mobile, id);
  }

  const updatePayload = {
    ...buildEmployeeUpdatePayload(employeeData),
    updatedBy,
  };

  const employee = await Employee.findByIdAndUpdate(
    id,
    updatePayload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  let user = null;
  let loginAccountNotFound = false;

  if (createUser) {
    user = await userService.createOrUpdateUserForEmployee({
      employee,
      password,
      role,
    });
  } else if (password !== undefined && password !== null && String(password).trim() !== '') {
    user = await userService.updateUserPasswordByEmployeeId(employee._id, password);

    if (!user) {
      loginAccountNotFound = true;
    }
  }

  await populateEmployeeAudit(employee);

  return { employee, user, loginAccountNotFound };
};

const deleteEmployee = async (id, actorId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  if (isEmployeeDeleted(employee)) {
    throw createError('Employee is already deleted', 400);
  }

  employee.isDeleted = true;
  employee.status = 'INACTIVE';
  employee.deletedAt = new Date();
  employee.deletedBy = actorId;
  employee.updatedBy = actorId;
  await employee.save();

  const user = await syncUserStatus(employee._id, 'INACTIVE');
  await populateEmployeeAudit(employee);

  return { employee, user };
};

const updateEmployeeStatus = async (id, status, actorId) => {
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

  if (isEmployeeDeleted(employee)) {
    throw createError('Cannot change status of a deleted employee', 400);
  }

  const result = await syncEmployeeUserStatus(employee, normalizedStatus, { actorId });
  await populateEmployeeAudit(result.employee);

  return result;
};

const restoreEmployee = async (id, actorId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Employee not found', 404);
  }

  const existing = await Employee.findById(id);

  if (!existing) {
    throw createError('Employee not found', 404);
  }

  if (!isEmployeeDeleted(existing)) {
    throw createError('Employee is not deleted', 400);
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    {
      $set: {
        status: 'ACTIVE',
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        updatedBy: actorId,
      },
    },
    { new: true, runValidators: true }
  );

  const user = await syncUserStatus(employee._id, 'ACTIVE');
  await populateEmployeeAudit(employee);

  return { employee, user };
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  restoreEmployee,
  resolveStatus,
};
