import { request } from './api';

export function getDashboardStats() {
  return request('/api/dashboard');
}

export function getLeaveBalance(employeeId) {
  return request(`/api/dashboard/leave-balance/${employeeId}`);
}
