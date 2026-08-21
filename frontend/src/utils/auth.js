export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getEmployeeId(user = getUser()) {
  if (!user?.employee) return null;
  return typeof user.employee === 'object' ? user.employee._id : user.employee;
}

export function hasRole(...roles) {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
}
