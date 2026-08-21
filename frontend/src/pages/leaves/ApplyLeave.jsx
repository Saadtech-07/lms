import { useEffect, useMemo, useState } from 'react';
import { createLeave, getLeaves } from '../../api/leaveApi';
import { getLeaveTypes } from '../../api/leaveTypeApi';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import SuccessMessage from '../../components/SuccessMessage';
import { getEmployeeId, getUser } from '../../utils/auth';
import { formatDate, getPopulatedName, calculateLeaveDaysPreview } from '../../utils/format';
import {
  findOverlappingLeaveRequest,
  getLeaveDateBounds,
  getLeaveDateValidationMessage,
  getToDateMinimum,
  isLeaveDateSelectable,
  validateEmployeeLeaveDates,
} from '../../utils/leaveDateUtils';

export default function ApplyLeave() {
  const user = getUser();
  const employeeId = getEmployeeId(user);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [form, setForm] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fromDateError, setFromDateError] = useState('');
  const [toDateError, setToDateError] = useState('');

  const { minimumDate, maximumDate } = useMemo(() => getLeaveDateBounds(), []);
  const toDateMinimum = useMemo(
    () => getToDateMinimum(form.fromDate),
    [form.fromDate]
  );

  const pendingLeaves = useMemo(
    () => employeeLeaves.filter((leave) => leave.status === 'PENDING'),
    [employeeLeaves]
  );

  const blockingLeaves = useMemo(
    () =>
      employeeLeaves.filter(
        (leave) => leave.status === 'PENDING' || leave.status === 'APPROVED'
      ),
    [employeeLeaves]
  );

  const estimatedDays = calculateLeaveDaysPreview(form.fromDate, form.toDate);
  const overlappingLeave = useMemo(() => {
    if (!form.fromDate || !form.toDate) {
      return null;
    }

    return findOverlappingLeaveRequest(form.fromDate, form.toDate, blockingLeaves);
  }, [blockingLeaves, form.fromDate, form.toDate]);

  useEffect(() => {
    Promise.all([
      getLeaveTypes(),
      employeeId ? getLeaves({ employee: employeeId }) : Promise.resolve({ data: { leaveRequests: [] } }),
    ])
      .then(([leaveTypeResponse, leaveResponse]) => {
        const active = (leaveTypeResponse.data.leaveTypes || []).filter((item) => item.isActive);
        setLeaveTypes(active);

        const leaves = leaveResponse.data.leaveRequests || [];
        setEmployeeLeaves(leaves);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const handleFromDateChange = (event) => {
    const value = event.target.value;
    setFromDateError('');

    if (!value) {
      setForm((previous) => ({ ...previous, fromDate: '', toDate: '' }));
      setToDateError('');
      return;
    }

    const validationMessage = getLeaveDateValidationMessage(value);

    if (validationMessage) {
      setFromDateError(validationMessage);
      return;
    }

    setForm((previous) => {
      const nextToDate =
        previous.toDate && previous.toDate >= value ? previous.toDate : '';

      if (nextToDate !== previous.toDate) {
        setToDateError('');
      }

      return {
        ...previous,
        fromDate: value,
        toDate: nextToDate,
      };
    });
  };

  const handleToDateChange = (event) => {
    const value = event.target.value;
    setToDateError('');

    if (!value) {
      setForm((previous) => ({ ...previous, toDate: '' }));
      return;
    }

    const validationMessage = getLeaveDateValidationMessage(value);

    if (validationMessage) {
      setToDateError(validationMessage);
      return;
    }

    if (form.fromDate && value < form.fromDate) {
      setToDateError('To date cannot be earlier than from date.');
      return;
    }

    setForm((previous) => ({ ...previous, toDate: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFromDateError('');
    setToDateError('');

    if (!employeeId) {
      setError('Employee profile not linked to your account');
      return;
    }

    if (!isLeaveDateSelectable(form.fromDate)) {
      setFromDateError(getLeaveDateValidationMessage(form.fromDate));
      return;
    }

    if (!isLeaveDateSelectable(form.toDate)) {
      setToDateError(getLeaveDateValidationMessage(form.toDate));
      return;
    }

    try {
      validateEmployeeLeaveDates(form.fromDate, form.toDate);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    if (overlappingLeave) {
      setError(
        `These dates overlap with your existing ${overlappingLeave.status.toLowerCase()} ${getPopulatedName(overlappingLeave.leaveType)} request (${formatDate(overlappingLeave.fromDate)} to ${formatDate(overlappingLeave.toDate)}). Choose different dates.`
      );
      return;
    }

    setSubmitting(true);

    try {
      await createLeave({
        employee: employeeId,
        leaveType: form.leaveType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason,
      });

      setSuccess('Leave request submitted successfully');
      setForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
      setEmployeeLeaves((previous) => [
        {
          _id: `temp-${Date.now()}`,
          status: 'PENDING',
          fromDate: form.fromDate,
          toDate: form.toDate,
          leaveType: leaveTypes.find((item) => item._id === form.leaveType) || { name: 'Leave' },
        },
        ...previous,
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h2 className="page-title">Apply Leave</h2>
        <p className="page-subtitle">Submit a new leave request for approval</p>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {pendingLeaves.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Your pending leave requests</p>
          <ul className="mt-2 space-y-1">
            {pendingLeaves.map((leave) => (
              <li key={leave._id}>
                {getPopulatedName(leave.leaveType)}: {formatDate(leave.fromDate)} to{' '}
                {formatDate(leave.toDate)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            New requests cannot overlap with pending or approved leave dates. Rejected requests
            can be submitted again for the same dates.
          </p>
        </div>
      )}

      {pendingLeaves.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          New requests cannot overlap with pending or approved leave dates. Rejected requests can
          be submitted again for the same dates.
        </p>
      )}

      {overlappingLeave && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Selected dates overlap with your {overlappingLeave.status.toLowerCase()}{' '}
          {getPopulatedName(overlappingLeave.leaveType)} request (
          {formatDate(overlappingLeave.fromDate)} to {formatDate(overlappingLeave.toDate)}).
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Leave Type</label>
          <select
            value={form.leaveType}
            onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
            required
            className="input-field"
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType._id} value={leaveType._id}>
                {leaveType.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">From Date</label>
            <input
              type="date"
              value={form.fromDate}
              onChange={handleFromDateChange}
              min={minimumDate}
              max={maximumDate}
              required
              className="input-field"
            />
            {fromDateError ? (
              <p className="mt-1.5 text-sm text-red-600">{fromDateError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                Weekdays only, from the last 7 days through 2 months ahead.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">To Date</label>
            <input
              type="date"
              value={form.toDate}
              onChange={handleToDateChange}
              min={toDateMinimum}
              max={maximumDate}
              required
              disabled={!form.fromDate}
              className="input-field disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            {toDateError ? (
              <p className="mt-1.5 text-sm text-red-600">{toDateError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                Must be on or after the from date and within the allowed window.
              </p>
            )}
          </div>
        </div>

        {estimatedDays !== null && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Estimated working days:{' '}
            <span className="font-semibold text-slate-800">{estimatedDays}</span>
            <span className="text-slate-500"> (weekends excluded)</span>
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
            rows={5}
            className="input-field min-h-28"
          />
        </div>

        <div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
