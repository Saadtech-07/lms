const processError = (error) => {
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation failed',
      data: Object.values(error.errors).map((err) => err.message),
    };
  }
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];

    if (duplicateField === 'email') {
      return {
        statusCode: 409,
        message: 'Email already exists',
        data: null,
      };
    }
    if (duplicateField === 'name') {
      return {
        statusCode: 409,
        message: 'Leave type name already exists',
        data: null,
      };
    }
    return {
      statusCode: 409,
      message: 'Duplicate value already exists',
      data: null,
    };
  }
  if (error.statusCode) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      data: null,
    };
  }
  if (error.name === 'CastError') {
    return {
      statusCode: 404,
      message: 'Resource not found',
      data: null,
    };
  }
  return {
    statusCode: 500,
    message: 'Internal server error',
    data: null,
  };
};
const logError = (error, statusCode) => {
  if (process.env.NODE_ENV !== 'production' || statusCode >= 500) {
    console.error(error);
  }
};
const handleError = (res, error) => {
  const { statusCode, message, data } = processError(error);

  logError(error, statusCode);

  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};
const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { statusCode, message, data } = processError(err);
  logError(err, statusCode);
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};
module.exports = {
  errorMiddleware,
  handleError,
};
