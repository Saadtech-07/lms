const dashboardService = require('../services/dashboardService');
const { handleError } = require('../middleware/errorMiddleware');

const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();

    return res.status(200).json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: stats,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role === 'EMPLOYEE') {
      if (!req.user.employee) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          data: null,
        });
      }

      if (req.user.employee.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          data: null,
        });
      }
    }

    const balance = await dashboardService.getEmployeeLeaveBalance(employeeId);

    return res.status(200).json({
      success: true,
      message: 'Employee leave balance fetched successfully',
      data: balance,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getDashboardStats,
  getEmployeeLeaveBalance,
};
