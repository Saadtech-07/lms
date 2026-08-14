const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isNonEmptyString, isValidEmail } = require('../utils/validators');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const loginUser = async (email, password) => {
  if (!isNonEmptyString(email)) {
    throw createError('Email is required', 400);
  }

  if (!isNonEmptyString(password)) {
    throw createError('Password is required', 400);
  }

  if (!isValidEmail(email)) {
    throw createError('Invalid email format', 400);
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  const userStatus = user.status || 'ACTIVE';

  if (userStatus === 'INACTIVE') {
    throw createError('Account is inactive', 403);
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee: user.employee,
    },
    token,
  };
};

module.exports = {
  loginUser,
};
