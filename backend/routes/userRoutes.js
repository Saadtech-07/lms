const express = require('express');
const { createUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('ADMIN'), createUser);

module.exports = router;
