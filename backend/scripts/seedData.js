const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const User = require('../models/User');

const demoEmployees = [
  {
    name: 'Mohammed Saad',
    email: 'employee@colanonline.com',
    mobile: '9876543210',
    department: 'Engineering',
  },
  {
    name: 'John Doe',
    email: 'john.doe@colanonline.com',
    mobile: '9876543211',
    department: 'HR',
  },
  {
    name: 'Sarah Smith',
    email: 'sarah.smith@colanonline.com',
    mobile: '9876543212',
    department: 'Finance',
  },
];

const leaveTypes = [
  { name: 'Casual Leave', totalDays: 12 },
  { name: 'Sick Leave', totalDays: 10 },
  { name: 'Earned Leave', totalDays: 15 },
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@colanonline.com',
    password: 'admin@123',
    role: 'ADMIN',
  },
  {
    name: 'Manager User',
    email: 'manager@colanonline.com',
    password: 'manager@123',
    role: 'MANAGER',
  },
  {
    name: 'Employee User',
    email: 'employee@colanonline.com',
    password: 'employee@123',
    role: 'EMPLOYEE',
    employeeEmail: 'employee@colanonline.com',
  },
];

const seedEmployees = async () => {
  console.log('\nSeeding demo employees...');
  console.log('Existing employees in the database are preserved and never updated.');

  for (const employeeData of demoEmployees) {
    const existingEmployee = await Employee.findOne({ email: employeeData.email });

    if (existingEmployee) {
      console.log(`Skipped employee (already exists): ${employeeData.email}`);
      continue;
    }

    await Employee.create(employeeData);
    console.log(`Created demo employee: ${employeeData.name} (${employeeData.email})`);
  }
};

const seedLeaveTypes = async () => {
  console.log('\nSeeding leave types...');

  for (const leaveTypeData of leaveTypes) {
    const existingLeaveType = await LeaveType.findOne({ name: leaveTypeData.name });

    if (existingLeaveType) {
      console.log(`Skipped leave type (already exists): ${leaveTypeData.name}`);
      continue;
    }

    await LeaveType.create(leaveTypeData);
    console.log(`Created leave type: ${leaveTypeData.name}`);
  }
};

const getEmployeeReference = async (userData) => {
  if (userData.role !== 'EMPLOYEE') {
    return undefined;
  }

  const employee = await Employee.findOne({ email: userData.employeeEmail });

  if (!employee) {
    throw new Error(
      `Employee not found for email ${userData.employeeEmail}. Run the demo employee seed before creating the EMPLOYEE user.`
    );
  }

  return employee._id;
};

const seedUsers = async () => {
  console.log('\nSeeding users...');

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      if (userData.role === 'EMPLOYEE' && !existingUser.employee) {
        existingUser.employee = await getEmployeeReference(userData);
        await existingUser.save();
        console.log(`Updated employee link for user: ${userData.email}`);
      } else {
        console.log(`Skipped user (already exists): ${userData.email}`);
      }

      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const employee = await getEmployeeReference(userData);

    await User.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      employee,
    });

    console.log(`Created user: ${userData.email} (${userData.role})`);
  }
};

const runSeed = async ({ usersOnly = false } = {}) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    console.log('Starting development seed...');

    if (!usersOnly) {
      await seedEmployees();
      await seedLeaveTypes();
    } else {
      await seedEmployees();
    }

    await seedUsers();

    console.log('\nDevelopment seed completed successfully');
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

module.exports = {
  demoEmployees,
  leaveTypes,
  users,
  runSeed,
};
