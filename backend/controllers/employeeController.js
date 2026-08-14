const employeeService = require('../services/employeeService');
const userService = require('../services/userService');
const { handleError } = require('../middleware/errorMiddleware');

const createEmployee = async (req, res) => {
  try {
    const { employee, user } = await employeeService.createEmployee(req.body);

    const message = user
      ? 'Employee created and login account created successfully'
      : 'Employee created successfully';

    return res.status(201).json({
      success: true,
      message,
      data: {
        employee,
        user: user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              employee: user.employee,
            }
          : null,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getEmployees = async (req, res) => {
  try {
    const result = await employeeService.getEmployees(req.query);

    return res.status(200).json({
      success: true,
      message: 'Employees fetched successfully',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Employee fetched successfully',
      data: employee,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { employee, user } = await employeeService.updateEmployee(req.params.id, req.body);

    if (user) {
      return res.status(200).json({
        success: true,
        message: 'Employee updated and login account saved successfully',
        data: {
          employee,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employee: user.employee,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const formatStatusResponse = ({ employee, user }) => ({
  employee: {
    _id: employee._id,
    name: employee.name,
    status: employeeService.resolveStatus(employee.status),
  },
  user: user
    ? {
        _id: user._id,
        email: user.email,
        role: user.role,
        status: employeeService.resolveStatus(user.status),
      }
    : null,
});

const deleteEmployee = async (req, res) => {
  try {
    const result = await employeeService.deleteEmployee(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      data: formatStatusResponse(result),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateEmployeeStatus = async (req, res) => {
  try {
    const result = await employeeService.updateEmployeeStatus(req.params.id, req.body.status);

    const isActive = employeeService.resolveStatus(req.body.status) === 'ACTIVE';

    return res.status(200).json({
      success: true,
      message: isActive ? 'Employee restored successfully' : 'Employee deactivated successfully',
      data: formatStatusResponse(result),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateEmployeeRole = async (req, res) => {
  try {
    const result = await userService.updateUserRoleByEmployeeId(req.params.id, req.body.role);

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  updateEmployeeRole,
};
