import { useEffect, useRef } from 'react';
import { formatDate, getPopulatedName } from '../utils/format';

export default function RejectLeaveDialog({
  open,
  leave,
  rejectionReason,
  onRejectionReasonChange,
  error,
  submitting,
  onCancel,
  onConfirm,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus();
    }
  }, [open]);

  if (!open || !leave) return null;

  const employeeName = getPopulatedName(leave.employee);
  const leaveTypeName = getPopulatedName(leave.leaveType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-leave-title"
      >
        <h3 id="reject-leave-title" className="text-lg font-semibold text-slate-800">
          Reject Leave Request?
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          {employeeName}&apos;s {leaveTypeName} request from {formatDate(leave.fromDate)} to{' '}
          {formatDate(leave.toDate)} will be rejected.
        </p>

        <div className="mt-4">
          <label htmlFor="rejection-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
            Rejection reason
          </label>
          <textarea
            id="rejection-reason"
            ref={textareaRef}
            value={rejectionReason}
            onChange={(event) => onRejectionReasonChange(event.target.value)}
            rows={4}
            placeholder="Explain why this leave request is being rejected"
            className="input-field min-h-24"
            disabled={submitting}
          />
          {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="btn-danger"
          >
            {submitting ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
