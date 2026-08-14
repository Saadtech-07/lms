const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null,
      });
    }
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token?.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null,
      });
    }
    const decoded = verifyToken(token.trim());
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null,
      });
    }
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};
module.exports = authMiddleware;