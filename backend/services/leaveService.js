const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeaveRequest = require('../models/LeaveRequest');
const { calculateLeaveDays } = require('../utils/dateUtils');
const { isNonEmptyString, isPresent } = require('../utils/validators');

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

const getLeavePopulateOptions = () => {
  const options = [{ path: 'employee' }, { path: 'leaveType' }];

  if (mongoose.models.User) {
    options.push({ path: 'approvedBy' });
  }

  return options;
};

const populateLeaveRequest = async (leaveRequest) => {
  await leaveRequest.populate(getLeavePopulateOptions());
  return leaveRequest;
};

const hasOverlappingLeave = async (employeeId, fromDate, toDate) => {
  const overlappingRequest = await LeaveRequest.findOne({
    employee: employeeId,
    status: { $in: ACTIVE_LEAVE_STATUSES },
    fromDate: { $lte: new Date(toDate) },
    toDate: { $gte: new Date(fromDate) },
  });

  return Boolean(overlappingRequest);
};

const createLeaveRequest = async (data) => {
  const { employee, leaveType, fromDate, toDate, reason } = data;

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

  let numberOfDays;

  try {
    numberOfDays = calculateLeaveDays(fromDate, toDate);
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

  const overlapping = await hasOverlappingLeave(employee, fromDate, toDate);

  if (overlapping) {
    throw createError('Leave request overlaps with an existing leave request', 400);
  }

  const leaveRequest = await LeaveRequest.create({
    employee,
    leaveType,
    fromDate,
    toDate,
    numberOfDays,
    reason,
    status: 'PENDING',
  });

  return leaveRequest.populate(['employee', 'leaveType']);
};

const getLeaveRequests = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.employee && mongoose.Types.ObjectId.isValid(query.employee)) {
    filter.employee = query.employee;
  }

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.leaveType && mongoose.Types.ObjectId.isValid(query.leaveType)) {
    filter.leaveType = query.leaveType;
  }

  if (query.search) {
    filter.reason = new RegExp(query.search.trim(), 'i');
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

  leaveRequest.status = 'APPROVED';

  const resolvedApprovedBy = resolveApprovedBy(approvedBy);

  if (!resolvedApprovedBy) {
    throw createError('Approver is required', 401);
  }

  leaveRequest.approvedBy = resolvedApprovedBy;

  await leaveRequest.save();

  return populateLeaveRequest(leaveRequest);
};

const rejectLeaveRequest = async (id, rejectionRemark) => {
  const leaveRequest = await findLeaveRequestById(id);

  ensurePendingStatus(leaveRequest);

  const trimmedRemark = rejectionRemark?.trim();

  if (!trimmedRemark) {
    throw createError('Rejection reason is required', 400);
  }

  leaveRequest.status = 'REJECTED';
  leaveRequest.rejectionRemark = trimmedRemark;

  await leaveRequest.save();

  return populateLeaveRequest(leaveRequest);
};

const updateLeaveStatus = async (id, status, { approvedBy, rejectionReason } = {}) => {
  const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';

  if (normalizedStatus !== 'APPROVED' && normalizedStatus !== 'REJECTED') {
    throw createError('Invalid status. Only APPROVED and REJECTED are allowed', 400);
  }

  if (normalizedStatus === 'APPROVED') {
    return approveLeaveRequest(id, approvedBy);
  }

  return rejectLeaveRequest(id, rejectionReason);
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveHistory,
  getLeaveRequestById,
  updateLeaveStatus,
};
