const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
const { isNonEmptyString, isValidTotalDays } = require('../utils/validators');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateLeaveTypeInput = (data, { isUpdate = false } = {}) => {
  if (!isUpdate || data.name !== undefined) {
    if (!isNonEmptyString(data.name)) {
      throw createError('Name is required', 400);
    }
  }

  if (!isUpdate || data.totalDays !== undefined) {
    if (!isValidTotalDays(data.totalDays)) {
      throw createError('totalDays is required and cannot be negative', 400);
    }
  }
};

const handleDuplicateName = (error) => {
  if (error.code === 11000) {
    throw createError('Leave type name already exists', 409);
  }

  throw error;
};

const createLeaveType = async (data) => {
  validateLeaveTypeInput(data);

  try {
    const leaveType = await LeaveType.create(data);
    return leaveType;
  } catch (error) {
    handleDuplicateName(error);
  }
};

const getLeaveTypes = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search) {
    filter.name = new RegExp(query.search.trim(), 'i');
  }

  const [leaveTypes, total] = await Promise.all([
    LeaveType.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LeaveType.countDocuments(filter),
  ]);

  return {
    leaveTypes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getLeaveTypeById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Leave type not found', 404);
  }

  const leaveType = await LeaveType.findById(id);

  if (!leaveType) {
    throw createError('Leave type not found', 404);
  }

  return leaveType;
};

const updateLeaveType = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Leave type not found', 404);
  }

  validateLeaveTypeInput(data, { isUpdate: true });

  try {
    const leaveType = await LeaveType.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!leaveType) {
      throw createError('Leave type not found', 404);
    }

    return leaveType;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    handleDuplicateName(error);
  }
};

const deleteLeaveType = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Leave type not found', 404);
  }

  const leaveType = await LeaveType.findByIdAndDelete(id);

  if (!leaveType) {
    throw createError('Leave type not found', 404);
  }

  return leaveType;
};

module.exports = {
  createLeaveType,
  getLeaveTypes,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
};
