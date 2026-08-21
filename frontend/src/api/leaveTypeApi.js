import { buildQuery, request } from './api';

export function getLeaveTypes(params = {}) {
  return request(`/api/leave-types${buildQuery({ limit: 100, ...params })}`);
}

export function getLeaveTypeById(id) {
  return request(`/api/leave-types/${id}`);
}

export function createLeaveType(payload) {
  return request('/api/leave-types', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateLeaveType(id, payload) {
  return request(`/api/leave-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteLeaveType(id) {
  return request(`/api/leave-types/${id}`, {
    method: 'DELETE',
  });
}
