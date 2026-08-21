import { calculateWorkingDays } from './leaveDateUtils';

export function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatReadableDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  const datePart = date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

export function formatUserWithRole(user) {
  if (!user || typeof user !== 'object') return '—';
  const name = user.name || '—';
  return user.role ? `${name} (${user.role})` : name;
}

export function getLeaveActionedAt(leave) {
  if (!leave) return '—';

  if (leave.status === 'APPROVED') {
    return leave.approvedAt ? formatDateTime(leave.approvedAt) : '—';
  }

  if (leave.status === 'REJECTED') {
    return leave.rejectedAt ? formatDateTime(leave.rejectedAt) : '—';
  }

  return '—';
}

export function getStatusLabel(status) {
  return status || 'ACTIVE';
}

export function getLeaveTypeStatus(isActive) {
  return isActive ? 'ACTIVE' : 'INACTIVE';
}

export function getPopulatedName(value) {
  if (!value) return '-';
  if (typeof value === 'object') return value.name || '-';
  return value;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getFirstName(fullName) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

export function calculateLeaveDaysPreview(fromDate, toDate) {
  if (!fromDate || !toDate) return null;

  try {
    const workingDays = calculateWorkingDays(fromDate, toDate);
    return workingDays > 0 ? workingDays : null;
  } catch {
    return null;
  }
}

export function isApprovedThisMonth(approvedAt) {
  if (!approvedAt) return false;

  const date = new Date(approvedAt);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  );
}
