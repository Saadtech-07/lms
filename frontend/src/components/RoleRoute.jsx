import { Navigate, Outlet } from 'react-router-dom';
import { getUser } from '../utils/auth';

export default function RoleRoute({ roles }) {
  const user = getUser();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
