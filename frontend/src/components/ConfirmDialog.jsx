export default function ConfirmDialog({
  open,
  title,
  message,
  messageClassName = 'text-slate-600',
  confirmLabel,
  confirmClassName = 'btn-danger',
  submittingLabel = 'Please wait...',
  onCancel,
  onConfirm,
  submitting = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-center text-lg font-semibold text-slate-800">{title}</h3>
        <p className={`mt-2 whitespace-pre-line text-center text-sm ${messageClassName}`}>{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={confirmClassName}
          >
            {submitting ? submittingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
