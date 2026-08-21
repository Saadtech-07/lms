import { buildQuery, request } from './api';

export function createLeave(payload) {
  return request('/api/leaves', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getLeaves(params = {}) {
  return request(`/api/leaves${buildQuery({ limit: 100, ...params })}`);
}

export function getLeaveById(id) {
  return request(`/api/leaves/${id}`);
}

export function getLeaveHistory(params = {}) {
  return request(`/api/leaves/history${buildQuery({ limit: 100, ...params })}`);
}

export function updateLeaveStatus(id, payload) {
  return request(`/api/leaves/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
