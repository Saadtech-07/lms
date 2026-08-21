import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getLeaveBalance } from '../api/dashboardApi';
import { getLeaves } from '../api/leaveApi';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import { getEmployeeId, getUser, hasRole } from '../utils/auth';
import {
  getFirstName,
  getGreeting,
  getPopulatedName,
  isApprovedThisMonth,
} from '../utils/format';

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{value ?? 0}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function AdminManagerDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [approvedThisMonth, setApprovedThisMonth] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getLeaves()])
      .then(([dashboardRes, leavesRes]) => {
        setStats(dashboardRes.data);
        const leaves = leavesRes.data.leaveRequests || [];
        setRecentLeaves(leaves);
        setApprovedThisMonth(
          leaves.filter(
            (leave) => leave.status === 'APPROVED' && isApprovedThisMonth(leave.approvedAt)
          ).length
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const firstName = getFirstName(user?.name);
  const visibleRecentLeaves = recentLeaves.slice(0, 7);
  const canViewAllRecent = recentLeaves.length > 7;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="page-title">
          {getGreeting()}, {firstName}
        </h2>
      </div>

      <ErrorMessage message={error} />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Employees" value={stats.totalEmployees} />
          <StatCard label="Pending Requests" value={stats.pendingRequests} />
          <StatCard label="Approved Leaves" value={stats.approvedLeaves} />
          <StatCard label="Rejected Leaves" value={stats.rejectedLeaves} />
          <StatCard
            label="Approved This Month"
            value={approvedThisMonth}
            hint="From leave records"
          />
        </div>
      )}

      <div className="card border-amber-100 bg-amber-50/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="section-title">Pending Leave Requests</h3>
            <p className="mt-1 text-sm text-slate-600">
              {stats?.pendingRequests ?? 0} request(s) waiting for approval
            </p>
          </div>
          <Link to="/pending-leaves" className="btn-primary">
            Review Requests
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Recent Leave Requests</h3>
          {canViewAllRecent && (
            <Link to="/pending-leaves" className="btn-link">
              View All
            </Link>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Days</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecentLeaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No leave requests yet
                  </td>
                </tr>
              ) : (
                visibleRecentLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td>{getPopulatedName(leave.employee)}</td>
                    <td>{getPopulatedName(leave.leaveType)}</td>
                    <td>{leave.numberOfDays}</td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                    <td>
                      {leave.status === 'PENDING' ? (
                        <Link to="/pending-leaves" className="btn-link">
                          Review
                        </Link>
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
      </div>
    </div>
  );
}

function EmployeeDashboard({ user }) {
  const employeeId = getEmployeeId(user);
  const [stats, setStats] = useState({
    availableLeave: 0,
    pendingRequests: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });
  const [balances, setBalances] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      setError('Employee profile not linked to your account');
      setLoading(false);
      return;
    }

    Promise.all([
      getLeaveBalance(employeeId),
      getLeaves({ employee: employeeId }),
    ])
      .then(([balanceRes, leavesRes]) => {
        const leaveBalances = balanceRes.data || [];
        const leaves = leavesRes.data.leaveRequests || [];

        setBalances(leaveBalances);
        setStats({
          availableLeave: leaveBalances.reduce(
            (total, item) => total + (item.availableDays || 0),
            0
          ),
          pendingRequests: leaves.filter((leave) => leave.status === 'PENDING').length,
          approvedLeaves: leaves.filter((leave) => leave.status === 'APPROVED').length,
          rejectedLeaves: leaves.filter((leave) => leave.status === 'REJECTED').length,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <Loading />;

  const firstName = getFirstName(user?.name);
  const visibleBalances = balances.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="page-title">Welcome, {firstName}</h2>
      </div>

      <ErrorMessage message={error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Leave" value={stats.availableLeave} hint="Total remaining days" />
        <StatCard label="Pending Requests" value={stats.pendingRequests} />
        <StatCard label="Approved Leaves" value={stats.approvedLeaves} />
        <StatCard label="Rejected Leaves" value={stats.rejectedLeaves} />
      </div>

      <div>
        <h3 className="section-title mb-4">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/leaves/apply"
            className="card p-5 transition hover:border-indigo-200 hover:shadow-md"
          >
            <p className="font-semibold text-slate-800">Apply for Leave</p>
            <p className="mt-1 text-sm text-slate-500">Submit a new leave request</p>
          </Link>
          <Link
            to="/leaves"
            className="card p-5 transition hover:border-indigo-200 hover:shadow-md"
          >
            <p className="font-semibold text-slate-800">View My Leaves</p>
            <p className="mt-1 text-sm text-slate-500">
              See your submitted leave requests and their status
            </p>
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Leave Balance</h3>
          <Link to="/leave-balance" className="btn-link">
            View All
          </Link>
        </div>

        {visibleBalances.length === 0 ? (
          <p className="text-sm text-slate-400">No leave balance data available.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBalances.map((item) => (
              <div key={item.leaveType._id} className="card p-5">
                <h3 className="font-semibold text-slate-800">{item.leaveType.name}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Total</span>
                    <span className="font-medium text-slate-700">{item.totalDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Used</span>
                    <span className="font-medium text-slate-700">{item.usedDays}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Pending</span>
                    <span className="font-medium text-slate-700">{item.pendingDays}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-medium text-indigo-700">
                    <span>Remaining</span>
                    <span>{item.availableDays}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = getUser();

  if (hasRole('EMPLOYEE')) {
    return <EmployeeDashboard user={user} />;
  }

  return <AdminManagerDashboard user={user} />;
}
