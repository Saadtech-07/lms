const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return process.env.JWT_SECRET;
};

const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '1d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const authError = new Error('Token has expired');
      authError.statusCode = 401;
      throw authError;
    }

    if (error.name === 'JsonWebTokenError') {
      const authError = new Error('Invalid token');
      authError.statusCode = 401;
      throw authError;
    }

    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
