import { useCallback, useEffect, useState } from 'react';
import { getEmployeeDepartments } from '../../api/employeeApi';
import { getLeaves, updateLeaveStatus } from '../../api/leaveApi';
import { getLeaveTypes } from '../../api/leaveTypeApi';
import EmptyTableState from '../../components/EmptyTableState';
import ErrorMessage from '../../components/ErrorMessage';
import FilterSelect from '../../components/FilterSelect';
import Loading from '../../components/Loading';
import RejectLeaveDialog from '../../components/RejectLeaveDialog';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import SuccessMessage from '../../components/SuccessMessage';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, getPopulatedName } from '../../utils/format';

const INITIAL_VISIBLE_COUNT = 7;

export default function PendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectLeave, setRejectLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const debouncedSearch = useDebounce(searchInput);
  const hasActiveFilters =
    Boolean(debouncedSearch.trim()) ||
    departmentFilter !== 'ALL' ||
    leaveTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const loadLeaves = useCallback(() => {
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

    if (leaveTypeFilter !== 'ALL') {
      params.leaveType = leaveTypeFilter;
    }

    getLeaves(params)
      .then((response) => setLeaves(response.data.leaveRequests || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, departmentFilter, leaveTypeFilter, statusFilter]);

  useEffect(() => {
    setShowAll(false);
    loadLeaves();
  }, [loadLeaves]);

  useEffect(() => {
    getEmployeeDepartments()
      .then((response) => setDepartments(response.data || []))
      .catch(() => setDepartments([]));

    getLeaveTypes()
      .then((response) => setLeaveTypes(response.data.leaveTypes || []))
      .catch(() => setLeaveTypes([]));
  }, []);

  const clearFilters = () => {
    setSearchInput('');
    setDepartmentFilter('ALL');
    setLeaveTypeFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleApprove = async (id) => {
    try {
      await updateLeaveStatus(id, { status: 'APPROVED' });
      setSuccess('Leave request approved');
      loadLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  const openRejectDialog = (leave) => {
    setRejectLeave(leave);
    setRejectionReason('');
    setRejectionError('');
    setError('');
  };

  const resetRejectDialog = () => {
    setRejectLeave(null);
    setRejectionReason('');
    setRejectionError('');
  };

  const closeRejectDialog = () => {
    if (rejectSubmitting) return;
    resetRejectDialog();
  };

  const handleRejectConfirm = async () => {
    if (!rejectLeave) return;

    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      setRejectionError('Rejection reason is required');
      return;
    }

    setRejectSubmitting(true);
    setRejectionError('');
    setError('');

    try {
      await updateLeaveStatus(rejectLeave._id, {
        status: 'REJECTED',
        rejectionReason: trimmedReason,
      });
      setSuccess('Leave request rejected');
      resetRejectDialog();
      loadLeaves();
    } catch (err) {
      setError(err.message);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const visibleLeaves = showAll ? leaves : leaves.slice(0, INITIAL_VISIBLE_COUNT);
  const canViewAll = leaves.length > INITIAL_VISIBLE_COUNT && !showAll;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="page-title">Leave Requests</h2>
          <p className="page-subtitle">Review and approve employee leave requests</p>
        </div>
        {canViewAll && (
          <button type="button" onClick={() => setShowAll(true)} className="btn-link">
            View All
          </button>
        )}
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <div className="filter-toolbar">
        <SearchInput
          id="leave-search"
          label="Search employee"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by employee name"
        />

        <FilterSelect
          id="leave-department-filter"
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
          id="leave-type-filter"
          label="Leave Type"
          value={leaveTypeFilter}
          onChange={(event) => setLeaveTypeFilter(event.target.value)}
        >
          <option value="ALL">All Leave Types</option>
          {leaveTypes.map((leaveType) => (
            <option key={leaveType._id} value={leaveType._id}>
              {leaveType.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="leave-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
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
        <Loading message="Loading leave requests..." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.length === 0 ? (
                <EmptyTableState title="No leave requests found" colSpan={8} />
              ) : (
                visibleLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td className="font-medium text-slate-800">
                      {getPopulatedName(leave.employee)}
                    </td>
                    <td>{getPopulatedName(leave.leaveType)}</td>
                    <td>{formatDate(leave.fromDate)}</td>
                    <td>{formatDate(leave.toDate)}</td>
                    <td>{leave.numberOfDays}</td>
                    <td className="max-w-xs truncate">{leave.reason}</td>
                    <td>
                      <StatusBadge status={leave.status} />
                      {leave.status === 'REJECTED' && leave.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">{leave.rejectionReason}</p>
                      )}
                    </td>
                    <td>
                      {leave.status === 'PENDING' ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(leave._id)}
                            className="btn-link-success"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectDialog(leave)}
                            className="btn-link-danger"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <RejectLeaveDialog
        open={Boolean(rejectLeave)}
        leave={rejectLeave}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={(value) => {
          setRejectionReason(value);
          if (rejectionError) {
            setRejectionError('');
          }
        }}
        error={rejectionError}
        submitting={rejectSubmitting}
        onCancel={closeRejectDialog}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
