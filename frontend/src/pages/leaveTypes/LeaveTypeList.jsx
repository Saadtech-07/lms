import { useEffect, useState } from 'react';
import {
  createLeaveType,
  deleteLeaveType,
  getLeaveTypes,
  updateLeaveType,
} from '../../api/leaveTypeApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import SuccessMessage from '../../components/SuccessMessage';
import { getLeaveTypeStatus } from '../../utils/format';

export default function LeaveTypeList() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', totalDays: '' });
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadLeaveTypes = () => {
    setLoading(true);
    setError('');

    getLeaveTypes()
      .then((response) => setLeaveTypes(response.data.leaveTypes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const resetForm = () => {
    setForm({ name: '', totalDays: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (leaveType) => {
    setEditingId(leaveType._id);
    setForm({
      name: leaveType.name,
      totalDays: String(leaveType.totalDays),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name: form.name,
      totalDays: Number(form.totalDays),
    };

    try {
      if (editingId) {
        await updateLeaveType(editingId, payload);
        setSuccess('Leave type updated successfully');
      } else {
        await createLeaveType({ ...payload, isActive: true });
        setSuccess('Leave type created successfully');
      }

      resetForm();
      loadLeaveTypes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (leaveType) => {
    setError('');
    setSuccess('');
    setTogglingId(leaveType._id);

    try {
      await updateLeaveType(leaveType._id, { isActive: !leaveType.isActive });
      setSuccess(
        `Leave type marked as ${leaveType.isActive ? 'inactive' : 'active'}`
      );
      loadLeaveTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setError('');
    setSuccess('');
    setDeleting(true);

    try {
      await deleteLeaveType(deleteTarget._id);
      setSuccess('Leave type deleted successfully');
      setDeleteTarget(null);
      loadLeaveTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Leave Types</h2>
          <p className="page-subtitle">Configure leave categories and allowances</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Add Leave Type
        </button>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />
      <SuccessMessage message={success} />

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <h3 className="section-title">{editingId ? 'Edit Leave Type' : 'Create Leave Type'}</h3>

          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="input-field"
          />

          <input
            type="number"
            min="0"
            placeholder="Total Days"
            value={form.totalDays}
            onChange={(e) => setForm({ ...form, totalDays: e.target.value })}
            required
            className="input-field"
          />

          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Total Days</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((leaveType) => (
                <tr key={leaveType._id}>
                  <td className="font-medium text-slate-800">{leaveType.name}</td>
                  <td>{leaveType.totalDays}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(leaveType)}
                      disabled={togglingId === leaveType._id}
                      title={`Click to mark as ${leaveType.isActive ? 'inactive' : 'active'}`}
                      className="cursor-pointer rounded-full disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    >
                      <StatusBadge status={getLeaveTypeStatus(leaveType.isActive)} />
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handleEdit(leaveType)} className="btn-link">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(leaveType)}
                        className="btn-link-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Leave Type?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?`
            : ''
        }
        messageClassName="font-medium text-slate-800"
        confirmLabel="Delete"
        confirmClassName="btn-danger"
        submittingLabel="Deleting..."
        submitting={deleting}
        onCancel={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
