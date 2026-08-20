const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeaveRequest = require('../models/LeaveRequest');
const {
  calculateWorkingDays,
  validateEmployeeLeaveDates,
  parseDateInput,
  toDateInputValue,
} = require('../utils/dateUtils');
const { isNonEmptyString, isPresent } = require('../utils/validators');
const {
  stripLeaveAuditFields,
  getLeaveAuditPopulateOptions,
} = require('../utils/auditUtils');
const {
  buildExactMatchRegex,
  buildSearchRegex,
  isAllFilterValue,
} = require('../utils/queryUtils');

const ACTIVE_LEAVE_STATUSES = ['PENDING', 'APPROVED'];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getUsedLeaveDays = async (employeeId, leaveTypeId, excludeRequestId = null) => {
  const filter = {
    employee: employeeId,
    leaveType: leaveTypeId,
    status: { $in: ACTIVE_LEAVE_STATUSES },
  };

  if (excludeRequestId) {
    filter._id = { $ne: excludeRequestId };
  }

  const leaveRequests = await LeaveRequest.find(filter).select('numberOfDays');

  return leaveRequests.reduce((total, request) => total + request.numberOfDays, 0);
};

const findLeaveRequestById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Leave request not found', 404);
  }

  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    throw createError('Leave request not found', 404);
  }

  return leaveRequest;
};

const ensurePendingStatus = (leaveRequest) => {
  if (leaveRequest.status === 'APPROVED') {
    throw createError('Leave request is already approved', 400);
  }

  if (leaveRequest.status === 'REJECTED') {
    throw createError('Leave request is already rejected', 400);
  }
};

const resolveApprovedBy = (approvedBy) => {
  if (!approvedBy) {
    return undefined;
  }

  if (!mongoose.Types.ObjectId.isValid(approvedBy)) {
    return undefined;
  }

  return approvedBy;
};

const getLeavePopulateOptions = () => getLeaveAuditPopulateOptions();

const buildEmployeeMatchFilter = ({ search, department } = {}) => {
  const conditions = [];

  if (!isAllFilterValue(department)) {
    const departmentRegex = buildExactMatchRegex(department);

    if (departmentRegex) {
      conditions.push({ department: departmentRegex });
    }
  }

  if (search) {
    const searchRegex = buildSearchRegex(search);

    if (searchRegex) {
      conditions.push({ $or: [{ name: searchRegex }, { email: searchRegex }] });
    }
  }

  if (!conditions.length) {
    return null;
  }

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
};

const resolveEmployeeIdsForLeaveFilter = async ({ search, department } = {}) => {
  const employeeMatch = buildEmployeeMatchFilter({ search, department });

  if (!employeeMatch) {
    return null;
  }

  const employees = await Employee.find(employeeMatch).select('_id');
  return employees.map((employee) => employee._id);
};

const resolveLeaveTypeFilter = async (leaveTypeParam) => {
  if (isAllFilterValue(leaveTypeParam) || !leaveTypeParam) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(leaveTypeParam)) {
    return leaveTypeParam;
  }

  const leaveTypeRegex = buildExactMatchRegex(leaveTypeParam);
  const leaveTypeDoc = await LeaveType.findOne({ name: leaveTypeRegex }).select('_id');

  return leaveTypeDoc?._id || null;
};

const buildEmptyLeaveListResult = (page, limit) => ({
  leaveRequests: [],
  pagination: {
    page,
    limit,
    total: 0,
    totalPages: 1,
  },
});

const populateLeaveRequest = async (leaveRequest) => {
  await leaveRequest.populate(getLeavePopulateOptions());
  return leaveRequest;
};

const findOverlappingLeave = async (employeeId, fromDate, toDate, excludeRequestId = null) => {
  const normalizedFrom = parseDateInput(fromDate);
  const normalizedTo = parseDateInput(toDate);

  const filter = {
    employee: employeeId,
    status: { $in: ACTIVE_LEAVE_STATUSES },
    fromDate: { $lte: normalizedTo },
    toDate: { $gte: normalizedFrom },
  };

  if (excludeRequestId) {
    filter._id = { $ne: excludeRequestId };
  }

  return LeaveRequest.findOne(filter).populate('leaveType', 'name');
};

const createLeaveRequest = async (data, createdBy, user = {}) => {
  const sanitized = stripLeaveAuditFields(data);
  const { employee, leaveType, fromDate, toDate, reason } = sanitized;

  if (!isPresent(employee)) {
    throw createError('Employee is required', 400);
  }

  if (!isPresent(leaveType)) {
    throw createError('Leave type is required', 400);
  }

  if (!fromDate || !toDate) {
    throw createError('fromDate and toDate are required', 400);
  }

  if (!isNonEmptyString(reason)) {
    throw createError('Reason is required', 400);
  }

  if (!mongoose.Types.ObjectId.isValid(employee)) {
    throw createError('Employee not found', 404);
  }

  const employeeDoc = await Employee.findById(employee);

  if (!employeeDoc) {
    throw createError('Employee not found', 404);
  }

  if (!mongoose.Types.ObjectId.isValid(leaveType)) {
    throw createError('Leave type not found', 404);
  }

  const leaveTypeDoc = await LeaveType.findById(leaveType);

  if (!leaveTypeDoc) {
    throw createError('Leave type not found', 404);
  }

  if (!leaveTypeDoc.isActive) {
    throw createError('Leave type is not active', 400);
  }

  const normalizedFromDate = parseDateInput(fromDate);
  const normalizedToDate = parseDateInput(toDate);

  let numberOfDays;

  try {
    if (user.role === 'EMPLOYEE') {
      numberOfDays = validateEmployeeLeaveDates(normalizedFromDate, normalizedToDate);
    } else {
      numberOfDays = calculateWorkingDays(normalizedFromDate, normalizedToDate);

      if (numberOfDays < 1) {
        throw new Error('Leave must include at least one working day');
      }
    }
  } catch (error) {
    throw createError(error.message, 400);
  }

  const usedDays = await getUsedLeaveDays(employee, leaveType);
  const availableBalance = leaveTypeDoc.totalDays - usedDays;

  if (numberOfDays > availableBalance) {
    throw createError(
      `Insufficient leave balance. Available: ${availableBalance}, requested: ${numberOfDays}`,
      400
    );
  }

  const overlappingRequest = await findOverlappingLeave(
    employee,
    normalizedFromDate,
    normalizedToDate
  );

  if (overlappingRequest) {
    const existingFrom = toDateInputValue(overlappingRequest.fromDate);
    const existingTo = toDateInputValue(overlappingRequest.toDate);
    const leaveTypeName = overlappingRequest.leaveType?.name || 'leave';

    throw createError(
      `These dates overlap with your existing ${overlappingRequest.status.toLowerCase()} ${leaveTypeName} request (${existingFrom} to ${existingTo}). Choose different dates.`,
      400
    );
  }

  const leaveRequest = await LeaveRequest.create({
    employee,
    leaveType,
    fromDate: normalizedFromDate,
    toDate: normalizedToDate,
    numberOfDays,
    reason,
    status: 'PENDING',
    createdBy,
  });

  return leaveRequest.populate(getLeavePopulateOptions());
};

const getLeaveRequests = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.employee && mongoose.Types.ObjectId.isValid(query.employee)) {
    filter.employee = query.employee;
  }

  if (query.status && !isAllFilterValue(query.status)) {
    filter.status = query.status.toUpperCase();
  }

  const leaveTypeFilter = await resolveLeaveTypeFilter(query.leaveType);

  if (query.leaveType && !isAllFilterValue(query.leaveType) && !leaveTypeFilter) {
    return buildEmptyLeaveListResult(page, limit);
  }

  if (leaveTypeFilter) {
    filter.leaveType = leaveTypeFilter;
  }

  const employeeIds = await resolveEmployeeIdsForLeaveFilter({
    search: query.search,
    department: query.department,
  });

  if (employeeIds) {
    if (!employeeIds.length) {
      return buildEmptyLeaveListResult(page, limit);
    }

    if (filter.employee) {
      const requestedEmployeeId = String(filter.employee);

      if (!employeeIds.some((employeeId) => String(employeeId) === requestedEmployeeId)) {
        return buildEmptyLeaveListResult(page, limit);
      }
    } else {
      filter.employee = { $in: employeeIds };
    }
  }

  const [leaveRequests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate(getLeavePopulateOptions())
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    leaveRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getLeaveHistory = async (query = {}, user = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (user.role === 'EMPLOYEE') {
    if (!user.employee) {
      throw createError('Employee profile not linked to user account', 403);
    }

    filter.employee = user.employee;
  } else if (query.employee && mongoose.Types.ObjectId.isValid(query.employee)) {
    filter.employee = query.employee;
  }

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.leaveType && mongoose.Types.ObjectId.isValid(query.leaveType)) {
    filter.leaveType = query.leaveType;
  }

  if (query.fromDate) {
    filter.toDate = { $gte: new Date(query.fromDate) };
  }

  if (query.toDate) {
    filter.fromDate = { $lte: new Date(query.toDate) };
  }

  const [leaveHistory, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate(getLeavePopulateOptions())
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    leaveHistory,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getLeaveRequestById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Leave request not found', 404);
  }

  const leaveRequest = await LeaveRequest.findById(id).populate(
    getLeavePopulateOptions()
  );

  if (!leaveRequest) {
    throw createError('Leave request not found', 404);
  }

  return leaveRequest;
};

const approveLeaveRequest = async (id, approvedBy) => {
  const leaveRequest = await findLeaveRequestById(id);

  ensurePendingStatus(leaveRequest);

  const leaveTypeDoc = await LeaveType.findById(leaveRequest.leaveType);

  if (!leaveTypeDoc) {
    throw createError('Leave type not found', 404);
  }

  const usedDays = await getUsedLeaveDays(
    leaveRequest.employee,
    leaveRequest.leaveType,
    leaveRequest._id
  );
  const availableBalance = leaveTypeDoc.totalDays - usedDays;

  if (leaveRequest.numberOfDays > availableBalance) {
    throw createError(
      `Insufficient leave balance. Available: ${availableBalance}, requested: ${leaveRequest.numberOfDays}`,
      400
    );
  }

  const resolvedApprovedBy = resolveApprovedBy(approvedBy);

  if (!resolvedApprovedBy) {
    throw createError('Approver is required', 401);
  }

  leaveRequest.status = 'APPROVED';
  leaveRequest.approvedBy = resolvedApprovedBy;
  leaveRequest.approvedAt = new Date();
  leaveRequest.rejectedBy = null;
  leaveRequest.rejectedAt = null;
  leaveRequest.rejectionReason = null;
  leaveRequest.rejectionRemark = null;

  await leaveRequest.save();

  return populateLeaveRequest(leaveRequest);
};

const rejectLeaveRequest = async (id, rejectionReason, rejectedBy) => {
  const leaveRequest = await findLeaveRequestById(id);

  ensurePendingStatus(leaveRequest);

  const trimmedReason = rejectionReason?.trim();

  if (!trimmedReason) {
    throw createError('Rejection reason is required', 400);
  }

  const resolvedRejectedBy = resolveApprovedBy(rejectedBy);

  if (!resolvedRejectedBy) {
    throw createError('Rejector is required', 401);
  }

  leaveRequest.status = 'REJECTED';
  leaveRequest.rejectionReason = trimmedReason;
  leaveRequest.rejectionRemark = trimmedReason;
  leaveRequest.rejectedBy = resolvedRejectedBy;
  leaveRequest.rejectedAt = new Date();
  leaveRequest.approvedBy = null;
  leaveRequest.approvedAt = null;

  await leaveRequest.save();

  return populateLeaveRequest(leaveRequest);
};

const updateLeaveStatus = async (id, status, { approvedBy, rejectedBy, rejectionReason } = {}) => {
  const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';

  if (normalizedStatus !== 'APPROVED' && normalizedStatus !== 'REJECTED') {
    throw createError('Invalid status. Only APPROVED and REJECTED are allowed', 400);
  }

  if (normalizedStatus === 'APPROVED') {
    return approveLeaveRequest(id, approvedBy);
  }

  return rejectLeaveRequest(id, rejectionReason, rejectedBy);
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveHistory,
  getLeaveRequestById,
  updateLeaveStatus,
};
