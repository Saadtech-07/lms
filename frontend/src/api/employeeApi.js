import { buildQuery, request } from './api';

export function getEmployees(params = {}) {
  return request(`/api/employees${buildQuery({ limit: 100, ...params })}`);
}

export function getEmployeeDepartments() {
  return request('/api/employees/departments');
}

export function getDeletedEmployees(params = {}) {
  return request(`/api/employees${buildQuery({ limit: 100, deleted: true, ...params })}`);
}

export function getEmployeeById(id) {
  return request(`/api/employees/${id}`);
}

export function createEmployee(payload) {
  return request('/api/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateEmployee(id, payload) {
  return request(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteEmployee(id) {
  return request(`/api/employees/${id}`, {
    method: 'DELETE',
  });
}

export function updateEmployeeStatus(id, status) {
  return request(`/api/employees/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function restoreEmployee(id) {
  return request(`/api/employees/${id}/restore`, {
    method: 'PATCH',
  });
}

export function updateEmployeeRole(id, role) {
  return request(`/api/employees/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}
