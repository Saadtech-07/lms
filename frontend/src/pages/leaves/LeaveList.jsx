import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaves } from '../../api/leaveApi';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { getEmployeeId } from '../../utils/auth';
import { formatDate, getLeaveActionedAt, getPopulatedName } from '../../utils/format';

function getLeaveRecords(response) {
  const payload = response?.data || {};
  const records = payload.leaveRequests || payload.leaves || [];
  return Array.isArray(records) ? records : [];
}

export default function LeaveList() {
  const employeeId = getEmployeeId();
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!employeeId) {
      setLeaves([]);
      setError('Failed to load leave requests.');
      setLoading(false);
      return undefined;
    }

    const params = { employee: employeeId };
    if (statusFilter !== 'ALL') params.status = statusFilter;

    setLoading(true);
    setError('');

    getLeaves(params)
      .then((response) => {
        if (cancelled) return;
        setLeaves(getLeaveRecords(response));
      })
      .catch((err) => {
        if (cancelled) return;
        setLeaves([]);
        setError(err.message || 'Failed to load leave requests.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="page-title">My Leaves</h2>
          <p className="page-subtitle">Track your submitted leave requests</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto min-w-32"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actioned At</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id}>
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
                    <td className="whitespace-nowrap text-slate-600">
                      {getLeaveActionedAt(leave)}
                    </td>
                    <td>
                      <Link to={`/leaves/${leave._id}`} className="btn-link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
