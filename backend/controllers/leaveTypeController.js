const leaveTypeService = require('../services/leaveTypeService');
const { handleError } = require('../middleware/errorMiddleware');

const createLeaveType = async (req, res) => {
  try {
    const leaveType = await leaveTypeService.createLeaveType(req.body);

    return res.status(201).json({
      success: true,
      message: 'Leave type created successfully',
      data: leaveType,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getLeaveTypes = async (req, res) => {
  try {
    const result = await leaveTypeService.getLeaveTypes(req.query);

    return res.status(200).json({
      success: true,
      message: 'Leave types fetched successfully',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getLeaveTypeById = async (req, res) => {
  try {
    const leaveType = await leaveTypeService.getLeaveTypeById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Leave type fetched successfully',
      data: leaveType,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateLeaveType = async (req, res) => {
  try {
    const leaveType = await leaveTypeService.updateLeaveType(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Leave type updated successfully',
      data: leaveType,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteLeaveType = async (req, res) => {
  try {
    const leaveType = await leaveTypeService.deleteLeaveType(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Leave type deleted successfully',
      data: leaveType,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createLeaveType,
  getLeaveTypes,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
};
