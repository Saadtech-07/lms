const AUDIT_USER_SELECT = 'name email role';

const EMPLOYEE_AUDIT_BODY_FIELDS = [
  'createdBy',
  'updatedBy',
  'deletedBy',
  'deletedAt',
  'isDeleted',
  'createdAt',
  'updatedAt',
];

const LEAVE_AUDIT_BODY_FIELDS = [
  ...EMPLOYEE_AUDIT_BODY_FIELDS,
  'approvedBy',
  'approvedAt',
  'rejectedBy',
  'rejectedAt',
];

const stripFields = (data, fields) => {
  const cleaned = { ...data };

  fields.forEach((field) => {
    delete cleaned[field];
  });

  return cleaned;
};

const stripEmployeeAuditFields = (data) => stripFields(data, EMPLOYEE_AUDIT_BODY_FIELDS);

const stripLeaveAuditFields = (data) => stripFields(data, LEAVE_AUDIT_BODY_FIELDS);

const getEmployeeAuditPopulateOptions = () => [
  { path: 'createdBy', select: AUDIT_USER_SELECT },
  { path: 'updatedBy', select: AUDIT_USER_SELECT },
  { path: 'deletedBy', select: AUDIT_USER_SELECT },
];

const getLeaveAuditPopulateOptions = () => [
  { path: 'employee' },
  { path: 'leaveType' },
  { path: 'createdBy', select: AUDIT_USER_SELECT },
  { path: 'updatedBy', select: AUDIT_USER_SELECT },
  { path: 'approvedBy', select: AUDIT_USER_SELECT },
  { path: 'rejectedBy', select: AUDIT_USER_SELECT },
];

const populateEmployeeAudit = async (employee) => {
  if (!employee) {
    return employee;
  }

  await employee.populate(getEmployeeAuditPopulateOptions());
  return employee;
};

module.exports = {
  stripEmployeeAuditFields,
  stripLeaveAuditFields,
  getEmployeeAuditPopulateOptions,
  getLeaveAuditPopulateOptions,
  populateEmployeeAudit,
};
