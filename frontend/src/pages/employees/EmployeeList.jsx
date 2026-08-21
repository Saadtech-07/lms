import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  deleteEmployee,
  getEmployeeDepartments,
  getEmployees,
  updateEmployeeStatus,
} from '../../api/employeeApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyTableState from '../../components/EmptyTableState';
import ErrorMessage from '../../components/ErrorMessage';
import FilterSelect from '../../components/FilterSelect';
import Loading from '../../components/Loading';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import SuccessMessage from '../../components/SuccessMessage';
import { useDebounce } from '../../hooks/useDebounce';
import { hasRole } from '../../utils/auth';
import { getStatusLabel } from '../../utils/format';

function getConfirmConfig(action) {
  if (!action) {
    return {
      title: '',
      message: '',
      confirmLabel: '',
      confirmClassName: 'btn-primary',
      submittingLabel: 'Please wait...',
    };
  }

  if (action.type === 'delete') {
    return {
      title: 'Delete Employee?',
      message: `${action.employee.name} will be removed from the active employee list.\n\nThe employee record will remain in the database for audit/history.`,
      confirmLabel: 'Delete Employee',
      confirmClassName: 'btn-danger',
      submittingLabel: 'Deleting...',
    };
  }

  if (action.type === 'activate') {
    return {
      title: 'Activate Employee?',
      message: `${action.employee.name} will be able to access the application again.`,
      confirmLabel: 'Activate',
      confirmClassName: 'btn-success',
      submittingLabel: 'Activating...',
    };
  }

  return {
    title: 'Deactivate Employee?',
    message: `${action.employee.name} will no longer be able to use the application.`,
    confirmLabel: 'Deactivate',
    confirmClassName: 'btn-danger',
    submittingLabel: 'Deactivating...',
  };
}

export default function EmployeeList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const debouncedSearch = useDebounce(searchInput);
  const isAdmin = hasRole('ADMIN');
  const canManageStatus = hasRole('ADMIN', 'MANAGER');
  const hasActiveFilters =
    Boolean(debouncedSearch.trim()) || departmentFilter !== 'ALL' || statusFilter !== 'ALL';

  const loadEmployees = useCallback(() => {
    setLoading(true);
    setError('');

    const params = {};

    if (statusFilter !== 'ALL') {
      params.status = statusFilter;
    }

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (departmentFilter !== 'ALL') {
      params.department = departmentFilter;
    }

    getEmployees(params)
      .then((response) => setEmployees(response.data.employees || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, departmentFilter, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    getEmployeeDepartments()
      .then((response) => setDepartments(response.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    const toastMessage = location.state?.success;
    if (!toastMessage) return;

    setSuccess(toastMessage);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [location.pathname, location.search, location.state, navigate]);

  const clearFilters = () => {
    setSearchInput('');
    setDepartmentFilter('ALL');
    setStatusFilter('ALL');
  };

  const closeConfirm = () => {
    if (submitting) return;
    setConfirmAction(null);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    setSubmitting(true);
    setError('');

    try {
      if (confirmAction.type === 'deactivate') {
        await updateEmployeeStatus(confirmAction.employee._id, 'INACTIVE');
        setSuccess('Employee deactivated successfully');
      } else if (confirmAction.type === 'activate') {
        await updateEmployeeStatus(confirmAction.employee._id, 'ACTIVE');
        setSuccess('Employee activated successfully');
      } else if (confirmAction.type === 'delete') {
        await deleteEmployee(confirmAction.employee._id);
        setSuccess('Employee deleted successfully');
      }

      setConfirmAction(null);
      loadEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmConfig = getConfirmConfig(confirmAction);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="page-subtitle">Manage employee records and account status</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canManageStatus && (
            <Link to="/employees/deleted" className="btn-secondary inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          )}
          {isAdmin && (
            <Link to="/employees/new" className="btn-primary">
              Add Employee
            </Link>
          )}
        </div>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <div className="filter-toolbar">
        <SearchInput
          id="employee-search"
          label="Search employee or work email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by employee name or work email"
        />

        <FilterSelect
          id="employee-department-filter"
          label="Department"
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
        >
          <option value="ALL">All Departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="employee-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </FilterSelect>

        {hasActiveFilters && (
          <div className="filter-actions">
            <button type="button" onClick={clearFilters} className="btn-secondary">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <Loading message="Loading employees..." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Status</th>
                {canManageStatus && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <EmptyTableState
                  title="No employees found"
                  colSpan={canManageStatus ? 6 : 5}
                />
              ) : (
                employees.map((employee) => {
                  const status = getStatusLabel(employee.status);

                  return (
                    <tr key={employee._id}>
                      <td className="font-medium text-slate-800">{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.mobile}</td>
                      <td>{employee.department || '—'}</td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      {canManageStatus && (
                        <td>
                          <div className="flex flex-wrap items-center gap-3">
                            {isAdmin && (
                              <Link
                                to={`/employees/${employee._id}/edit`}
                                className="table-action table-action-edit"
                              >
                                Edit
                              </Link>
                            )}
                            {status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({ type: 'deactivate', employee })
                                }
                                className="table-action table-action-deactivate"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmAction({ type: 'activate', employee })
                                }
                                className="table-action table-action-activate"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmAction({ type: 'delete', employee })}
                              className="table-action table-action-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        confirmClassName={confirmConfig.confirmClassName}
        submittingLabel={confirmConfig.submittingLabel}
        submitting={submitting}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
