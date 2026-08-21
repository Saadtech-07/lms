import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLeaveById } from '../../api/leaveApi';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { hasRole } from '../../utils/auth';
import {
  formatDate,
  formatDateTime,
  formatUserWithRole,
  getPopulatedName,
} from '../../utils/format';

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function LeaveActionSection({ leave }) {
  if (leave.status === 'PENDING') {
    return (
      <div className="border-t border-slate-100 pt-5">
        <h3 className="section-title mb-3">Approval Information</h3>
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Awaiting Approval</p>
        </div>
      </div>
    );
  }

  if (leave.status === 'APPROVED') {
    return (
      <div className="border-t border-slate-100 pt-5">
        <h3 className="section-title mb-3">Approval Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Approved By" value={formatUserWithRole(leave.approvedBy)} />
          <DetailField
            label="Approved At"
            value={leave.approvedAt ? formatDateTime(leave.approvedAt) : '—'}
          />
        </div>
      </div>
    );
  }

  if (leave.status === 'REJECTED') {
    return (
      <div className="border-t border-slate-100 pt-5">
        <h3 className="section-title mb-3">Rejection Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Rejected By" value={formatUserWithRole(leave.rejectedBy)} />
          <DetailField
            label="Rejected At"
            value={leave.rejectedAt ? formatDateTime(leave.rejectedAt) : '—'}
          />
        </div>
        {leave.rejectionReason && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">Reason for Rejection</p>
            <p className="mt-1 text-sm text-red-700">{leave.rejectionReason}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function LeaveDetails() {
  const { id } = useParams();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaveById(id)
      .then((response) => setLeave(response.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link to={hasRole('EMPLOYEE') ? '/leaves' : '/pending-leaves'} className="btn-link">
          ← Back to leaves
        </Link>
        <h2 className="page-title mt-2">Leave Details</h2>
      </div>

      <ErrorMessage message={error} />

      {leave && (
        <div className="card space-y-5 p-6 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-500">Status</span>
            <StatusBadge status={leave.status} />
          </div>

          <div>
            <h3 className="section-title mb-3">Leave Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Employee" value={getPopulatedName(leave.employee)} />
              <DetailField label="Leave Type" value={getPopulatedName(leave.leaveType)} />
              <DetailField label="From" value={formatDate(leave.fromDate)} />
              <DetailField label="To" value={formatDate(leave.toDate)} />
              <DetailField label="Days" value={leave.numberOfDays} />
            </div>
            <div className="mt-4">
              <DetailField label="Reason" value={leave.reason} />
            </div>
          </div>

          <LeaveActionSection leave={leave} />
        </div>
      )}
    </div>
  );
}
