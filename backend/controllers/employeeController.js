const employeeService = require('../services/employeeService');
const userService = require('../services/userService');
const { handleError } = require('../middleware/errorMiddleware');

const createEmployee = async (req, res) => {
  try {
    const { employee, user } = await employeeService.createEmployee(req.body, req.user._id);

    return res.status(201).json({
      success: true,
      message: 'Employee created and login account created successfully',
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

const getEmployeeDepartments = async (req, res) => {
  try {
    const departments = await employeeService.getEmployeeDepartments();

    return res.status(200).json({
      success: true,
      message: 'Employee departments fetched successfully',
      data: departments,
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
    const { employee, user, loginAccountNotFound } = await employeeService.updateEmployee(
      req.params.id,
      req.body,
      req.user._id
    );

    if (loginAccountNotFound) {
      return res.status(200).json({
        success: true,
        message:
          'Employee updated successfully, but no login account was found to update the password',
        data: { employee },
      });
    }

    if (user) {
      return res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
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
    email: employee.email,
    mobile: employee.mobile,
    department: employee.department,
    status: employeeService.resolveStatus(employee.status),
    isDeleted: Boolean(employee.isDeleted),
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    createdBy: employee.createdBy,
    updatedBy: employee.updatedBy,
    deletedAt: employee.deletedAt || null,
    deletedBy: employee.deletedBy || null,
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
    const result = await employeeService.deleteEmployee(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: formatStatusResponse(result),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateEmployeeStatus = async (req, res) => {
  try {
    const result = await employeeService.updateEmployeeStatus(
      req.params.id,
      req.body.status,
      req.user._id
    );

    const isActive = employeeService.resolveStatus(req.body.status) === 'ACTIVE';

    return res.status(200).json({
      success: true,
      message: isActive ? 'Employee activated successfully' : 'Employee deactivated successfully',
      data: formatStatusResponse(result),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const restoreEmployee = async (req, res) => {
  try {
    const result = await employeeService.restoreEmployee(req.params.id, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Employee restored successfully',
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
  getEmployeeDepartments,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  restoreEmployee,
  updateEmployeeRole,
};
