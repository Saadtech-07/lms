const express = require('express');
const {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveHistory,
  getLeaveRequestById,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware,authorizeRoles('EMPLOYEE', 'MANAGER', 'ADMIN'),
  createLeaveRequest);
router.get('/',authMiddleware,authorizeRoles('EMPLOYEE', 'MANAGER', 'ADMIN'),
  getLeaveRequests);
router.get('/history',authMiddleware,authorizeRoles('EMPLOYEE', 'MANAGER', 'ADMIN'),
getLeaveHistory);
router.patch('/:id/status',authMiddleware,authorizeRoles('ADMIN', 'MANAGER'),
  updateLeaveStatus);
router.get('/:id',authMiddleware,authorizeRoles('EMPLOYEE', 'MANAGER', 'ADMIN'),
  getLeaveRequestById);

module.exports = router;
