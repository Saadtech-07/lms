const userService = require('../services/userService');
const { handleError } = require('../middleware/errorMiddleware');

const createUser = async (req, res) => {
  try {
    const user = await userService.createUserForEmployee(req.body);

    return res.status(201).json({
      success: true,
      message: 'User account created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createUser,
};
