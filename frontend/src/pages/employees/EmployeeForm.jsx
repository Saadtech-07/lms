import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createEmployee, getEmployeeById, updateEmployee } from '../../api/employeeApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';

const ROLES = ['EMPLOYEE', 'MANAGER', 'ADMIN'];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  department: '',
  mobile: '',
};

function normalizeValue(value) {
  return String(value || '').trim();
}

function hasEmployeeChanges(form, original) {
  if (!original) return false;

  return (
    normalizeValue(form.name) !== normalizeValue(original.name) ||
    normalizeValue(form.email) !== normalizeValue(original.email) ||
    normalizeValue(form.department) !== normalizeValue(original.department) ||
    normalizeValue(form.mobile) !== normalizeValue(original.mobile)
  );
}

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const hasChanges = isEdit ? hasEmployeeChanges(form, original) : true;
  const isSubmitDisabled = submitting || (isEdit && !hasChanges);

  useEffect(() => {
    if (!isEdit) return;

    getEmployeeById(id)
      .then((response) => {
        const employee = response.data;
        const nextForm = {
          name: employee.name || '',
          email: employee.email || '',
          password: '',
          role: 'EMPLOYEE',
          department: employee.department || '',
          mobile: employee.mobile || '',
        };

        setForm(nextForm);
        setOriginal({
          name: nextForm.name,
          email: nextForm.email,
          department: nextForm.department,
          mobile: nextForm.mobile,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeUpdateConfirm = () => {
    if (submitting) return;
    setShowUpdateConfirm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isEdit) {
      if (!hasChanges) return;
      setShowUpdateConfirm(true);
      return;
    }

    setSubmitting(true);

    try {
      await createEmployee(form);
      navigate('/employees', { state: { success: 'Employee created successfully' } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!hasChanges) return;

    setSubmitting(true);
    setError('');

    try {
      await updateEmployee(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        department: form.department.trim(),
      });

      navigate('/employees', { state: { success: 'Employee updated successfully' } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link to="/employees" className="btn-link">
          ← Back to Employees
        </Link>
        <h2 className="page-title mt-2">{isEdit ? 'Edit Employee' : 'Create Employee'}</h2>
        <p className="page-subtitle">
          {isEdit
            ? 'Update employee details'
            : 'Add a new employee account and assign their role.'}
        </p>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="card space-y-6 p-6">
        <h3 className="section-title">Employee Information</h3>

        {isEdit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mobile</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-field"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mobile</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitDisabled} className="btn-primary">
            {submitting
              ? isEdit
                ? 'Updating...'
                : 'Creating...'
              : isEdit
                ? 'Update Employee'
                : 'Create Employee'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showUpdateConfirm}
        title="Update Employee Details?"
        message="Are you sure you want to update this employee's details?"
        confirmLabel="Confirm Update"
        confirmClassName="btn-primary"
        submittingLabel="Updating..."
        submitting={submitting}
        onCancel={closeUpdateConfirm}
        onConfirm={handleConfirmUpdate}
      />
    </div>
  );
}
