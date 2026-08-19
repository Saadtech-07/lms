const mongoose = require('mongoose');
const {
  isValidEmployeeName,
  isValidEmail,
  isValidMobile,
  isValidDepartment,
  VALIDATION_MESSAGES,
} = require('../utils/validators');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      validate: {
        validator: isValidEmployeeName,
        message: VALIDATION_MESSAGES.NAME,
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidEmail,
        message: VALIDATION_MESSAGES.EMAIL_INVALID,
      },
    },
    mobile: {
      type: String,
      required: [true, 'Mobile is required'],
      trim: true,
      validate: {
        validator: isValidMobile,
        message: VALIDATION_MESSAGES.MOBILE_INVALID,
      },
    },
    department: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          return value === undefined || value === null || value === '' || isValidDepartment(value);
        },
        message: VALIDATION_MESSAGES.DEPARTMENT_INVALID,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Employee', employeeSchema);
