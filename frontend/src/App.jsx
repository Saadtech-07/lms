import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Dashboard from './pages/Dashboard';
import LeaveBalance from './pages/LeaveBalance';
import Login from './pages/Login';
import DeletedEmployees from './pages/employees/DeletedEmployees';
import EmployeeForm from './pages/employees/EmployeeForm';
import EmployeeList from './pages/employees/EmployeeList';
import LeaveTypeList from './pages/leaveTypes/LeaveTypeList';
import ApplyLeave from './pages/leaves/ApplyLeave';
import LeaveDetails from './pages/leaves/LeaveDetails';
import LeaveList from './pages/leaves/LeaveList';
import PendingLeaves from './pages/leaves/PendingLeaves';
import { hasRole, isAuthenticated } from './utils/auth';

function LeaveHistoryRedirect() {
  if (hasRole('EMPLOYEE')) {
    return <Navigate to="/leaves" replace />;
  }

  if (hasRole('ADMIN', 'MANAGER')) {
    return <Navigate to="/pending-leaves" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route element={<RoleRoute roles={['ADMIN', 'MANAGER']} />}>
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/deleted" element={<DeletedEmployees />} />
              <Route path="/pending-leaves" element={<PendingLeaves />} />
            </Route>

            <Route element={<RoleRoute roles={['ADMIN']} />}>
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/employees/:id/edit" element={<EmployeeForm />} />
              <Route path="/leave-types" element={<LeaveTypeList />} />
            </Route>

            <Route element={<RoleRoute roles={['EMPLOYEE']} />}>
              <Route path="/leaves/apply" element={<ApplyLeave />} />
              <Route path="/leaves" element={<LeaveList />} />
              <Route path="/leave-balance" element={<LeaveBalance />} />
            </Route>

            <Route path="/leave-history" element={<LeaveHistoryRedirect />} />
            <Route path="/leaves/:id" element={<LeaveDetails />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
