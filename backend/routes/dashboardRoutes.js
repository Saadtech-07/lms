const express = require('express');
const {
  getDashboardStats,
  getEmployeeLeaveBalance,
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, authorizeRoles('ADMIN', 'MANAGER'), getDashboardStats);
router.get(
  '/leave-balance/:employeeId',
  authMiddleware,
  authorizeRoles('ADMIN', 'MANAGER', 'EMPLOYEE'),
  getEmployeeLeaveBalance
);

module.exports = router;
