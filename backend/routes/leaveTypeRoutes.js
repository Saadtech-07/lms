const express = require('express');
const {
  createLeaveType,
  getLeaveTypes,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
} = require('../controllers/leaveTypeController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('ADMIN', 'MANAGER'), createLeaveType);
router.get('/', authMiddleware, authorizeRoles('ADMIN', 'MANAGER', 'EMPLOYEE'), getLeaveTypes);
router.get('/:id', authMiddleware, authorizeRoles('ADMIN', 'MANAGER', 'EMPLOYEE'), getLeaveTypeById);
router.put('/:id', authMiddleware, authorizeRoles('ADMIN', 'MANAGER'), updateLeaveType);
router.delete('/:id', authMiddleware, authorizeRoles('ADMIN'), deleteLeaveType);

module.exports = router;
