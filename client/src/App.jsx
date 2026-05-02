import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import MachinesPage from './pages/MachinesPage';
import DispatchPage from './pages/DispatchPage';
import EmployeesPage from './pages/EmployeesPage';
import InventoryPage from './pages/InventoryPage';
import VendorsPage from './pages/VendorsPage';
import MaintenancePage from './pages/MaintenancePage';
import PayrollPage from './pages/PayrollPage';
import ReportsPage from './pages/ReportsPage';
import ChatPage from './pages/ChatPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1929' }}>
      <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      
      {/* Protected routes wrapped in Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/machines" element={<MachinesPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/dispatch" element={<DispatchPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
