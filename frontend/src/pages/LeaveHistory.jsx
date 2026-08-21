import { useEffect, useState } from 'react';
import { getLeaveHistory } from '../api/leaveApi';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import { formatDate, getPopulatedName } from '../utils/format';

export default function LeaveHistory() {
  const [history, setHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const params = {};
    if (statusFilter) params.status = statusFilter;

    getLeaveHistory(params)
      .then((response) => setHistory(response.data.leaveHistory || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="page-title">Leave History</h2>
          <p className="page-subtitle">Browse past and current leave records</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto min-w-36"
          >
            <option value="">All</option>
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
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leave history found
                  </td>
                </tr>
              ) : (
                history.map((leave) => (
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
