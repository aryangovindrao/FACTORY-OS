import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Factory, LayoutDashboard, ClipboardList, Cog, Package,
  Users, Wallet, Truck, Wrench, BarChart3, Bot, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
  { to: '/machines', icon: Cog, label: 'Machines' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/dispatch', icon: Truck, label: 'Dispatch' },
  { to: '/vendors', icon: Package, label: 'Vendors' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/chat', icon: Bot, label: 'FactoryBot' },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Factory className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <div><h2 className="text-white font-bold text-lg leading-tight">FactoryOS</h2>
          <p className="text-navy-500 text-xs truncate">{tenant?.name || 'Factory'}</p></div>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'text-amber-400' : 'text-navy-300 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(245,158,11,0.1)' } : {}}>
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t px-3 py-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-navy-500 text-xs truncate">{user?.role?.replace('_', ' ')}</p>
          </div>}
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-navy-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all">
          <LogOut size={16} />{!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-white" style={{ background: 'rgba(16,42,67,0.9)' }}
        onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ background: 'linear-gradient(180deg, #0a1929, #0f2137)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {sidebarContent}
        {/* Desktop collapse toggle */}
        <button className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 rounded-full items-center justify-center text-navy-400 hover:text-white text-xs"
          style={{ background: '#1a365d', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </aside>
    </>
  );
}
