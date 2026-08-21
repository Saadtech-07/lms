import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUser, hasRole } from '../utils/auth';

const linkClass = ({ isActive }) =>
  `relative flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

function NavItem({ to, end = false, children }) {
  return (
    <NavLink to={to} end={end} className={linkClass}>
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-indigo-600" />
          )}
          <span className="pl-1">{children}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <h1 className="text-xl font-bold tracking-tight text-indigo-700">LeaveSphere</h1>
        {user && (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {user.role}
            </p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <NavItem to="/dashboard">Dashboard</NavItem>

        {hasRole('ADMIN', 'MANAGER') && (
          <>
            <NavItem to="/employees">Employees</NavItem>
            <NavItem to="/pending-leaves">Leave Requests</NavItem>
          </>
        )}

        {hasRole('ADMIN') && <NavItem to="/leave-types">Leave Types</NavItem>}

        {hasRole('EMPLOYEE') && (
          <>
            <NavItem to="/leaves/apply">Apply Leave</NavItem>
            <NavItem to="/leaves" end>
              My Leaves
            </NavItem>
            <NavItem to="/leave-balance">Leave Balance</NavItem>
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button type="button" onClick={handleLogout} className="btn-secondary w-full">
          Logout
        </button>
      </div>
    </aside>
  );
}
