const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeaveRequest = require('../models/LeaveRequest');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getDashboardStats = async () => {
  const [totalEmployees, pendingRequests, approvedLeaves, rejectedLeaves] =
    await Promise.all([
      Employee.countDocuments(),
      LeaveRequest.countDocuments({ status: 'PENDING' }),
      LeaveRequest.countDocuments({ status: 'APPROVED' }),
      LeaveRequest.countDocuments({ status: 'REJECTED' }),
    ]);

  return {
    totalEmployees,
    pendingRequests,
    approvedLeaves,
    rejectedLeaves,
  };
};

const getEmployeeLeaveBalance = async (employeeId) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw createError('Employee not found', 404);
  }

  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw createError('Employee not found', 404);
  }

  const leaveTypes = await LeaveType.find({ isActive: true }).sort({ name: 1 });

  const usage = await LeaveRequest.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        status: { $in: ['APPROVED', 'PENDING'] },
      },
    },
    {
      $group: {
        _id: { leaveType: '$leaveType', status: '$status' },
        days: { $sum: '$numberOfDays' },
      },
    },
  ]);

  const usageMap = new Map();

  for (const item of usage) {
    const leaveTypeId = item._id.leaveType.toString();

    if (!usageMap.has(leaveTypeId)) {
      usageMap.set(leaveTypeId, { usedDays: 0, pendingDays: 0 });
    }

    const entry = usageMap.get(leaveTypeId);

    if (item._id.status === 'APPROVED') {
      entry.usedDays = item.days;
    } else if (item._id.status === 'PENDING') {
      entry.pendingDays = item.days;
    }
  }

  return leaveTypes.map((leaveType) => {
    const { usedDays = 0, pendingDays = 0 } =
      usageMap.get(leaveType._id.toString()) || {};

    return {
      leaveType,
      totalDays: leaveType.totalDays,
      usedDays,
      pendingDays,
      availableDays: leaveType.totalDays - usedDays - pendingDays,
    };
  });
};

module.exports = {
  getDashboardStats,
  getEmployeeLeaveBalance,
};
