import { useEffect, useState } from 'react';
import { getLeaveBalance } from '../api/dashboardApi';
import ErrorMessage from '../components/ErrorMessage';
import Loading from '../components/Loading';
import { getEmployeeId, getUser } from '../utils/auth';

export default function LeaveBalance() {
  const user = getUser();
  const employeeId = getEmployeeId(user);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employeeId) {
      setError('Employee profile not linked to your account');
      setLoading(false);
      return;
    }

    getLeaveBalance(employeeId)
      .then((response) => setBalances(response.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Leave Balance</h2>
        <p className="page-subtitle">Your remaining leave allowance by type</p>
      </div>

      <ErrorMessage message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((item) => (
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

      {balances.length === 0 && !error && (
        <p className="text-slate-400">No leave balance data available.</p>
      )}
    </div>
  );
}
