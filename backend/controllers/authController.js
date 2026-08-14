const authService = require('../services/authService');
const { handleError } = require('../middleware/errorMiddleware');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  login,
};
