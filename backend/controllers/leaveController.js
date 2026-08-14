const leaveService = require('../services/leaveService');
const { handleError } = require('../middleware/errorMiddleware');

const createLeaveRequest = async (req, res) => {
  try {
    const { employee, leaveType, fromDate, toDate, reason } = req.body;

    const leaveRequest = await leaveService.createLeaveRequest({
      employee,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getLeaveRequests = async (req, res) => {
  try {
    const { employee, status, leaveType, page, limit, search } = req.query;

    const result = await leaveService.getLeaveRequests({
      employee,
      status,
      leaveType,
      page,
      limit,
      search,
    });

    return res.status(200).json({
      success: true,
      message: 'Leave requests fetched successfully',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getLeaveHistory = async (req, res) => {
  try {
    const { employee, status, leaveType, page, limit, fromDate, toDate } = req.query;

    const result = await leaveService.getLeaveHistory(
      {
        employee,
        status,
        leaveType,
        page,
        limit,
        fromDate,
        toDate,
      },
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Leave history fetched successfully',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await leaveService.getLeaveRequestById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Leave request fetched successfully',
      data: leaveRequest,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const leaveRequest = await leaveService.updateLeaveStatus(
      req.params.id,
      status,
      {
        approvedBy: req.user._id,
        rejectionReason,
      }
    );

    const message =
      leaveRequest.status === 'APPROVED'
        ? 'Leave request approved successfully'
        : 'Leave request rejected successfully';

    return res.status(200).json({
      success: true,
      message,
      data: leaveRequest,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveHistory,
  getLeaveRequestById,
  updateLeaveStatus,
};
