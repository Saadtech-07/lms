import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDeletedEmployees, restoreEmployee } from '../../api/employeeApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import SuccessMessage from '../../components/SuccessMessage';
import { formatReadableDateTime, formatUserWithRole } from '../../utils/format';

export default function DeletedEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDeletedEmployees = () => {
    setLoading(true);
    setError('');

    getDeletedEmployees()
      .then((response) => setEmployees(response.data.employees || []))
      .catch((err) => setError(err.message || 'Failed to load deleted employees'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeletedEmployees();
  }, []);

  const closeConfirm = () => {
    if (submitting) return;
    setSelectedEmployee(null);
  };

  const handleRestore = async () => {
    if (!selectedEmployee) return;

    setSubmitting(true);
    setError('');

    try {
      await restoreEmployee(selectedEmployee._id);
      setEmployees((prev) => prev.filter((employee) => employee._id !== selectedEmployee._id));
      setSuccess('Employee restored successfully');
      setSelectedEmployee(null);
    } catch (err) {
      setError(err.message || 'Failed to restore employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/employees" className="btn-link">
            ← Back to employees
          </Link>
          <h2 className="page-title mt-2">Deleted Employees</h2>
        </div>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />
      <SuccessMessage message={success} />

      {loading ? (
        <Loading message="Loading deleted employees..." />
      ) : employees.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-base font-medium text-slate-800">No deleted employees</p>
          <p className="mt-1 text-sm text-slate-500">
            You currently don't have any soft-deleted employees.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td className="font-medium text-slate-800">{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.mobile || '—'}</td>
                  <td>{employee.department || '—'}</td>
                  <td>{formatUserWithRole(employee.deletedBy)}</td>
                  <td>{formatReadableDateTime(employee.deletedAt)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(employee)}
                      className="btn-link-success"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(selectedEmployee)}
        title="Restore Employee?"
        message={
          selectedEmployee
            ? `Are you sure you want to restore ${selectedEmployee.name}?\n\nThe employee will become active again and will appear in the normal employee list.`
            : ''
        }
        confirmLabel="Restore Employee"
        confirmClassName="btn-primary"
        submittingLabel="Restoring..."
        submitting={submitting}
        onCancel={closeConfirm}
        onConfirm={handleRestore}
      />
    </div>
  );
}
