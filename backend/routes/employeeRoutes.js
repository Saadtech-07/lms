const express = require('express');
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  updateEmployeeRole,
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('ADMIN'), createEmployee);
router.get('/', authMiddleware, authorizeRoles('ADMIN', 'MANAGER'), getEmployees);
router.patch('/:id/role', authMiddleware, authorizeRoles('ADMIN'), updateEmployeeRole);
router.patch('/:id/status', authMiddleware, authorizeRoles('ADMIN'), updateEmployeeStatus);
router.get('/:id', authMiddleware, authorizeRoles('ADMIN', 'MANAGER'), getEmployeeById);
router.put('/:id', authMiddleware, authorizeRoles('ADMIN'), updateEmployee);
router.delete('/:id', authMiddleware, authorizeRoles('ADMIN'), deleteEmployee);

module.exports = router;